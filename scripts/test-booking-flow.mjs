#!/usr/bin/env node
/**
 * Headed Playwright booking-flow test.
 *
 * Launches a VISIBLE Chromium pointed at the production contractor landing
 * page, captures every Meta pixel network request and every postMessage from
 * the GHL booking iframe, then waits for the operator to manually submit a
 * test booking. After submit, dumps all captured signals to the console so we
 * can verify which pixel(s) fired and what shape GHL's success postMessage
 * has (this is what `BookingWidget.tsx` postMessage detection reads from).
 *
 * Usage:
 *   node scripts/test-booking-flow.mjs                 # production
 *   node scripts/test-booking-flow.mjs --code TEST123  # with Meta Test Events code
 *   node scripts/test-booking-flow.mjs --url <staging>  # alternate base URL
 *
 * The browser stays open after the report so you can inspect manually. Close
 * the browser window to exit the script.
 */
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const argv = (key, fallback = null) => {
  const i = args.indexOf(key)
  return i >= 0 ? args[i + 1] : fallback
}

const BASE = argv('--url', 'https://acewebdesigners.com')
const TEST_CODE = argv('--code', null)
const URL = `${BASE}/contractorlanding${TEST_CODE ? `?test_event_code=${TEST_CODE}` : ''}`

console.log(`\n🌐 Launching headed Chromium against: ${URL}\n`)

const browser = await chromium.launch({
  headless: false,
  slowMo: 200,
  args: ['--start-maximized'],
})
const ctx = await browser.newContext({ viewport: null })

const pixelCalls = []
const postMessages = []
const consoleLogs = []
const consoleErrors = []

ctx.on('request', req => {
  const u = req.url()
  if (u.includes('facebook.com/tr') || u.includes('connect.facebook.net/signals')) {
    const id = u.match(/[?&]id=(\d+)/)?.[1]
    const ev = u.match(/[?&]ev=([^&]+)/)?.[1]
    pixelCalls.push({ id, ev, url: u.slice(0, 250) })
  }
})

const page = await ctx.newPage()

// Inject a global postMessage interceptor BEFORE navigation so we capture
// every message including those that fire before our other listeners attach.
await page.addInitScript(() => {
  // @ts-expect-error — runtime-attached
  window.__capturedMessages = []
  window.addEventListener(
    'message',
    e => {
      try {
        // @ts-expect-error — runtime-attached
        window.__capturedMessages.push({
          ts: Date.now(),
          origin: e.origin,
          data: e.data,
        })
      } catch {
        /* clone failures (DataCloneError) — ignore */
      }
    },
    { capture: true },
  )
})

page.on('console', msg => {
  const t = msg.type()
  const text = msg.text()
  if (t === 'error') consoleErrors.push(text)
  else consoleLogs.push(`[${t}] ${text}`)
})

await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 })

console.log('✓ Page loaded. Booking iframe should be visible in the browser.')
console.log()
console.log('========================================')
console.log('  NEXT: SUBMIT A TEST BOOKING IN THE BROWSER')
console.log('========================================')
console.log('  - Use realistic email + phone + name')
console.log(`  - Test code: ${TEST_CODE || '(none — events will hit live data)'}`)
console.log('  - Wait for the GHL "Confirmed" / "Thank you" screen')
console.log('  - Then come back here and press ENTER to dump the report')
console.log()

// Wait for ENTER on stdin
await new Promise(resolve => {
  process.stdin.setRawMode?.(true)
  process.stdin.resume()
  process.stdin.once('data', () => {
    process.stdin.setRawMode?.(false)
    process.stdin.pause()
    resolve()
  })
})

// Pull captured postMessages out of the page context
const messages = await page
  .evaluate(() => {
    // @ts-expect-error — runtime-attached
    return window.__capturedMessages || []
  })
  .catch(() => [])

const fromGhl = messages.filter(
  m =>
    m.origin?.includes('leadconnectorhq.com') ||
    m.origin?.includes('msgsndr.com'),
)

console.log('\n========== BOOKING-FLOW REPORT ==========\n')

console.log('--- META PIXEL FIRES ---')
const byId = pixelCalls.reduce((acc, c) => {
  const k = c.id || 'unknown'
  acc[k] = acc[k] || new Set()
  acc[k].add(c.ev || 'unknown')
  return acc
}, {})
for (const [id, evs] of Object.entries(byId)) {
  console.log(`  pixel ${id}: ${[...evs].join(', ')} (${pixelCalls.filter(c => c.id === id).length} total fires)`)
}
console.log()

console.log('--- GHL postMessages ---')
console.log(`  total messages: ${messages.length}`)
console.log(`  from GHL origins: ${fromGhl.length}`)
if (fromGhl.length > 0) {
  console.log('  full payloads (last 10):')
  for (const m of fromGhl.slice(-10)) {
    console.log(`    [${new Date(m.ts).toISOString().slice(11, 19)}] origin=${m.origin}`)
    console.log(`      data: ${JSON.stringify(m.data).slice(0, 400)}`)
  }
} else {
  console.log('  ⚠ No messages from leadconnectorhq.com / msgsndr.com captured.')
  console.log('  ⚠ This explains why BookingWidget.tsx detection never fires.')
  console.log('  ⚠ GHL widget either does not postMessage on submit, or sends from a')
  console.log('  ⚠ different origin we are not filtering for. Check origin field above.')
}
console.log()

console.log('--- CONSOLE LOGS (booking-relevant) ---')
const relevant = consoleLogs.filter(l =>
  /booking|appointment|fbq|pixel|capi|event_id|attribution|leadconnector/i.test(l),
)
console.log(relevant.length === 0 ? '  (none — that is itself diagnostic)' : '')
relevant.slice(-30).forEach(l => console.log(`  ${l}`))
console.log()

console.log('--- CONSOLE ERRORS ---')
console.log(consoleErrors.length === 0 ? '  (none)' : '')
consoleErrors.slice(0, 15).forEach(l => console.log(`  ${l}`))
console.log()

console.log('--- VERDICT ---')
const sawCorrectPixel = pixelCalls.some(c => c.id === '4230021860577001')
const sawWrongPixel = pixelCalls.some(c => c.id === '1548487516424971')
const sawSubmit = relevant.some(l => l.includes('Booking detected'))
const sawCAPI = consoleLogs.some(l => l.includes('event_id='))
console.log(`  ✓ Correct contractor pixel fired (4230021860577001): ${sawCorrectPixel ? 'YES' : 'NO'}`)
console.log(`  ✓ Wrong contractor pixel did NOT fire (1548487516424971): ${sawWrongPixel ? 'NO ⚠' : 'YES'}`)
console.log(`  ✓ Booking-detection log fired: ${sawSubmit ? 'YES' : 'NO ⚠'}`)
console.log(`  ✓ event_id was logged (attribution flow): ${sawCAPI ? 'YES' : 'NO'}`)
console.log()
console.log('Browser stays open for manual inspection. Close it to exit.')

await new Promise(resolve => browser.on('disconnected', resolve))
