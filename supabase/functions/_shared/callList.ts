/**
 * Follow-up / call list for the outbound funnel (/admin → Outbound → "Follow up or call").
 *
 * Email did its job or it didn't; either way these are the prospects a PERSON should pick up the
 * phone (or write one personal line) for. Pure — vitest-covered in callList.test.ts — so the
 * dashboard and any future staff alert rank the same way.
 *
 *   replied   — wrote back and wasn't a no/remove/hostile; the desk may have answered, a human closes
 *   viewed    — opened the demo page (clicked the link) but never replied: the warmest silent lead
 *   finished  — the 3-step sequence has run its course (≥ SEQUENCE_DAYS since first email) with no
 *               reply and no view: last chance is a call, not a 4th email (owner rule: never a 4th touch)
 *
 * Prospects with no phone, suppressed, test, purchased, or called in the last RECALL_DAYS are left out.
 */

export const SEQUENCE_DAYS = 10 // day 0/3/7 steps + a weekend of slack
export const RECALL_DAYS = 14

export interface CallListProspect {
  id: string
  business_name: string
  phone?: string | null
  email?: string | null
  city?: string | null
  state?: string | null
  business_type?: string | null
  token?: string | null
  preview_url?: string | null
  emailed_at?: string | null
  replied_at?: string | null
  reply_sentiment?: string | null
  last_reply?: string | null
  handoff_at?: string | null
  demo_first_viewed_at?: string | null
  demo_view_count?: number | null
  purchased_at?: string | null
  suppressed?: boolean | null
  is_test?: boolean | null
  called_at?: string | null
  call_note?: string | null
}

export type CallReason = 'replied' | 'viewed' | 'finished'

export interface CallListEntry {
  prospect: CallListProspect
  reason: CallReason
  /** One line a caller can read before dialling. */
  why: string
  /** Lower sorts first. */
  rank: number
}

const NEGATIVE = new Set(['no', 'remove', 'hostile', 'ooo_auto'])

export function buildCallList(rows: CallListProspect[], now: Date = new Date(), limit = 150): CallListEntry[] {
  const t = now.getTime()
  const day = 24 * 60 * 60 * 1000
  const out: CallListEntry[] = []
  for (const p of rows) {
    if (!p.phone || p.suppressed || p.is_test || p.purchased_at || !p.emailed_at) continue
    if (p.called_at && t - new Date(p.called_at).getTime() < RECALL_DAYS * day) continue
    if (p.replied_at && !NEGATIVE.has(p.reply_sentiment ?? '')) {
      const intent = p.reply_sentiment ?? 'replied'
      out.push({
        prospect: p,
        reason: 'replied',
        rank: p.handoff_at ? 0 : 1,
        why: `${p.handoff_at ? 'Needs a person — ' : ''}replied "${intent}"${p.last_reply ? `: “${p.last_reply.slice(0, 90)}”` : ''}`,
      })
      continue
    }
    if (p.demo_first_viewed_at && !p.replied_at) {
      out.push({ prospect: p, reason: 'viewed', rank: 2, why: `Opened the demo ${p.demo_view_count && p.demo_view_count > 1 ? `${p.demo_view_count}× ` : ''}but never wrote back` })
      continue
    }
    if (!p.replied_at && !p.demo_first_viewed_at && t - new Date(p.emailed_at).getTime() >= SEQUENCE_DAYS * day) {
      out.push({ prospect: p, reason: 'finished', rank: 3, why: 'All three emails went out, no reply, no view — a call is the last touch' })
    }
  }
  out.sort((a, b) => a.rank - b.rank || recency(b) - recency(a))
  return out.slice(0, limit)
}

/** Most recent meaningful moment, for ordering inside a rank. */
function recency(e: CallListEntry): number {
  const p = e.prospect
  return new Date(p.replied_at ?? p.demo_first_viewed_at ?? p.emailed_at ?? 0).getTime()
}
