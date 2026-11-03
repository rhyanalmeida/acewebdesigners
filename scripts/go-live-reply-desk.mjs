// One-shot go-live for the reply desk (built 2026-11-02). Runs every production step in
// order, stopping at the first failure. Each step is idempotent, so re-running is safe.
//
//   node scripts/go-live-reply-desk.mjs            # everything
//   node scripts/go-live-reply-desk.mjs --from 5   # resume at step 5
//   node scripts/go-live-reply-desk.mjs --skip-copy   # don't push the v5 Instantly copy
//
// Steps
//   1 secrets   INSTANTLY_API_KEY, INSTANTLY_SENDER_API_KEY (poller + sends), GHL_CUSTOM_FIELD_IDS
//               (two new hand-off fields) — one key at a time, never --env-file
//   2 db        supabase db push --remote (migration 0015: outbound_replies + prospect columns)
//   3 functions reply-desk (--no-verify-jwt), instantly-webhook, instantly-poll, demo-site, admin-data
//   4 cron      scripts/run-cron-jobs.mjs (reply-desk-release */5, reply-desk-followups daily)
//   5 gate      scripts/reply-desk-dryrun.mjs — every sample must land as expected
//   6 enable    REPLY_DESK_ENABLED=true (the webhook starts routing replies to the desk)
//   7 copy      instantly-create-campaign.mjs --update <campaign> (v5 preview-first emails)
//   8 frontend  npm run build + netlify deploy (admin Reply desk panel)
//
// ⚠️ Setting secrets / deploying restarts all Edge isolates — don't run mid demo-build.

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CAMPAIGN = '46657029-fdd6-4567-b5fe-2165bb298367'
const NETLIFY_SITE = '4ea5b9c0-5a70-406f-a928-7f009290f519'
const args = process.argv.slice(2)
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const FROM = Number(opt('from') ?? 1)
const SKIP_COPY = args.includes('--skip-copy')

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
  console.log(`\n▶ ${label}\n  $ ${cmd} ${cmdArgs.map((a) => (a.length > 60 ? a.slice(0, 57) + '…' : a)).join(' ')}`)
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...extraEnv } })
  if (r.status !== 0) { console.error(`\n✗ ${label} failed (exit ${r.status}). Fix and re-run with --from <step>.`); process.exit(r.status ?? 1) }
}
const supa = (...a) => run(a.join(' '), 'npx', ['supabase', ...a])
const step = (n) => n >= FROM

// GHL custom field ids (not secret — ids of fields in our own GHL location). Must include the
// two reply-desk fields created by scripts/ghl-setup-custom-fields.mjs on 2026-11-02.
const GHL_FIELD_IDS = {
  fbc: 'Gp6Qs4jzRCMHDWlCruD9', fbp: 'M8jmTE2Xdw13pWJsemHm', fbclid: 'I9vDEUimDaBje9DzE4bW', client_ip: 'pgzjGe0J06f64BlzTGSf',
  client_user_agent: 'vqvX6slqQb3rxeDGRLZH', landing_url: '0gSheCb9PGNmsCBpaFnv', utm_source: '5I7HcjtKnRH4EMyIM8au', utm_medium: '8xjcKhOz158Zhs4ah9r0',
  utm_campaign: 'nwhKwx9vqr5x08lPW5SE', utm_content: 'ei11rFPHSgQvMBY4fF87', utm_term: 'Z1QzpriIXXFZjIj55N1Y', campaign_id: 'Uxtsj4jxUXj5hYswIFAD',
  adset_id: 'EYKC9VHAVp7YxdVVO1GK', ad_id: 'qv4dhTZ23OYQu8SsE4yE', deal_value: 'WIJ4iud88EQWUgqwKQD3', recurring_value: 'U3wcLEkIFy8zKef5OYF6',
  recurring_interval: 'ELp0XsDjLL7h7xJnkfXV', plan_name: 'F0ZFzRC82DJYuUAUATbE', business_type: 'qWpAty6FUD82vOQ1a9rF', years_in_business: 'xfduaZ3aIA1hkZJBtSXY',
  has_website: 'OCNGFiry4lqc6kLFErwr', preview_url: 'ywQp2gT8RhVEFGFjHq5b', chosen_domain: 'MKwDW5R9q5ZOCuqRtYu7',
  last_reply_text: 'kG2fJQ4AjcyWmbfpLaJQ', last_reply_intent: 'SkgsSJwcIvO6AV0YLHKt',
}

if (step(1)) {
  supa('secrets', 'set', `INSTANTLY_API_KEY=${need('INSTANTLY_API_KEY')}`)
  supa('secrets', 'set', `INSTANTLY_SENDER_API_KEY=${need('INSTANTLY_SENDER_API_KEY')}`)
  supa('secrets', 'set', `GHL_CUSTOM_FIELD_IDS=${JSON.stringify(GHL_FIELD_IDS)}`)
}
if (step(2)) supa('db', 'push', '--remote', '--yes')
if (step(3)) {
  supa('functions', 'deploy', 'reply-desk', '--no-verify-jwt', '--yes')
  supa('functions', 'deploy', 'instantly-webhook', 'instantly-poll', 'demo-site', 'admin-data', '--yes')
}
if (step(4)) run('cron jobs', 'node', ['scripts/run-cron-jobs.mjs'])
if (step(5)) run('dry-run gate (Sonnet classifies the samples; nothing is written)', 'node', ['scripts/reply-desk-dryrun.mjs'])
if (step(6)) supa('secrets', 'set', 'REPLY_DESK_ENABLED=true')
if (step(7) && !SKIP_COPY) run('v5 copy → live campaign', 'node', ['scripts/instantly-create-campaign.mjs', '--update', CAMPAIGN])
if (step(8)) {
  run('build', 'npm', ['run', 'build'])
  run('netlify deploy', 'npx', ['netlify', 'deploy', '--prod', '--dir=dist', `--site=${NETLIFY_SITE}`], { NETLIFY_AUTH_TOKEN: need('NETLIFY_AUTH_TOKEN') })
}
console.log(`
✓ Reply desk is live.
  Next (one-time, in the GHL UI): workflow "Outbound — Needs a Person" — trigger: tag added
  \`outbound-needs-human\` → SMS to +1 774-329-3117 with {{contact.company_name}}, {{contact.email}},
  {{contact.last_reply_text}} and https://acewebdesigners.com/admin. Re-entry ON. Save after Publish.
  Then disable the Windows task "Instantly Poll" (the Edge poller now runs green).
`)
