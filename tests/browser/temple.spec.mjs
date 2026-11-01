import { expect, test } from '@playwright/test';

test('the built temple renders and starts its audio graph after interaction', async ({ page }) => {
  const errors = [];
  const milestones = new Set();
  const externalRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
    if (['VisualEngine: Initialized', 'AudioEngine: Started'].includes(message.text())) {
      milestones.add(message.text());
    }
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    externalRequests.push(url.origin);
    return route.abort();
  });

  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle('Un Templo en las Nubes del Algoritmo');
  await expect(page.getByRole('heading', { name: 'Un Templo en las Nubes del Algoritmo' })).toBeVisible();
  await expect.poll(() => milestones.has('VisualEngine: Initialized')).toBe(true);
  await expect(page.locator('#canvas')).toBeVisible();
  expect(await page.locator('#canvas').evaluate(canvas => {
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return Boolean(context && !context.isContextLost() && context.drawingBufferWidth && context.drawingBufferHeight);
  })).toBe(true);
  expect(milestones.has('AudioEngine: Started')).toBe(false);

  await page.locator('#overlay').click();
  await expect(page.locator('#overlay')).toHaveClass('active');
  await expect.poll(() => milestones.has('AudioEngine: Started')).toBe(true);

  const slider = page.getByRole('slider');
  await expect(slider).toBeEnabled();
  await slider.press('Home');
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('1');
  await page.locator('.sensor-toggle').click();
  await expect(slider).toBeDisabled();
  await page.locator('.sensor-toggle').click();
  await expect(slider).toBeEnabled();
  await page.locator('#controls-toggle').click();
  await expect(page.locator('#control-panel')).toHaveClass('collapsed');
  await page.locator('#controls-toggle').click();
  await expect(page.locator('#control-panel')).not.toHaveClass('collapsed');

  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
});
