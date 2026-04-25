import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'iPad',
      use: { ...devices['iPad (gen 7)'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'node .next/standalone/server.js' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: process.env.CI
      ? {
          DATABASE_URL: process.env.DATABASE_URL ?? '',
          APP_PASSWORD_HASH: process.env.APP_PASSWORD_HASH ?? '',
          SESSION_SECRET: process.env.SESSION_SECRET ?? '',
          LIST_PROVIDER: process.env.LIST_PROVIDER ?? 'apple_reminders',
          APPLE_SHORTCUTS_NAME: process.env.APPLE_SHORTCUTS_NAME ?? '',
          E2E_PASSWORD: process.env.E2E_PASSWORD ?? '',
        }
      : {},
  },
})
