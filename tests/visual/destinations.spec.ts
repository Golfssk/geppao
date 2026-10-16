import { test, expect, type Page } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const lang of ['th', 'en'] as const) {
  test(`destinations ${lang}`, async ({ page }, testInfo) => {
    // Keep snapshots public, offline and deterministic. Never use production accounts.
    // Third-party photos and hillshade are deliberately excluded from this baseline.
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (route.request().resourceType() === 'image' && url.hostname === 'upload.wikimedia.org') {
        return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#d0ddbe"/></svg>' });
      }
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
      return route.continue();
    });
    await page.goto(`/go?lang=${lang}`);
    const country = page.locator('[data-camera-flight]');
    await expect(country).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('[data-province]')).toHaveCount(77);
    await expect(page.locator('figure img')).toHaveCount(1);
    await settle(page);
    await argosScreenshot(page, `destinations-${lang}-${testInfo.project.name}-country`);

    await page.getByLabel(lang === 'th' ? 'หรือเลือกจังหวัดโดยตรง' : 'Or choose a province', { exact: true }).selectOption('nakhon-ratchasima');
    const province = page.locator('[data-province-view="nakhon-ratchasima"]');
    const district = page.getByLabel(lang === 'th' ? 'เลือกอำเภอ' : 'Choose a district', { exact: true });
    await expect(district.locator('option')).toHaveCount(33);
    // Toggle the optional network terrain layer off; do not depend on tile availability.
    const terrain = province.getByRole('button', { name: /▧/ });
    if (await terrain.getAttribute('aria-pressed') === 'true') await terrain.click();
    await expect(province.locator('[data-map-place]')).toHaveCount(5);
    await settle(page);
    await argosScreenshot(page, `destinations-${lang}-${testInfo.project.name}-province`);

    await district.selectOption({ label: lang === 'th' ? 'ปากช่อง' : 'Pak Chong' });
    await expect(district).not.toHaveValue('');
    await settle(page);
    await argosScreenshot(page, `destinations-${lang}-${testInfo.project.name}-district`);
  });
}
