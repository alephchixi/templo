export const MAX_DELAY_SECONDS = 1;

export function delaySecondsForLatency(latency) {
    const milliseconds = Number.isFinite(latency) ? Math.max(0, latency) : 0;
    return Math.min(MAX_DELAY_SECONDS, 0.5 + milliseconds / 400);
}
