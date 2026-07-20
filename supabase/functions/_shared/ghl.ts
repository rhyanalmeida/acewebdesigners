/**
 * GoHighLevel relay — the ONE deliberate, isolated GHL tie.
 *
 * GHL is no longer the CRM, booking system, or conversion sender — that's all
 * ours (Supabase + Meta CAPI). GHL is kept only as the messaging engine (its A2P
 * SMS, email, voicemail drops, workflows). We push every funnel stage into GHL so
 * marketing/comms workflows can be built directly in the GHL UI, triggered by:
 *
 *   • a per-stage TAG on the contact — funnel-lead / funnel-booked /
 *     funnel-showed / funnel-purchased (workflows can't be created via API, so
 *     they're built in the UI and triggered by these tags), and
 *   • a real GHL calendar APPOINTMENT on booking (so GHL-native Appointment-Created
 *     + reminder triggers work).
 *
 * Each stage upserts the contact with the SAME enriched attribution we send to
 * Meta — fbc/fbp/fbclid, client ip/ua, landing_url, the full utm/campaign/adset/ad
 * map, and (at purchase) deal value/plan — mapped into GHL custom fields by id.
 *
 * Transport: GHL v2 REST API with a Private Integration Token.
 *   GHL_API_TOKEN     — the PIT (Bearer)
 *   GHL_LOCATION_ID   — sub-account that owns the workflows + custom fields
 *   GHL_CALENDAR_ID   — calendar to create appointments on
 *   GHL_CUSTOM_FIELD_IDS — JSON map { our_key: ghl_custom_field_id } from
 *                          scripts/ghl-setup-custom-fields.mjs (no-op if unset)
 *
 * Legacy: the original inbound-webhook relay is kept behind GHL_LEGACY_WEBHOOK so
 * confirmations/reminders never lapse while the new GHL-native workflows are built.
 * Set GHL_LEGACY_WEBHOOK=false to retire it.
 *
 * Everything here no-ops when unconfigured and NEVER throws into the funnel.
 */

import { formatInTimeZone } from 'npm:date-fns-tz@3'

const GHL_API = 'https://services.leadconnectorhq.com'
const GHL_VERSION = '2021-07-28'

export type FunnelStage = 'lead' | 'booked' | 'showed' | 'noshow' | 'purchased'

/**
 * Which ad funnel a stage belongs to. SAME GHL account for all — funnels are
 * isolated by their TAG SET (and the workflows you build on those tags), not by
 * separate accounts. 'default' = contractor/main; 'restaurant' = the self-serve
 * restaurant funnel. A restaurant lead gets `restaurant-lead` (NOT `funnel-lead`),
 * so it only enrolls in restaurant workflows — never the contractor nurture.
 */
export type GhlFunnel = 'default' | 'restaurant'

/** Per-funnel, per-stage tag. GHL workflows trigger on "Contact Tag" added. */
const STAGE_TAGS: Record<GhlFunnel, Record<FunnelStage, string>> = {
  default: {
    lead: 'funnel-lead',
    booked: 'funnel-booked',
    showed: 'funnel-showed',
    noshow: 'funnel-noshow',
    purchased: 'funnel-purchased',
  },
  restaurant: {
    lead: 'restaurant-lead',
    booked: 'restaurant-booked',
    showed: 'restaurant-showed',
    noshow: 'restaurant-noshow',
    purchased: 'restaurant-purchased',
  },
}

const token = () => Deno.env.get('GHL_API_TOKEN')
const locationId = () => Deno.env.get('GHL_LOCATION_ID')

/** True when the v2 API path is usable (token + location set). */
export function ghlConfigured(): boolean {
  return Boolean(token() && locationId())
}

function apiHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${token()}`,
    Version: GHL_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

/** The enriched attribution we mirror into GHL custom fields (same data Meta gets). */
export interface GhlAttribution {
  fbc?: string
  fbp?: string
  fbclid?: string
  clientIp?: string
  clientUserAgent?: string
  landingUrl?: string
  utm?: Record<string, string>
  // purchase-only
  dealValue?: number
  recurringValue?: number
  recurringInterval?: string
  planName?: string
}

/** Parse GHL_CUSTOM_FIELD_IDS (JSON map our_key → ghl field id); {} when unset/bad. */
function customFieldIdMap(): Record<string, string> {
  const raw = Deno.env.get('GHL_CUSTOM_FIELD_IDS')
  if (!raw) return {}
  try {
    const o = JSON.parse(raw)
    return o && typeof o === 'object' ? (o as Record<string, string>) : {}
  } catch {
    console.error('[ghl] GHL_CUSTOM_FIELD_IDS is not valid JSON — skipping custom fields')
    return {}
  }
}

/**
 * Map attribution → GHL `customFields: [{ id, value }]`. Driven by the id map:
 * only keys present in GHL_CUSTOM_FIELD_IDS are sent, and blanks are dropped (so a
 * later stage missing a value never wipes a stored one). Pure — unit-testable.
 */
export function buildGhlCustomFields(
  attr: GhlAttribution,
  idMap: Record<string, string>,
): { id: string; value: string }[] {
  const flat: Record<string, string | undefined> = {
    fbc: attr.fbc,
    fbp: attr.fbp,
    fbclid: attr.fbclid,
    client_ip: attr.clientIp,
    client_user_agent: attr.clientUserAgent,
    landing_url: attr.landingUrl,
    ...(attr.utm ?? {}),
    deal_value: attr.dealValue != null ? String(attr.dealValue) : undefined,
    recurring_value: attr.recurringValue != null ? String(attr.recurringValue) : undefined,
    recurring_interval: attr.recurringInterval,
    plan_name: attr.planName,
  }
  const out: { id: string; value: string }[] = []
  for (const [key, id] of Object.entries(idMap)) {
    const v = flat[key]
    if (id && typeof v === 'string' && v.trim() !== '') out.push({ id, value: v })
  }
  return out
}

export interface GhlStageInput {
  stage: FunnelStage
  /** Which funnel's tag set to apply (default = contractor/main; same GHL account). */
  funnel?: GhlFunnel
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  businessName?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  attribution?: GhlAttribution
}

/**
 * Sync a funnel stage to GHL: upsert the contact (PII + enriched custom fields),
 * then ADD the stage tag. Returns the GHL contact id (needed to create an
 * appointment), or null. No-ops (returns null) when unconfigured; never throws.
 *
 * Why two calls: `/contacts/upsert` with a `tags` array REPLACES the contact's
 * whole tag set (verified) — that would wipe earlier stage tags and could move a
 * contact backwards if an earlier stage re-fires. The dedicated `/tags` endpoint
 * ADDS without removing, so funnel-lead/booked/showed/purchased accumulate and
 * each GHL "tag added" trigger fires exactly once, at its moment.
 */
export async function ghlSyncStage(input: GhlStageInput): Promise<string | null> {
  if (!ghlConfigured()) return null
  if (!input.email && !input.phone) {
    console.error('[ghl] ghlSyncStage skipped — need email or phone to upsert')
    return null
  }
  try {
    // 1) upsert contact identity + enriched custom fields (NO tags — see above)
    const body: Record<string, unknown> = { locationId: locationId() }
    if (input.email) body.email = input.email
    if (input.phone) body.phone = input.phone
    if (input.firstName) body.firstName = input.firstName
    if (input.lastName) body.lastName = input.lastName
    if (input.businessName) body.companyName = input.businessName
    if (input.city) body.city = input.city
    if (input.state) body.state = input.state
    if (input.zip) body.postalCode = input.zip
    if (input.country) body.country = input.country
    const cf = buildGhlCustomFields(input.attribution ?? {}, customFieldIdMap())
    if (cf.length) body.customFields = cf

    const resp = await fetch(`${GHL_API}/contacts/upsert`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(body),
    })
    if (!resp.ok) {
      console.error('[ghl] contact upsert failed', resp.status, (await resp.text()).slice(0, 200))
      return null
    }
    const data = (await resp.json().catch(() => null)) as { contact?: { id?: string } } | null
    const id = data?.contact?.id ?? null
    if (!id) {
      console.error('[ghl] contact upsert returned no id')
      return null
    }

    // 2) ADD the stage tag (additive — preserves prior stage tags)
    const tag = STAGE_TAGS[input.funnel ?? 'default'][input.stage]
    const tagResp = await fetch(`${GHL_API}/contacts/${id}/tags`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ tags: [tag] }),
    })
    if (!tagResp.ok) {
      console.error('[ghl] add tag failed', tagResp.status, (await tagResp.text()).slice(0, 200))
    } else {
      console.log(`[ghl] synced stage=${input.stage} tag=${tag} contact=${id}`)
    }
    return id
  } catch (err) {
    console.error('[ghl] ghlSyncStage error', err)
    return null
  }
}

export interface GhlSmsInput {
  email?: string
  phone?: string
  message: string
}

/**
 * Send an SMS to a contact via the GHL conversations API. Upserts the contact
 * by email/phone to resolve its id (idempotent), then posts the message.
 * Requires the PIT to carry the `conversations/message.write` scope — returns
 * { sent:false, error } if the scope is missing or anything fails. Never throws.
 */
export async function sendGhlSms(input: GhlSmsInput): Promise<{ sent: boolean; error?: string }> {
  if (!ghlConfigured()) return { sent: false, error: 'GHL not configured' }
  if (!input.phone && !input.email) return { sent: false, error: 'need phone or email' }
  try {
    const upBody: Record<string, unknown> = { locationId: locationId() }
    if (input.email) upBody.email = input.email
    if (input.phone) upBody.phone = input.phone
    const up = await fetch(`${GHL_API}/contacts/upsert`, {
      method: 'POST', headers: apiHeaders(), body: JSON.stringify(upBody),
    })
    if (!up.ok) return { sent: false, error: `contact lookup failed (${up.status})` }
    const upData = (await up.json().catch(() => null)) as { contact?: { id?: string } } | null
    const contactId = upData?.contact?.id
    if (!contactId) return { sent: false, error: 'no contact id' }

    const msg = await fetch(`${GHL_API}/conversations/messages`, {
      method: 'POST', headers: apiHeaders(),
      body: JSON.stringify({ type: 'SMS', contactId, message: input.message }),
    })
    if (!msg.ok) {
      const t = (await msg.text()).slice(0, 200)
      console.error('[ghl] sms send failed', msg.status, t)
      return { sent: false, error: `send failed (${msg.status})` }
    }
    console.log(`[ghl] payment-link SMS sent contact=${contactId}`)
    return { sent: true }
  } catch (err) {
    console.error('[ghl] sendGhlSms error', err)
    return { sent: false, error: String(err).slice(0, 120) }
  }
}

export interface GhlAppointmentInput {
  contactId: string
  calendarId?: string
  startISO: string
  endISO: string
  title?: string
}

/**
 * Create a real appointment on the GHL calendar so GHL's native Appointment-Created
 * + reminder workflows fire and it shows on the GHL calendar. Best-effort.
 */
export async function createGhlAppointment(input: GhlAppointmentInput): Promise<string | null> {
  if (!ghlConfigured()) return null
  const calId = input.calendarId || Deno.env.get('GHL_CALENDAR_ID')
  if (!calId || !input.contactId) return null
  // GHL requires an assigned team member on the appointment (422 without it).
  const assignedUserId = Deno.env.get('GHL_ASSIGNED_USER_ID')
  if (!assignedUserId) {
    console.error('[ghl] GHL_ASSIGNED_USER_ID unset — skipping GHL appointment create')
    return null
  }
  try {
    const resp = await fetch(`${GHL_API}/calendars/events/appointments`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        calendarId: calId,
        locationId: locationId(),
        contactId: input.contactId,
        assignedUserId,
        startTime: input.startISO,
        endTime: input.endISO,
        title: input.title ?? 'Free Design Meeting',
        appointmentStatus: 'confirmed',
        ignoreFreeSlotValidation: true,
      }),
    })
    if (!resp.ok) {
      console.error('[ghl] appointment create failed', resp.status, (await resp.text()).slice(0, 200))
      return null
    }
    const data = (await resp.json().catch(() => null)) as { id?: string } | null
    const id = data?.id ?? null
    console.log(`[ghl] appointment created id=${id ?? '?'} contact=${input.contactId}`)
    return id
  } catch (err) {
    console.error('[ghl] createGhlAppointment error', err)
    return null
  }
}

export interface GhlBookingInput {
  appointmentId: string
  contactId: string
  eventId: string
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  startISO: string
  endISO: string
  tz: string
  title?: string
}

/**
 * LEGACY: the original inbound-webhook relay. Kept behind GHL_LEGACY_WEBHOOK so the
 * existing confirmation/reminder workflow keeps firing during cutover to the
 * GHL-native (tag + appointment) path. Set GHL_LEGACY_WEBHOOK=false to retire it.
 * No-ops when the webhook URL is unset or the flag is off; never throws.
 */
export async function pushLegacyBooking(input: GhlBookingInput): Promise<void> {
  if (Deno.env.get('GHL_LEGACY_WEBHOOK') === 'false') return
  const url = Deno.env.get('GHL_INBOUND_WEBHOOK_URL')
  if (!url) return
  try {
    const startLocal = formatInTimeZone(new Date(input.startISO), input.tz, "EEEE, MMMM d 'at' h:mm a zzz")
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // our identifiers — GHL stores/echoes these for cross-platform tracking
        appointment_id: input.appointmentId,
        our_contact_id: input.contactId,
        event_id: input.eventId,
        // contact (GHL inbound-webhook trigger can create/update the contact)
        first_name: input.firstName ?? '',
        last_name: input.lastName ?? '',
        full_name: `${input.firstName ?? ''} ${input.lastName ?? ''}`.trim(),
        email: input.email ?? '',
        phone: input.phone ?? '',
        city: input.city ?? '',
        state: input.state ?? '',
        postal_code: input.zip ?? '',
        country: input.country || 'US',
        // appointment
        appointment_start: input.startISO,
        appointment_end: input.endISO,
        appointment_local: startLocal,
        timezone: input.tz,
        title: input.title ?? 'Free Design Meeting',
      }),
    })
    if (!resp.ok) console.error('[ghl] legacy webhook failed', resp.status, (await resp.text()).slice(0, 200))
    else console.log(`[ghl] legacy booking webhook sent appt=${input.appointmentId}`)
  } catch (err) {
    console.error('[ghl] pushLegacyBooking error', err)
  }
}
