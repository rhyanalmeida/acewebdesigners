// Apply scripts/cron-jobs.sql to the production database through the Supabase Management
// API, substituting <KEY> with CAPI_INTERNAL_SECRET from supabase/.env. Idempotent (the SQL
// unschedules each job first). Needs SUPABASE_ACCESS_TOKEN (Windows user env var).
//
//   node scripts/run-cron-jobs.mjs          # apply
//   node scripts/run-cron-jobs.mjs --list   # just print cron.job + the last 10 run results

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT = 'dwsmrruzufqpopdzlszw'
const LIST = process.argv.includes('--list')

function loadDotEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}
const env = { ...loadDotEnv(path.join(ROOT, 'supabase', '.env')), ...process.env }
const TOKEN = env.SUPABASE_ACCESS_TOKEN
const KEY = env.CAPI_INTERNAL_SECRET
if (!TOKEN) { console.error('SUPABASE_ACCESS_TOKEN missing'); process.exit(1) }
if (!KEY && !LIST) { console.error('CAPI_INTERNAL_SECRET missing (supabase/.env)'); process.exit(1) }

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const txt = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${txt.slice(0, 400)}`)
  return txt ? JSON.parse(txt) : null
}

if (!LIST) {
  const file = fs.readFileSync(path.join(ROOT, 'scripts', 'cron-jobs.sql'), 'utf8').replaceAll('<KEY>', KEY)
  await sql(file)
  console.log('cron-jobs.sql applied')
}
console.log(JSON.stringify(await sql('select jobid, jobname, schedule, active from cron.job order by jobname'), null, 1))
console.log(JSON.stringify(await sql("select j.jobname, d.status, d.start_time, left(d.return_message, 80) msg from cron.job_run_details d join cron.job j on j.jobid = d.jobid order by d.start_time desc limit 10"), null, 1))
