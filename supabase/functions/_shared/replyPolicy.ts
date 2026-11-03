/**
 * Reply-desk policy — pure, vitest-covered (no Deno APIs, no I/O).
 *
 * The desk has three layers:
 *   1. rules   (`replyClassifier.ts`)  — hard overrides: remove/hostile/ooo are final
 *   2. model   (`reply-desk` fn)       — intent + draft, constrained to OUTBOUND_FACTS
 *   3. policy  (this file)             — `decide()` turns both into ONE action
 * plus `humanReleaseTime` (a human-looking send delay inside business hours in the lead's
 * state) and `lintDraft` (rejects any draft that leaks something the facts don't support).
 */

import type { ReplySentiment, RuleSentiment } from './replyClassifier.ts'
import { OUTBOUND_FACTS, OUTBOUND_NEVER, OUTBOUND_PRICE, SUPPORT_EMAIL } from './outboundFacts.ts'

export type Intent = ReplySentiment

export interface ClassifierOutput {
  intent: Intent
  confidence: number
  needs_human: boolean
  reason: string
  reply_text: string | null
  followup_days: number | null
}

export interface ProspectCtx {
  suppressed: boolean
  is_test: boolean
  ai_turns: number
  handoff_at: string | null
  site_status: string
  demo_url: string
}

export interface DecideInput {
  rule: RuleSentiment
  model: ClassifierOutput | null
  prospect: ProspectCtx
}

export type Decision =
  | { action: 'suppress'; intent: Intent; reason: 'hostile' | 'unsubscribe' | 'declined' }
  | { action: 'ignore'; intent: 'ooo_auto' }
  | { action: 'silent'; intent: Intent; reason: string }
  | {
      action: 'reply'
      intent: Intent
      kind: 'demo_link' | 'reply'
      body: string | null // null = use the demoLinkReply template
      startBuild: boolean
      followupDays: number | null
    }
  | { action: 'escalate'; intent: Intent; reason: string }

export const MAX_AI_TURNS = 2
export const MIN_CONFIDENCE = 0.75
export const DEFAULT_FOLLOWUP_DAYS = 21
export const MAX_FOLLOWUP_DAYS = 60
export const MIN_FOLLOWUP_DAYS = 7

export function decide(input: DecideInput): Decision {
  const { rule, model, prospect } = input

  // 1) terminal rules — nothing downstream can override these
  if (rule === 'hostile') return { action: 'suppress', intent: 'hostile', reason: 'hostile' }
  if (rule === 'remove') return { action: 'suppress', intent: 'remove', reason: 'unsubscribe' }
  if (rule === 'ooo_auto') return { action: 'ignore', intent: 'ooo_auto' }

  // 2) threads the desk must stay out of
  if (prospect.suppressed) return { action: 'silent', intent: model?.intent ?? 'unknown', reason: 'suppressed' }
  if (prospect.is_test) return { action: 'silent', intent: model?.intent ?? 'unknown', reason: 'test row' }
  if (prospect.handoff_at) return { action: 'silent', intent: model?.intent ?? 'unknown', reason: 'handed off to a person' }

  // 3) no model → a person decides
  if (!model) return { action: 'escalate', intent: rule === 'yes' || rule === 'no' ? rule : 'unknown', reason: 'classifier unavailable' }

  let intent = model.intent
  if (model.confidence < MIN_CONFIDENCE) intent = 'unknown'
  // rules beat the model on polarity: a rule 'no' can only soften to a timing objection
  if (rule === 'no' && intent !== 'later' && intent !== 'objection_timing') intent = 'no'
  // a rule 'yes' (no NO-terms present) is trusted even if the model hedged
  if (rule === 'yes' && (intent === 'unknown' || intent === 'question')) intent = 'yes'

  if (intent === 'hostile') return { action: 'suppress', intent, reason: 'hostile' }
  if (intent === 'remove') return { action: 'suppress', intent, reason: 'unsubscribe' }
  if (intent === 'no') return { action: 'suppress', intent, reason: 'declined' }
  if (intent === 'ooo_auto') return { action: 'ignore', intent }

  if (model.needs_human) return { action: 'escalate', intent, reason: model.reason || 'model asked for a person' }
  if (intent === 'unknown') return { action: 'escalate', intent, reason: model.reason || 'intent unclear' }

  if (intent === 'yes') {
    return { action: 'reply', intent, kind: 'demo_link', body: null, startBuild: prospect.site_status === 'none', followupDays: null }
  }

  if (prospect.ai_turns >= MAX_AI_TURNS) return { action: 'escalate', intent, reason: `already answered ${prospect.ai_turns} times` }

  const draft = (model.reply_text ?? '').trim()
  if (!draft) return { action: 'escalate', intent, reason: 'no draft' }
  const lint = lintDraft(draft, prospect.demo_url)
  if (!lint.ok) return { action: 'escalate', intent, reason: `draft rejected: ${lint.problems.join('; ')}` }

  if (intent === 'later' || intent === 'objection_timing') {
    const days = clampFollowup(model.followup_days)
    return { action: 'reply', intent, kind: 'reply', body: draft, startBuild: false, followupDays: days }
  }
  // question / objection_price
  return { action: 'reply', intent, kind: 'reply', body: draft, startBuild: false, followupDays: null }
}

export function clampFollowup(days: number | null | undefined): number {
  if (days == null || !Number.isFinite(days)) return DEFAULT_FOLLOWUP_DAYS
  return Math.min(MAX_FOLLOWUP_DAYS, Math.max(MIN_FOLLOWUP_DAYS, Math.round(days)))
}

// ── draft lint ──────────────────────────────────────────────────────────────

const FORBIDDEN =
  /\b(ai|a\.i\.|automat\w*|bot|generated|generator|algorithm|software|template[sd]?|instant(ly)?|minutes?|seconds?|discount|coupon|free month|refund|guarantee[sd]?|ranking|rank|seo|leads?|clients?|customers? (love|trust)|percent)\b|%/i
const URL_RE = /https?:\/\/[^\s)>\]]+/gi
const MONEY_RE = /\$\s?(\d[\d,]*(?:\.\d+)?)/g

export function lintDraft(text: string, demoUrl: string): { ok: boolean; problems: string[] } {
  const problems: string[] = []
  const t = text.trim()
  if (!t) problems.push('empty')
  if (t.length > 900) problems.push('too long')
  if (/!/.test(t)) problems.push('exclamation mark')
  if (/^\s*([-*•]|\d+\.)\s/m.test(t)) problems.push('list formatting')
  const bad = t.match(FORBIDDEN)
  if (bad) problems.push(`forbidden word "${bad[0]}"`)
  for (const m of t.matchAll(MONEY_RE)) {
    const n = Number(m[1].replace(/,/g, ''))
    if (n !== OUTBOUND_PRICE) problems.push(`price $${m[1]}`)
  }
  for (const u of t.match(URL_RE) ?? []) {
    if (u.replace(/[.,]$/, '') !== demoUrl) problems.push(`link ${u}`)
  }
  if (/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(t)) problems.push('phone number')
  return { ok: problems.length === 0, problems }
}

// ── human-looking release time ──────────────────────────────────────────────

/** Contiguous-US state → IANA tz (owner sells to US contractors; ET default). */
export const STATE_TZ: Record<string, string> = {
  CT: 'America/New_York', DE: 'America/New_York', FL: 'America/New_York', GA: 'America/New_York',
  ME: 'America/New_York', MD: 'America/New_York', MA: 'America/New_York', NH: 'America/New_York',
  NJ: 'America/New_York', NY: 'America/New_York', NC: 'America/New_York', OH: 'America/New_York',
  PA: 'America/New_York', RI: 'America/New_York', SC: 'America/New_York', VT: 'America/New_York',
  VA: 'America/New_York', WV: 'America/New_York', MI: 'America/New_York', IN: 'America/New_York',
  KY: 'America/New_York', DC: 'America/New_York',
  AL: 'America/Chicago', AR: 'America/Chicago', IL: 'America/Chicago', IA: 'America/Chicago',
  KS: 'America/Chicago', LA: 'America/Chicago', MN: 'America/Chicago', MS: 'America/Chicago',
  MO: 'America/Chicago', NE: 'America/Chicago', ND: 'America/Chicago', OK: 'America/Chicago',
  SD: 'America/Chicago', TN: 'America/Chicago', TX: 'America/Chicago', WI: 'America/Chicago',
  AZ: 'America/Phoenix', CO: 'America/Denver', ID: 'America/Denver', MT: 'America/Denver',
  NM: 'America/Denver', UT: 'America/Denver', WY: 'America/Denver',
  CA: 'America/Los_Angeles', NV: 'America/Los_Angeles', OR: 'America/Los_Angeles', WA: 'America/Los_Angeles',
  AK: 'America/Anchorage', HI: 'Pacific/Honolulu',
}

const FULL_STATE: Record<string, string> = {
  maine: 'ME', massachusetts: 'MA', 'new hampshire': 'NH', vermont: 'VT', connecticut: 'CT', 'rhode island': 'RI',
  'new york': 'NY', 'new jersey': 'NJ', pennsylvania: 'PA', florida: 'FL', texas: 'TX', california: 'CA',
}

export function tzForState(state: string | null | undefined): string {
  const s = (state ?? '').trim()
  if (!s) return 'America/New_York'
  const code = s.length === 2 ? s.toUpperCase() : (FULL_STATE[s.toLowerCase()] ?? '')
  return STATE_TZ[code] ?? 'America/New_York'
}

export const WINDOW_OPEN_HOUR = 7
export const WINDOW_CLOSE_HOUR = 19
export const HOLD_MIN_MINUTES = 20
export const HOLD_MAX_MINUTES = 90

interface LocalParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number // 0 = Sunday
}

function localParts(d: Date, tz: string): LocalParts {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short',
  })
  const p: Record<string, string> = {}
  for (const part of f.formatToParts(d)) p[part.type] = part.value
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday)
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour % 24, minute: +p.minute, weekday: wd }
}

/** The instant that is `hour:minute` local on the same local calendar day as `d`, plus `addDays`. */
function atLocal(d: Date, tz: string, hour: number, minute: number, addDays: number): Date {
  const lp = localParts(d, tz)
  // guess in UTC, then correct by the zone offset at that guess (handles DST edges well enough)
  const guess = new Date(Date.UTC(lp.year, lp.month - 1, lp.day + addDays, hour, minute, 0, 0))
  const gp = localParts(guess, tz)
  const asUtc = Date.UTC(gp.year, gp.month - 1, gp.day, gp.hour, gp.minute)
  const offsetMs = asUtc - guess.getTime()
  return new Date(guess.getTime() - offsetMs)
}

/**
 * When an answer should go out: 20–90 min after `now`, but never outside 07:00–19:00 in the
 * lead's time zone and never on a Sunday. Outside the window it lands 10–60 min after the
 * next opening. `rng` is injectable so tests are deterministic.
 */
export function humanReleaseTime(now: Date, state: string | null | undefined, rng: () => number = Math.random): Date {
  const tz = tzForState(state)
  const holdMin = HOLD_MIN_MINUTES + Math.floor(rng() * (HOLD_MAX_MINUTES - HOLD_MIN_MINUTES + 1))
  let t = new Date(now.getTime() + holdMin * 60_000)
  for (let i = 0; i < 4; i++) {
    const lp = localParts(t, tz)
    const openJitter = 10 + Math.floor(rng() * 51) // 10–60 min after opening
    if (lp.weekday === 0) {
      t = atLocal(t, tz, WINDOW_OPEN_HOUR, openJitter, 1)
      continue
    }
    if (lp.hour < WINDOW_OPEN_HOUR) {
      t = atLocal(t, tz, WINDOW_OPEN_HOUR, openJitter, 0)
      continue
    }
    if (lp.hour >= WINDOW_CLOSE_HOUR) {
      t = atLocal(t, tz, WINDOW_OPEN_HOUR, openJitter, 1)
      continue
    }
    break
  }
  return t
}

// ── fixed texts (no model) ──────────────────────────────────────────────────

function greet(first_name?: string | null, business_name?: string | null): string {
  return (first_name ?? '').trim() || (business_name ?? '').trim() || 'there'
}

/** The one re-touch after a "later" — truthful, no new claims. */
export function followupText(p: { first_name?: string | null; business_name?: string | null; demo_url: string }): string {
  return `Hi ${greet(p.first_name, p.business_name)},

You mentioned the timing wasn't right when we last spoke, so I'm checking back. The preview is still at the same link: ${p.demo_url}

If anything about it should change, tell me and I'll take care of it. If now still isn't the time, no problem at all.

Rhyan
Ace Web Designers`
}

/** Nudges for someone who opened the preview and went quiet. n = 1 or 2. */
export function nudgeText(p: { first_name?: string | null; business_name?: string | null; demo_url: string }, n: number): string {
  const name = greet(p.first_name, p.business_name)
  if (n === 1) {
    return `Hi ${name},

Saw the preview got a look. Anything you'd want changed on it? A different photo, a service added, different wording — just tell me and I'll update it.

It's here if you want another look: ${p.demo_url}

Rhyan
Ace Web Designers`
  }
  return `Hi ${name},

Last note from me on this. The preview stays at ${p.demo_url} whenever you want it. If you'd like it live on your own .com it's $${OUTBOUND_PRICE} a month with the domain, hosting and updates included, and you can cancel anytime.

If it's not for you, no hard feelings.

Rhyan
Ace Web Designers`
}

// ── model prompt + tool schema ──────────────────────────────────────────────

export const INTENTS: readonly Intent[] = [
  'yes', 'question', 'objection_price', 'objection_timing', 'later', 'no', 'remove', 'hostile', 'ooo_auto', 'unknown',
]

export interface PromptCtx {
  business_name: string
  first_name?: string | null
  city?: string | null
  state?: string | null
  demo_url: string
  site_status: string
  original_email: string
  thread: { direction: 'in' | 'out'; body: string; at: string }[]
  ai_turns: number
}

export function buildSystemPrompt(): string {
  return `You are Rhyan, the owner of Ace Web Designers, a small web design shop. You emailed a contractor a cold note offering a free homepage preview, and they replied. Your job: classify their newest message and, when it needs an answer, write the reply Rhyan would send.

VOICE: a busy, friendly tradesperson-to-tradesperson tone. Two to five short sentences. Plain words. No exclamation marks, no bullet points, no headings, no greeting fluff, no sign-off beyond "Rhyan". Never mention software, tools, AI, automation, how the site was made, or how fast anything happens. Do not use the words "instantly", "minutes" or "seconds".

FACTS — the only things you may state or imply:
${OUTBOUND_FACTS.map((f) => `- ${f}`).join('\n')}

NEVER:
${OUTBOUND_NEVER.map((f) => `- ${f}`).join('\n')}

INTENTS (classify the NEWEST message only; quoted older text is context):
- yes: they want to see the preview / want it built / want it live.
- question: they ask something the FACTS answer (price, what's included, domain, updates, cancel, what happens next).
- objection_price: cost is the concern.
- objection_timing: busy / not now / season, with a window you can read.
- later: not now, no window.
- no: polite decline, no removal request.
- remove: asks to be removed / unsubscribed / stop emailing.
- hostile: angry, abusive, threatens to report.
- ooo_auto: auto-responder / out of office.
- unknown: anything else, or you aren't sure.

needs_human = true when the right answer needs anything outside the FACTS: legal, refunds, complaints, privacy ("where did you get my email"), partnership or hiring offers, a request for a call or a specific time, custom features, existing-site migration details, anything about their current web company. When needs_human is true, reply_text must be null.

For yes: reply_text must be null (a fixed message with the link is sent). For no/remove/hostile/ooo_auto/unknown: reply_text null.
For question / objection_price / objection_timing / later: write reply_text. If they can reach the preview, include the preview link exactly as given. For objection_timing/later set followup_days (7–60) to when checking back would be welcome.

Output ONLY via the classify_reply tool.`
}

export function buildUserMessage(ctx: PromptCtx): string {
  const thread = ctx.thread
    .map((m) => `[${m.direction === 'in' ? 'THEM' : 'RHYAN'} ${m.at}]\n${m.body}`)
    .join('\n\n')
  return `BUSINESS: ${ctx.business_name}${ctx.first_name ? ` (contact: ${ctx.first_name})` : ''}${ctx.city || ctx.state ? ` — ${[ctx.city, ctx.state].filter(Boolean).join(', ')}` : ''}
PREVIEW LINK: ${ctx.demo_url}
PREVIEW STATE: ${ctx.site_status === 'deployed' ? 'built — the link shows it' : 'the link builds it when opened'}
ANSWERS ALREADY SENT IN THIS THREAD: ${ctx.ai_turns}

ORIGINAL COLD EMAIL RHYAN SENT:
${ctx.original_email}

THREAD (oldest first; the LAST message is the one to classify):
${thread}`
}

export const CLASSIFY_TOOL = {
  name: 'classify_reply',
  description: 'Classify the newest message in the thread and, when appropriate, draft the reply.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      intent: { type: 'string', enum: [...INTENTS] },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      needs_human: { type: 'boolean' },
      reason: { type: 'string', description: 'One short sentence for the audit log.' },
      reply_text: { type: ['string', 'null'] },
      followup_days: { type: ['integer', 'null'], minimum: 7, maximum: 60 },
    },
    required: ['intent', 'confidence', 'needs_human', 'reason', 'reply_text', 'followup_days'],
  },
} as const

/** Validate the tool output; null when the shape is wrong (caller escalates). */
export function parseClassifier(raw: unknown): ClassifierOutput | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const intent = String(o.intent ?? '') as Intent
  if (!INTENTS.includes(intent)) return null
  const confidence = Number(o.confidence)
  if (!Number.isFinite(confidence)) return null
  return {
    intent,
    confidence: Math.max(0, Math.min(1, confidence)),
    needs_human: Boolean(o.needs_human),
    reason: typeof o.reason === 'string' ? o.reason.slice(0, 300) : '',
    reply_text: typeof o.reply_text === 'string' && o.reply_text.trim() ? o.reply_text.trim() : null,
    followup_days: typeof o.followup_days === 'number' && Number.isFinite(o.followup_days) ? o.followup_days : null,
  }
}

/** Plain-text → the {text, html} pair Instantly's reply endpoint takes. */
export function toEmailBody(text: string, linkUrl?: string): { text: string; html: string } {
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  if (linkUrl && html.includes(linkUrl)) html = html.replace(linkUrl, `<a href="${linkUrl}">${linkUrl}</a>`)
  return { text, html: `<p>${html.replace(/\n/g, '<br/>')}</p>` }
}

export { SUPPORT_EMAIL }
