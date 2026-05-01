#!/usr/bin/env node
/**
 * Verify the Facebook Pixel ID configured at the GHL contractor location.
 *
 * GHL location settings auto-inject a Facebook Pixel into pages served via
 * GHL widgets/funnels — that's what was firing pixel 4230021860577001 onto
 * /contractorlanding from outside our code. This script lets us confirm
 * what's actually configured and update it if wrong.
 *
 * The GHL UI is too dynamic to auto-navigate reliably across roles + UI
 * versions, so the user manually navigates to the pixel setting; the script
 * then scrapes the current value from whatever input field is visible.
 *
 * Usage:
 *   node scripts/verify-ghl-pixel.mjs
 *   node scripts/verify-ghl-pixel.mjs --expected 4230021860577001
 */
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const argv = (key, fallback = null) => {
  const i = args.indexOf(key)
  return i >= 0 ? args[i + 1] : fallback
}

const EXPECTED = argv('--expected', '4230021860577001')
const PIXEL_RE = /\b(\d{15,16})\b/

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

console.log(`\n🌐 Launching Chromium → GoHighLevel`)
console.log(`   expected pixel: ${EXPECTED}\n`)

const browser = await chromium.launch({
  headless: false,
  slowMo: 150,
  args: ['--start-maximized'],
})
const ctx = await browser.newContext({ viewport: null })
const page = await ctx.newPage()

await page.goto('https://app.gohighlevel.com/', { waitUntil: 'domcontentloaded' })

await waitEnter(
  '👤 Please log in to GHL.\n' +
    `   Then SWITCH TO THE CONTRACTOR LOCATION (the one your contractor ads route to).`,
)

await waitEnter(
  '📍 Now navigate to the location settings where the Facebook Pixel is configured.\n' +
    `   Common paths (UI varies):\n` +
    `     • Settings → Integrations → Facebook (Pixel ID field)\n` +
    `     • Settings → Tracking & Pixels → Facebook Pixel\n` +
    `     • Sites/Funnels → <site> → Tracking → Facebook Pixel\n` +
    `   Stop when you can see the pixel-ID input field on screen.`,
)

console.log(`\n🔍 Scanning all visible input fields for a 15-16 digit pixel ID...\n`)

// Pull every input/textarea value + every text node, look for pixel-shaped IDs
const candidates = await page
  .evaluate(() => {
    const results = []
    document.querySelectorAll('input, textarea').forEach((el) => {
      const v = (el.value || '').trim()
      if (v) {
        results.push({
          source: 'input',
          name: el.getAttribute('name') || '',
          id: el.id || '',
          placeholder: el.getAttribute('placeholder') || '',
          ariaLabel: el.getAttribute('aria-label') || '',
          value: v,
        })
      }
    })
    // Also scrape visible text nodes that look like pixel IDs (15-16 digits)
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const t = walker.currentNode.textContent?.trim() || ''
      if (/\b\d{15,16}\b/.test(t)) {
        results.push({ source: 'text', value: t.slice(0, 200) })
      }
    }
    return results
  })
  .catch(() => [])

const pixelIds = new Set()
for (const c of candidates) {
  const m = c.value?.match(PIXEL_RE)
  if (m) pixelIds.add(m[1])
}

console.log(`Found ${pixelIds.size} pixel-shaped ID(s) on page:`)
for (const id of pixelIds) {
  const status =
    id === EXPECTED
      ? '✅ correct'
      : id === '1548487516424971'
        ? '❌ OLD value — should be replaced'
        : '⚠ unknown'
  console.log(`  ${id}  ${status}`)
}

if (pixelIds.size === 0) {
  console.log(`\n⚠ No pixel-shaped IDs found in any input or visible text on this page.`)
  console.log(`  Either:`)
  console.log(`    • You're not on the right settings screen yet, OR`)
  console.log(`    • The pixel field is rendered inside an iframe (GHL sometimes does this)`)
  console.log(`\nAll non-empty input fields on page (for diagnosis):`)
  candidates
    .filter((c) => c.source === 'input')
    .slice(0, 30)
    .forEach((c) => {
      console.log(
        `  name="${c.name}" id="${c.id}" label="${c.ariaLabel}" value="${c.value.slice(0, 80)}"`,
      )
    })
}

console.log()
if (pixelIds.has(EXPECTED) && !pixelIds.has('1548487516424971')) {
  console.log(`✅ Contractor location is configured with the correct pixel.`)
} else if (pixelIds.has('1548487516424971')) {
  console.log(`❌ Contractor location is configured with the OLD wrong pixel.`)
  console.log(`   Update the field in the browser to ${EXPECTED} and save.`)
} else if (pixelIds.size > 0 && !pixelIds.has(EXPECTED)) {
  console.log(`⚠ Pixel ID(s) found but none match expected ${EXPECTED}.`)
  console.log(`   Confirm with the user which ID is canonical and update if needed.`)
}

console.log(`\n👋 Browser stays open. Close it to exit.`)
await new Promise((r) => browser.on('disconnected', r))
