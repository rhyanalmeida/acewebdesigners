#!/usr/bin/env node
/**
 * auto-wave.mjs — the whole lead wave in one run, and the trigger that decides when one is due.
 *
 *   scrape-places → enrich-emails → enrich-haiku → verify-emails (MillionVerifier) → import-prospects --verify
 *   → export-instantly → instantly-upload-leads → re-activate the campaign if COMPLETED → log a line in
 *   docs/OUTBOUND_FLOW.md §9 → write the wave + pipeline state rows the /admin "Lead pipeline" panel reads.
 *
 *   node scripts/auto-wave.mjs --dry                # plan: cities, expected counts, cost, trigger verdict. Touches nothing.
 *   node scripts/auto-wave.mjs --live [--yes]       # run a wave now (asks y/N unless --yes)
 *   node scripts/auto-wave.mjs --auto               # scheduled tick: refresh the state row; run ONLY if /admin queued
 *                                                   # a list ("Scrape a new list") or the pool is running low
 *   node scripts/auto-wave.mjs --tick               # refresh the state row only (credits, runway, next cities)
 *
 *   --cities N (default 4) · --max N places per city (default 80) · --search <term> (default restaurant)
 *   --city "Lynn, MA" (repeatable: override the rotation) · --campaign <instantly id> · --resume (continue a
 *   scrape that stopped on a CAPTCHA) · --no-upload (stop after import) · --force (with --auto: run even if not low)
 *
 * WHY: waves were run by hand (docs/OUTBOUND_FLOW.md §3) and the campaign needs a fresh one every ~14 send-days.
 * Runs on the office PC (the scrape needs a real browser; Edge can't) — Windows task "Ace Auto Wave" via
 * scripts/install-auto-wave-task.ps1 → run-hidden.vbs. Every rule with a number lives in lib/wave-plan.mjs.
 *
 * STOPS (uploads nothing): Google CAPTCHA (scraper exit 2 — re-run with --resume), email yield < 40%,
 * MillionVerifier credits short, 7-day bounce ≥ 2%, Instantly month cap used up, another wave open.
 * NEVER: uploads an unverified address (import --verify = ok only), bypasses suppressions / place-id dedupe /
 * skip_if_in_campaign, touches send windows or daily limits, sets an Edge secret.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import { spawnSync } from 'node:child_process'
import { ROOT, env, sql, lit, jsonLit, textArrayLit } from './lib/mgmt.mjs'
import { parseCsv, findColumn } from './lib/csv.mjs'
import {
  CITY_ROTATION, DEFAULT_CITIES_PER_WAVE, DEFAULT_MAX_PER_CITY, HAIKU_USD_PER_SITE, MIN_EMAIL_YIELD, NEW_LEADS_PER_DAY,
  assessPool, batchLabel, emailYield, nextCapReset, parseHaikuCost, parseUploadLine, parseVerifyOutput, pickNextCities,
} from './lib/wave-plan.mjs'

// ── args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flag = (n) => args.includes(`--${n}`)
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && i + 1 < args.length ? args[i + 1] : d }
const many = (n) => args.flatMap((a, i) => (a === `--${n}` ? [args[i + 1]] : []))
const MODE = flag('live') ? 'live' : flag('auto') ? 'auto' : flag('tick') ? 'tick' : 'dry'
const SEARCH = opt('search', 'restaurant')
const N_CITIES = Number(opt('cities', DEFAULT_CITIES_PER_WAVE))
const MAX = Number(opt('max', DEFAULT_MAX_PER_CITY))
const CITY_OVERRIDE = many('city')
const NO_UPLOAD = flag('no-upload')
const STATE_KEY = 'lead-pipeline'
const WAVES_DIR = path.join(ROOT, 'leads', 'waves')
const FLOW_DOC = path.join(ROOT, 'docs', 'OUTBOUND_FLOW.md')
const INSTANTLY = 'https://api.instantly.ai/api/v2'
const say = (...a) => console.log(...a)

if (!process.env.SUPABASE_ACCESS_TOKEN) { console.error('SUPABASE_ACCESS_TOKEN env var is required'); process.exit(1) }

// ── readings (all read-only) ──────────────────────────────────────────────────
async function readPool() {
  const [row] = await sql(`select
      count(*) filter (where batch ilike '%restaurant%') as restaurants,
      count(*) filter (where batch not ilike '%restaurant%' or batch is null) as contractors
    from prospects where emailed_at is null and not suppressed and not is_test and email is not null`)
  return { restaurants: Number(row?.restaurants ?? 0), contractors: Number(row?.contractors ?? 0) }
}
/** Cities already covered by restaurant prospects (any batch) → { city: count }. */
async function readDoneCities() {
  const rows = await sql(`select city, count(*) as n from prospects where batch ilike '%restaurant%' and city is not null group by 1`)
  return Object.fromEntries(rows.map((r) => [r.city, Number(r.n)]))
}
async function readState() {
  const [row] = await sql(`select value, updated_at from poll_state where key = ${lit(STATE_KEY)}`)
  return row?.value ?? {}
}
async function readOpenWave() {
  // tolerate a DB where migration 0019 is not applied yet (--dry still works)
  const [row] = await sql(`select id, status, requested_by, requested_at, note from lead_waves where status in ('requested','running') order by requested_at asc limit 1`).catch(() => [])
  return row ?? null
}
async function readCampaignId() {
  if (opt('campaign')) return opt('campaign')
  const [row] = await sql(`select instantly_campaign_id from prospects where instantly_campaign_id is not null and emailed_at is not null and batch ilike '%restaurant%' order by emailed_at desc limit 1`)
  return row?.instantly_campaign_id ?? null
}
async function readHaikuSpendMonth() {
  const ym = new Date().toISOString().slice(0, 7)
  const [row] = await sql(`select coalesce(sum((cost->>'haiku_usd')::numeric), 0) as usd from lead_waves where to_char(coalesce(finished_at, requested_at), 'YYYY-MM') = ${lit(ym)}`).catch(() => [])
  return { month: ym, usd: Number(row?.usd ?? 0) }
}
async function verifierCredits() {
  const key = env('MILLIONVERIFIER_API_KEY')
  if (!key) return null
  try {
    const r = await fetch(`https://api.millionverifier.com/api/v3/credits?api=${encodeURIComponent(key)}`)
    const j = await r.json()
    return typeof j.credits === 'number' ? j.credits : null
  } catch { return null }
}
async function instantly(pathname, init = {}) {
  const key = init.admin ? env('INSTANTLY_ADMIN_API_KEY') : env('INSTANTLY_API_KEY')
  if (!key) return null
  const r = await fetch(INSTANTLY + pathname, { ...init, headers: { authorization: `Bearer ${key}`, ...(init.body ? { 'content-type': 'application/json' } : {}) } })
  const text = await r.text()
  if (!r.ok) throw new Error(`${init.method ?? 'GET'} ${pathname} → ${r.status} ${text.slice(0, 200)}`)
  try { return JSON.parse(text) } catch { return text }
}
async function campaignStats(campaignId) {
  if (!campaignId) return null
  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const [all] = (await instantly(`/campaigns/analytics?id=${campaignId}`)) ?? []
    const [week] = (await instantly(`/campaigns/analytics?id=${campaignId}&start_date=${since}`)) ?? []
    if (!all) return null
    const n = (o, k) => Number(o?.[k] ?? 0) || 0
    return {
      name: all.campaign_name, status: n(all, 'campaign_status'), leads: n(all, 'leads_count'), contacted: n(all, 'contacted_count'),
      uncontacted: Math.max(0, n(all, 'leads_count') - n(all, 'contacted_count')), bounced: n(all, 'bounced_count'), sent: n(all, 'emails_sent_count'),
      weekSent: n(week, 'emails_sent_count'), weekBounced: n(week, 'bounced_count'),
    }
  } catch (e) { console.error(`  Instantly analytics unavailable: ${e.message}`); return null }
}

/** Everything the trigger and the dashboard need, in one object (reads only). */
async function snapshot({ force = false } = {}) {
  const [pool, done, state, openWave, campaignId, spend, credits] = await Promise.all([
    readPool(), readDoneCities(), readState(), readOpenWave(), readCampaignId(), readHaikuSpendMonth(), verifierCredits(),
  ])
  const stats = await campaignStats(campaignId)
  const cities = CITY_OVERRIDE.length ? CITY_OVERRIDE : pickNextCities(done, N_CITIES, { extraDone: state.done_cities ?? [] })
  const verdict = assessPool({
    poolRestaurants: pool.restaurants, instantlyUncontacted: stats?.uncontacted ?? null,
    remainingInPlan: state.instantly_remaining_in_plan ?? null, remainingCheckedAt: state.instantly_remaining_checked_at ?? null,
    weekSent: stats?.weekSent ?? 0, weekBounced: stats?.weekBounced ?? 0, verifierCredits: credits, openWave, force,
  })
  return { pool, done, state, openWave, campaignId, stats, spend, credits, cities, verdict }
}

async function writeState(s, extra = {}) {
  const value = {
    campaign_id: s.campaignId,
    millionverifier_credits: s.credits, millionverifier_checked_at: s.credits == null ? s.state.millionverifier_checked_at ?? null : new Date().toISOString(),
    instantly_remaining_in_plan: s.state.instantly_remaining_in_plan ?? null, instantly_remaining_checked_at: s.state.instantly_remaining_checked_at ?? null,
    instantly_cap_resets_on: nextCapReset(),
    haiku_spend_usd_month: Math.round(s.spend.usd * 100) / 100, haiku_spend_month: s.spend.month,
    new_leads_per_day: NEW_LEADS_PER_DAY, runway_days: s.verdict.runway_days,
    next_cities: s.cities, done_cities: Object.keys(s.done),
    last_tick_at: new Date().toISOString(), last_wave_at: s.state.last_wave_at ?? null, runner_host: os.hostname(),
    trigger: { low: s.verdict.low, reason: s.verdict.reason },
    ...extra,
  }
  await sql(`insert into poll_state (key, value, updated_at) values (${lit(STATE_KEY)}, ${jsonLit(value)}, now())
             on conflict (key) do update set value = excluded.value, updated_at = now()`)
  return value
}

// ── plan / dry run ────────────────────────────────────────────────────────────
function printPlan(s) {
  const places = s.cities.length * MAX
  // last real wave (2026-11-04): 560 places → 553 real sites → 210 emails (38%) → 147 ok (70%)
  const real = Math.round(places * 0.95), emails = Math.round(real * 0.38), ok = Math.round(emails * 0.7)
  say(`\nPLAN — ${SEARCH} × ${s.cities.length} cities (≤${MAX} places each): ${s.cities.join(' · ') || '(none left in the rotation!)'}`)
  say(`  expected: ~${places} places → ~${real} real sites → ~${emails} emails → ~${ok} verified-ok leads`)
  say(`  cost: Haiku ≈ $${(real * HAIKU_USD_PER_SITE).toFixed(2)} · MillionVerifier ≈ ${emails} credits (have ${s.credits ?? '?'}) · scrape $0`)
  say(`  pool now: ${s.pool.restaurants} restaurant leads un-emailed in the DB · Instantly uncontacted ${s.stats?.uncontacted ?? '?'} ` +
      `(${s.stats ? `${s.stats.name}, status ${s.stats.status}` : 'campaign stats unavailable'})`)
  if (s.stats) say(`  last 7 days: ${s.stats.weekSent} sent, ${s.stats.weekBounced} bounced`)
  say(`  Instantly contacts left this month: ${s.state.instantly_remaining_in_plan ?? 'unknown (set by the first upload)'} · cap resets ${nextCapReset()}`)
  say(`  trigger: ${s.verdict.low ? 'LOW' : 'ok'} — ${s.verdict.reason}${s.verdict.run ? '' : s.verdict.low ? '  → would NOT run' : ''}`)
  if (s.openWave) say(`  open wave: ${s.openWave.status} since ${s.openWave.requested_at} (${s.openWave.requested_by})`)
}

// ── the chain ─────────────────────────────────────────────────────────────────
let logFile = null
const tail = []
function run(label, script, scriptArgs, { allowExit = [0] } = {}) {
  say(`\n==> ${label}\n    node scripts/${script} ${scriptArgs.join(' ')}`)
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), ...scriptArgs], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: process.env })
  const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`
  process.stdout.write(out.replace(/\r(?!\n)/g, '\n'))
  const lines = out.split(/\r?\n|\r/).filter((l) => l.trim())
  tail.push(`[${label}]`, ...lines.slice(-12))
  if (logFile) fs.appendFileSync(logFile, `\n==> ${label}\n${out}`)
  if (!allowExit.includes(r.status)) throw Object.assign(new Error(`${label} failed (exit ${r.status})`), { step: label, exit: r.status, out })
  return { ...r, out }
}
const csvRows = (file) => parseCsv(fs.readFileSync(file, 'utf8'))
const countCol = (file, name, pred = (v) => v.trim() !== '') => {
  const rows = csvRows(file); const i = findColumn(rows[0], name)
  return i < 0 ? 0 : rows.slice(1).filter((r) => pred(r[i] ?? '')).length
}

async function saveWave(id, patch) {
  const sets = Object.entries(patch).map(([k, v]) => `${k} = ${k === 'counts' || k === 'cost' ? jsonLit(v) : k === 'cities' ? textArrayLit(v) : lit(v)}`)
  await sql(`update lead_waves set ${sets.join(', ')} where id = ${lit(id)}`)
}

async function runWave(s, { requestedBy, waveId }) {
  const cities = s.cities
  if (!cities.length) throw new Error('no cities left in the rotation — add more to lib/wave-plan.mjs CITY_ROTATION or pass --city')
  const batch = batchLabel(SEARCH, cities)
  fs.mkdirSync(WAVES_DIR, { recursive: true })
  const base = path.join(WAVES_DIR, batch)
  logFile = `${base}.log`
  const counts = {}, cost = {}
  if (!waveId) {
    const [row] = await sql(`insert into lead_waves (status, requested_by, started_at, search, cities, batch) values ('running', ${lit(requestedBy)}, now(), ${lit(SEARCH)}, ${textArrayLit(cities)}, ${lit(batch)}) returning id`)
    waveId = row.id
  } else {
    await saveWave(waveId, { status: 'running', started_at: new Date().toISOString(), search: SEARCH, cities, batch })
  }
  say(`\nWAVE ${batch} (${waveId}) — ${cities.join(' · ')}`)
  const finish = async (status, note) => {
    await saveWave(waveId, { status, finished_at: new Date().toISOString(), counts, cost, note, log_tail: tail.slice(-40).join('\n').slice(0, 4000) })
    return { status, note, batch, counts, cost }
  }
  try {
    // 1 scrape (our Playwright; exit 2 = CAPTCHA → keep the cache, stop)
    const scraped = `${base}.csv`
    const r1 = run('1/7 scrape Google Maps', 'scrape-places.mjs', ['--search', SEARCH, ...cities.flatMap((c) => ['--city', c]), '--max', String(MAX), '--website', 'withWebsite', '--out', scraped, ...(flag('resume') ? ['--resume'] : [])], { allowExit: [0, 2] })
    if (r1.status === 2) return await finish('failed', 'Google asked for a CAPTCHA — progress is cached; re-run `node scripts/auto-wave.mjs --live --resume --city …` in an hour')
    counts.scraped = csvRows(scraped).length - 1
    counts.real_sites = countCol(scraped, 'websiteKind', (v) => v === 'real')
    if (counts.scraped === 0) return await finish('skipped', 'scrape returned 0 places')

    // 2 emails (mailto + visible text only)
    const enriched = `${base}.enriched.csv`
    run('2/7 crawl sites for emails', 'enrich-emails.mjs', ['--in', scraped, '--out', enriched])
    counts.emails = countCol(enriched, 'emails/0')
    const y = emailYield(counts.emails, counts.real_sites)
    if (y < MIN_EMAIL_YIELD) return await finish('skipped', `email yield ${(y * 100).toFixed(0)}% < ${MIN_EMAIL_YIELD * 100}% (${counts.emails}/${counts.real_sites}) — wrong segment, nothing uploaded`)

    // 3 Haiku: owner name only with a quote, cuisine, dishes, first_line
    const haiku = `${base}.enriched.haiku.csv`
    const r3 = run('3/7 Haiku reads each site', 'enrich-haiku.mjs', ['--in', enriched, '--out', haiku, '--concurrency', '4'])
    cost.haiku_usd = parseHaikuCost(r3.stderr) ?? Math.round(counts.real_sites * HAIKU_USD_PER_SITE * 1000) / 1000
    counts.emails = countCol(haiku, 'emails/0') // Haiku may have found a printed address the crawler missed
    counts.first_lines = countCol(haiku, 'first_line')

    // 4 verify (credits checked first — never start a pass we cannot finish)
    const credits = await verifierCredits()
    if (credits != null && credits < counts.emails) return await finish('failed', `MillionVerifier has ${credits} credits, wave needs ~${counts.emails} — top up, then re-run --live --resume --city …`)
    const verified = `${base}.enriched.haiku.verified.csv`
    const r4 = run('4/7 MillionVerifier', 'verify-emails.mjs', ['--in', haiku, '--out', verified], { allowExit: [0, 2] })
    const v = parseVerifyOutput(r4.stdout)
    counts.verified = v.calls; counts.verified_ok = v.tally.ok ?? 0; counts.catch_all = v.tally.catch_all ?? 0; counts.invalid = v.tally.invalid ?? 0
    cost.verify_credits = v.calls ?? 0
    s.credits = v.credits ?? s.credits
    if (r4.status === 2) return await finish('failed', 'MillionVerifier rejected the run (key / credits) — partial results cached; re-run')
    if (!counts.verified_ok) return await finish('skipped', 'no address verified ok — nothing to import')

    // 5 import ok-only (business_type comes from categoryName — assert it is never NULL)
    run('5/7 import verified-ok prospects', 'import-prospects.mjs', ['--file', verified, '--batch', batch, '--verify'])
    const [imp] = await sql(`select count(*) as n, count(*) filter (where business_type is null) as no_type, count(*) filter (where first_line is not null) as fl from prospects where batch = ${lit(batch)}`)
    counts.imported = Number(imp?.n ?? 0); counts.imported_first_line = Number(imp?.fl ?? 0)
    if (Number(imp?.no_type ?? 0) > 0) return await finish('failed', `${imp.no_type} imported rows have business_type NULL (would build contractor demos) — fix before uploading`)
    if (!counts.imported) return await finish('skipped', 'every verified-ok address was already a prospect (place-id / email dedupe)')
    if (NO_UPLOAD) return await finish('done', `imported ${counts.imported}; --no-upload — export/upload by hand`)

    // 6 export (stamps emailed_at + campaign id; suppressions re-checked here)
    if (!s.campaignId) return await finish('failed', 'no Instantly campaign id (pass --campaign <id>) — imported, not uploaded')
    run('6/7 export for Instantly', 'export-instantly.mjs', ['--batch', batch, '--campaign', s.campaignId])
    const exported = path.join(ROOT, `instantly-${batch}.csv`)
    if (!fs.existsSync(exported)) return await finish('done', 'nothing new to export (all already emailed)')
    const kept = path.join(WAVES_DIR, path.basename(exported))
    fs.renameSync(exported, kept)
    counts.exported = csvRows(kept).length - 1

    // 7 upload (skip_if_in_campaign; verified-ok only by construction)
    const r7 = run('7/7 upload to Instantly', 'instantly-upload-leads.mjs', ['--file', kept, '--campaign', s.campaignId])
    const up = parseUploadLine(r7.stdout)
    counts.uploaded = up?.uploaded ?? null
    counts.remaining_in_plan = up?.remaining_in_plan ?? null
    if (up?.remaining_in_plan != null) { s.state.instantly_remaining_in_plan = up.remaining_in_plan; s.state.instantly_remaining_checked_at = new Date().toISOString() }

    // re-activate if the campaign had run out of leads (status 3 = COMPLETED → new leads never send)
    let activated = false
    try {
      const c = await instantly(`/campaigns/${s.campaignId}`)
      if (c?.status === 3) { await instantly(`/campaigns/${s.campaignId}/activate`, { method: 'POST', admin: true, body: '{}' }); activated = true }
    } catch (e) { tail.push(`activate check failed: ${e.message}`) }

    const line = `- **${new Date().toISOString().slice(0, 10)} auto-wave (${requestedBy}):** ${SEARCH} × ${cities.join(', ')} → ${counts.scraped} places · ${counts.emails} emails · ` +
      `MV ok ${counts.verified_ok} / catch_all ${counts.catch_all} / invalid ${counts.invalid} → batch \`${batch}\` = ${counts.imported} prospects (${counts.imported_first_line} with a Haiku first_line) → ` +
      `**${counts.uploaded ?? '?'} uploaded** (remaining in plan ${counts.remaining_in_plan ?? '?'})${activated ? ' · campaign re-activated' : ''}. Haiku $${(cost.haiku_usd ?? 0).toFixed(2)}, ${cost.verify_credits} MV credits (${s.credits ?? '?'} left).`
    appendFlowLog(line)
    return await finish('done', `${counts.uploaded ?? 0} uploaded${activated ? ', campaign re-activated' : ''}`)
  } catch (e) {
    console.error(`\n✗ ${e.message}`)
    return await finish('failed', e.message.slice(0, 300))
  }
}

/** Append one dated line at the top of §9 "Current status" in OUTBOUND_FLOW.md. */
function appendFlowLog(line) {
  try {
    const md = fs.readFileSync(FLOW_DOC, 'utf8')
    const marker = '## 9. Current status (update in place)\n\n'
    const i = md.indexOf(marker)
    if (i < 0) throw new Error('§9 marker not found')
    fs.writeFileSync(FLOW_DOC, md.slice(0, i + marker.length) + line + '\n' + md.slice(i + marker.length))
    say(`\nlogged in docs/OUTBOUND_FLOW.md §9`)
  } catch (e) { console.error(`could not log to OUTBOUND_FLOW.md: ${e.message}\n${line}`) }
}

async function confirm(q) {
  if (flag('yes') || !process.stdin.isTTY) return flag('yes')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const a = await new Promise((r) => rl.question(`${q} [y/N] `, r))
  rl.close()
  return /^y(es)?$/i.test(a.trim())
}

// ── main ──────────────────────────────────────────────────────────────────────
const s = await snapshot({ force: MODE === 'live' || flag('force') })
printPlan(s)

if (MODE === 'dry') { say('\n(--dry) nothing written. Run with --live to do it, --auto for the scheduled check.'); process.exit(0) }
if (MODE === 'tick') { await writeState(s); say('\nstate row refreshed (poll_state lead-pipeline)'); process.exit(0) }

if (MODE === 'auto') {
  const queued = s.openWave?.status === 'requested' ? s.openWave : null
  if (!queued && !s.verdict.run) { await writeState(s); say(`\n(--auto) no wave: ${s.verdict.reason}`); process.exit(0) }
  if (queued) {
    // an admin request bypasses the "low" test but never the hard blocks (cap / bounce / credits)
    const hard = s.verdict.reasons.filter((r) => !r.startsWith('a wave is already'))
    if (hard.length) { await saveWave(queued.id, { status: 'skipped', finished_at: new Date().toISOString(), note: `cannot run: ${hard.join('; ')}` }); await writeState(s); say(`\n(--auto) request skipped: ${hard.join('; ')}`); process.exit(0) }
    say(`\n(--auto) running the list requested from /admin (${queued.requested_at})`)
  } else say(`\n(--auto) pool is low — running a wave`)
  const result = await runWave(s, { requestedBy: queued ? 'admin' : 'trigger', waveId: queued?.id ?? null })
  await writeState(s, { last_wave_at: new Date().toISOString() })
  say(`\n${result.status.toUpperCase()}: ${result.note}`)
  process.exit(result.status === 'failed' ? 1 : 0)
}

// --live
if (s.verdict.reasons.length) {
  say(`\nBLOCKED: ${s.verdict.reasons.join('; ')}`)
  if (!flag('force')) process.exit(2)
  say('(--force) continuing anyway')
}
if (!(await confirm('\nRun this wave now? It scrapes, spends Haiku + MillionVerifier credits, imports and uploads to Instantly.'))) { say('aborted'); process.exit(0) }
const result = await runWave(s, { requestedBy: 'manual', waveId: null })
await writeState(s, { last_wave_at: new Date().toISOString() })
say(`\n${result.status.toUpperCase()}: ${result.note}`)
process.exit(result.status === 'failed' ? 1 : 0)
