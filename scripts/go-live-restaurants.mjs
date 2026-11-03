// One-shot go-live for the restaurant switch + own-domain checkout (built 2026-11-03). Runs the
// production steps an agent session cannot confirm, in order, stopping at the first failure.
// Each step is idempotent, so re-running is safe.
//
//   node scripts/go-live-restaurants.mjs            # everything
//   node scripts/go-live-restaurants.mjs --from 3   # resume at step 3
//
// Steps
//   1 db        supabase db push (migration 0016: prospects.domain_mode + 'awaiting_dns' status)
//   2 functions demo-site, create-subscription, stripe-webhook, provision-domain, admin-data
//               (generate-site + reply-desk were already deployed from the session — redeployed anyway)
//   3 cron      scripts/run-cron-jobs.mjs (adds domain-recheck, hourly)
//   4 frontend  npm run build + netlify deploy (own-domain checkout + DNS instructions on /demo)
//   5 campaign  activate "Outbound — Restaurants v1" in Instantly (leads are already uploaded)
//
// ⚠️ Deploying restarts all Edge isolates — don't run mid demo-build.
// ⚠️ Step 1 MUST land before step 2: the new functions select prospects.domain_mode.

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RESTAURANT_CAMPAIGN = '94ab9d2a-faac-46da-8470-7ade9c9fd55c'
const NETLIFY_SITE = '4ea5b9c0-5a70-406f-a928-7f009290f519'
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

function run(label, cmd, cmdArgs, extraEnv = {}) {
  console.log(`\n▶ ${label}\n  $ ${cmd} ${cmdArgs.join(' ')}`)
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...extraEnv } })
  if (r.status !== 0) { console.error(`\n✗ ${label} failed (exit ${r.status}). Fix and re-run with --from <step>.`); process.exit(r.status ?? 1) }
}
const supa = (...a) => run(a.join(' '), 'npx', ['supabase', ...a])
const step = (n) => n >= FROM

if (step(1)) supa('db', 'push', '--remote', '--yes')
if (step(2)) {
  supa('functions', 'deploy', 'generate-site', 'reply-desk', 'demo-site', 'provision-domain', 'stripe-webhook', '--no-verify-jwt', '--yes')
  supa('functions', 'deploy', 'create-subscription', 'admin-data', '--yes')
}
if (step(3)) run('cron jobs', 'node', ['scripts/run-cron-jobs.mjs'])
if (step(4)) {
  run('build', 'npm', ['run', 'build'])
  run('netlify deploy', 'npx', ['netlify', 'deploy', '--prod', '--dir=dist', `--site=${NETLIFY_SITE}`], { NETLIFY_AUTH_TOKEN: need('NETLIFY_AUTH_TOKEN') })
}
if (step(5)) {
  const r = await fetch(`https://api.instantly.ai/api/v2/campaigns/${RESTAURANT_CAMPAIGN}/activate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${need('INSTANTLY_ADMIN_API_KEY')}`, 'content-type': 'application/json' },
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) { console.error(`✗ activate failed: ${r.status} ${JSON.stringify(j).slice(0, 300)}`); process.exit(1) }
  console.log(`\n▶ Instantly campaign "${j.name}" status=${j.status} (1 = active)`)
}
console.log(`
✓ Restaurants are live. Sends run Mon–Fri 9:30–11:00 and 14:00–16:00 ET; replies go to the reply desk;
  checkout offers "I already have a domain". First read: demo views per 100 sends after ~2 weeks
  (docs/RESTAURANT_OUTBOUND_PLAN_2026-11-03.md).
`)
