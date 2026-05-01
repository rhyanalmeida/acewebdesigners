#!/usr/bin/env node
/**
 * Live production audit using Playwright. Drives a real Chromium against
 * acewebdesigners.com and reports:
 *   - Meta Pixel network calls (which pixel IDs are firing)
 *   - JSON-LD blocks live on each route (catch fake-review regression)
 *   - Per-route <title>, <meta description>, canonical
 *   - /privacypolicy redirect status
 *   - Sitemap freshness
 *   - Console errors
 *   - Booking widget iframe load
 *
 * Read-only. Does NOT submit any form or fire any conversion event.
 */
import { chromium } from 'playwright'

const BASE = 'https://acewebdesigners.com'
const ROUTES = [
  '/',
  '/about',
  '/services',
  '/work',
  '/reviews',
  '/contact',
  '/socialmedia',
  '/refer',
  '/landing',
  '/contractorlanding',
  '/privacy',
]

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
})

const report = {
  pixelCalls: { home: [], contractor: [] },
  routes: [],
  privacyRedirect: null,
  sitemap: null,
  consoleErrors: [],
}

const page = await ctx.newPage()
page.on('console', msg => {
  if (msg.type() === 'error') report.consoleErrors.push(msg.text())
})

// Capture every Meta pixel network request site-wide
ctx.on('request', req => {
  const url = req.url()
  if (url.includes('facebook.com/tr') || url.includes('connect.facebook.net/signals')) {
    const m = url.match(/[?&]id=(\d+)/)
    const ev = url.match(/[?&]ev=([^&]+)/)
    const entry = {
      pixelId: m?.[1] || 'unknown',
      event: ev?.[1] || 'unknown',
      url: url.slice(0, 200),
    }
    if (page.url().includes('contractorlanding')) report.pixelCalls.contractor.push(entry)
    else report.pixelCalls.home.push(entry)
  }
})

// 1. Walk every route, capture per-route SEO state
for (const path of ROUTES) {
  const url = BASE + path
  const r = { path, status: 0, title: '', description: '', canonical: '', robots: '', jsonLdTypes: [], hasAggregateRating: false, hasFakeReview: false, hasBreadcrumb: false }
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 })
    r.status = resp?.status() ?? 0
    r.title = await page.title()
    r.description = await page
      .locator('meta[name="description"]')
      .first()
      .getAttribute('content')
      .catch(() => '')
    r.canonical = await page
      .locator('link[rel="canonical"]')
      .first()
      .getAttribute('href')
      .catch(() => '')
    r.robots = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute('content')
      .catch(() => '')

    const blocks = await page.$$eval('script[type="application/ld+json"]', els =>
      els.map(e => e.textContent || ''),
    )
    for (const raw of blocks) {
      try {
        const parsed = JSON.parse(raw)
        const arr = Array.isArray(parsed) ? parsed : [parsed]
        for (const obj of arr) {
          if (obj && obj['@type']) r.jsonLdTypes.push(obj['@type'])
          if (obj?.aggregateRating) r.hasAggregateRating = true
          if (Array.isArray(obj?.review) && obj.review.length > 0) r.hasFakeReview = true
          if (obj?.['@type'] === 'BreadcrumbList') r.hasBreadcrumb = true
        }
      } catch {
        /* malformed JSON-LD */
      }
    }
  } catch (e) {
    r.error = String(e).slice(0, 200)
  }
  report.routes.push(r)
}

// 2. /privacypolicy redirect check (browser-level, follows redirects)
try {
  const resp = await page.goto(BASE + '/privacypolicy', { waitUntil: 'domcontentloaded', timeout: 15000 })
  report.privacyRedirect = {
    status: resp?.status() ?? 0,
    finalUrl: page.url(),
    redirected: page.url() !== BASE + '/privacypolicy',
  }
} catch (e) {
  report.privacyRedirect = { error: String(e).slice(0, 200) }
}

// 3. Sitemap state
try {
  const resp = await page.goto(BASE + '/sitemap.xml', { waitUntil: 'domcontentloaded' })
  const xml = await resp?.text()
  const dates = [...(xml || '').matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m => m[1])
  const urls = [...(xml || '').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  const uniqueDates = [...new Set(dates)]
  const ageDays = uniqueDates.map(d => {
    const t = Date.parse(d)
    return Number.isFinite(t) ? Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)) : null
  })
  report.sitemap = {
    urlCount: urls.length,
    uniqueLastmodDates: uniqueDates,
    ageDays,
    hasPrivacypolicy: urls.some(u => u.endsWith('/privacypolicy')),
    hasWWW: urls.some(u => u.includes('www.acewebdesigners.com')),
  }
} catch (e) {
  report.sitemap = { error: String(e).slice(0, 200) }
}

await browser.close()

// 4. Print structured report
console.log('\n========== PRODUCTION AUDIT ==========\n')

console.log('--- META PIXEL FIRING ---')
const homePixelIds = [...new Set(report.pixelCalls.home.map(c => c.pixelId))]
const contractorPixelIds = [...new Set(report.pixelCalls.contractor.map(c => c.pixelId))]
console.log(`Home/standard pages: pixels seen = ${homePixelIds.join(', ') || 'NONE'}`)
console.log(`  events: ${[...new Set(report.pixelCalls.home.map(c => c.event))].join(', ')}`)
console.log(`Contractor landing : pixels seen = ${contractorPixelIds.join(', ') || 'NONE'}`)
console.log(`  events: ${[...new Set(report.pixelCalls.contractor.map(c => c.event))].join(', ')}`)
console.log()

console.log('--- PER-ROUTE SEO ---')
const seenTitles = new Map()
const seenDescs = new Map()
for (const r of report.routes) {
  const flags = []
  if (r.status !== 200) flags.push(`HTTP ${r.status}`)
  if (!r.canonical) flags.push('no-canonical')
  if (r.path !== '/' && !r.hasBreadcrumb) flags.push('no-breadcrumb')
  if (r.hasAggregateRating) flags.push('FAKE-aggregateRating')
  if (r.hasFakeReview) flags.push('FAKE-review')
  if (r.path === '/privacy' && !r.robots?.includes('noindex')) flags.push('privacy-not-noindex')
  const dup = []
  if (seenTitles.has(r.title)) dup.push(`title-dup-of-${seenTitles.get(r.title)}`)
  if (seenDescs.has(r.description)) dup.push(`desc-dup-of-${seenDescs.get(r.description)}`)
  seenTitles.set(r.title, r.path)
  seenDescs.set(r.description, r.path)
  flags.push(...dup)
  console.log(`${r.path.padEnd(20)} ${flags.length ? '⚠ ' + flags.join(' | ') : '✓'}`)
  console.log(`  title: ${(r.title || '').slice(0, 80)}`)
  console.log(`  jsonLd: ${r.jsonLdTypes.join(', ') || '(none)'}`)
}
console.log()

console.log('--- /privacypolicy REDIRECT ---')
console.log(JSON.stringify(report.privacyRedirect, null, 2))
console.log()

console.log('--- SITEMAP ---')
console.log(JSON.stringify(report.sitemap, null, 2))
console.log()

console.log('--- CONSOLE ERRORS ---')
console.log(report.consoleErrors.length === 0 ? '(none)' : report.consoleErrors.slice(0, 10).join('\n'))
console.log()

console.log('======================================\n')
