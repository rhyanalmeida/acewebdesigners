// Seed/refresh niche_playbooks by running the SAME research prompt as generate-brief's
// research stage, but from this machine — the Edge Function's research call (Sonnet 5 +
// web search, ~1-2 min, streamed 4k tokens) trips Supabase's WORKER_RESOURCE_LIMIT (546)
// on every trade (2026-09-22; first seen 2026-08-03). Local Node has no such cap.
// Writes rows straight to the table via the service key; generate-brief/generate-site
// pick them up on the next run (DB is the source of truth, no deploy).
//
//   node scripts/seed-niche-playbooks-local.mjs            — trades missing/stale (>120d)
//   node scripts/seed-niche-playbooks-local.mjs --force    — re-research everything
//   node scripts/seed-niche-playbooks-local.mjs roofer     — one trade
//
// Reads ANTHROPIC_API_KEY from supabase/.env; SUPABASE_ACCESS_TOKEN from env. ~$0.15-0.35/trade.
// The prompt below is a copy of RESEARCH_PROMPT in supabase/functions/generate-brief/index.ts —
// change both together.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REF = 'dwsmrruzufqpopdzlszw'
const URL = `https://${REF}.supabase.co`
const MGMT = process.env.SUPABASE_ACCESS_TOKEN
if (!MGMT) { console.error('SUPABASE_ACCESS_TOKEN not in env'); process.exit(1) }
const MODEL = 'claude-sonnet-5'
const STALE_DAYS = 120

const TRADES = ['general contractor', 'remodeler', 'roofer', 'plumber', 'electrician', 'hvac', 'landscaper', 'painter', 'concrete', 'flooring', 'handyman']

function loadDotEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('='); if (eq < 0) continue
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}
const ANTHROPIC_KEY = { ...loadDotEnv(path.join(ROOT, 'supabase', '.env')), ...process.env }.ANTHROPIC_API_KEY
if (!ANTHROPIC_KEY) { console.error('ANTHROPIC_API_KEY missing (supabase/.env)'); process.exit(1) }

const r0 = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${MGMT}` } })
const SVC = (await r0.json()).find((k) => k.name === 'service_role')?.api_key
if (!SVC) throw new Error('could not reveal service_role key')
const rest = (p, init = {}) => fetch(`${URL}/rest/v1/${p}`, { ...init, headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } })

const RESEARCH_PROMPT = (trade) => `Research the "${trade}" trade (US local service businesses) for a web design agency's sales knowledge base. The agency sells custom websites + optional monthly services (hosting/maintenance, social media content, local SEO) to small ${trade} businesses.

Use web search to ground EVERYTHING in current reality — especially pricing. Search for things like "${trade} website design cost 2026", "how customers choose a ${trade}", "${trade} marketing".

Then output ONLY a JSON object (no markdown fences, no commentary) with exactly these keys:
{
  "id": "short-kebab-slug for this trade",
  "display_name": "Human name",
  "trades": ["lowercase", "match", "keywords", "for", "this", "trade"],
  "how_customers_buy": "2-4 sentences: how customers in this trade actually find and choose providers.",
  "must_have_site_features": "2-4 sentences: the #1 thing their website must do + other must-haves specific to this trade.",
  "credibility_levers": "1-3 sentences: trust signals specific to this trade.",
  "pitch_angles": "2-4 sentences of offer framing for selling a website to this trade, grounded in named high-converting sales frameworks (e.g. Hormozi value equation, SPIN, consequence framing) — say which framework each angle uses.",
  "upsell_ladder": "1-3 sentences: which monthly services fit this trade best, in order of likelihood.",
  "common_objections": "The 2-3 most common objections from this trade with a one-line response each.",
  "pricing": [{"item": "e.g. 5-page custom website", "low": 1500, "high": 5000, "source": "site or report name", "as_of": "2026-07"}],
  "sources": [{"title": "...", "url": "..."}]
}

Rules: pricing must come from your search results — ranges only, with the source named. If research is thin for an item, widen the range; NEVER invent a precise figure. "trades" should include the words a business owner might type as their business type (singular forms, common synonyms).`

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
function parseJsonLoose(raw) {
  const t = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const a = t.indexOf('{'); const b = t.lastIndexOf('}')
  return JSON.parse(a >= 0 && b > a ? t.slice(a, b + 1) : t)
}

async function research(trade) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 12000,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6 }],
      messages: [{ role: 'user', content: RESEARCH_PROMPT(trade) }],
    }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(`anthropic ${r.status} ${JSON.stringify(j).slice(0, 200)}`)
  const text = (j.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('\n')
  try { return parseJsonLoose(text) } catch (e) { throw new Error(`parse: ${e.message} · stop=${j.stop_reason} · tail=${JSON.stringify(text.slice(-240))}`) }
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const only = args.filter((a) => !a.startsWith('--'))
const trades = only.length ? only : TRADES

const existing = await (await rest('niche_playbooks?select=id,trades,researched_at')).json()
const matches = (trade) => existing.find((p) => (p.trades ?? []).includes(trade.toLowerCase()))
const stale = (p) => !p.researched_at || Date.now() - Date.parse(p.researched_at) > STALE_DAYS * 864e5

let failed = 0
for (const trade of trades) {
  process.stdout.write(`researching "${trade}" ... `)
  const t0 = Date.now()
  try {
    const have = matches(trade)
    if (have && !stale(have) && !force) { console.log(`skipped (fresh: ${have.id})`); continue }
    const parsed = await research(trade)
    const id = have?.id || slug(String(parsed.id || trade))
    const row = {
      id,
      display_name: String(parsed.display_name || trade),
      trades: Array.isArray(parsed.trades) ? parsed.trades.map((t) => String(t).toLowerCase()).slice(0, 20) : [trade.toLowerCase()],
      how_customers_buy: String(parsed.how_customers_buy ?? ''),
      must_have_site_features: String(parsed.must_have_site_features ?? ''),
      credibility_levers: String(parsed.credibility_levers ?? ''),
      pitch_angles: String(parsed.pitch_angles ?? ''),
      upsell_ladder: String(parsed.upsell_ladder ?? ''),
      common_objections: String(parsed.common_objections ?? ''),
      pricing: Array.isArray(parsed.pricing) ? parsed.pricing : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      researched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const tw = trade.toLowerCase().trim()
    if (tw && !row.trades.includes(tw)) row.trades.push(tw)
    const u = await rest('niche_playbooks?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) })
    if (!u.ok) throw new Error(`upsert ${u.status} ${(await u.text()).slice(0, 200)}`)
    console.log(`ok → ${row.id} (${row.pricing.length} pricing rows, ${row.sources.length} sources) in ${Math.round((Date.now() - t0) / 1000)}s`)
  } catch (err) {
    failed++
    console.log(`FAILED ${String(err).slice(0, 300)}`)
  }
}
console.log(failed ? `\ndone with ${failed} failure(s) — re-run to retry` : '\nall playbooks seeded')
process.exit(failed ? 1 : 0)
