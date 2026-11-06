#!/usr/bin/env node
/**
 * go-live-alerts.mjs — one-shot, OWNER-RUN go-live for the 2026-11-05 work (the auto-mode classifier blocks
 * secret writes + production deploys for an agent, so the agent prepared this and the owner runs it):
 *
 *   1. GHL_CUSTOM_FIELD_IDS  ← the id map scripts/ghl-setup-custom-fields.mjs printed (4 new fields created
 *      2026-11-05: last_event / reply_sentiment / demo_view_count / checkout_domain). Single key, never --env-file.
 *      ⚠️ Setting a secret restarts every Edge isolate — the script refuses while a preview site is generating.
 *   2. db push               ← migration 0018 (prospects.first_line / hook / cuisine / dishes / owner_evidence)
 *   3. deploy demo-site, reply-desk, create-subscription  (the outbound-viewed / -replied / -checkout tags)
 *
 *   node scripts/go-live-alerts.mjs            # runs all three, in order, stops on the first failure
 *   node scripts/go-live-alerts.mjs --from 2   # resume at a step
 *
 * Then build the three GHL workflows (docs/GHL_OUTBOUND_ALERTS_2026-11-05.md) and disable "Outbound — Interested Lead".
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fromIdx = process.argv.indexOf('--from')
const from = fromIdx >= 0 ? Number(process.argv[fromIdx + 1]) || 1 : 1
const run = (label, cmd, args) => {
  console.log(`\n==> ${label}\n    ${cmd} ${args.join(' ').slice(0, 120)}${args.join(' ').length > 120 ? '…' : ''}`)
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.status !== 0) { console.error(`\nFAILED at: ${label} (exit ${r.status}). Fix and re-run with --from <step>.`); process.exit(r.status || 1) }
}

const IDS = {
  fbc: 'Gp6Qs4jzRCMHDWlCruD9', fbp: 'M8jmTE2Xdw13pWJsemHm', fbclid: 'I9vDEUimDaBje9DzE4bW', client_ip: 'pgzjGe0J06f64BlzTGSf',
  client_user_agent: 'vqvX6slqQb3rxeDGRLZH', landing_url: '0gSheCb9PGNmsCBpaFnv', utm_source: '5I7HcjtKnRH4EMyIM8au', utm_medium: '8xjcKhOz158Zhs4ah9r0',
  utm_campaign: 'nwhKwx9vqr5x08lPW5SE', utm_content: 'ei11rFPHSgQvMBY4fF87', utm_term: 'Z1QzpriIXXFZjIj55N1Y', campaign_id: 'Uxtsj4jxUXj5hYswIFAD',
  adset_id: 'EYKC9VHAVp7YxdVVO1GK', ad_id: 'qv4dhTZ23OYQu8SsE4yE', deal_value: 'WIJ4iud88EQWUgqwKQD3', recurring_value: 'U3wcLEkIFy8zKef5OYF6',
  recurring_interval: 'ELp0XsDjLL7h7xJnkfXV', plan_name: 'F0ZFzRC82DJYuUAUATbE', business_type: 'qWpAty6FUD82vOQ1a9rF', years_in_business: 'xfduaZ3aIA1hkZJBtSXY',
  has_website: 'OCNGFiry4lqc6kLFErwr', preview_url: 'ywQp2gT8RhVEFGFjHq5b', chosen_domain: 'MKwDW5R9q5ZOCuqRtYu7', last_reply_text: 'kG2fJQ4AjcyWmbfpLaJQ',
  last_reply_intent: 'SkgsSJwcIvO6AV0YLHKt', last_event: 'swg9p7en4D009BNJPh1I', reply_sentiment: '7LPZOsc0J7Catrktkxuu', demo_view_count: 'Q3pShHXZc46m0daKYGRp',
  checkout_domain: 'LwfffI7oN4tuWJASIRyO',
}

if (from <= 1) {
  // never restart isolates mid-build
  const MGMT = process.env.SUPABASE_ACCESS_TOKEN
  if (MGMT) {
    const r = await fetch('https://api.supabase.com/v1/projects/dwsmrruzufqpopdzlszw/database/query', { method: 'POST', headers: { Authorization: `Bearer ${MGMT}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "select (select count(*) from prospects where site_status='generating') + (select count(*) from appointments where site_status='generating' and created_at > now() - interval '2 hours') as n" }) })
    const j = await r.json().catch(() => null)
    if (Array.isArray(j) && Number(j[0]?.n) > 0) { console.error(`A preview site is generating right now (${j[0].n}). Setting a secret would kill it — wait a few minutes and re-run.`); process.exit(1) }
  }
  const tmp = path.join(ROOT, '.ghl-ids.env')
  fs.writeFileSync(tmp, `GHL_CUSTOM_FIELD_IDS=${JSON.stringify(IDS)}\n`)
  run('1/3 secret GHL_CUSTOM_FIELD_IDS (one key)', 'npx', ['supabase', 'secrets', 'set', '--env-file', tmp, '--yes'])
  fs.unlinkSync(tmp)
}
if (from <= 2) run('2/3 db push (migration 0018)', 'npx', ['supabase', 'db', 'push', '--remote', '--yes'])
if (from <= 3) for (const fn of ['demo-site', 'reply-desk', 'create-subscription']) run(`3/3 deploy ${fn}`, 'npx', ['supabase', 'functions', 'deploy', fn, '--yes'])

console.log('\nDONE ✅  Next: the three GHL workflows in docs/GHL_OUTBOUND_ALERTS_2026-11-05.md, then disable "Outbound — Interested Lead".')
