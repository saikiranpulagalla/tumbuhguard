import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run serve:e2e',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
  retries: 0,
  projects: [{ name: 'edge-local', use: { ...devices['Desktop Edge'], channel: 'msedge' } }],
});
