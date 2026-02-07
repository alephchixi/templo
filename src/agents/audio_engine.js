import * as Tone from 'tone';

export class AudioEngine {
    constructor(systemState) {
        this.systemState = systemState;
        this.isStarted = false;
        this.drones = [];
    }

    async init() {
        // Wait for user interaction to start context, handled by main.js calling start()
        console.log('AudioEngine: Initialized');
    }

    async start() {
        await Tone.start();

        // Master Chain
        this.reverb = new Tone.Reverb({
            decay: 10,
            wet: 0.5
        }).toDestination();

        this.delay = new Tone.FeedbackDelay({
            delayTime: 0.5,
            feedback: 0.3,
            wet: 0.3
        }).connect(this.reverb);

        this.masterVol = new Tone.Volume(-12);

        // Replcaed Lowpass with FrequencyShifter (Alterar)
        // Default 0Hz shift = Normal sound
        this.shifter = new Tone.FrequencyShifter(0).connect(this.delay);
        this.masterVol.connect(this.shifter);

        this.setupDrones();
        this.startLoop();

        this.isStarted = true;
        console.log('AudioEngine: Started');
    }

    setupDrones() {
        // Calculate root freq from canvas hash
        const hash = this.systemState.get().canvas_hash;

        // --- HARMONIC SEEDING FROM BROWSER ---
        const seedA = window.screen.width + window.screen.height;
        const seedB = navigator.hardwareConcurrency || 4;
        const seedC = (navigator.userAgent.length) % 100;

        // Base fundamental: relatively low for drone (40-80Hz)
        const baseFreq = 40 + (seedA % 40);
        console.log('AudioEngine: Harmonic Base', baseFreq);

        // Intervals based on browser "Identity"
        let intervals = [1]; // Root
        if (seedB > 4) {
            // Complex/Jazz
            intervals.push(1.2);   // Minor 3rd
            intervals.push(1.5);   // 5th
            intervals.push(1.875); // Major 7th
            intervals.push(2.25);  // Major 9th
        } else {
            // Open/Ethereal
            intervals.push(1.5);   // 5th
            intervals.push(2.0);   // Octave
            intervals.push(3.0);   // Octave + 5th
        }

        // Add a "Ghost" note from Canvas Hash - SNAP TO OCTAVE
        intervals.push(4.0); // 2 Octaves up (Safe/Ethereal)

        intervals.forEach((ratio, i) => {
            const osc = new Tone.Oscillator({
                frequency: baseFreq * ratio,
                type: "sine", // PURE SINE for clean sound
                volume: -12 - (i * 2) // Higher partials quieter
            }).connect(this.masterVol);

            // Shimmer / Detune LFO using User Agent seed
            const lfoRate = 0.05 + (seedC / 500); // 0.05 to 0.25 Hz
            // Initial depth will be set in update()
            const lfo = new Tone.LFO(lfoRate, 0, 0).connect(osc.detune).start();

            this.drones.push({
                osc,
                baseFreq: baseFreq * ratio,
                lfo: lfo,
                baseRate: lfoRate,
                initialVol: -12 - (i * 2)
            });

            osc.start();
        });
    }

    startLoop() {
        // Update loop running at 10Hz to update parameters based on state
        setInterval(() => this.update(), 100);
    }

    update() {
        if (!this.isStarted) return;

        const state = this.systemState.get();

        // 1. Battery Level -> Reverb Decay / Volume
        const batteryMod = Math.max(0.1, state.battery_level);
        let targetDecay = 1 + (batteryMod * 10);

        // 2. Velocity (Entropy) -> "Suave y Extendido"
        // Higher velocity -> Longer reverb, Brighter harmonics
        // Note: state.cursor_entropy is now smoothed by SystemState
        const entropy = state.cursor_entropy || 0;

        // Extend Reverb (up to +15s)
        targetDecay += entropy * 15;
        this.reverb.decay = Math.min(targetDecay, 30); // Cap at 30s

        // Unveil Harmonics
        // Higher drones get louder with velocity (Opening the filter/harmonics)
        this.drones.forEach((d, i) => {
            if (i > 0) {
                // Higher index = needs more entropy to be heard
                // Smoothly ramp volume up
                let targetVol = d.initialVol + (entropy * 10);
                // Cap at max 0dB
                targetVol = Math.min(targetVol, -6);
                d.osc.volume.rampTo(targetVol, 1); // Slow ramp (1s) for "suave"
            }
        });

        // 3. Latency -> "Dilated" Delay
        // Longer ramp times (3s), longer max delay time
        const latency = state.latency || 0;
        // Map latency (0-1000ms typically) to delay time (0.5s to 2.5s)
        const delayTime = Tone.Time((latency / 400) + 0.5).toSeconds();
        this.delay.delayTime.rampTo(delayTime, 3); // 3s ramp = "Dilated/Breathing"

        // Feedback
        const feedback = Math.min((latency / 800) + 0.2, 0.85);
        this.delay.feedback.rampTo(feedback, 3);

        // 4. Alterar (Audio Shift) -> Frequency Shifter
        if (this.shifter && state.audio_shift !== undefined) {
            // Shift 0Hz to 200Hz
            this.shifter.frequency.rampTo(state.audio_shift, 0.2);
        }

        // LFO Modulation (Life) - Keep it subtle
        this.drones.forEach(d => {
            let depth = 5 + (entropy * 5); // Very subtle detune (5-10 cents)
            d.lfo.min = -depth;
            d.lfo.max = depth;
        });
    }
}
