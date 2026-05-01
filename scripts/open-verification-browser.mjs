#!/usr/bin/env node
/**
 * Opens ONE headed Chromium with two tabs (Netlify + GHL), no stdin prompts.
 * Stays open with CDP exposed on port 9222 so other scripts can attach,
 * navigate, and scrape state without re-launching or re-logging-in.
 *
 * Run via: node scripts/open-verification-browser.mjs
 * Inspect: chromium.connectOverCDP('http://localhost:9222') from another script.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PORT = 9222
const USER_DATA_DIR = path.join(os.tmpdir(), 'awd-playwright-profile')

// launchPersistentContext keeps cookies/sessions across runs so re-launching
// doesn't force a re-login. user-data-dir is a temp profile, NOT the user's
// real Chrome profile (no risk of polluting their actual browser).
const ctx = await chromium.launchPersistentContext(USER_DATA_DIR, {
  headless: false,
  args: [`--remote-debugging-port=${PORT}`, '--start-maximized'],
  viewport: null,
})

// Tab 1: Netlify
const netlifyPage = ctx.pages()[0] ?? (await ctx.newPage())
await netlifyPage.goto('https://app.netlify.com/', { waitUntil: 'domcontentloaded' })

// Tab 2: GHL
const ghlPage = await ctx.newPage()
await ghlPage.goto('https://app.gohighlevel.com/', { waitUntil: 'domcontentloaded' })

const meta = {
  pid: process.pid,
  port: PORT,
  cdpUrl: `http://localhost:${PORT}`,
  userDataDir: USER_DATA_DIR,
  startedAt: new Date().toISOString(),
}
fs.writeFileSync(path.join(os.tmpdir(), 'awd-browser.json'), JSON.stringify(meta, null, 2))

console.log('───────────────────────────────────────────────────────')
console.log('  CHROMIUM OPEN WITH TWO TABS')
console.log('───────────────────────────────────────────────────────')
console.log(`  CDP endpoint : ${meta.cdpUrl}`)
console.log(`  PID          : ${meta.pid}`)
console.log(`  Profile dir  : ${meta.userDataDir}`)
console.log()
console.log('  Tab 1: Netlify  → https://app.netlify.com/')
console.log('  Tab 2: GHL      → https://app.gohighlevel.com/')
console.log()
console.log('  Log in to both. Switch GHL to the contractor location.')
console.log('  Navigate to the relevant settings pages.')
console.log('  This terminal will stay open until you close the browser.')
console.log('───────────────────────────────────────────────────────')

await new Promise((resolve) => ctx.on('close', resolve))
console.log('\nBrowser closed, exiting.')
