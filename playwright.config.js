const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      testIgnore: ['**/06-mobile-responsive.spec.js'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'chromium-mobile',
      testMatch: ['**/06-mobile-responsive.spec.js'],
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:5000',
    reuseExistingServer: true,
    timeout: 10000,
  },
});
