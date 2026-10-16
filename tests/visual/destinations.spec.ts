import { test, expect, type Page } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';

async function settle(page: Page) {
  await page.mouse.move(0, 0);
  await page.evaluate(async () => {
    // Full-page capture includes below-fold lazy images. Decode the fixture first.
    for (const image of document.images) image.loading = 'eager';
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, image => image.decode().catch(() => {})));
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function capture(page: Page, name: string, ready: () => Promise<void>) {
  const verify = async () => {
    await ready();
    await expect(page.getByRole('heading', {name: 'กำลังโหลดข้อมูล...'})).toHaveCount(0);
    await settle(page);
    await ready();
  };
  await verify();
  // Revalidate at Argos' capture boundary, not just before its stabilization work.
  await argosScreenshot(page, name, {beforeScreenshot: verify});
  await ready();
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
    // SSR controls can exist before React hydration: exercise a handler before capture.
    const listButton = page.getByRole('button', {name: lang === 'th' ? 'รายชื่อ' : 'List', exact: true});
    const mapButton = page.getByRole('button', {name: lang === 'th' ? 'แผนที่' : 'Map', exact: true});
    await expect(async () => {
      await listButton.click();
      await expect(listButton).toHaveAttribute('aria-pressed', 'true', {timeout: 1000});
    }).toPass();
    await mapButton.click();
    const countryReady = async () => {
      await expect(mapButton).toHaveAttribute('aria-pressed', 'true');
      await expect(country).toHaveAttribute('aria-busy', 'false');
      await expect(page.locator('[data-province]')).toHaveCount(77);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
    };
    await capture(page, `destinations-${lang}-${testInfo.project.name}-country`, countryReady);

    await page.getByLabel(lang === 'th' ? 'หรือเลือกจังหวัดโดยตรง' : 'Or choose a province', { exact: true }).selectOption('nakhon-ratchasima');
    const province = page.locator('[data-province-view="nakhon-ratchasima"]');
    const district = page.getByLabel(lang === 'th' ? 'เลือกอำเภอ' : 'Choose a district', { exact: true });
    await expect(district.locator('option')).toHaveCount(33);
    // Toggle the optional network terrain layer off; do not depend on tile availability.
    const terrain = province.getByRole('button', { name: /▧/ });
    if (await terrain.getAttribute('aria-pressed') === 'true') await terrain.click();
    await expect(province.locator('[data-map-place]')).toHaveCount(5);
    const provinceReady = async () => {
      await expect(province).toBeVisible();
      await expect(province.locator('[data-map-place]')).toHaveCount(5);
      await expect(district.locator('option')).toHaveCount(33);
      await expect(terrain).toHaveAttribute('aria-pressed', 'false');
    };
    await capture(page, `destinations-${lang}-${testInfo.project.name}-province`, async () => {
      await provinceReady();
      await expect(district).toHaveValue('');
    });

    await district.selectOption({ label: lang === 'th' ? 'ปากช่อง' : 'Pak Chong' });
    await expect(district).not.toHaveValue('');
    await capture(page, `destinations-${lang}-${testInfo.project.name}-district`, async () => {
      await provinceReady();
      await expect(district.locator('option:checked')).toHaveText(lang === 'th' ? 'ปากช่อง' : 'Pak Chong');
    });
  });
}
