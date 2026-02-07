import * as THREE from 'three';
import vertexShader from '../shaders/cloud.vert?raw';
import fragmentShader from '../shaders/portal.frag?raw';

export class VisualEngine {
    constructor(systemState) {
        this.systemState = systemState;
        this.canvas = document.getElementById('canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.material = null;
        this.clock = new THREE.Clock();
        this.cloudTime = 0;
    }

    init() {
        // Scene Setup
        this.scene = new THREE.Scene();

        // Camera (Orthographic for full screen pass)
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Hide default cursor (Portal effect acts as cursor)
        this.canvas.style.cursor = 'none';

        // Shader Material
        const uniforms = {
            uTime: { value: 0 },
            uColorA: { value: new THREE.Color() },
            uColorB: { value: new THREE.Color() },
            uBrightness: { value: 1.0 },
            uSpeed: { value: 0.1 },
            uDistortion: { value: 0.0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) }, // Normalized mouse position
            uInvert: { value: 0.0 }, // 0 = Normal, 1 = Inverted
            uHour: { value: 0.0 } // 0-1 mapped from 0-24h
        };

        // Random Color Palette Logic (Per Session)
        // Celestial / Iridescent / Light
        // Hues: Blue (0.6) to Pink (0.9) to Cyan (0.5)
        this.baseHue = 0.5 + Math.random() * 0.4; // Store as property for shifting

        // High lightness (L) for "Light" vibe, Low Saturation (S) for pastel/celestial
        const colorA = new THREE.Color().setHSL(this.baseHue, 0.8, 0.8); // Light Pastel
        const colorB = new THREE.Color().setHSL((this.baseHue + 0.2) % 1.0, 0.9, 0.9); // Very light highlight (nearly white)

        uniforms.uColorA.value.copy(colorA);
        uniforms.uColorB.value.copy(colorB);

        this.material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        // Full screen quad
        const geometry = new THREE.PlaneGeometry(2, 2);
        const plane = new THREE.Mesh(geometry, this.material);
        this.scene.add(plane);

        // Mouse State for Trailing Effect
        this.targetMouse = new THREE.Vector2(0.5, 0.5);

        // Resize handler
        window.addEventListener('resize', () => this.onResize());

        // Mouse handler
        window.addEventListener('mousemove', (e) => {
            // Normalize mouse to 0..1
            const x = e.clientX / window.innerWidth;
            const y = 1.0 - (e.clientY / window.innerHeight); // Flip Y for shader UVs

            this.targetMouse.set(x, y);
        });

        console.log('VisualEngine: Initialized');

        // Start loop
        this.animate();
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const dt = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        const state = this.systemState.get();

        // Update Uniforms
        this.material.uniforms.uTime.value = elapsedTime;

        // Update Resolution
        this.material.uniforms.uResolution.value.set(this.canvas.width, this.canvas.height);

        // Helper LERP
        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

        // Mouse Trailing Effect
        const currentMouse = this.material.uniforms.uMouse.value;
        const lag = 0.02; // Very slow catchup
        currentMouse.x = lerp(currentMouse.x, this.targetMouse.x, lag);
        currentMouse.y = lerp(currentMouse.y, this.targetMouse.y, lag);

        // --- REACTIVITY MAPPING ---

        // 1. TURBULENCE (Latencia) -> Radical Color Variation
        // Map 0-1000ms to 0-1 (Reduced sensitivity)
        const turbulence = Math.min((state.latency || 0) / 1000, 1.0);
        this.material.uniforms.uDistortion.value = lerp(this.material.uniforms.uDistortion.value, turbulence, 0.005);

        // Color Shift Logic:
        // Oscillate the base hue based on turbulence and time.
        // Higher turbulence = Faster oscillation through the ethereal palette
        if (turbulence > 0.01) {
            // We use our stored random baseHue as the center
            // And oscillate around it (or travel linearly)
            const hueShiftSpeed = turbulence * 0.5;
            const currentHue = (this.baseHue + elapsedTime * hueShiftSpeed) % 1.0;

            // Update Colors
            const colorA = new THREE.Color().setHSL(currentHue, 0.8, 0.8);
            const colorB = new THREE.Color().setHSL((currentHue + 0.2) % 1.0, 0.9, 0.9);

            this.material.uniforms.uColorA.value.lerp(colorA, 0.005);
            this.material.uniforms.uColorB.value.lerp(colorB, 0.005);
        }

        // 2. SPEED (Cursor Entropy) -> Permanent & Extreme Range
        // Range 0 to 2 -> Map to 0.0 to 10.0 (Very slow to Texture-like fast)
        // Note: Entropy creates speed, not permanent setting from UI unless overridden.
        // But assuming manual control or high entropy:
        const rawSpeed = state.cursor_entropy || 0;
        // Cap max speed to be "subtle" (e.g. max 2.0 instead of 10.0)
        const targetSpeed = Math.min(rawSpeed * 3.0, 3.0);
        // 0.002 Lerp = Glacial
        this.material.uniforms.uSpeed.value = lerp(this.material.uniforms.uSpeed.value, targetSpeed, 0.002);

        // 3. ALTERAR (Audio Shift) -> Gradual Inversion
        // Range 0 to 200 mapping to 0.0 to 1.0
        const audioShift = state.audio_shift || 0;
        const targetInvert = Math.min(Math.max(audioShift / 200, 0), 1);

        // Slow Down: Lerp 0.005 (Extremely slow/sluggish)
        if (this.material.uniforms.uInvert) {
            this.material.uniforms.uInvert.value = lerp(this.material.uniforms.uInvert.value, targetInvert, 0.005);
        }

        // 4. CLOCK (Time Cycle) -> Prominent Density/Zoom
        // Cycle 0-1 based on seconds of day.
        // Replaces uHour
        const timeCycle = state.time_cycle || 0;
        if (this.material.uniforms.uHour) {
            this.material.uniforms.uHour.value = lerp(this.material.uniforms.uHour.value, timeCycle, 0.05);
        }

        // Battery -> Brightness
        const targetBrightness = 0.8 + (state.battery_level * 0.2);
        this.material.uniforms.uBrightness.value = lerp(this.material.uniforms.uBrightness.value, targetBrightness, 0.05);

        this.renderer.render(this.scene, this.camera);
    }
}
