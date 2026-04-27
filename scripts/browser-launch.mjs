// Launches Chromium headed with a persistent profile so logins stick.
// Keeps CDP open on port 9222 so follow-up scripts can attach.
// Usage: node scripts/browser-launch.mjs [url]

import { chromium } from 'playwright'
import path from 'node:path'
import os from 'node:os'

const url = process.argv[2] || 'about:blank'
const userDataDir = path.join(os.homedir(), '.awd-browser-profile')

const browser = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: null,
  args: ['--remote-debugging-port=9222'],
  channel: 'chrome',
})

const page = browser.pages()[0] || (await browser.newPage())
await page.goto(url)

console.log('BROWSER_LAUNCHED')
console.log('CDP: http://127.0.0.1:9222')

// Keep alive
await new Promise(() => {})
