#!/usr/bin/env node
/**
 * go-live-waves.mjs — one-shot, OWNER-RUN go-live for the lead-wave automation + admin panels (2026-11-06).
 * The auto-mode classifier blocks an agent from secret writes, `db push`, function deploys and Netlify
 * deploys, so the agent prepared everything and the owner runs this (template: go-live-alerts.mjs).
 *
 *   1. db push                  ← migration 0019 (lead_waves table, prospects.called_at / call_note)
 *   2. secret ADMIN_EMAILS      ← hello@ + valerieereyy@gmail.com (Valerie's /admin login — the auth user already
 *                                 exists, password in ~/.secrets/admin-valerie-credentials.txt). Single key.
 *                                 ⚠️ restarts every Edge isolate — refuses while a preview site is generating.
 *   3. deploy admin-data        ← leadPipeline action, requestWave / cancelWave / markCalled, Instantly analytics
 *   4. Netlify production deploy ← Email Outreach tab: Lead pipeline panel + Follow up or call list
 *   5. first state tick         ← node scripts/auto-wave.mjs --tick (fills the panel: credits, runway, next cities)
 *   6. Windows task "Ace Auto Wave" ← scripts/install-auto-wave-task.ps1 (weekdays, every 2 h, hidden)
 *
 *   node scripts/go-live-waves.mjs            # all six, in order, stops on the first failure
 *   node scripts/go-live-waves.mjs --from 3   # resume at a step
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, loadDotEnv, sql } from './lib/mgmt.mjs'

const fromIdx = process.argv.indexOf('--from')
const from = fromIdx >= 0 ? Number(process.argv[fromIdx + 1]) || 1 : 1
const run = (label, cmd, args, opts = {}) => {
  console.log(`\n==> ${label}\n    ${cmd} ${args.join(' ').slice(0, 140)}`)
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', ...opts })
  if (r.status !== 0) { console.error(`\nFAILED at: ${label} (exit ${r.status}). Fix and re-run with --from <step>.`); process.exit(r.status || 1) }
}
const env = loadDotEnv()
const NETLIFY_SITE = '4ea5b9c0-5a70-406f-a928-7f009290f519'

if (from <= 1) run('1/6 db push (migration 0019)', 'npx', ['supabase', 'db', 'push', '--remote', '--yes'])

if (from <= 2) {
  const [{ n }] = await sql(`select (select count(*) from prospects where site_status='generating') + (select count(*) from appointments where site_status='generating' and created_at > now() - interval '2 hours') as n`)
  if (Number(n) > 0) { console.error(`A preview site is generating right now (${n}). Setting a secret would kill it — wait a few minutes and re-run with --from 2.`); process.exit(1) }
  const emails = env.ADMIN_EMAILS || 'hello@acewebdesigners.com,valerieereyy@gmail.com'
  if (!emails.includes('valerieereyy@gmail.com')) { console.error('supabase/.env ADMIN_EMAILS does not include valerieereyy@gmail.com — fix the file first'); process.exit(1) }
  const tmp = path.join(ROOT, '.admin-emails.env')
  fs.writeFileSync(tmp, `ADMIN_EMAILS=${emails}\n`)
  run('2/6 secret ADMIN_EMAILS (one key)', 'npx', ['supabase', 'secrets', 'set', '--env-file', tmp, '--yes'])
  fs.unlinkSync(tmp)
}

if (from <= 3) run('3/6 deploy admin-data', 'npx', ['supabase', 'functions', 'deploy', 'admin-data', '--yes'])

if (from <= 4) {
  run('4/6a build', 'npm', ['run', 'build'])
  run('4/6b Netlify production deploy', 'npx', ['netlify', 'deploy', '--prod', '--dir=dist', `--site=${NETLIFY_SITE}`], { env: { ...process.env, ...(env.NETLIFY_AUTH_TOKEN ? { NETLIFY_AUTH_TOKEN: env.NETLIFY_AUTH_TOKEN } : {}) } })
}

if (from <= 5) run('5/6 first pipeline tick', 'node', ['scripts/auto-wave.mjs', '--tick'])

if (from <= 6) run('6/6 Windows task "Ace Auto Wave"', 'powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/install-auto-wave-task.ps1'])

console.log(`
DONE ✅
  • /admin → Email Outreach now shows "Lead pipeline" (credits, send-days left, Scrape a new list) and "Follow up or call".
  • Valerie signs in at https://acewebdesigners.com/admin with the password in ~/.secrets/admin-valerie-credentials.txt
    (or "Email me a sign-in link"). She sees the same dashboard: reply desk hand-offs ("NEEDS YOU"), the call list, the button.
  • Verify: open /admin, confirm the MillionVerifier credit number matches the account, click "Scrape a new list" once —
    the next task tick (≤ 2 h, weekdays 06–20) runs the wave and the row moves requested → running → done.
`)
