// One-shot go-live for the restaurant demo-site fix (2026-11-04). Runs the production steps an
// agent session cannot confirm, in order, stopping at the first failure. Idempotent — re-run safe.
//
//   node scripts/go-live-restaurant-sites.mjs            # everything
//   node scripts/go-live-restaurant-sites.mjs --from 2   # resume at step 2
//
// Why: every restaurant prospect was imported with business_type NULL (import-prospects.mjs never
// lowercased camelCase Apify headers → categoryName/totalScore/reviewsCount silently missed), so
// generate-site built restaurants as "General Contracting" with construction photos. Two real
// prospects (Point Breeze, Steaming Tender) opened those. The DB backfill already ran from the
// session (scripts/backfill-prospect-fields.mjs); this script ships the code and repairs the two.
//
// Steps
//   1 functions  deploy generate-site (Sonnet 5.5 fast path, restaurant spec, food-only design pool,
//                restaurant playbook fallback) — migration 0017 rows are ALREADY in the DB
//   2 rebuild    reset the targeted restaurant demo(s) to site_status 'none' and re-trigger the build
//                through the public demo-site gate (same URL, same Netlify site). Default = Point Breeze
//                only (see REBUILD_DEFAULT); --rebuild <token>[,<token>] overrides.
//   3 campaign   push the tightened v2 email copy (docs/OUTBOUND_COLD_SEQUENCE_RESTAURANTS.md) to the
//                live Instantly campaign — bodies only; schedule/leads untouched
//   --- $37/mo price cut (owner, 2026-11-04). Steps 4-8 run in THIS order so checkout never charges
//       $49 while the page says $37. The $37 Stripe Price already exists (created from the session,
//       live mode): price_1UYF6ZJHIJK0EFOz2tJCdGJZ on prod_VAfN7P63mmSbnl. The agent session could
//       not set the Edge secret (auto mode blocks secret-store writes) — hence owner-run.
//   4 secret     STRIPE_PRICE_DEMO_MONTHLY → the $37 price (create-subscription reads it at runtime)
//   5 functions  deploy reply-desk + instantly-poll ($37 in outboundFacts / instantlyEvents / summaries)
//   6 frontend   npm run build + netlify deploy (outboundPlan.ts monthly: 37 → /demo page + FAQ)
//   7 campaign   Instantly email 3 says $37 (same push as step 3; runs only when resuming past 3)
//   8 stripe     archive the old $49 price so nothing can sell it again (existing subs unaffected)
//
//   Steps 1-3 ran from the session on 2026-11-04 (01:00 UTC); step 1 must run AGAIN for the nav-legibility
//   prompt fix, so the normal invocation is the plain one (from step 1) — it redeploys, rebuilds Point
//   Breeze, re-pushes the (identical) copy, then does the $37 steps 4-8.
//
// ⚠️ Steps 1, 4 and 5 restart all Edge isolates — don't run mid demo-build (the script checks).

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REF = 'dwsmrruzufqpopdzlszw'
const SUPABASE_URL = `https://${REF}.supabase.co`
const RESTAURANT_CAMPAIGN = '94ab9d2a-faac-46da-8470-7ade9c9fd55c'
const NETLIFY_SITE = '4ea5b9c0-5a70-406f-a928-7f009290f519'
const NEW_PRICE = 'price_1UYF6ZJHIJK0EFOz2tJCdGJZ' // $37/mo, live, prod_VAfN7P63mmSbnl (created 2026-11-04)
const OLD_PRICE = 'price_1UAK4BJHIJK0EFOzqlk5VOaJ' // $49/mo — archived by step 8
const args = process.argv.slice(2)
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const FROM = Number(opt('from') ?? 1)
// Step 2 targets. Both were rebuilt as restaurants on 2026-11-04 ~01:02 UTC; Steaming Tender passed review,
// Point Breeze needs ONE more pass (its nav links were dark-on-dark over the hero photo at scroll 0 — the
// prompt now mandates a translucent nav backdrop). Override with --rebuild <token>[,<token>].
const REBUILD_DEFAULT = [
  { name: 'Point Breeze', token: '08b7ecbf4c5241b8a6341ca909217526' },
]
const KNOWN = {
  '08b7ecbf4c5241b8a6341ca909217526': 'Point Breeze',
  'b88b18c47bd5781251d784878b37422f': 'Steaming Tender Restaurant',
}
const BROKEN = opt('rebuild')
  ? opt('rebuild').split(',').map((t) => t.trim()).filter(Boolean).map((token) => ({ name: KNOWN[token] ?? token, token }))
  : REBUILD_DEFAULT

function loadDotEnv(file) {
  const out = {}
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}
const env = loadDotEnv(path.join(ROOT, 'supabase', '.env'))
const need = (k) => { if (!env[k]) { console.error(`supabase/.env is missing ${k}`); process.exit(1) } return env[k] }
const MGMT = process.env.SUPABASE_ACCESS_TOKEN
if (!MGMT) { console.error('SUPABASE_ACCESS_TOKEN env var is required'); process.exit(1) }

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${MGMT}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
  })
  const out = await r.json()
  if (!r.ok || out?.message) throw new Error(`SQL failed: ${JSON.stringify(out).slice(0, 300)}`)
  return out
}
async function anonKey() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${MGMT}` } })
  const key = (await r.json()).find((k) => k.name === 'anon')?.api_key
  if (!key) throw new Error('could not reveal anon key')
  return key
}
function run(label, cmd, cmdArgs, extraEnv = {}) {
  console.log(`\n▶ ${label}\n  $ ${cmd} ${cmdArgs.join(' ')}`)
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...extraEnv } })
  if (r.status !== 0) { console.error(`\n✗ ${label} failed (exit ${r.status}). Fix and re-run with --from <step>.`); process.exit(r.status ?? 1) }
}

// ── 1 functions ──────────────────────────────────────────────────────────────
if (FROM <= 1) {
  const [{ n }] = await sql(`select (select count(*) from prospects where site_status='generating') + (select count(*) from appointments where site_status='generating') as n`)
  if (Number(n) > 0) { console.error(`✗ ${n} build(s) in flight — deploying now would kill them. Wait and re-run.`); process.exit(1) }
  run('deploy generate-site', 'npx', ['supabase', 'functions', 'deploy', 'generate-site', '--no-verify-jwt', '--yes'])
}

// ── 2 rebuild the two contractor-styled restaurant demos ─────────────────────
if (FROM <= 2) {
  const anon = await anonKey()
  for (const p of BROKEN) {
    console.log(`\n▶ rebuild ${p.name}`)
    // Back to 'none' so the demo-site one-build gate accepts a fresh build; netlify_site_id stays,
    // so the deploy replaces the live site at the SAME preview URL the prospect already has.
    const rows = await sql(`update prospects set site_status='none', site_error=null, updated_at=now() where token='${p.token}' and business_type is not null returning id, business_type, netlify_site_id`)
    if (!rows.length) { console.error(`  ✗ prospect not found or still missing business_type — run scripts/backfill-prospect-fields.mjs first`); process.exit(1) }
    console.log(`  reset → none (${rows[0].business_type}, netlify ${rows[0].netlify_site_id})`)
    const r = await fetch(`${SUPABASE_URL}/functions/v1/demo-site`, {
      method: 'POST', headers: { 'content-type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify({ token: p.token, action: 'build' }),
    })
    const j = await r.json().catch(() => ({}))
    console.log(`  demo-site → ${r.status} ${j.siteStatus ?? ''} ${j.started ? '(build started)' : ''}`)
    if (!r.ok) { console.error('  ✗ build did not start — check ANTHROPIC_API_KEY credits / NETLIFY_AUTH_TOKEN'); process.exit(1) }
  }
  console.log('\n  Builds run ~2 min each. Verify: node -e "..." or /admin → the preview URLs now title the restaurant, not "General Contracting".')
}

async function noBuildsInFlight(label) {
  const [{ n }] = await sql(`select (select count(*) from prospects where site_status='generating') + (select count(*) from appointments where site_status='generating') as n`)
  if (Number(n) > 0) { console.error(`✗ ${n} build(s) in flight — ${label} would kill them. Wait and re-run.`); process.exit(1) }
}

// ── 3 campaign copy (v2, tightened; email 3 carries the $37 price) ───────────
async function pushCampaignCopy() {
  const key = need('INSTANTLY_ADMIN_API_KEY')
  const H = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const sig = `<p>Rhyan<br />Ace Web Designers</p><p>{{unsubscribe}}<br />Ace Web Designers · 30 North Main St, Leominster, MA 01453</p>`
  const BODIES = [
    `<p>Hi {{first_name}},</p><p>I design websites for restaurants around {{city}}. I put together a new homepage for {{company_name}} — your menu, a tap-to-call button and directions right at the top, built for phones.</p><p>Take a look: {{demo_url}}</p><p>If anything's off, reply and I'll change it. No call, no charge to look.</p>${sig}`,
    `<p>Hi {{first_name}},</p><p>Quick follow-up. Most people find a restaurant on their phone when they're already hungry — the page I made for {{company_name}} gets them to your menu and your phone number in one tap.</p><p>{{demo_url}}</p><p>Tell me what you'd change and I'll do it.</p>${sig}`,
    `<p>Hi {{first_name}},</p><p>If cost is the question: $37 a month, all in — your domain or a new one, hosting, and any menu or hours change whenever you need it. Cancel anytime.</p><p>The preview's still here: {{demo_url}}</p>${sig}`,
  ]
  console.log('\n▶ push v2 copy to Instantly')
  const c = await (await fetch(`https://api.instantly.ai/api/v2/campaigns/${RESTAURANT_CAMPAIGN}`, { headers: H })).json()
  const steps = c.sequences?.[0]?.steps
  if (!steps || steps.length !== 3) { console.error(`  ✗ expected 3 steps, got ${steps?.length}`); process.exit(1) }
  steps.forEach((s, i) => { s.variants.forEach((v) => { v.body = BODIES[i] }) })
  const r = await fetch(`https://api.instantly.ai/api/v2/campaigns/${RESTAURANT_CAMPAIGN}`, { method: 'PATCH', headers: H, body: JSON.stringify({ sequences: c.sequences }) })
  console.log(`  PATCH → ${r.status}`)
  if (!r.ok) { console.error((await r.text()).slice(0, 300)); process.exit(1) }
}
if (FROM <= 3) await pushCampaignCopy()

// ── 4 secret: STRIPE_PRICE_DEMO_MONTHLY → the $37 price ──────────────────────
if (FROM <= 4) {
  await noBuildsInFlight('setting a secret')
  run('set STRIPE_PRICE_DEMO_MONTHLY', 'npx', ['supabase', 'secrets', 'set', `STRIPE_PRICE_DEMO_MONTHLY=${NEW_PRICE}`, '--yes'])
}

// ── 5 functions that embed the price ─────────────────────────────────────────
if (FROM <= 5) {
  await noBuildsInFlight('deploying')
  run('deploy reply-desk', 'npx', ['supabase', 'functions', 'deploy', 'reply-desk', '--no-verify-jwt', '--yes'])
  run('deploy instantly-poll', 'npx', ['supabase', 'functions', 'deploy', 'instantly-poll', '--yes'])
}

// ── 6 frontend ($37 on /demo) ─────────────────────────────────────────────────
if (FROM <= 6) {
  run('npm run build', 'npm', ['run', 'build'])
  run('netlify deploy', 'npx', ['netlify', 'deploy', '--prod', '--dir=dist', `--site=${NETLIFY_SITE}`], { NETLIFY_AUTH_TOKEN: need('NETLIFY_AUTH_TOKEN') })
}

// ── 7 campaign: email 3 → $37 (same push as step 3; only when resuming past it) ──
if (FROM <= 7 && FROM > 3) await pushCampaignCopy()

// ── 8 stripe: retire the $49 price (existing subscribers keep theirs) ─────────
if (FROM <= 8) {
  const key = need('STRIPE_SECRET_KEY')
  console.log('\n▶ archive old $49 price')
  const r = await fetch(`https://api.stripe.com/v1/prices/${OLD_PRICE}`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' }, body: 'active=false' })
  const j = await r.json()
  console.log(`  ${OLD_PRICE} active=${j.active} ${j.error ? JSON.stringify(j.error).slice(0, 200) : ''}`)
  if (!r.ok) process.exit(1)
}

console.log('\n✓ done')
