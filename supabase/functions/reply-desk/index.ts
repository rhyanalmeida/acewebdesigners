/**
 * `reply-desk` — the outbound funnel's automated sales desk (owner, 2026-11-02: "if they
 * are interested or need a reply an AI should email back; if it needs me, message me").
 *
 * Every inbound cold-email reply becomes an `outbound_replies` row (written by
 * `instantly-webhook`, which then fires `classify` here). The desk:
 *
 *   classify {replyId}   rules (_shared/replyClassifier) → ONE Sonnet call (intent + draft,
 *                        constrained to _shared/outboundFacts) → `decide()` (_shared/replyPolicy)
 *                        → suppress | ignore | queue an answer | hand off to a person
 *   release              pg_cron every 5 min — send answers whose human-looking hold has elapsed, in-thread,
 *                        from the inbox that received the reply (Instantly POST /emails/reply)
 *   followups            pg_cron daily — the one "later" re-touch + up to 2 nudges for people who
 *                        opened the preview and went quiet
 *   dryrun {text, …}     classify without writing anything (scripts/reply-desk-dryrun.mjs)
 *
 * Hand-off = GHL tag `outbound-needs-human` (remove-then-add so the workflow's SMS fires every
 * time) + `prospects.handoff_at`; the desk stays silent on that thread until /admin Resolve.
 * Nothing here ever sends from acewebdesigners.com or GHL — Instantly delivers, same thread,
 * same address. Never says "AI"/"automated"/minutes anywhere a prospect can see (lintDraft).
 *
 * Auth: `x-cron-key` = CAPI_INTERNAL_SECRET (cron, scripts) or `x-internal-key` =
 * SUPABASE_SERVICE_ROLE_KEY (webhook, admin-data). Deployed --no-verify-jwt.
 * Secrets: ANTHROPIC_API_KEY (classify), INSTANTLY_SENDER_API_KEY (release; without it answers
 * queue but never send), GHL_* (hand-off alerts; no-op when unset).
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.40.1'
import { isFoodBusiness } from '../_shared/niche.ts'
import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { classifyReply, type RuleSentiment } from '../_shared/replyClassifier.ts'
import { demoLinkReply } from '../_shared/instantlyEvents.ts'
import { ghlAddTags, ghlFindContactId, ghlRemoveTags, ghlSyncStage, ghlUpdateContactFields } from '../_shared/ghl.ts'
import {
  CLASSIFY_TOOL,
  buildSystemPrompt,
  buildUserMessage,
  decide,
  followupText,
  humanReleaseTime,
  nudgeText,
  parseClassifier,
  toEmailBody,
  type ClassifierOutput,
  type Decision,
  type Intent,
} from '../_shared/replyPolicy.ts'

const SITE = 'https://acewebdesigners.com'
const INSTANTLY = 'https://api.instantly.ai/api/v2'
const MODEL = 'claude-sonnet-5-5'
const RELEASE_BATCH = 5
const STALE_SENDING_MS = 10 * 60_000
const NEEDS_HUMAN_TAG = 'outbound-needs-human'
const NUDGE_1_AFTER_MS = 2 * 24 * 3600e3
const NUDGE_2_AFTER_MS = 5 * 24 * 3600e3

/** What E1 said — context for the model (keep in step with the two sequence docs in docs/). */
const CONTRACTOR_EMAIL_SUMMARY = `Subject: {company} homepage?
Rhyan came across their business while looking at contractors in their area, said he designs websites for contractors and put together a homepage preview for them built around their work (not a template). The preview link was in the email. It's free, there's no call; if they like it, taking it live is $49/month with domain, hosting and updates included, cancel anytime. He asked them to have a look and tell him what to change.`
const RESTAURANT_EMAIL_SUMMARY = `Subject: {company} website?
Rhyan came across their restaurant while looking at restaurants in their city, said he designs websites for local restaurants and mocked up a new homepage for them with the menu, hours and directions up top, built to load fast on a phone. The preview link was in the email. It's free, there's no call; if they like it, taking it live is $49/month — the domain they already have or a new one, hosting, and menu/hours changes whenever they need them, cancel anytime. He asked them to have a look and tell him what to change.`
const originalEmailSummary = (p: { business_name: string; business_type: string | null }) =>
  (isFoodBusiness(p.business_type) ? RESTAURANT_EMAIL_SUMMARY : CONTRACTOR_EMAIL_SUMMARY).replace('{company}', p.business_name)

const env = (k: string) => Deno.env.get(k) ?? ''

interface ProspectRow {
  id: string
  token: string
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  business_name: string
  business_type: string | null
  city: string | null
  state: string | null
  is_test: boolean
  suppressed: boolean
  site_status: string
  ai_turns: number
  handoff_at: string | null
  reply_email_id: string | null
  reply_eaccount: string | null
  reply_subject: string | null
  demo_first_viewed_at: string | null
  replied_at: string | null
  purchased_at: string | null
  emailed_at: string | null
  followup_at: string | null
  followup_sent_at: string | null
  nudge_count: number
  demo_link_sent_at: string | null
}

interface ReplyRow {
  id: string
  prospect_id: string
  direction: 'in' | 'out'
  kind: 'reply' | 'demo_link' | 'followup' | 'nudge'
  instantly_email_id: string | null
  reply_to_email_id: string | null
  eaccount: string | null
  subject: string | null
  body: string
  intent: Intent | null
  status: string
  release_after: string | null
  sent_at: string | null
  created_at: string
}

const PROSPECT_COLS =
  'id, token, email, phone, first_name, last_name, business_name, business_type, city, state, is_test, suppressed, site_status, ' +
  'ai_turns, handoff_at, reply_email_id, reply_eaccount, reply_subject, demo_first_viewed_at, replied_at, purchased_at, emailed_at, ' +
  'followup_at, followup_sent_at, nudge_count, demo_link_sent_at'

const demoUrl = (p: { token: string }) => `${SITE}/demo/${p.token}`
const reSubject = (s: string | null | undefined, fallback: string) => (s && /^re:/i.test(s) ? s : `Re: ${s || fallback}`)

// ── model ───────────────────────────────────────────────────────────────────

async function runModel(p: ProspectRow, thread: ReplyRow[], newest: string): Promise<ClassifierOutput | null> {
  const key = env('ANTHROPIC_API_KEY')
  if (!key) return null
  try {
    const anthropic = new Anthropic({ apiKey: key })
    const msgs = thread.map((m) => ({ direction: m.direction, body: m.body.slice(0, 1500), at: m.created_at.slice(0, 16) }))
    if (!msgs.length || msgs[msgs.length - 1].body !== newest.slice(0, 1500)) msgs.push({ direction: 'in', body: newest.slice(0, 1500), at: new Date().toISOString().slice(0, 16) })
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: buildUserMessage({
            business_name: p.business_name,
            first_name: p.first_name,
            city: p.city,
            state: p.state,
            demo_url: demoUrl(p),
            site_status: p.site_status,
            original_email: originalEmailSummary(p),
            thread: msgs,
            ai_turns: p.ai_turns,
          }),
        },
      ],
      // deno-lint-ignore no-explicit-any
      tools: [CLASSIFY_TOOL as any],
      // Sonnet 5.5 rejects forced tool_choice ('tool'/'any') and 'temperature'; the prompt mandates the tool
      tool_choice: { type: 'auto' },
    })
    const tu = msg.content.find((b) => b.type === 'tool_use') as { input?: unknown } | undefined
    return parseClassifier(tu?.input)
  } catch (err) {
    console.error('[reply-desk] model error', err)
    return null
  }
}

// ── side effects ────────────────────────────────────────────────────────────

async function suppress(supa: ReturnType<typeof admin>, p: ProspectRow, reason: 'hostile' | 'unsubscribe' | 'declined') {
  if (p.email) await supa.from('suppressions').upsert({ email: p.email.toLowerCase(), reason }, { onConflict: 'email' })
  await supa.from('prospects').update({ suppressed: true, suppressed_reason: reason }).eq('id', p.id)
  // anything still waiting to go out to them is cancelled
  await supa.from('outbound_replies').update({ status: 'cancelled', error: `suppressed: ${reason}` }).eq('prospect_id', p.id).eq('direction', 'out').in('status', ['ready', 'queued'])
}

async function startBuild(supa: ReturnType<typeof admin>, prospectId: string): Promise<boolean> {
  const { data: won } = await supa.from('prospects').update({ site_status: 'generating', site_error: null }).eq('id', prospectId).eq('site_status', 'none').select('id').maybeSingle()
  if (!won) return false
  const task = fetch(`${env('SUPABASE_URL')}/functions/v1/generate-site`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-internal-key': env('SUPABASE_SERVICE_ROLE_KEY') },
    body: JSON.stringify({ prospectId }),
  })
    .then(async (r) => {
      if (!r.ok) await supa.from('prospects').update({ site_status: 'failed', site_error: `build start failed (${r.status})` }).eq('id', prospectId)
      else await r.body?.cancel()
    })
    .catch(async (err) => {
      await supa.from('prospects').update({ site_status: 'failed', site_error: String(err).slice(0, 280) }).eq('id', prospectId)
    })
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) EdgeRuntime.waitUntil(task)
  else await task
  return true
}

async function tagLead(p: ProspectRow): Promise<string | null> {
  return await ghlSyncStage({
    stage: 'lead',
    funnel: 'outbound',
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
    firstName: p.first_name ?? undefined,
    lastName: p.last_name ?? undefined,
    businessName: p.business_name,
    city: p.city ?? undefined,
    state: p.state ?? undefined,
    qualifiers: { business_type: p.business_type ?? undefined, preview_url: demoUrl(p) },
  })
}

/** A person is needed: GHL fields + remove/add tag (fires the staff SMS workflow every time). */
async function escalate(supa: ReturnType<typeof admin>, p: ProspectRow, intent: Intent, text: string, reason: string) {
  await supa.from('prospects').update({ handoff_at: new Date().toISOString(), reply_sentiment: intent }).eq('id', p.id)
  if (p.is_test) return
  const id = (await tagLead(p)) ?? (await ghlFindContactId({ email: p.email ?? undefined, phone: p.phone ?? undefined }))
  await ghlUpdateContactFields({ email: p.email ?? undefined, phone: p.phone ?? undefined, qualifiers: { last_reply_text: text.slice(0, 1500), last_reply_intent: `${intent} — ${reason}`.slice(0, 200) } })
  if (id) {
    await ghlRemoveTags(id, [NEEDS_HUMAN_TAG])
    await ghlAddTags(id, [NEEDS_HUMAN_TAG])
  }
}

// ── actions ─────────────────────────────────────────────────────────────────

async function classify(supa: ReturnType<typeof admin>, replyId: string) {
  const { data: r } = await supa.from('outbound_replies').select('*').eq('id', replyId).maybeSingle()
  const inbound = r as ReplyRow | null
  if (!inbound || inbound.direction !== 'in') return json({ error: 'not an inbound reply' }, 404)
  if (inbound.status !== 'queued') return json({ ok: true, skipped: `already ${inbound.status}` })
  const { data: pr } = await supa.from('prospects').select(PROSPECT_COLS).eq('id', inbound.prospect_id).maybeSingle()
  const p = pr as unknown as ProspectRow | null
  if (!p) return json({ error: 'prospect missing' }, 404)

  // a fresh reply cancels any queued nudge/follow-up — the conversation is live again
  await supa.from('outbound_replies').update({ status: 'cancelled', error: 'they replied' }).eq('prospect_id', p.id).eq('direction', 'out').in('kind', ['nudge', 'followup']).in('status', ['ready', 'queued'])

  const { data: th } = await supa.from('outbound_replies').select('*').eq('prospect_id', p.id).in('status', ['sent', 'answered', 'needs_human', 'ignored', 'queued']).order('created_at', { ascending: true }).limit(8)
  const thread = (th ?? []) as ReplyRow[]

  const rule: RuleSentiment = classifyReply(inbound.body)
  const terminal = rule === 'hostile' || rule === 'remove' || rule === 'ooo_auto'
  const model = terminal ? null : await runModel(p, thread, inbound.body)
  const decision: Decision = decide({
    rule,
    model,
    prospect: { suppressed: p.suppressed, is_test: p.is_test, ai_turns: p.ai_turns, handoff_at: p.handoff_at, site_status: p.site_status, demo_url: demoUrl(p) },
  })
  const audit = { rule, model, decision }
  const base = { intent: decision.intent, confidence: model?.confidence ?? null, needs_human: decision.action === 'escalate', reason: 'reason' in decision ? decision.reason : null, raw: audit }

  if (decision.action === 'suppress') {
    await suppress(supa, p, decision.reason)
    await supa.from('prospects').update({ reply_sentiment: decision.intent }).eq('id', p.id)
    await supa.from('outbound_replies').update({ ...base, status: 'suppressed' }).eq('id', inbound.id)
  } else if (decision.action === 'ignore' || decision.action === 'silent') {
    await supa.from('outbound_replies').update({ ...base, status: 'ignored', reason: decision.action === 'silent' ? decision.reason : 'auto-responder' }).eq('id', inbound.id)
    if (decision.action === 'ignore') await supa.from('prospects').update({ reply_sentiment: 'ooo_auto' }).eq('id', p.id)
  } else if (decision.action === 'escalate') {
    await supa.from('outbound_replies').update({ ...base, status: 'needs_human' }).eq('id', inbound.id)
    await escalate(supa, p, decision.intent, inbound.body, decision.reason)
  } else {
    // reply
    const text = decision.kind === 'demo_link' ? demoLinkReply({ first_name: p.first_name, business_name: p.business_name, demo_url: demoUrl(p) }).text : decision.body!
    const releaseAfter = humanReleaseTime(new Date(), p.state)
    const { error } = await supa.from('outbound_replies').insert({
      prospect_id: p.id,
      direction: 'out',
      kind: decision.kind,
      reply_to_email_id: inbound.instantly_email_id,
      eaccount: inbound.eaccount,
      subject: reSubject(inbound.subject, `${p.business_name} homepage?`),
      body: text,
      intent: decision.intent,
      status: 'ready',
      release_after: releaseAfter.toISOString(),
    })
    if (error && !/duplicate|unique/i.test(error.message)) console.error('[reply-desk] queue insert failed', error.message)
    await supa.from('outbound_replies').update({ ...base, status: 'answered' }).eq('id', inbound.id)
    await supa
      .from('prospects')
      .update({
        reply_sentiment: decision.intent,
        ...(decision.followupDays ? { followup_at: new Date(Date.now() + decision.followupDays * 86400e3).toISOString(), followup_sent_at: null } : {}),
      })
      .eq('id', p.id)
    let built = false
    if (decision.startBuild) built = await startBuild(supa, p.id)
    if (!p.is_test && decision.intent !== 'later' && decision.intent !== 'objection_timing') await tagLead(p)
    console.log(`[reply-desk] ${p.email} ${decision.intent} → ${decision.kind} at ${releaseAfter.toISOString()} build=${built}`)
  }
  return json({ ok: true, ...audit })
}

async function sendViaInstantly(row: ReplyRow, linkUrl: string): Promise<void> {
  const key = env('INSTANTLY_SENDER_API_KEY')
  if (!key) throw new Error('no INSTANTLY_SENDER_API_KEY')
  if (!row.reply_to_email_id || !row.eaccount) throw new Error('missing reply_to/eaccount')
  const r = await fetch(`${INSTANTLY}/emails/reply`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ reply_to_uuid: row.reply_to_email_id, eaccount: row.eaccount, subject: row.subject ?? 'Re:', body: toEmailBody(row.body, linkUrl) }),
  })
  if (!r.ok) throw new Error(`emails/reply ${r.status} ${(await r.text()).slice(0, 160)}`)
}

async function release(supa: ReturnType<typeof admin>) {
  const now = new Date()
  // 1) park anything stuck mid-send (isolate died) and hand it to a person
  const { data: stuck } = await supa.from('outbound_replies').select('*').eq('status', 'sending').lt('release_after', new Date(now.getTime() - STALE_SENDING_MS).toISOString())
  for (const s of (stuck ?? []) as ReplyRow[]) {
    await supa.from('outbound_replies').update({ status: 'failed', error: 'stuck in sending' }).eq('id', s.id)
    const { data: pr } = await supa.from('prospects').select(PROSPECT_COLS).eq('id', s.prospect_id).maybeSingle()
    if (pr) await escalate(supa, pr as unknown as ProspectRow, s.intent ?? 'unknown', s.body, 'send failed')
  }
  // 2) re-fire classification for inbound rows the webhook never got to
  const { data: unclassified } = await supa.from('outbound_replies').select('id').eq('direction', 'in').eq('status', 'queued').lt('created_at', new Date(now.getTime() - 2 * 60_000).toISOString()).limit(3)
  for (const u of unclassified ?? []) await classify(supa, (u as { id: string }).id).catch((e) => console.error('[reply-desk] reclassify', e))

  // 3) send what is due
  const { data: due } = await supa.from('outbound_replies').select('*').eq('status', 'ready').lte('release_after', now.toISOString()).order('release_after', { ascending: true }).limit(RELEASE_BATCH)
  let sent = 0, skipped = 0, failed = 0
  for (const row of (due ?? []) as ReplyRow[]) {
    const { data: pr } = await supa.from('prospects').select(PROSPECT_COLS).eq('id', row.prospect_id).maybeSingle()
    const p = pr as unknown as ProspectRow | null
    if (!p || p.suppressed || p.purchased_at) {
      await supa.from('outbound_replies').update({ status: 'cancelled', error: !p ? 'prospect gone' : p.suppressed ? 'suppressed' : 'purchased' }).eq('id', row.id)
      continue
    }
    if (row.kind === 'demo_link' && p.site_status !== 'deployed') {
      if (p.site_status === 'failed') {
        await supa.from('outbound_replies').update({ status: 'failed', error: 'build failed' }).eq('id', row.id)
        await escalate(supa, p, 'yes', row.body, 'demo build failed')
        failed++
      } else skipped++
      continue
    }
    const { data: claimed } = await supa.from('outbound_replies').update({ status: 'sending' }).eq('id', row.id).eq('status', 'ready').select('id').maybeSingle()
    if (!claimed) continue
    try {
      await sendViaInstantly(row, demoUrl(p))
      await supa.from('outbound_replies').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', row.id)
      const patch: Record<string, unknown> = {}
      if (row.kind === 'reply') patch.ai_turns = p.ai_turns + 1
      if (row.kind === 'demo_link') patch.demo_link_sent_at = new Date().toISOString()
      if (row.kind === 'followup') patch.followup_sent_at = new Date().toISOString()
      if (row.kind === 'nudge') patch.nudge_count = p.nudge_count + 1
      await supa.from('prospects').update(patch).eq('id', p.id)
      sent++
      console.log(`[reply-desk] sent ${row.kind} → ${p.email}`)
    } catch (e) {
      failed++
      await supa.from('outbound_replies').update({ status: 'failed', error: String(e).slice(0, 280) }).eq('id', row.id)
      await escalate(supa, p, 'unknown', row.body, `send failed: ${String(e).slice(0, 120)}`)
    }
  }
  return json({ ok: true, sent, skipped, failed, parked: (stuck ?? []).length, reclassified: (unclassified ?? []).length })
}

/** Instantly id + inbox of the most recent email we SENT this lead (for in-thread nudges). */
async function lastSentEmail(email: string): Promise<{ id: string; eaccount: string; subject: string } | null> {
  const key = env('INSTANTLY_API_KEY')
  if (!key) return null
  const url = new URL(`${INSTANTLY}/emails`)
  url.searchParams.set('email_type', 'sent')
  url.searchParams.set('lead', email)
  url.searchParams.set('limit', '5')
  url.searchParams.set('sort_order', 'desc')
  const r = await fetch(url, { headers: { authorization: `Bearer ${key}` } })
  if (!r.ok) return null
  const d = (await r.json()) as { items?: Record<string, unknown>[] }
  const it = (d.items ?? []).find((x) => x.id && x.eaccount)
  return it ? { id: String(it.id), eaccount: String(it.eaccount), subject: typeof it.subject === 'string' ? it.subject : '' } : null
}

async function followups(supa: ReturnType<typeof admin>) {
  const now = Date.now()
  let queued = 0
  const base = supa.from('prospects').select(PROSPECT_COLS).eq('suppressed', false).eq('is_test', false).is('purchased_at', null).is('handoff_at', null)

  // "later" re-touches
  const { data: laters } = await base.lte('followup_at', new Date(now).toISOString()).is('followup_sent_at', null).not('reply_email_id', 'is', null).limit(10)
  for (const p of (laters ?? []) as unknown as ProspectRow[]) {
    const { error } = await supa.from('outbound_replies').insert({
      prospect_id: p.id, direction: 'out', kind: 'followup', reply_to_email_id: p.reply_email_id, eaccount: p.reply_eaccount,
      subject: reSubject(p.reply_subject, `${p.business_name} homepage?`), body: followupText({ first_name: p.first_name, business_name: p.business_name, demo_url: demoUrl(p) }),
      intent: 'later', status: 'ready', release_after: humanReleaseTime(new Date(), p.state).toISOString(),
    })
    await supa.from('prospects').update({ followup_at: null }).eq('id', p.id)
    if (!error) queued++
  }

  // viewed the preview, never replied, never bought → 2 nudges
  const { data: viewers } = await supa.from('prospects').select(PROSPECT_COLS).eq('suppressed', false).eq('is_test', false).is('purchased_at', null).is('handoff_at', null).is('replied_at', null).not('demo_first_viewed_at', 'is', null).not('emailed_at', 'is', null).lt('nudge_count', 2).limit(25)
  for (const p of (viewers ?? []) as unknown as ProspectRow[]) {
    if (!p.email) continue
    const { data: prior } = await supa.from('outbound_replies').select('status, sent_at').eq('prospect_id', p.id).eq('kind', 'nudge').order('created_at', { ascending: false }).limit(1)
    const last = (prior ?? [])[0] as { status: string; sent_at: string | null } | undefined
    if (last && last.status !== 'sent') continue // one in flight (or cancelled/failed → stop)
    const since = p.nudge_count === 0 ? Date.parse(p.demo_first_viewed_at!) : last?.sent_at ? Date.parse(last.sent_at) : NaN
    const gap = p.nudge_count === 0 ? NUDGE_1_AFTER_MS : NUDGE_2_AFTER_MS
    if (!Number.isFinite(since) || now - since < gap) continue
    const sentEmail = await lastSentEmail(p.email)
    if (!sentEmail) {
      console.log(`[reply-desk] nudge skipped, no sent email found for ${p.email}`)
      continue
    }
    const { error } = await supa.from('outbound_replies').insert({
      prospect_id: p.id, direction: 'out', kind: 'nudge', reply_to_email_id: sentEmail.id, eaccount: sentEmail.eaccount,
      subject: reSubject(sentEmail.subject, `${p.business_name} homepage?`), body: nudgeText({ first_name: p.first_name, business_name: p.business_name, demo_url: demoUrl(p) }, p.nudge_count + 1),
      intent: 'unknown', status: 'ready', release_after: humanReleaseTime(new Date(), p.state).toISOString(),
    })
    if (!error) queued++
  }
  return json({ ok: true, queued })
}

async function dryrun(body: { text?: string; context?: Partial<ProspectRow> }) {
  const text = String(body.text ?? '')
  const p: ProspectRow = {
    id: 'dry', token: '0'.repeat(32), email: 'dry@example.com', phone: null, first_name: 'Sam', last_name: null, business_name: 'Sample Roofing', business_type: 'roofing',
    city: 'Portland', state: 'ME', is_test: false, suppressed: false, site_status: 'none', ai_turns: 0, handoff_at: null, reply_email_id: null, reply_eaccount: null, reply_subject: null,
    demo_first_viewed_at: null, replied_at: null, purchased_at: null, emailed_at: null, followup_at: null, followup_sent_at: null, nudge_count: 0, demo_link_sent_at: null,
    ...(body.context ?? {}),
  }
  const rule = classifyReply(text)
  const terminal = rule === 'hostile' || rule === 'remove' || rule === 'ooo_auto'
  const model = terminal ? null : await runModel(p, [], text)
  const decision = decide({ rule, model, prospect: { suppressed: p.suppressed, is_test: false, ai_turns: p.ai_turns, handoff_at: p.handoff_at, site_status: p.site_status, demo_url: demoUrl(p) } })
  return json({ rule, model, decision, release_after: humanReleaseTime(new Date(), p.state).toISOString() })
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  const cron = env('CAPI_INTERNAL_SECRET')
  const internal = env('SUPABASE_SERVICE_ROLE_KEY')
  const okCron = cron && req.headers.get('x-cron-key') === cron
  const okInternal = internal && req.headers.get('x-internal-key') === internal
  if (!okCron && !okInternal) return json({ error: 'forbidden' }, 403)

  let body: { action?: string; replyId?: string; text?: string; context?: Partial<ProspectRow> } = {}
  try {
    body = await req.json()
  } catch {
    /* empty */
  }
  const supa = admin()
  try {
    switch (body.action) {
      case 'classify':
        if (!body.replyId) return json({ error: 'replyId required' }, 400)
        return await classify(supa, body.replyId)
      case 'release':
        return await release(supa)
      case 'followups':
        return await followups(supa)
      case 'dryrun':
        return await dryrun(body)
      default:
        return json({ error: 'unknown action' }, 400)
    }
  } catch (err) {
    console.error('[reply-desk]', body.action, err)
    return json({ error: String(err).slice(0, 300) }, 500)
  }
})
