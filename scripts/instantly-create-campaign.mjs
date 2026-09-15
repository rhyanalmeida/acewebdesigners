// Create (or preview) the outbound cold-email campaign in Instantly.ai from the
// approved sequence doc — the doc stays the single source of truth for copy.
//
//   node scripts/instantly-create-campaign.mjs --dry          # print the API payload, create nothing
//   node scripts/instantly-create-campaign.mjs                # create it (not running — never activates)
//   node scripts/instantly-create-campaign.mjs --update <id>  # PATCH copy/settings onto an existing campaign
//   node scripts/instantly-create-campaign.mjs --name "..."   # override the campaign name
//   node scripts/instantly-create-campaign.mjs --daily 40     # override campaign daily limit (default 20)
//
// Reads INSTANTLY_ADMIN_API_KEY (scopes campaigns:all + leads:all +
// account_campaign_mappings:all) from supabase/.env. Refuses to create a second
// campaign with the same name. The campaign is created in Instantly's default
// (not-running) state; starting it is a deliberate owner click in the UI after the
// Phase 5 dry run and the postal address are in.
//
// Copy source: docs/OUTBOUND_COLD_SEQUENCE_DRAFT.md — "## Email N — Day D" sections,
// each with a "**Subject:**" line and a plain-text body ending at the next "---".
// Follow-ups whose subject starts with "Re:" are sent with an EMPTY subject so
// Instantly threads them natively (its documented behaviour); a fresh subject
// (Email 4) breaks the thread on purpose. Pure logic lives in lib/instantly-campaign.mjs.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSequenceDoc, buildPayload, validateSteps, isThreaded, DEFAULT_NAME } from './lib/instantly-campaign.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://api.instantly.ai/api/v2'
const DOC = path.join(ROOT, 'docs', 'OUTBOUND_COLD_SEQUENCE_DRAFT.md')

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const NAME = opt('name') ?? DEFAULT_NAME
const DAILY = Number(opt('daily') ?? 20)
const UPDATE_ID = opt('update')

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
const KEY = env.INSTANTLY_ADMIN_API_KEY
if (!KEY && !DRY) { console.error('INSTANTLY_ADMIN_API_KEY missing (supabase/.env)'); process.exit(1) }

async function api(pathname, { method = 'GET', body, query } = {}) {
  const url = new URL(API + pathname)
  for (const [k, v] of Object.entries(query ?? {})) if (v != null) url.searchParams.set(k, String(v))
  const r = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const txt = await r.text()
  if (!r.ok) throw new Error(`${method} ${pathname} → ${r.status} ${txt.slice(0, 400)}`)
  return txt ? JSON.parse(txt) : null
}

async function main() {
  const steps = parseSequenceDoc(fs.readFileSync(DOC, 'utf8'))
  const { problems, placeholders } = validateSteps(steps)
  if (problems.length) { for (const p of problems) console.error(`✗ ${p}`); process.exit(1) }
  if (placeholders) {
    console.warn(`⚠ ${placeholders}/${steps.length} emails still carry the [OWNER: postal address] placeholder — ` +
      'fine while the campaign is not running, NOT for sending. Re-run with --update <id> once the address is in the doc.')
  }
  const payload = buildPayload(steps, { name: NAME, daily: DAILY })
  console.log(`Sequence: ${steps.map((s) => `E${s.n}@day${s.day}${isThreaded(s.subject) ? ' (threaded)' : ''}`).join(' → ')}`)
  if (DRY) { console.log(JSON.stringify(payload, null, 2)); return }

  if (UPDATE_ID) {
    const { name: _n, ...patch } = payload // never rename on update
    const updated = await api(`/campaigns/${UPDATE_ID}`, { method: 'PATCH', body: patch })
    console.log(`Updated campaign "${updated.name}" id=${updated.id} status=${updated.status}`)
    return
  }

  const existing = await api('/campaigns', { query: { search: NAME, limit: 50 } })
  const dup = (existing.items ?? []).find((c) => c.name === NAME)
  if (dup) { console.error(`A campaign named "${NAME}" already exists (id ${dup.id}). Use --update ${dup.id} instead.`); process.exit(1) }

  const created = await api('/campaigns', { method: 'POST', body: payload })
  console.log(`Created campaign "${created.name}" id=${created.id} status=${created.status}`)
  console.log('It is NOT running. Open it in Instantly to eyeball copy + variables; start it only after Phase 5.')
  console.log(`Use: node scripts/export-instantly.mjs --batch <label> --campaign ${created.id}`)
}

main().catch((e) => { console.error(e.message); process.exit(1) })
