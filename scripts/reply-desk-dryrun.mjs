// Dry-run the reply desk against sample replies — classify + decide, write nothing.
//
//   node scripts/reply-desk-dryrun.mjs                 # all of scripts/data/reply-samples.json
//   node scripts/reply-desk-dryrun.mjs --only hostile  # labels containing "hostile"
//   node scripts/reply-desk-dryrun.mjs --text "How much is it?"
//
// Calls the deployed `reply-desk` fn with { action: 'dryrun' } using CAPI_INTERNAL_SECRET
// from supabase/.env (x-cron-key). Each sample costs one Sonnet call (~$0.01) unless the
// rules short-circuit it. Prints rule / model intent / decision and FAILs when a sample's
// `expect` doesn't match, so this doubles as the pre-enable gate.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }

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
const URL_BASE = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? 'https://dwsmrruzufqpopdzlszw.supabase.co'
const KEY = env.CAPI_INTERNAL_SECRET
if (!KEY) { console.error('CAPI_INTERNAL_SECRET missing (supabase/.env)'); process.exit(1) }

const samples = opt('text')
  ? [{ label: 'ad hoc', text: opt('text') }]
  : JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'data', 'reply-samples.json'), 'utf8')).filter((s) => !opt('only') || s.label.includes(opt('only')))

const outcome = (d) => (d.decision.action === 'reply' ? `reply:${d.decision.kind}` : d.decision.action)

let fails = 0
for (const s of samples) {
  const r = await fetch(`${URL_BASE}/functions/v1/reply-desk`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-cron-key': KEY },
    body: JSON.stringify({ action: 'dryrun', text: s.text }),
  })
  const d = await r.json()
  if (!r.ok) { console.log(`✗ ${s.label}: ${r.status} ${JSON.stringify(d).slice(0, 200)}`); fails++; continue }
  const got = outcome(d)
  const ok = !s.expect || got === s.expect
  if (!ok) fails++
  console.log(`${ok ? '✓' : '✗'} ${s.label}`)
  console.log(`    rule=${d.rule} model=${d.model ? `${d.model.intent} ${Math.round(d.model.confidence * 100)}%${d.model.needs_human ? ' NEEDS_HUMAN' : ''} (${d.model.reason})` : '—'}`)
  console.log(`    → ${got}${s.expect && !ok ? ` (expected ${s.expect})` : ''}${d.decision.reason ? ` — ${d.decision.reason}` : ''}`)
  if (d.decision.action === 'reply' && d.decision.body) console.log(`    draft:\n${d.decision.body.split('\n').map((l) => '      | ' + l).join('\n')}`)
  if (d.decision.action === 'reply') console.log(`    would go out: ${d.release_after}`)
}
console.log(`\n${samples.length - fails}/${samples.length} as expected`)
process.exit(fails ? 1 : 0)
