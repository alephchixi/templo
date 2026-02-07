import './style.css';
import { SystemState } from './agents/system_state.js';
import { AudioEngine } from './agents/audio_engine.js';
import { VisualEngine } from './agents/visual_engine.js';
import { ControlPanel } from './ui/controls.js';

console.log('Cloud Temple Initializing...');

const overlay = document.getElementById('overlay');

// Instantiate Agents
const systemState = new SystemState();
const controlPanel = new ControlPanel(systemState); // Initialize UI
const visualEngine = new VisualEngine(systemState);
const audioEngine = new AudioEngine(systemState);

// Start Visuals immediately (they are silent)
visualEngine.init();

const init = async () => {
    console.log('Interaction detected. Starting Audio...');

    // Fade out overlay
    overlay.classList.add('active');

    // Start Audio (needs interaction)
    try {
        await audioEngine.init();
        await audioEngine.start();
    } catch (e) {
        console.error('Audio start failed', e);
    }
};

overlay.addEventListener('click', () => {
    init();
});
