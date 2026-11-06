#!/usr/bin/env node
/**
 * scrape-places.mjs — pull local businesses from Google Maps with OUR OWN Playwright (no Apify) and
 * write the SAME CSV `import-prospects.mjs` already understands (title / emails/0 / phone / city /
 * state / zip / website / websiteKind / placeId / categoryName / totalScore / reviewsCount / address).
 *
 * WHY: Apify's Starter plan ($19/mo) was nearly exhausted after two scrapes (2026-11-04: $18.4 of $19).
 * Google Maps search results are a public page our Playwright can read: the list pane yields name /
 * rating / review count / category / street, and each place page yields website / phone / full address.
 * Proven 2026-11-05: 47 Worcester restaurants in 11.7s; details ~1.5s/place. Cost: $0.
 *
 *   node scripts/scrape-places.mjs --search restaurant --city "Worcester, MA" --city "Lowell, MA" --max 80 --out leads/x.csv
 *   node scripts/scrape-places.mjs --search "pizza" --search "italian restaurant" --city "Quincy, MA" --website withWebsite
 *
 * Options: --search (repeatable), --city (repeatable, "City, ST"), --max <n per search×city, default 120>,
 *          --website allPlaces|withWebsite|withoutWebsite (default allPlaces), --out <csv>,
 *          --no-details (list pass only — no website/phone), --concurrency <tabs for details, default 3>,
 *          --headful (watch it), --resume (reuse <out>.cache.json from a previous run).
 *
 * Pacing: ~1–2s jitter between place pages; stops and says so if Google serves a CAPTCHA/"unusual traffic"
 * page (rare at this volume from a home IP — wait an hour or use --headful and solve it once).
 * Google Maps publishes NO emails: run scripts/enrich-emails.mjs (and enrich-haiku.mjs) next, then
 * verify-emails → import-prospects --verify, exactly as with an Apify CSV.
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { classifyWebsite } from './lib/website-kind.mjs'
import { placeIdFromHref, parseRating, parseAddress, parseCardText, mapsQuery, phoneFromItemId } from './lib/places.mjs'

const args = process.argv.slice(2)
const many = (n) => args.flatMap((a, i) => (a === `--${n}` ? [args[i + 1]] : []))
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && i + 1 < args.length ? args[i + 1] : d }
const flag = (n) => args.includes(`--${n}`)
const searches = many('search'), cities = many('city')
if (!searches.length || !cities.length) { console.error('usage: --search <term> --city "City, ST" [--max N] [--out file.csv] …'); process.exit(1) }
const MAX = Number(opt('max', 120))
const WEBSITE = opt('website', 'allPlaces')
const OUT = opt('out', `leads/places-${new Date().toISOString().slice(0, 10)}.csv`)
const CONC = Number(opt('concurrency', 3))
const DETAILS = !flag('no-details')
const CACHE = `${OUT}.cache.json`
const cache = flag('resume') && fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {}
const saveCache = () => fs.writeFileSync(CACHE, JSON.stringify(cache))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const jitter = (a, b) => sleep(a + Math.random() * (b - a))

const browser = await chromium.launch({ headless: !flag('headful') })
const ctx = await browser.newContext({
  locale: 'en-US', viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
})
const blocked = (page) => page.url().includes('/sorry/') || page.locator('#captcha-form, form[action*="sorry"]').count().then((n) => n > 0)

async function acceptConsent(page) {
  const c = page.locator('button:has-text("Accept all"), form[action*="consent"] button').first()
  if (await c.isVisible({ timeout: 2500 }).catch(() => false)) await c.click().catch(() => {})
}

// ── list pass ────────────────────────────────────────────────────────────────
const places = new Map() // placeId → row
for (const search of searches) {
  for (const city of cities) {
    const q = mapsQuery(search, city)
    const page = await ctx.newPage()
    process.stderr.write(`→ ${q} … `)
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(q)}?hl=en`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await acceptConsent(page)
    if (await blocked(page)) { console.error('\nBLOCKED — Google is asking for a CAPTCHA. Wait an hour, or re-run with --headful and solve it once.'); await browser.close(); process.exit(2) }
    const feed = page.locator('div[role="feed"]')
    if (!(await feed.waitFor({ timeout: 30000 }).then(() => true).catch(() => false))) { console.error('no results'); await page.close(); continue }
    let last = -1, same = 0, n = 0
    while (n < MAX && same < 3) {
      await feed.evaluate((el) => el.scrollBy(0, 4000))
      await jitter(900, 1600)
      n = await page.locator('div[role="feed"] a[href*="/maps/place/"]').count()
      if (await page.locator('div[role="feed"] span:has-text("You\'ve reached the end of the list")').count()) break
      same = n === last ? same + 1 : 0
      last = n
    }
    const cards = await page.evaluate(() => [...document.querySelectorAll('div[role="feed"] a[href*="/maps/place/"]')].map((a) => ({
      name: a.getAttribute('aria-label') || '', href: a.href, text: (a.closest('div[jsaction]') || a.parentElement)?.innerText || '',
    })))
    let added = 0
    for (const c of cards.slice(0, MAX)) {
      const id = placeIdFromHref(c.href)
      if (!id || places.has(id) || !c.name) continue
      const { rating, reviews } = parseRating(c.text)
      const { category, street, price } = parseCardText(c.text)
      places.set(id, { placeId: id, title: c.name, url: c.href.split('?')[0], totalScore: rating ?? '', reviewsCount: reviews ?? '', categoryName: category, street, price, searchCity: city, search })
      added++
    }
    console.error(`${cards.length} cards, ${added} new (total ${places.size})`)
    await page.close()
    await jitter(1500, 3000)
  }
}

// ── details pass: website / phone / full address ─────────────────────────────
if (DETAILS) {
  const queue = [...places.values()].filter((p) => !cache[p.placeId])
  console.error(`→ details for ${queue.length} places (${places.size - queue.length} cached), ${CONC} tabs …`)
  let done = 0
  const worker = async () => {
    const page = await ctx.newPage()
    for (;;) {
      const p = queue.shift()
      if (!p) break
      try {
        await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
        if (await blocked(page)) { console.error('\nBLOCKED mid-run — progress is cached; re-run later with --resume.'); saveCache(); await browser.close(); process.exit(2) }
        await page.locator('h1').first().waitFor({ timeout: 20000 })
        await jitter(500, 900)
        const d = await page.evaluate(() => {
          const q = (s) => document.querySelector(s)
          return {
            website: q('a[data-item-id="authority"]')?.href || '',
            phoneId: q('button[data-item-id^="phone:tel:"]')?.getAttribute('data-item-id') || '',
            address: q('button[data-item-id="address"]')?.getAttribute('aria-label')?.replace(/^Address:\s*/i, '') || '',
            category: q('button[jsaction*="category"]')?.innerText?.trim() || '',
            plusCode: q('button[data-item-id="oloc"]')?.getAttribute('aria-label')?.replace(/^Plus code:\s*/i, '') || '',
          }
        })
        cache[p.placeId] = { website: d.website, phone: phoneFromItemId(d.phoneId), address: d.address.trim(), category: d.category || p.categoryName }
      } catch (e) {
        cache[p.placeId] = { website: '', phone: '', address: '', category: p.categoryName, error: String(e.message).slice(0, 80) }
      }
      if (++done % 10 === 0) { saveCache(); process.stderr.write(`  ${done}/${done + queue.length}\r`) }
      await jitter(800, 1800)
    }
    await page.close()
  }
  await Promise.all(Array.from({ length: Math.min(CONC, Math.max(1, queue.length)) }, worker))
  saveCache()
  console.error(`  details done (${done}).`)
}
await browser.close()

// ── rows → CSV (importer-compatible headers) ─────────────────────────────────
const rows = []
for (const p of places.values()) {
  const d = cache[p.placeId] || {}
  const addr = parseAddress(d.address || '')
  const [cityFromSearch, stateFromSearch = ''] = p.searchCity.split(',').map((s) => s.trim())
  const website = d.website || ''
  const kind = classifyWebsite(website)
  if (WEBSITE === 'withWebsite' && kind !== 'real') continue
  if (WEBSITE === 'withoutWebsite' && kind === 'real') continue
  rows.push({
    title: p.title, 'emails/0': '', phone: d.phone || '', city: addr.city || cityFromSearch, state: addr.state || stateFromSearch.slice(0, 2).toUpperCase(),
    zip: addr.zip, website, websiteKind: kind, placeId: p.placeId, categoryName: d.category || p.categoryName, totalScore: p.totalScore,
    reviewsCount: p.reviewsCount, address: d.address || p.street, price: p.price, url: p.url, country: 'US', search: p.search,
  })
}
const cols = ['title', 'emails/0', 'phone', 'city', 'state', 'zip', 'website', 'websiteKind', 'placeId', 'categoryName', 'totalScore', 'reviewsCount', 'address', 'price', 'url', 'country', 'search']
const cell = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n'))

const by = (k) => rows.reduce((m, r) => ((m[r[k] || '—'] = (m[r[k] || '—'] || 0) + 1), m), {})
console.error(`\n${rows.length} places → ${OUT}`)
console.error(`  website: none ${by('websiteKind').none ?? 0} · social-only ${by('websiteKind').social ?? 0} · real ${by('websiteKind').real ?? 0}`)
console.error(`  with phone: ${rows.filter((r) => r.phone).length} · with rating: ${rows.filter((r) => r.totalScore !== '').length}`)
console.error('  by city:', JSON.stringify(by('city')))
console.error('  next: node scripts/enrich-emails.mjs --in ' + OUT + '   (then verify-emails → import-prospects --verify)')
