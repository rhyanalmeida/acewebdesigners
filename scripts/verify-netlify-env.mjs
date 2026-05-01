#!/usr/bin/env node
/**
 * Verify (and optionally fix) the Netlify env var META_PIXEL_ID.
 *
 * Drives a visible Chromium so the user can log in once, then automates the
 * navigation to Site configuration → Environment variables. Reads the current
 * value of META_PIXEL_ID and compares against the expected one. If wrong /
 * unset, prompts the user to update via the same browser session.
 *
 * Usage:
 *   node scripts/verify-netlify-env.mjs
 *   node scripts/verify-netlify-env.mjs --site acewebdesigners --expected 4230021860577001
 */
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const argv = (key, fallback = null) => {
  const i = args.indexOf(key)
  return i >= 0 ? args[i + 1] : fallback
}

const SITE_NAME = argv('--site', 'acewebdesigners')
const EXPECTED = argv('--expected', '4230021860577001')
const ENV_VAR = 'META_PIXEL_ID'

const waitEnter = (msg) =>
  new Promise((resolve) => {
    process.stdout.write(`\n${msg}\nPress ENTER when ready... `)
    process.stdin.setRawMode?.(true)
    process.stdin.resume()
    process.stdin.once('data', () => {
      process.stdin.setRawMode?.(false)
      process.stdin.pause()
      console.log()
      resolve()
    })
  })

const promptYN = (msg) =>
  new Promise((resolve) => {
    process.stdout.write(`\n${msg} [y/n]: `)
    process.stdin.setRawMode?.(true)
    process.stdin.resume()
    process.stdin.once('data', (d) => {
      process.stdin.setRawMode?.(false)
      process.stdin.pause()
      const ch = d.toString().toLowerCase()[0]
      console.log(ch)
      resolve(ch === 'y')
    })
  })

console.log(`\n🌐 Launching Chromium → Netlify`)
console.log(`   site:     ${SITE_NAME}`)
console.log(`   var:      ${ENV_VAR}`)
console.log(`   expected: ${EXPECTED}\n`)

const browser = await chromium.launch({
  headless: false,
  slowMo: 150,
  args: ['--start-maximized'],
})
const ctx = await browser.newContext({ viewport: null })
const page = await ctx.newPage()

await page.goto('https://app.netlify.com/', { waitUntil: 'domcontentloaded' })

await waitEnter(
  '👤 Please log in to Netlify in the browser window.\n' +
    `   When you see the dashboard with your sites listed, come back here.`,
)

// Navigate directly to the env-vars page for the configured site
const envUrl = `https://app.netlify.com/sites/${SITE_NAME}/configuration/env`
console.log(`→ Navigating to ${envUrl}`)
await page.goto(envUrl, { waitUntil: 'networkidle', timeout: 30000 })

// Page loaded — try to find the META_PIXEL_ID row
console.log(`\n🔍 Scanning page for ${ENV_VAR}...`)

// Attempt 1: text-based locator (most resilient to selector changes)
const hasVar = await page.getByText(ENV_VAR, { exact: true }).count().catch(() => 0)
if (!hasVar) {
  console.log(`\n⚠ Could not find ${ENV_VAR} in the env-vars list.`)
  console.log(`  This usually means it isn't set yet, OR the Netlify UI changed selectors.`)
  console.log(`  Manual link: ${envUrl}`)
  const yes = await promptYN(`Add ${ENV_VAR}=${EXPECTED} now via the UI?`)
  if (yes) {
    console.log(`\n→ Click "Add a variable" or similar button manually, then come back.`)
    await waitEnter(`Once the new variable form is open with key=${ENV_VAR} value=${EXPECTED}, press ENTER.`)
  }
  console.log(`\n👋 Browser stays open for manual completion. Close it when done.`)
  await new Promise((r) => browser.on('disconnected', r))
  process.exit(0)
}

// Attempt to read the value next to the var name. Netlify shows env values
// masked by default — clicking "Show value" or the row reveals them.
console.log(`✓ Found ${ENV_VAR} on page.`)
console.log(`\n→ Click the ${ENV_VAR} row in the browser to expand/show its value.`)
await waitEnter(
  `Once the value is visible (you may need to click "Show" or the row),\npress ENTER and I'll scrape it.`,
)

// Pull every text node on the page and look for our expected value
const expectedSeen = await page.locator(`text=${EXPECTED}`).count().catch(() => 0)
const wrongOldSeen = await page.locator(`text=1548487516424971`).count().catch(() => 0)

console.log()
if (expectedSeen > 0) {
  console.log(`✅ Correct value visible on page: ${EXPECTED}`)
  console.log(`   META_PIXEL_ID is set correctly. No action needed.`)
} else if (wrongOldSeen > 0) {
  console.log(`❌ OLD value (1548487516424971) is visible on page.`)
  console.log(`   ${ENV_VAR} needs to be updated to ${EXPECTED}.`)
  const yes = await promptYN(`Open the edit form so you can update it?`)
  if (yes) {
    console.log(`\n→ Click the ${ENV_VAR} row → Edit/pencil icon → change value to ${EXPECTED} → Save.`)
    await waitEnter(`When you have saved the new value, press ENTER.`)
    console.log(
      `\n📝 Reminder: Netlify env var changes only take effect on the NEXT deploy.\n` +
        `   Trigger a redeploy via Netlify → Deploys → "Trigger deploy" → "Clear cache and deploy site".`,
    )
  }
} else {
  console.log(`⚠ Couldn't conclusively scrape the value — Netlify may have masked it,`)
  console.log(`  or the UI selectors changed. Look at the open browser:`)
  console.log(`  - If you see ${EXPECTED} → you're good ✅`)
  console.log(`  - If you see 1548487516424971 → click Edit and change to ${EXPECTED}`)
  console.log(`  - If empty / not set → click Add a variable, key=${ENV_VAR}, value=${EXPECTED}`)
  console.log(`  After Netlify next deploys, the new value takes effect.`)
}

console.log(`\n👋 Browser stays open. Close it to exit.`)
await new Promise((r) => browser.on('disconnected', r))
