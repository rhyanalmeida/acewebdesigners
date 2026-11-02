#!/usr/bin/env node
/**
 * enrich-emails.mjs — fill the `emails/0` column of a scraper CSV by crawling each
 * business website ourselves (homepage + common contact pages). $0 alternative to
 * Apify's `scrapeContacts` add-on for runs that were scraped without it.
 *
 *   node scripts/enrich-emails.mjs --in leads.csv --out leads.enriched.csv [--concurrency 8] [--only-missing]
 *
 * Only rows whose `websiteKind` is `real` (or that have a non-social `website`) are
 * crawled. Rows that already have an email are left alone with --only-missing (default).
 * Emails that are obviously not a business inbox (sentry/wixpress/example/placeholder
 * images, etc.) are dropped; the importer applies its own JUNK_EMAIL filter afterwards.
 */

import fs from 'node:fs'

const args = process.argv.slice(2)
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && i + 1 < args.length ? args[i + 1] : d }
const IN = opt('in'), OUT = opt('out', IN?.replace(/\.csv$/i, '.enriched.csv'))
const CONC = Number(opt('concurrency', 8))
if (!IN) { console.error('usage: --in <csv> [--out <csv>]'); process.exit(1) }

// ── csv ────────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else q = false }
      else cell += ch
    } else if (ch === '"') q = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.length > 1 || r[0] !== '')
}
const esc = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }

// ── email extraction ───────────────────────────────────────────────────────
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const BAD_DOMAIN = /(sentry|wixpress|wix\.com|squarespace|godaddy|example\.|domain\.com|email\.com|yourdomain|sentry\.io|w3\.org|schema\.org|\.png$|\.jpg$|\.jpeg$|\.gif$|\.svg$|\.webp$|\.js$|\.css$)/i
const BAD_LOCAL = /^(noreply|no-reply|donotreply|mailer-daemon|postmaster|abuse|webmaster|privacy|legal|dmca|support@(?:wix|squarespace|godaddy))/i
function extract(html) {
  const out = new Set()
  for (const m of html.matchAll(/mailto:([^"'?\s>]+)/gi)) out.add(decodeURIComponent(m[1]).toLowerCase())
  for (const m of html.matchAll(EMAIL_RE)) out.add(m[0].toLowerCase())
  return [...out].filter((e) => !BAD_DOMAIN.test(e) && !BAD_LOCAL.test(e) && e.length < 80)
}
function rank(emails, siteHost) {
  // prefer an address on the business's own domain, then info@/office@ style generic inboxes
  const host = siteHost.replace(/^www\./, '')
  return [...emails].sort((a, b) => {
    const ad = a.endsWith('@' + host) ? 0 : 1, bd = b.endsWith('@' + host) ? 0 : 1
    if (ad !== bd) return ad - bd
    const gen = /^(info|office|contact|hello|sales|admin|service)@/
    return (gen.test(a) ? 0 : 1) - (gen.test(b) ? 0 : 1)
  })
}

async function get(url, ms = 12000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms)
  try {
    const r = await fetch(url, { signal: ac.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; AceWebDesigners-contact-lookup/1.0)' } })
    if (!r.ok) return ''
    const ct = r.headers.get('content-type') || ''
    if (!/html|text/i.test(ct)) return ''
    return (await r.text()).slice(0, 1_500_000)
  } catch { return '' } finally { clearTimeout(t) }
}

const CONTACT_PATHS = ['/contact', '/contact-us', '/contactus', '/contact.html', '/about', '/about-us']
async function crawl(website) {
  let base
  try { base = new URL(website.startsWith('http') ? website : `https://${website}`) } catch { return [] }
  const home = await get(base.href)
  let found = extract(home)
  if (!found.length && home) {
    // follow on-site links that look like contact pages first, then guess common paths
    const links = [...home.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1])
      .filter((h) => /contact|about/i.test(h)).slice(0, 4)
    const tries = new Set()
    for (const h of links) { try { const u = new URL(h, base); if (u.host === base.host) tries.add(u.href) } catch {} }
    for (const p of CONTACT_PATHS) tries.add(new URL(p, base).href)
    for (const u of [...tries].slice(0, 6)) {
      found = extract(await get(u, 8000))
      if (found.length) break
    }
  }
  return rank(found, base.host)
}

// ── main ───────────────────────────────────────────────────────────────────
const rows = parseCsv(fs.readFileSync(IN, 'utf8'))
const H = rows[0].map((h) => h.trim())
const ix = (n) => H.indexOf(n)
const iEmail = ix('emails/0'), iSite = ix('website'), iKind = ix('websiteKind')
if (iEmail < 0 || iSite < 0) { console.error('CSV needs emails/0 and website columns'); process.exit(1) }

const todo = []
for (let r = 1; r < rows.length; r++) {
  const row = rows[r]
  const site = row[iSite]?.trim(), kind = iKind >= 0 ? row[iKind] : (site ? 'real' : 'none')
  if (!site || kind !== 'real') continue
  if (row[iEmail]?.trim()) continue
  todo.push(r)
}
console.log(`${rows.length - 1} rows · ${todo.length} real-website rows without an email → crawling with concurrency ${CONC}`)

let done = 0, hits = 0
async function worker() {
  while (todo.length) {
    const r = todo.shift()
    const emails = await crawl(rows[r][iSite])
    if (emails.length) { rows[r][iEmail] = emails[0]; hits++ }
    done++
    if (done % 10 === 0) process.stdout.write(`  ${done} crawled · ${hits} emails found\r`)
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
console.log(`\n${done} crawled · ${hits} emails found`)
fs.writeFileSync(OUT, rows.map((r) => r.map(esc).join(',')).join('\n') + '\n')
console.log(`wrote → ${OUT}`)
