import { defineConfig } from '@playwright/test';
import { createArgosReporterOptions } from '@argos-ci/playwright/reporter';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [
    [process.env.CI ? 'dot' : 'list'],
    ['@argos-ci/playwright/reporter', createArgosReporterOptions({ uploadToArgos: process.env.ARGOS_UPLOAD === 'true' })],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3110',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'Asia/Bangkok',
    trace: 'off',
    screenshot: 'only-on-failure',
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
      args: ['--disable-lcd-text', '--font-render-hinting=none'],
    },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: process.env.VISUAL_USE_DEV === 'true' ? 'npm run dev -- --webpack --port 3110 --hostname 127.0.0.1' : 'npm run start -- --port 3110 --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3110/go?lang=en',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'ci-placeholder-key',
    },
  },
});
