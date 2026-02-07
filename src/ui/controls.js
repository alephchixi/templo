export class ControlPanel {
    constructor(systemState) {
        this.systemState = systemState;
        this.container = null;
        this.isVisible = false;

        // Configuration for controllable parameters
        this.params = [
            { id: 'audio_shift', label: 'Alterar', type: 'range', min: 0, max: 200, step: 1, default: 0 },
        ];

        // Monitors (Read-only visualization)
        this.monitors = [
            { id: 'battery_level', label: 'Batería' },
            { id: 'latency', label: 'Latencia' },
            { id: 'clock_display', label: 'Reloj' }, // Uses string HH:MM:SS
            { id: 'cursor_entropy', label: 'Velocidad' },
        ];

        this.overrides = {}; // Store manual values
        this.toggles = {};   // Store active/inactive state of sensors (True = Sensor Active, False = Manual Override)

        this.init();
    }

    init() {
        this.createUI();
        this.attachListeners();
        this.systemState.registerOverlay(this); // Tell system state to check us

        // Start monitor update loop
        setInterval(() => this.updateMonitors(), 500);
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'control-panel';
        this.container.innerHTML = `
      <div class="controls-header">
        <span></span>
        <button id="controls-toggle" class="icon-btn">×</button>
      </div>
      <div class="controls-content">
        ${this.params.map(p => `
          <div class="control-group" data-id="${p.id}">
            <div class="control-label">
              <span>${p.label}</span>
              <span class="sensor-toggle">AUTO</span>
            </div>
            <input type="range" 
                   min="${p.min}" max="${p.max}" step="${p.step}" 
                   value="${p.default}" 
                   class="delicate-slider">
          </div>
        `).join('')}
        
        <div class="monitors-section" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
             ${this.monitors.map(m => `
                <div class="monitor-group" data-id="${m.id}" style="display: flex; justify-content: space-between; margin-bottom: 5px; opacity: 0.7;">
                    <span style="font-size: 10px;">${m.label}</span>
                    <span class="monitor-value" style="font-family: monospace; font-size: 10px;">--</span>
                </div>
             `).join('')}
        </div>
      </div>
    `;
        document.body.appendChild(this.container);
    }

    attachListeners() {
        const toggleBtn = this.container.querySelector('#controls-toggle');
        toggleBtn.addEventListener('click', () => {
            this.container.classList.toggle('collapsed');
            toggleBtn.textContent = this.container.classList.contains('collapsed') ? '+' : '×';
        });

        this.params.forEach(p => {
            const group = this.container.querySelector(`.control-group[data-id="${p.id}"]`);
            const slider = group.querySelector('input');
            const toggle = group.querySelector('.sensor-toggle');
            // Value display is removed

            // Init State: MANUAL by default (Sensor = false)
            this.toggles[p.id] = false;
            this.overrides[p.id] = p.default;

            toggle.addEventListener('click', () => {
                this.toggles[p.id] = !this.toggles[p.id];

                if (this.toggles[p.id]) {
                    // Switch to Auto (Sensor ON)
                    toggle.classList.add('active');
                    slider.disabled = true;
                } else {
                    // Switch to Manual (Sensor OFF)
                    toggle.classList.remove('active');
                    slider.disabled = false;
                    // Update override immediately
                    this.overrides[p.id] = parseFloat(slider.value);
                }
            });

            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.overrides[p.id] = val;
            });
        });
    }

    updateMonitors() {
        if (!this.container || this.container.classList.contains('collapsed')) return;

        const state = this.systemState.get(); // Note: get() might return overridden values if modified by ControlPanel logic itself? 
        // Actually systemState.get() applies overrides. 
        // We probably want the RAW state for visualization? 
        // But systemState.state has the raw values. 
        // Let's check SystemState implementation.
        // It has this.state (raw) and get() which copies and overrides.
        // We can access this.systemState.state directly for pure raw values if we want.
        // Let's use raw values to show what the browser is actually reporting.

        const rawState = this.systemState.state;

        this.monitors.forEach(m => {
            const el = this.container.querySelector(`.monitor-group[data-id="${m.id}"] .monitor-value`);
            if (el) {
                let val = rawState[m.id];
                if (typeof val === 'number') {
                    // Format special cases
                    if (m.id === 'battery_level') val = (val * 100).toFixed(0) + '%';
                    else if (m.id === 'cursor_entropy') val = val.toFixed(3);
                    else val = val;
                }
                el.textContent = val !== undefined ? val : '--';
            }
        });
    }

    // Method for SystemState to pull values
    getOverride(key) {
        if (this.toggles[key] === false) { // If sensor is NOT active (Manual mode)
            return this.overrides[key];
        }
        return null; // Return null to indicate "use sensor value"
    }
}
