import { defineConfig, devices } from '@playwright/test'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const cache = process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'ms-playwright') : ''
const installed = cache && existsSync(cache) ? readdirSync(cache).filter(name => /^chromium-\d+$/.test(name)).sort((a,b) => Number(b.split('-')[1]) - Number(a.split('-')[1])) : []
const executablePath = process.env.CI ? undefined : installed.map(name => join(cache, name, 'chrome-win64', 'chrome.exe')).find(existsSync)

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.LIVE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: process.env.LIVE_URL ? undefined : { command: 'npm run preview', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } },
    { name: 'landscape', use: { viewport: { width: 844, height: 390 }, isMobile:true, hasTouch:true } },
    { name: 'reduced-motion', use: { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' } },
  ],
})
