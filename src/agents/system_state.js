export class SystemState {
    constructor() {
        this.state = {
            canvas_hash: 0,
            battery_level: 1.0,
            network_rtt: 0,
            time_of_day: 0,
            cursor_entropy: 0,
            audio_cutoff: 20000,
        };

        this.cursorHistory = [];
        this.lastCursorTime = Date.now();

        this.init();
    }

    async init() {
        console.log('SystemState: Initializing...');

        // 1. Clock (Hours, Minutes, Seconds)
        this.updateClock();
        setInterval(() => this.updateClock(), 1000); // Update every second

        // 2. Battery
        await this.initBattery();

        // 3. Latency (Internal Jitter / Ping simulation)
        this.initLatency();

        // 4. Canvas Hash (Fingerprint)
        this.generateCanvasHash();

        // 5. Cursor Entropy
        this.initCursorTracking();

        console.log('SystemState: Ready', this.state);
    }

    updateClock() {
        const now = new Date();
        this.state.clock_display = now.toLocaleTimeString(); // For UI
        // Normalize time to 0-1 cycle (0 = midnight, 1 = midnight next day)
        // Including seconds for reactivity
        const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        this.state.clock_seconds = totalSeconds;
        this.state.time_cycle = totalSeconds / 86400;
    }

    initLatency() {
        // Measure internal loop latency (jitter) as a proxy for "system ping"
        let lastTime = performance.now();

        // Use a slight sine wave to simulate "breathing" latency + jitter
        let time = 0;

        setInterval(() => {
            const now = performance.now();
            const rawDelta = now - lastTime;
            lastTime = now; // FIX: Update lastTime!

            // Expected 200ms. 
            // If delta is 210, jitter is 10.
            const jitter = Math.abs(rawDelta - 200);

            // Simulation Layer
            time += 0.05; // Slower breathing
            const breathing = Math.sin(time) * 5 + 5; // 0 to 10ms wave (Reduced from 40ms)

            // Combine Real Jitter + Simulated Breathing + Random Noise
            // Very low random noise (2ms) to prevent pitch warping
            let estimatedLatency = jitter + breathing + (Math.random() * 2);

            // If online, mix in RTT if available (rarely accurate in JS but try)
            if (navigator.connection && navigator.connection.rtt) {
                // RTT is usually granular (e.g. 50, 100). weighted average.
                estimatedLatency = (estimatedLatency * 0.7) + (navigator.connection.rtt * 0.3);
            }

            this.state.latency = Math.max(0, estimatedLatency);
        }, 200);
    }

    generateCanvasHash() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 50;

            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText("Cloud Temple", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("Cloud Temple", 4, 17);

            const dataURL = canvas.toDataURL();
            // Simple hash function
            let hash = 0;
            if (dataURL.length === 0) {
                this.state.canvas_hash = hash;
                return;
            }
            for (let i = 0; i < dataURL.length; i++) {
                const char = dataURL.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            this.state.canvas_hash = Math.abs(hash);
            console.log('SystemState: Canvas Hash', this.state.canvas_hash);
        } catch (e) {
            console.warn('Canvas Fingerprint failed', e);
            this.state.canvas_hash = 12345; // Fallback
        }
    }

    initCursorTracking() {
        let movementAccumulator = 0;

        document.addEventListener('mousemove', (e) => {
            // Accumulate raw movement (robust against time jitter)
            movementAccumulator += Math.abs(e.movementX) + Math.abs(e.movementY);
        });

        // Loop to calculate speed (pixels per 100ms) and decay
        setInterval(() => {
            // Get current speed from accumulator
            let currentSpeed = movementAccumulator;

            // Apply simple smoothing to state
            // "Menos sensible": Scale down drastically
            // 1000px movement -> 1.0 target entropy (formerly 200px)
            const targetEntropy = currentSpeed / 1000;

            // "Mas suave": EXTREMELY slow smoothing (0.01 update / 0.99 retention)
            // This acts like a heavy lowpass filter on movement
            this.state.cursor_entropy = (this.state.cursor_entropy * 0.99) + (targetEntropy * 0.01);

            // Reset accumulator for next frame
            movementAccumulator = 0;
        }, 100);
    }

    // ... rest of class logic ...
    async initBattery() {
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                const updateBattery = () => {
                    this.state.battery_level = battery.level;
                    console.log('SystemState: Battery', battery.level);
                };
                updateBattery();
                battery.addEventListener('levelchange', updateBattery);
            } catch (e) {
                console.warn('Battery API failed', e);
            }
        }
    }

    registerOverlay(controlPanel) {
        this.controlPanel = controlPanel;
    }

    get() {
        // Create a shallow copy of the state
        const currentState = { ...this.state };

        // Apply overrides from ControlPanel if they exist
        if (this.controlPanel) {
            // Check each parameter
            ['audio_shift'].forEach(key => {
                const override = this.controlPanel.getOverride(key);
                if (override !== null) {
                    currentState[key] = override;
                }
            });
        }

        return currentState;
    }
}
