import assert from 'node:assert/strict';
import test from 'node:test';
import { delaySecondsForLatency, MAX_DELAY_SECONDS } from '../src/agents/audio_limits.js';

test('preserves delay values already supported by the existing buffer', () => {
    for (const [latency, seconds] of [[0, 0.5], [100, 0.75], [200, 1]]) {
        assert.equal(delaySecondsForLatency(latency), seconds);
    }
});

test('CI latency spikes cannot exceed the allocated delay buffer', () => {
    for (const latency of [350.92, 1190.85, 10_000, Number.MAX_VALUE]) {
        assert.equal(delaySecondsForLatency(latency), MAX_DELAY_SECONDS);
    }
});

test('invalid sensor values retain a finite supported delay', () => {
    for (const latency of [-1, NaN, Infinity, -Infinity, undefined, null, '100']) {
        assert.equal(delaySecondsForLatency(latency), 0.5);
    }
});
