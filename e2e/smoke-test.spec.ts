import { test, expect } from '@playwright/test';

test.describe('Dev harness', () => {
  test('init tag requests Conviva-hosted SDK script URL', async ({ page }) => {
    const sdkRequest = page.waitForRequest(
      (req) =>
        req.url().includes('sensor.conviva.com/dpi/releases/') &&
        req.url().includes('convivaAppTracker.js'),
      { timeout: 15_000 },
    );

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const req = await sdkRequest;
    expect(req.url()).toMatch(/sensor\.conviva\.com\/dpi\/releases\/.+\/convivaAppTracker\.js/);
  });
});
