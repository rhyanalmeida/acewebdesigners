// Pure helpers for scripts/instantly-poll.mjs — no I/O so they can be unit-tested.
//
// Instantly's webhooks are gated to the Hyper Growth plan; we are on Growth, so a
// scheduled script polls the v2 API and replays reply / bounce / unsubscribe events
// into the existing `instantly-webhook` Edge Function in the exact shape a real
// webhook would have sent ({ event_type, lead_email, campaign_id }). The function
// is idempotent, but we still track what we've forwarded so a reply doesn't re-fire
// the GHL staff alert on every 15-minute tick.

/** ue_type from GET /api/v2/emails — 2 = received (a reply to us). */
export const UE_TYPE_RECEIVED = 2

/**
 * Map one item from GET /api/v2/emails?email_type=received to a webhook event.
 * Returns null for anything that isn't a genuine campaign reply: auto-replies
 * (OOO / bounce notices arrive as auto replies), emails with no lead, and emails
 * outside any campaign (warm-up traffic, manual sends).
 */
export function mapReceivedEmail(item) {
  if (!item || typeof item !== 'object') return null
  if (item.ue_type != null && Number(item.ue_type) !== UE_TYPE_RECEIVED) return null
  if (Number(item.is_auto_reply) === 1) return null
  const lead = String(item.lead ?? item.from_address_email ?? '').trim().toLowerCase()
  if (!lead) return null
  if (!item.campaign_id) return null
  return {
    event_type: 'reply',
    lead_email: lead,
    campaign_id: String(item.campaign_id),
    key: `reply:${item.id ?? `${lead}:${item.timestamp_created ?? ''}`}`,
    ts: item.timestamp_created ?? item.timestamp_email ?? null,
  }
}

/** Lead `status` enum from POST /api/v2/leads/list. */
export const LEAD_STATUS = { BOUNCED: -1, UNSUBSCRIBED: -2 }

/**
 * Map one lead from POST /api/v2/leads/list to a suppression event. `filter` is
 * the Instantly filter constant the page was fetched with; the lead's own status
 * is cross-checked so a mis-filtered page can never suppress an active lead.
 */
export function mapLead(item, filter) {
  if (!item || typeof item !== 'object') return null
  const email = String(item.email ?? '').trim().toLowerCase()
  if (!email) return null
  const status = Number(item.status)
  let event_type
  if (filter === 'FILTER_VAL_BOUNCED' && status === LEAD_STATUS.BOUNCED) event_type = 'bounce'
  else if (filter === 'FILTER_VAL_UNSUBSCRIBED' && status === LEAD_STATUS.UNSUBSCRIBED) event_type = 'unsubscribe'
  else return null
  return {
    event_type,
    lead_email: email,
    campaign_id: item.campaign ? String(item.campaign) : null,
    key: `${event_type}:${email}`,
    ts: item.timestamp_updated ?? null,
  }
}

/** Drop events already forwarded; returns the new ones (order preserved). */
export function selectNew(events, seenKeys) {
  const seen = seenKeys instanceof Set ? seenKeys : new Set(seenKeys ?? [])
  const out = []
  for (const ev of events) {
    if (!ev || seen.has(ev.key)) continue
    seen.add(ev.key)
    out.push(ev)
  }
  return out
}

/**
 * Next `min_timestamp_created` for the reply poll: the newest timestamp seen,
 * never moving backwards. We re-request from the watermark inclusively and rely
 * on `seenKeys` to drop the boundary duplicate, so a same-second reply can't slip.
 */
export function advanceWatermark(prev, events) {
  let best = prev ? Date.parse(prev) : 0
  for (const ev of events) {
    const t = ev?.ts ? Date.parse(ev.ts) : NaN
    if (Number.isFinite(t) && t > best) best = t
  }
  return best ? new Date(best).toISOString() : prev ?? null
}

/** Keep the seen-set bounded; newest keys are at the end. */
export function trimSeen(keys, max = 5000) {
  const arr = Array.from(keys)
  return arr.length > max ? arr.slice(arr.length - max) : arr
}

/** Build the exact body `instantly-webhook` expects. */
export function toWebhookBody(ev) {
  return {
    event_type: ev.event_type,
    lead_email: ev.lead_email,
    campaign_id: ev.campaign_id ?? undefined,
    source: 'instantly-poll',
  }
}
