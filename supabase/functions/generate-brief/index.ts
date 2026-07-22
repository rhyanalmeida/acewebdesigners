/**
 * `generate-brief` — pre-meeting sales brief for a booking, powered by the
 * niche-playbook knowledge base.
 *
 * Two stages, both Claude Sonnet 5:
 *   1. ensurePlaybook — resolve the booking's trade to a `niche_playbooks` row.
 *      If no row matches (or it's > PLAYBOOK_STALE_DAYS old), RESEARCH the niche
 *      live (web-search server tool: buyer behavior + current market pricing with
 *      sources, pitch angles grounded in named sales frameworks) and upsert the
 *      row — so the DB grows itself and later bookings in the niche reuse it
 *      instead of re-searching.
 *   2. generateBrief — the ~450-word markdown brief for THIS lead: playbook
 *      supplies niche guidance + pricing (no fresh niche search), web search is
 *      scoped to looking up the specific business (GBP, reviews, site, socials).
 *      Result lands on appointments.sales_brief and shows in /admin.
 *
 * Fired by `book` (fire-and-forget after a real booking) and re-fired by
 * `qualify` with force (regenerate enriched with years_in_business/has_website).
 * Failures never affect the booking; they land in brief_status/brief_error.
 *
 * Auth (deployed --no-verify-jwt), same as generate-site:
 *   • x-internal-key === SUPABASE_SERVICE_ROLE_KEY (book/qualify triggers), or
 *   • a Supabase user JWT whose email is in ADMIN_EMAILS (admin regenerate/seed).
 *
 * POST { appointmentId, force? }        → 202, runs in background
 * POST { action: 'research', trade, force? } → runs research synchronously,
 *        returns the playbook row (used by scripts/seed-niche-playbooks.mjs)
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.40.1'
import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'
import {
  FALLBACK_PLAYBOOK,
  isPlaybookStale,
  type NichePlaybook,
  selectNichePlaybook,
} from '../_shared/nichePlaybooks.ts'

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined

const MODEL = 'claude-sonnet-5' // fast + cheap enough per booking (~$0.03-0.08/brief incl. searches)
const RESEARCH_MAX_TOKENS = 4000
const BRIEF_MAX_TOKENS = 1500

// Server-side web search (runs on Anthropic's infra). `web_search_20260209` is
// the Sonnet 5 variant; the SDK passes the unknown tool type through untouched.
const webSearch = (maxUses: number) =>
  ({ type: 'web_search_20260209', name: 'web_search', max_uses: maxUses }) as never

interface Body {
  appointmentId?: string
  force?: boolean
  action?: string
  trade?: string
}

interface ApptRow {
  id: string
  is_test: boolean
  brief_status: string | null
  sales_brief: string | null
  preview_url: string | null
  start_ts: string
  contacts: {
    first_name: string | null
    last_name: string | null
    business_name: string | null
    business_type: string | null
    city: string | null
    state: string | null
    years_in_business: string | null
    has_website: string | null
  } | null
}

/** Concatenate all text blocks — web-search responses interleave text with result blocks. */
function textOf(msg: { content: { type: string }[] }): string {
  return (msg.content as { type: string; text?: string }[])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
}

/** Best-effort JSON extraction: strip fences, slice outermost braces. Throws on failure. */
function parseJsonLoose<T>(raw: string): T {
  let s = raw.trim().replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) s = s.slice(start, end + 1)
  return JSON.parse(s) as T
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'unknown-trade'

async function loadPlaybooks(supa: ReturnType<typeof admin>): Promise<NichePlaybook[]> {
  try {
    const { data, error } = await supa
      .from('niche_playbooks')
      .select(
        'id, display_name, trades, how_customers_buy, must_have_site_features, credibility_levers, pitch_angles, upsell_ladder, common_objections, pricing, sources, researched_at',
      )
      .eq('active', true)
      .order('sort', { ascending: true })
      .order('id', { ascending: true })
    if (error || !data) return []
    return data as unknown as NichePlaybook[]
  } catch {
    return []
  }
}

// ── research stage ────────────────────────────────────────────────────────────

const RESEARCH_PROMPT = (trade: string) => `Research the "${trade}" trade (US local service businesses) for a web design agency's sales knowledge base. The agency sells custom websites + optional monthly services (hosting/maintenance, social media content, local SEO) to small ${trade} businesses.

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

async function researchPlaybook(
  supa: ReturnType<typeof admin>,
  anthropic: Anthropic,
  trade: string,
  existingId?: string,
): Promise<NichePlaybook> {
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: RESEARCH_MAX_TOKENS,
    tools: [webSearch(6)],
    messages: [{ role: 'user', content: RESEARCH_PROMPT(trade) }],
  } as never)
  const msg = await stream.finalMessage()
  const parsed = parseJsonLoose<Partial<NichePlaybook>>(textOf(msg))

  const id = existingId || slug(String(parsed.id || trade))
  const row: NichePlaybook = {
    id,
    display_name: String(parsed.display_name || trade),
    trades: Array.isArray(parsed.trades)
      ? parsed.trades.map((t) => String(t).toLowerCase()).slice(0, 20)
      : [trade.toLowerCase()],
    how_customers_buy: String(parsed.how_customers_buy ?? ''),
    must_have_site_features: String(parsed.must_have_site_features ?? ''),
    credibility_levers: String(parsed.credibility_levers ?? ''),
    pitch_angles: String(parsed.pitch_angles ?? ''),
    upsell_ladder: String(parsed.upsell_ladder ?? ''),
    common_objections: String(parsed.common_objections ?? ''),
    pricing: Array.isArray(parsed.pricing) ? (parsed.pricing as NichePlaybook['pricing']) : [],
    sources: Array.isArray(parsed.sources) ? (parsed.sources as NichePlaybook['sources']) : [],
    researched_at: new Date().toISOString(),
  }
  // Make sure the raw trade string keeps matching this row in the future.
  const tradeWord = trade.toLowerCase().trim()
  if (tradeWord && !row.trades.includes(tradeWord)) row.trades.push(tradeWord)

  const { error } = await supa
    .from('niche_playbooks')
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) console.error('[generate-brief] playbook upsert failed', error.message)
  console.log(`[generate-brief] researched playbook "${row.id}" for trade "${trade}"`)
  return row
}

/** Resolve (and if needed research) the playbook for a trade. Never throws. */
async function ensurePlaybook(
  supa: ReturnType<typeof admin>,
  anthropic: Anthropic,
  trade: string | null | undefined,
): Promise<NichePlaybook> {
  const t = (trade ?? '').trim()
  if (!t) return FALLBACK_PLAYBOOK
  const existing = selectNichePlaybook(await loadPlaybooks(supa), t)
  if (existing && !isPlaybookStale(existing, Date.now())) return existing
  try {
    return await researchPlaybook(supa, anthropic, t, existing?.id)
  } catch (err) {
    console.error('[generate-brief] research failed — using fallback', err)
    return existing ?? FALLBACK_PLAYBOOK
  }
}

// ── brief stage ───────────────────────────────────────────────────────────────

const BRIEF_SYSTEM = `You are a senior sales strategist for a web design agency that sells custom websites and social-media management to local service businesses (contractors, plumbers, roofers, restaurants, etc.). Your job: produce a pre-meeting sales brief for ONE booked appointment so the closer walks in prepared.

The agency's offer: a free homepage preview is built BEFORE the call; the pitch is to convert that preview into a paid website build plus optional monthly services (hosting/maintenance, social-media content, local SEO).

You are given (a) the lead's data and (b) a researched NICHE PLAYBOOK for their trade — buyer behavior, must-have site features, pitch angles, market pricing ranges with sources. Use the playbook for all niche-level guidance and pricing; use web search ONLY to look up this specific business by name + location (Google Business Profile, reviews, existing website, social accounts).

Output the brief in this exact structure, Markdown, 450 words max:

## Review before the call
3-5 bullets: what exists online about this business, gaps you spotted (no site / weak reviews / no socials), and what their qualifying answers imply about readiness to buy.

## Niche playbook: {business_type}
3-4 bullets: how customers in this trade actually find and choose providers, the #1 thing their website must do, and one credibility lever specific to the trade.

## What to pitch, in order
Primary offer, then 2-3 upsells ranked by likelihood for this niche. One line each on WHY it fits this lead.

## Fair pricing
A table: item | typical market range (from the playbook, with source) | recommended quote. Anchor recommendations inside the market range. If the playbook has no pricing for an item, widen the range and say research is thin — NEVER invent a precise figure.

## Likely objections + responses
The 2 most probable objections for this lead (infer from has_website, years_in_business) with a one-line response each.

Rules:
- State only what search results or the playbook support; mark anything inferred as "(assumption)". Do not fabricate review counts, competitor names, or statistics.
- If the business is unfindable online, say so plainly — that absence IS the pitch — and skip to niche-level guidance.
- No preamble, no closing summary. Start directly with the first heading.`

function leadJson(appt: ApptRow): string {
  const c = appt.contacts
  return JSON.stringify(
    {
      first_name: c?.first_name ?? null,
      last_name: c?.last_name ?? null,
      business_name: c?.business_name ?? null,
      business_type: c?.business_type ?? null,
      city: c?.city ?? null,
      state: c?.state ?? null,
      years_in_business: c?.years_in_business ?? null,
      has_website: c?.has_website ?? null,
      preview_site_url: appt.preview_url ?? null,
      meeting_time: appt.start_ts,
    },
    null,
    2,
  )
}

function playbookForBrief(pb: NichePlaybook): string {
  return JSON.stringify(
    {
      niche: pb.display_name,
      how_customers_buy: pb.how_customers_buy,
      must_have_site_features: pb.must_have_site_features,
      credibility_levers: pb.credibility_levers,
      pitch_angles: pb.pitch_angles,
      upsell_ladder: pb.upsell_ladder,
      common_objections: pb.common_objections,
      pricing: pb.pricing,
      researched_at: pb.researched_at,
    },
    null,
    2,
  )
}

async function generateBrief(anthropic: Anthropic, appt: ApptRow, pb: NichePlaybook): Promise<string> {
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: BRIEF_MAX_TOKENS,
    system: BRIEF_SYSTEM,
    tools: [webSearch(3)],
    messages: [
      {
        role: 'user',
        content: `<lead_data>\n${leadJson(appt)}\n</lead_data>\n\n<niche_playbook>\n${playbookForBrief(pb)}\n</niche_playbook>`,
      },
    ],
  } as never)
  const msg = await stream.finalMessage()
  const brief = textOf(msg).trim()
  if (!brief) throw new Error('model returned no brief text')
  return brief
}

// ── orchestration ─────────────────────────────────────────────────────────────

async function runBrief(appt: ApptRow): Promise<void> {
  const supa = admin()
  const save = (fields: Record<string, unknown>) =>
    supa.from('appointments').update(fields).eq('id', appt.id)
  try {
    await save({ brief_status: 'generating', brief_error: null })
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
    const pb = await ensurePlaybook(supa, anthropic, appt.contacts?.business_type)
    const brief = await generateBrief(anthropic, appt, pb)
    await save({
      sales_brief: brief,
      brief_status: 'ready',
      brief_generated_at: new Date().toISOString(),
      brief_error: null,
    })
    console.log(`[generate-brief] ready appt=${appt.id} playbook="${pb.id}" chars=${brief.length}`)
  } catch (err) {
    console.error('[generate-brief] failed', appt.id, err)
    await save({ brief_status: 'failed', brief_error: String(err).slice(0, 280) }).then(
      () => {},
      () => {},
    )
  }
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const internal =
    req.headers.get('x-internal-key') === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!internal) {
    const adminUser = await requireAdmin(req)
    if (!adminUser) return json({ error: 'unauthorized' }, 401)
  }
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'ANTHROPIC_API_KEY not set' }, 503)

  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  const supa = admin()

  // ── research-only mode (seed script / manual refresh) ───────────────────────
  if (b.action === 'research') {
    const trade = (b.trade ?? '').trim()
    if (!trade) return json({ error: 'trade required' }, 400)
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
    const existing = selectNichePlaybook(await loadPlaybooks(supa), trade)
    if (existing && !isPlaybookStale(existing, Date.now()) && !b.force) {
      return json({ ok: true, skipped: 'fresh playbook exists', playbook: existing.id })
    }
    try {
      const row = await researchPlaybook(supa, anthropic, trade, existing?.id)
      return json({ ok: true, playbook: row.id, trades: row.trades, pricing: row.pricing.length, sources: row.sources.length })
    } catch (err) {
      console.error('[generate-brief] research action failed', err)
      return json({ error: String(err).slice(0, 280) }, 502)
    }
  }

  // ── per-appointment brief ────────────────────────────────────────────────────
  if (!b.appointmentId) return json({ error: 'appointmentId required' }, 400)
  const { data, error } = await supa
    .from('appointments')
    .select(
      'id, is_test, brief_status, sales_brief, preview_url, start_ts, contacts:contact_id ( first_name, last_name, business_name, business_type, city, state, years_in_business, has_website )',
    )
    .eq('id', b.appointmentId)
    .single()
  if (error || !data) return json({ error: 'appointment not found' }, 404)
  const appt = data as unknown as ApptRow

  if (appt.is_test && !b.force) return json({ ok: true, skipped: 'test booking' })
  if (appt.brief_status === 'ready' && appt.sales_brief && !b.force) {
    return json({ ok: true, skipped: 'brief already generated' })
  }

  const task = runBrief(appt)
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) {
    EdgeRuntime.waitUntil(task)
  } else {
    await task // local dev fallback
  }
  return json({ ok: true, started: true }, 202)
})
