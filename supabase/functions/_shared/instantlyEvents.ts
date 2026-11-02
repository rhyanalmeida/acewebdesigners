/**
 * Deno port of scripts/lib/instantly-events.mjs for the `instantly-poll` Edge Function.
 * ⚠️ KEEP IN SYNC with the .mjs (which the local fallback script + vitest use) — same
 * logic, same shapes; only the types are added. Pure helpers, no I/O.
 */

export const UE_TYPE_RECEIVED = 2
export const LEAD_STATUS = { BOUNCED: -1, UNSUBSCRIBED: -2 } as const

export interface PollEvent {
  event_type: 'reply' | 'bounce' | 'unsubscribe'
  lead_email: string
  campaign_id: string | null
  key: string
  ts: string | null
  reply_text?: string
  email_id?: string | null
  eaccount?: string | null
  subject?: string
}

type Item = Record<string, unknown>

/** Map one item from GET /api/v2/emails?email_type=received to a webhook event (null = not a campaign reply). */
export function mapReceivedEmail(item: Item | null | undefined): PollEvent | null {
  if (!item || typeof item !== 'object') return null
  if (item.ue_type != null && Number(item.ue_type) !== UE_TYPE_RECEIVED) return null
  if (Number(item.is_auto_reply) === 1) return null
  const lead = String(item.lead ?? item.from_address_email ?? '').trim().toLowerCase()
  if (!lead) return null
  if (!item.campaign_id) return null
  const body = (item.body && typeof item.body === 'object' ? item.body : {}) as { text?: unknown; html?: unknown }
  const text = typeof body.text === 'string' && body.text.trim() ? body.text : htmlToText(body.html)
  return {
    event_type: 'reply',
    lead_email: lead,
    campaign_id: String(item.campaign_id),
    key: `reply:${item.id ?? `${lead}:${item.timestamp_created ?? ''}`}`,
    ts: (item.timestamp_created ?? item.timestamp_email ?? null) as string | null,
    reply_text: text.slice(0, 4000),
    email_id: item.id ? String(item.id) : null,
    eaccount: item.eaccount ? String(item.eaccount) : null,
    subject: typeof item.subject === 'string' ? item.subject : '',
  }
}

export function htmlToText(html: unknown): string {
  if (typeof html !== 'string') return ''
  return html
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '')
    .replace(/<(br|\/p|\/div|\/tr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** The in-thread reply that carries the demo link — the only email that ever links. */
export function demoLinkReply({
  first_name,
  business_name,
  demo_url,
}: {
  first_name?: string | null
  business_name?: string | null
  demo_url: string
}): { text: string; html: string } {
  const name = (first_name ?? '').trim() || (business_name ?? '').trim() || 'there'
  const text = `Hi ${name},

Here it is: ${demo_url}

It's a draft — tell me what to change and I'll turn it around.

If you like it as-is, there's a button on that page that takes it live on your own .com for $49/month. The domain, hosting and every update you ever want are included, and you can cancel anytime. It's usually live within an hour of signing up, and we handle all of it.

Happy to go over it on a quick 15-minute call too — just say when works.

Rhyan
Ace Web Designers`
  return {
    text,
    html: `<p>${text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(demo_url, `<a href="${demo_url}">${demo_url}</a>`)
      .replace(/\n/g, '<br/>')}</p>`,
  }
}

export function mapLead(item: Item | null | undefined, filter: string): PollEvent | null {
  if (!item || typeof item !== 'object') return null
  const email = String(item.email ?? '').trim().toLowerCase()
  if (!email) return null
  const status = Number(item.status)
  let event_type: PollEvent['event_type']
  if (filter === 'FILTER_VAL_BOUNCED' && status === LEAD_STATUS.BOUNCED) event_type = 'bounce'
  else if (filter === 'FILTER_VAL_UNSUBSCRIBED' && status === LEAD_STATUS.UNSUBSCRIBED) event_type = 'unsubscribe'
  else return null
  return {
    event_type,
    lead_email: email,
    campaign_id: item.campaign ? String(item.campaign) : null,
    key: `${event_type}:${email}`,
    ts: (item.timestamp_updated ?? null) as string | null,
  }
}

export function selectNew(events: (PollEvent | null)[], seen: Set<string>): PollEvent[] {
  const out: PollEvent[] = []
  for (const ev of events) {
    if (!ev || seen.has(ev.key)) continue
    seen.add(ev.key)
    out.push(ev)
  }
  return out
}

export function advanceWatermark(prev: string | null, events: PollEvent[]): string | null {
  let best = prev ? Date.parse(prev) : 0
  for (const ev of events) {
    const t = ev?.ts ? Date.parse(ev.ts) : NaN
    if (Number.isFinite(t) && t > best) best = t
  }
  return best ? new Date(best).toISOString() : (prev ?? null)
}

export function trimSeen(keys: Iterable<string>, max = 5000): string[] {
  const arr = Array.from(keys)
  return arr.length > max ? arr.slice(arr.length - max) : arr
}

export function toWebhookBody(ev: PollEvent): Record<string, unknown> {
  return {
    event_type: ev.event_type,
    lead_email: ev.lead_email,
    campaign_id: ev.campaign_id ?? undefined,
    source: 'instantly-poll',
    ...(ev.event_type === 'reply'
      ? { reply_text: ev.reply_text ?? '', email_id: ev.email_id ?? undefined, eaccount: ev.eaccount ?? undefined, subject: ev.subject ?? '' }
      : {}),
  }
}
