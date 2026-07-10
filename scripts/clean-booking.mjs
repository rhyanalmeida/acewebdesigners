#!/usr/bin/env node
import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const TEST_CODE = 'TEST36224'
const ts = Date.now()
const CONTACT = {
  first: 'EndToEnd',
  last: 'Verify',
  email: `e2e-verify+${ts}@acewebdesigners.com`,
  phone: '9785551234',
}

const browser = await chromium.connectOverCDP('http://localhost:9222')
const ctx = browser.contexts()[0]

const events = []
ctx.on('request', (req) => {
  const u = req.url()
  if (
    u.includes('/.netlify/functions/') ||
    u.includes('api.leadconnectorhq.com/widget') ||
    u.includes('api.leadconnectorhq.com/calendar')
  ) {
    const t = new Date().toISOString().slice(11, 19)
    const type = u.includes('netlify') ? 'NETLIFY' : 'GHL'
    events.push({ t, method: req.method(), url: u.slice(0, 150), type })
    console.log(`[${t}] ${type === 'NETLIFY' ? '🟢' : '🔵'} ${req.method()} ${u.slice(0, 140)}`)
  }
})
ctx.on('response', async (resp) => {
  const u = resp.url()
  if (u.includes('/.netlify/functions/ghl-capi')) {
    try {
      const body = await resp.text()
      console.log(`         🟢 ghl-capi RESPONSE ${resp.status()}: ${body.slice(0, 250)}`)
    } catch {}
  }
  if (u.includes('api.leadconnectorhq.com/calendar') || u.includes('appointment')) {
    try {
      const body = await resp.text()
      if (body.length < 1500) console.log(`         🔵 GHL ${resp.status()}: ${body.slice(0, 300)}`)
    } catch {}
  }
})

const url = `https://acewebdesigners.com/contractorlanding?test_event_code=${TEST_CODE}&fbclid=clean_${ts}`
console.log(`\nLoading ${url}\n`)
const page = await ctx.newPage()
page.on('console', (m) => {
  const t = m.text()
  if (/booking|✅ Booking|attribution|capi|leadconnector/i.test(t)) {
    console.log(`  CONSOLE: ${t.slice(0, 220)}`)
  }
})
page.on('pageerror', (e) => console.log(`  PAGE ERROR: ${String(e).slice(0, 200)}`))

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(5000)

await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(
    (b) => /^Accept$/i.test((b.textContent || '').trim()),
  )
  btn?.click()
})
await page.evaluate(() => {
  document.querySelector('iframe[src*="leadconnector"]')?.scrollIntoView({ block: 'start' })
})
await page.evaluate(() => window.scrollBy(0, -100))
await page.waitForTimeout(7000)

const eventId = await page.evaluate(() => {
  try {
    return JSON.parse(sessionStorage.getItem('awd_attribution') || '{}').event_id
  } catch {
    return null
  }
})
console.log(`event_id: ${eventId}`)
console.log(`email: ${CONTACT.email}`)
console.log(`phone: ${CONTACT.phone}\n`)

const ghlFrame = page.frames().find((f) => f.url().includes('leadconnectorhq'))
const ifBoxFn = () => page.locator('iframe[src*="leadconnector"]').boundingBox()

const click = async (info, label) => {
  if (!info) {
    console.log(`  ✗ ${label}`)
    return false
  }
  const box = await ifBoxFn()
  await page.mouse.click(box.x + info.x + info.w / 2, box.y + info.y + info.h / 2)
  console.log(`  ✓ ${label}: "${info.text}"`)
  return true
}

console.log('Step 1: time slot')
const slot = await ghlFrame.evaluate(() => {
  let r = null
  document.querySelectorAll('*').forEach((el) => {
    if (r || el.children.length > 0) return
    const t = (el.textContent || '').trim()
    if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(t)) {
      const b = el.getBoundingClientRect()
      if (b.width > 0 && b.height > 0) r = { text: t, x: b.x, y: b.y, w: b.width, h: b.height }
    }
  })
  return r
})
await click(slot, 'time slot')
await page.waitForTimeout(2500)

console.log('Step 2: Select')
const sel = await ghlFrame.evaluate(() => {
  let r = null
  document.querySelectorAll('button').forEach((el) => {
    if (r) return
    const t = (el.textContent || '').trim()
    if (/^Select$/i.test(t) && !el.disabled) {
      const b = el.getBoundingClientRect()
      if (b.width > 0 && b.height > 0) r = { text: t, x: b.x, y: b.y, w: b.width, h: b.height }
    }
  })
  return r
})
await click(sel, 'Select')
await page.waitForTimeout(4000)

console.log('Step 3: fill form')
for (const [field, value] of Object.entries(CONTACT)) {
  const ok = await ghlFrame.evaluate(
    ({ field, value }) => {
      const meta = (el) =>
        (
          (el.getAttribute('name') || '') +
          ' ' +
          (el.getAttribute('placeholder') || '') +
          ' ' +
          (el.getAttribute('aria-label') || '') +
          ' ' +
          (el.id || '') +
          ' ' +
          (el.getAttribute('type') || '')
        ).toLowerCase()
      const target = Array.from(document.querySelectorAll('input, textarea')).find((el) => {
        const m = meta(el)
        if (field === 'first') return /first|fname/.test(m)
        if (field === 'last') return /last|lname|business/.test(m)
        if (field === 'email') return /email/.test(m)
        if (field === 'phone') return /phone|tel|mobile/.test(m)
        return false
      })
      if (!target) return false
      target.focus()
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), 'value')?.set
      setter?.call(target, value)
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.dispatchEvent(new Event('change', { bubbles: true }))
      target.blur()
      return true
    },
    { field, value },
  )
  console.log(`  ${field}: ${ok ? '✓' : '✗'}`)
  await page.waitForTimeout(300)
}

const consent = await ghlFrame.evaluate(() => {
  const cb = document.querySelector('input[type="checkbox"]')
  if (cb && !cb.checked) cb.click()
  return cb?.checked || false
})
console.log(`Step 4: SMS consent: ${consent}`)
await page.waitForTimeout(800)

console.log('Step 5: Schedule Meeting')
const submit = await ghlFrame.evaluate(() => {
  let r = null
  document.querySelectorAll('button').forEach((el) => {
    if (r) return
    const t = (el.textContent || '').trim()
    if (/Schedule Meeting/i.test(t) && !el.disabled) {
      const b = el.getBoundingClientRect()
      if (b.width > 0 && b.height > 0) r = { text: t, x: b.x, y: b.y, w: b.width, h: b.height }
    }
  })
  return r
})
if (!submit) {
  const disabled = await ghlFrame.evaluate(() => {
    const r = []
    document.querySelectorAll('button').forEach((el) => {
      const t = (el.textContent || '').trim()
      if (/Schedule|Submit|Book/i.test(t)) r.push({ text: t, disabled: el.disabled })
    })
    return r
  })
  console.log(`  no enabled submit. State: ${JSON.stringify(disabled)}`)
} else {
  await click(submit, 'submit')
}

console.log('\n--- Watching 120s for booking + workflow + ghl-capi ---')
const start = Date.now()
const check = setInterval(() => {
  const sec = Math.floor((Date.now() - start) / 1000)
  console.log(`  ${sec}s elapsed | events captured: ${events.length}`)
}, 15000)
await page.waitForTimeout(120000)
clearInterval(check)

const finalText = await ghlFrame.evaluate(() => (document.body.innerText || '').slice(0, 1500)).catch(() => '')
console.log('\nFinal iframe text (first 800):')
console.log(finalText.slice(0, 800))

const tmp = path.join(os.tmpdir(), 'awd-snapshots')
await fs.mkdir(tmp, { recursive: true })
await page.screenshot({ path: path.join(tmp, 'clean-final.png'), fullPage: true })

console.log('\n══ EVIDENCE ══')
console.log(`event_id     : ${eventId}`)
console.log(`Total events : ${events.length}`)
events.forEach((e) => console.log(`  [${e.t}] ${e.type} ${e.method} ${e.url}`))

const ghlCapi = events.filter((e) => e.url.includes('ghl-capi'))
const stash = events.filter((e) => e.url.includes('attribution-stash'))
const ghlBooking = events.filter((e) => e.type === 'GHL')

console.log(`\n  GHL booking submit  : ${ghlBooking.length}`)
console.log(`  attribution-stash   : ${stash.length}`)
console.log(`  ghl-capi (workflow) : ${ghlCapi.length}`)

if (ghlBooking.length > 0 && ghlCapi.length > 0) {
  console.log('\n🟢 END-TO-END VERIFIED — booking saved AND workflow webhook fired')
} else if (ghlBooking.length > 0 && ghlCapi.length === 0) {
  console.log('\n🟡 Booking saved to GHL but workflow did not fire ghl-capi (yet — may take longer)')
} else if (ghlBooking.length === 0) {
  console.log('\n🔴 No booking submit network call detected — form may have rejected silently')
}

await browser.close().catch(() => {})
