#!/usr/bin/env node
/**
 * apify-scrape-contractors.mjs — pull contractors from Google Maps via Apify's
 * Google Maps Scraper (compass/crawler-google-places) and write a CSV that
 * `import-prospects.mjs` understands (title / emails/0 / phone / city / state /
 * website / placeId / categoryName / totalScore / reviewsCount).
 *
 * Each place is classified by `websiteKind`:
 *   none    — no website on the listing (the "build you a site" target)
 *   social  — only a Facebook/Instagram/Yelp/Angi/HomeAdvisor/Nextdoor/Houzz link
 *   real    — a real business website (the redesign angle used by the v4 sequence)
 *
 * Google Maps publishes NO email addresses. The actor's `scrapeContacts` add-on
 * crawls the business WEBSITE for emails, so `none` rows have no email source and
 * `social` rows need a Facebook-page scrape — this script just reports the yield.
 *
 * Pricing (Apify FREE tier, 2026-11): $0.004 / place + $0.001 / place per filter.
 *
 *   node scripts/apify-scrape-contractors.mjs --state Massachusetts --search "general contractor" --max 300 --out leads.csv
 *   node scripts/apify-scrape-contractors.mjs --run <runId> --out leads.csv     # re-fetch a finished run
 *
 * Options: --search (repeatable or comma-separated), --state, --city, --max (per search),
 *          --website allPlaces|withoutWebsite|withWebsite (default allPlaces), --contacts
 *          (enable scrapeContacts; only useful with real websites), --budget <usd> (hard cap on
 *          the run, default 2), --out <csv>, --run <id>, --dry (print input, don't start).
 *
 * APIFY_TOKEN comes from supabase/.env (local scripts only, never an Edge secret).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── env ────────────────────────────────────────────────────────────────────
function loadEnv() {
  const p = path.join(ROOT, 'supabase', '.env')
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()
const TOKEN = process.env.APIFY_TOKEN
if (!TOKEN) {
  console.error('APIFY_TOKEN missing (supabase/.env)')
  process.exit(1)
}

// ── args ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def
}
const flag = (name) => args.includes(`--${name}`)
const searches = args
  .flatMap((a, i) => (a === '--search' ? [args[i + 1]] : []))
  .flatMap((s) => s.split(','))
  .map((s) => s.trim())
  .filter(Boolean)
if (searches.length === 0) searches.push('general contractor')

const ACTOR = 'compass~crawler-google-places'
const API = 'https://api.apify.com/v2'

// websiteKind classification is shared with scrape-places.mjs (lib/website-kind.mjs) — one definition.
import { classifyWebsite } from './lib/website-kind.mjs'
export { classifyWebsite }

async function api(pathname, init = {}) {
  const sep = pathname.includes('?') ? '&' : '?'
  const r = await fetch(`${API}${pathname}${sep}token=${TOKEN}`, init)
  if (!r.ok) throw new Error(`${init.method ?? 'GET'} ${pathname} → ${r.status} ${(await r.text()).slice(0, 300)}`)
  return r.json()
}

async function startRun() {
  const input = {
    searchStringsArray: searches,
    countryCode: 'us',
    ...(opt('state') ? { state: opt('state') } : {}),
    ...(opt('city') ? { city: opt('city') } : {}),
    maxCrawledPlacesPerSearch: Number(opt('max', 100)),
    language: 'en',
    website: opt('website', 'allPlaces'),
    skipClosedPlaces: false,
    scrapeContacts: flag('contacts'),
    scrapePlaceDetailPage: false,
    maxImages: 0,
    maxReviews: 0,
  }
  const budget = Number(opt('budget', 2))
  console.log('actor input:', JSON.stringify(input))
  console.log(`hard budget cap: $${budget}`)
  if (flag('dry')) process.exit(0)
  const { data } = await api(`/acts/${ACTOR}/runs?maxTotalChargeUsd=${budget}&memory=2048`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  console.log(`run ${data.id} started → https://console.apify.com/actors/runs/${data.id}`)
  return data.id
}

async function waitForRun(runId) {
  for (;;) {
    const { data } = await api(`/actor-runs/${runId}`)
    const usd = data.usageTotalUsd ?? data.stats?.computeUnits
    process.stdout.write(`\r  status ${data.status}  items ${data.stats?.datasetItemCount ?? '?'}  cost $${Number(usd ?? 0).toFixed(3)}   `)
    if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(data.status)) {
      console.log()
      return data
    }
    await new Promise((r) => setTimeout(r, 10_000))
  }
}

async function fetchItems(datasetId) {
  const items = []
  for (let offset = 0; ; offset += 1000) {
    const page = await api(`/datasets/${datasetId}/items?clean=true&offset=${offset}&limit=1000`)
    items.push(...page)
    if (page.length < 1000) break
  }
  return items
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toRows(items) {
  return items.map((p) => ({
    title: p.title,
    'emails/0': Array.isArray(p.emails) ? p.emails[0] ?? '' : '',
    phone: p.phone ?? p.phoneUnformatted ?? '',
    city: p.city ?? '',
    state: p.state ?? '',
    website: p.website ?? '',
    websiteKind: classifyWebsite(p.website),
    placeId: p.placeId ?? '',
    categoryName: p.categoryName ?? '',
    totalScore: p.totalScore ?? '',
    reviewsCount: p.reviewsCount ?? '',
    address: p.address ?? '',
    url: p.url ?? '',
    facebook: Array.isArray(p.facebooks) ? p.facebooks[0] ?? '' : '',
    instagram: Array.isArray(p.instagrams) ? p.instagrams[0] ?? '' : '',
  }))
}

async function main() {
  const runId = opt('run') || (await startRun())
  const run = await waitForRun(runId)
  if (run.status !== 'SUCCEEDED') console.warn(`run ended ${run.status} — using whatever landed in the dataset`)
  const items = await fetchItems(run.defaultDatasetId)
  const rows = toRows(items)

  const by = (k) => rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] ?? 0) + 1), m), {})
  const kinds = by('websiteKind')
  const withEmail = rows.filter((r) => r['emails/0']).length
  const socialWithPhone = rows.filter((r) => r.websiteKind === 'social' && r.phone).length
  console.log(`\n${rows.length} places · cost $${Number(run.usageTotalUsd ?? 0).toFixed(3)}`)
  console.log(`  website: none ${kinds.none ?? 0} · social-only ${kinds.social ?? 0} · real ${kinds.real ?? 0}`)
  console.log(`  with an email: ${withEmail} · social-only with phone: ${socialWithPhone}`)
  console.log('  by state:', JSON.stringify(by('state')))

  const out = opt('out')
  if (out) {
    const cols = Object.keys(rows[0] ?? { title: '' })
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n')
    fs.writeFileSync(out, csv)
    console.log(`wrote ${rows.length} rows → ${out}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
