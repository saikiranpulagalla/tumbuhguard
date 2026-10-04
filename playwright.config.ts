import { defineConfig, devices } from '@playwright/test';

const e2ePort = Number(process.env.E2E_PORT ?? 3001);
const e2eUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  use: {
    baseURL: e2eUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // The release command builds before invoking Playwright. Serving only the
    // completed dist bundle keeps the browser harness on its parent Node
    // runtime instead of resolving a different system Node through npm.cmd.
    command: `"${process.execPath}" scripts/serve-dist.mjs ${e2ePort}`,
    url: e2eUrl,
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1' || !process.env.CI,
  },
  retries: 0,
  projects: [{ name: 'edge-local', use: { ...devices['Desktop Edge'], channel: 'msedge' } }],
});
