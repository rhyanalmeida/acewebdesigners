// One-shot go-live for the 2026-11-06 outbound audit fixes. Owner-run (agent sessions can't
// deploy to production). Re-runnable; `--from <step>` resumes.
//
//   node scripts/go-live-outbound-fix.mjs            # all steps
//   node scripts/go-live-outbound-fix.mjs --from 3   # resume at step 3
//
// Why: a commit pushed to `master` (132d313) made Netlify auto-build production from the July
// code — no /demo route — so every /demo/<token> link in ~300 cold emails opened the HOME page
// from 2026-11-05 19:46 UTC. The $37 price was never wired in (checkout charged $49). The nudge
// cron could stack on the Instantly sequence.
//
// Steps
//   1 frontend   npm run build + netlify deploy --prod (restores DemoPage, outreach admin tab, $37)
//   2 branch     Netlify production branch master → redesign/marketing-site (so a git push can never
//                ship the July code again)
//   3 functions  deploy admin-data (outreach action) + reply-desk (nudges wait for the sequence)
//   4 price      scripts/go-live-restaurant-sites.mjs --from 4 → STRIPE_PRICE_DEMO_MONTHLY=$37,
//                redeploy reply-desk + instantly-poll, Email 3 says $37, archive the $49 price
//   5 verify     live deploy has a DemoPage chunk; /demo/<seed token> is the demo page; campaign
//                Email 3 contains $37; secret digest = sha256 of the $37 price id
//
// ⚠️ Steps 3-4 restart Edge isolates — the script refuses to run them while a demo build is in flight.

import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REF = 'dwsmrruzufqpopdzlszw'
const NETLIFY_SITE = '4ea5b9c0-5a70-406f-a928-7f009290f519'
const PROD_BRANCH = 'redesign/marketing-site'
const RESTAURANT_CAMPAIGN = '94ab9d2a-faac-46da-8470-7ade9c9fd55c'
const NEW_PRICE = 'price_1UYF6ZJHIJK0EFOz2tJCdGJZ' // $37/mo
const SEED_TOKEN = '2dd901abd7eaeac52163794f9c515471' // prospects.batch = 'internal-seed' (our own row)
const args = process.argv.slice(2)
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const FROM = Number(opt('from') ?? 1)

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
const NETLIFY = need('NETLIFY_AUTH_TOKEN')

function run(label, cmd, cmdArgs, extraEnv = {}) {
  console.log(`\n▶ ${label}\n  $ ${cmd} ${cmdArgs.join(' ')}`)
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...extraEnv } })
  if (r.status !== 0) { console.error(`\n✗ ${label} failed (exit ${r.status}). Fix and re-run with --from <step>.`); process.exit(r.status ?? 1) }
}
async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${MGMT}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
  })
  const out = await r.json()
  if (!r.ok || out?.message) throw new Error(`SQL failed: ${JSON.stringify(out).slice(0, 300)}`)
  return out
}
async function noBuildsInFlight(label) {
  const [{ n }] = await sql(`select (select count(*) from prospects where site_status='generating') + (select count(*) from appointments where site_status='generating') as n`)
  if (Number(n) > 0) { console.error(`✗ ${n} build(s) in flight — ${label} would kill them. Wait and re-run.`); process.exit(1) }
}
const netlify = async (p, init = {}) => {
  const r = await fetch(`https://api.netlify.com/api/v1${p}`, { ...init, headers: { Authorization: `Bearer ${NETLIFY}`, 'content-type': 'application/json', ...(init.headers ?? {}) } })
  if (!r.ok) throw new Error(`netlify ${p} → ${r.status} ${(await r.text()).slice(0, 200)}`)
  return r.json()
}

// ── 1 frontend ───────────────────────────────────────────────────────────────
if (FROM <= 1) {
  run('build frontend', 'npm', ['run', 'build'])
  if (!fs.readdirSync(path.join(ROOT, 'dist', 'assets', 'js')).some((f) => /^DemoPage-/.test(f))) { console.error('✗ dist has no DemoPage chunk — wrong branch checked out?'); process.exit(1) }
  run('deploy frontend', 'npx', ['netlify', 'deploy', '--prod', '--dir=dist', `--site=${NETLIFY_SITE}`, '--message', 'restore demo page + outreach admin + $37 (go-live-outbound-fix)'], { NETLIFY_AUTH_TOKEN: NETLIFY })
}

// ── 2 Netlify production branch ──────────────────────────────────────────────
if (FROM <= 2) {
  console.log(`\n▶ Netlify production branch → ${PROD_BRANCH}`)
  const site = await netlify(`/sites/${NETLIFY_SITE}`, { method: 'PATCH', body: JSON.stringify({ build_settings: { repo_branch: PROD_BRANCH } }) })
  const got = site.build_settings?.repo_branch
  if (got !== PROD_BRANCH) { console.error(`  ✗ branch reads "${got}" — set it in Netlify UI → Build & deploy → Branches`); process.exit(1) }
  console.log(`  ✓ repo_branch = ${got}`)
}

// ── 3 functions ──────────────────────────────────────────────────────────────
if (FROM <= 3) {
  await noBuildsInFlight('deploying functions')
  run('deploy admin-data + reply-desk', 'npx', ['supabase', 'functions', 'deploy', 'admin-data', 'reply-desk', '--no-verify-jwt', '--yes'])
}

// ── 4 price ($37 everywhere) ─────────────────────────────────────────────────
if (FROM <= 4) {
  run('$37 price steps (secret, fns, email 3, archive $49)', 'node', ['scripts/go-live-restaurant-sites.mjs', '--from', '4'])
}

// ── 5 verify ─────────────────────────────────────────────────────────────────
if (FROM <= 5) {
  console.log('\n▶ verify')
  const deploys = await netlify(`/sites/${NETLIFY_SITE}/deploys?per_page=1`)
  const files = await netlify(`/deploys/${deploys[0].id}/files`)
  const demoChunk = files.find((f) => /demopage-/i.test(f.id))
  console.log(`  live deploy ${deploys[0].id} (${deploys[0].branch ?? 'manual'}): DemoPage chunk ${demoChunk ? '✓ ' + demoChunk.id : '✗ MISSING'}`)
  const html = await (await fetch('https://acewebdesigners.com/')).text()
  const js = html.match(/assets\/js\/index-[^"]+\.js/)?.[0]
  const bundle = js ? await (await fetch(`https://acewebdesigners.com/${js}`)).text() : ''
  console.log(`  index bundle has the /demo route: ${/"demo"/.test(bundle) ? '✓' : '✗'}`)
  console.log(`  open https://acewebdesigners.com/demo/${SEED_TOKEN} in a browser → should be the demo page (our own seed row), not the homepage`)

  const sec = await (await fetch(`https://api.supabase.com/v1/projects/${REF}/secrets`, { headers: { Authorization: `Bearer ${MGMT}` } })).json()
  const digest = (Array.isArray(sec) ? sec : []).find((s) => s.name === 'STRIPE_PRICE_DEMO_MONTHLY')?.value
  const want = createHash('sha256').update(NEW_PRICE).digest('hex')
  console.log(`  STRIPE_PRICE_DEMO_MONTHLY = $37 price: ${digest === want ? '✓' : `✗ (digest ${String(digest).slice(0, 12)}…)`}`)

  const camp = await (await fetch(`https://api.instantly.ai/api/v2/campaigns/${RESTAURANT_CAMPAIGN}`, { headers: { authorization: `Bearer ${need('INSTANTLY_ADMIN_API_KEY')}` } })).json()
  const e3 = camp.sequences?.[0]?.steps?.[2]?.variants?.[0]?.body ?? ''
  console.log(`  Instantly Email 3 says $37: ${/\$37\b/.test(e3) && !/\$49\b/.test(e3) ? '✓' : '✗'}`)
  console.log('\nDone. Record the result in CLAUDE.md "Known problems" + docs/OUTBOUND_FLOW.md §9.')
}
