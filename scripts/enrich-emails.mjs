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
 *
 * Extraction + ranking live in lib/email-quality.mjs (vitest-covered). Only `mailto:` links and
 * VISIBLE text count — never <script>/<style>/attribute values, which is where the 2026-11-04
 * bounces came from (form placeholders, font-licence credits in CSS, JSON-LD blobs, "\\n"
 * leaks) — and junk (placeholder / builder / font / platform / chain domains) is dropped there.
 * `rankEmails` prefers the site's own domain → business-like free-mail → generic role inboxes.
 * The importer re-applies isJunkEmail plus the shared-email (agency) filter afterwards.
 */

import fs from 'node:fs'
import { extractEmailsFromHtml, rankEmails } from './lib/email-quality.mjs'

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

// ── fetch + crawl ──────────────────────────────────────────────────────────
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
async function crawl(website, businessName) {
  let base
  try { base = new URL(website.startsWith('http') ? website : `https://${website}`) } catch { return [] }
  const home = await get(base.href)
  let found = extractEmailsFromHtml(home)
  if (!found.length && home) {
    // follow on-site links that look like contact pages first, then guess common paths
    const links = [...home.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1])
      .filter((h) => /contact|about/i.test(h)).slice(0, 4)
    const tries = new Set()
    for (const h of links) { try { const u = new URL(h, base); if (u.host === base.host) tries.add(u.href) } catch { /* unparseable href */ } }
    for (const p of CONTACT_PATHS) tries.add(new URL(p, base).href)
    for (const u of [...tries].slice(0, 6)) {
      found = extractEmailsFromHtml(await get(u, 8000))
      if (found.length) break
    }
  }
  return rankEmails(found, base.host, { businessName })
}

// ── main ───────────────────────────────────────────────────────────────────
const rows = parseCsv(fs.readFileSync(IN, 'utf8'))
const H = rows[0].map((h) => h.trim())
const ix = (n) => H.indexOf(n)
const iEmail = ix('emails/0'), iSite = ix('website'), iKind = ix('websiteKind')
const iName = ix('title') >= 0 ? ix('title') : ix('name')
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
    const emails = await crawl(rows[r][iSite], iName >= 0 ? rows[r][iName] : '')
    if (emails.length) { rows[r][iEmail] = emails[0]; hits++ }
    done++
    if (done % 10 === 0) process.stdout.write(`  ${done} crawled · ${hits} emails found\r`)
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
console.log(`\n${done} crawled · ${hits} emails found`)
fs.writeFileSync(OUT, rows.map((r) => r.map(esc).join(',')).join('\n') + '\n')
console.log(`wrote → ${OUT}`)
