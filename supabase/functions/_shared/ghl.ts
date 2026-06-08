/**
 * GoHighLevel relay — the ONE deliberate, isolated GHL tie.
 *
 * GHL is no longer the CRM, booking system, or conversion sender. It is kept
 * only as a messaging engine: we upsert the contact and create an appointment
 * via the GHL API so the EXISTING "Appointment Created" workflow fires its
 * confirmation email + appointment-relative reminders + internal notification.
 *
 * IMPORTANT: the CAPI action must be removed from that GHL workflow — CAPI is
 * ours now (see _shared/meta.ts); leaving GHL's would double-fire.
 *
 * Everything here is best-effort and behind this one module: it no-ops when
 * GHL_API_TOKEN is unset and never throws into the booking flow, so it can be
 * swapped for Resend/Twilio later without touching the core.
 */

import { formatInTimeZone } from 'npm:date-fns-tz@3'

const GHL_BASE = 'https://services.leadconnectorhq.com'
const GHL_VERSION = '2021-04-15'

export function ghlConfigured(): boolean {
  return Boolean(Deno.env.get('GHL_API_TOKEN') && Deno.env.get('GHL_LOCATION_ID'))
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${Deno.env.get('GHL_API_TOKEN')}`,
    Version: GHL_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export interface GhlBookingInput {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  startISO: string // UTC
  endISO: string
  tz: string
  title?: string
}

export interface GhlResult {
  contactId?: string
  appointmentId?: string
}

/** Upsert contact + create appointment in GHL to trigger its messaging workflow. */
export async function pushBooking(input: GhlBookingInput): Promise<GhlResult> {
  if (!ghlConfigured()) return {}
  const locationId = Deno.env.get('GHL_LOCATION_ID')!
  const calendarId = Deno.env.get('GHL_CALENDAR_ID')

  const result: GhlResult = {}
  try {
    // 1) Upsert contact (matches on email/phone within the location).
    const upsertResp = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        locationId,
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        lastName: input.lastName,
        city: input.city,
        state: input.state,
        postalCode: input.zip,
        country: input.country || 'US',
      }),
    })
    if (!upsertResp.ok) {
      console.error('[ghl] contact upsert failed', upsertResp.status, (await upsertResp.text()).slice(0, 200))
      return result
    }
    const upserted = (await upsertResp.json()) as { contact?: { id?: string }; id?: string }
    result.contactId = upserted.contact?.id ?? upserted.id
    if (!result.contactId || !calendarId) return result

    // 2) Create appointment → fires "Appointment Created" workflow.
    // GHL wants local times with offset, not a Z-suffixed UTC instant.
    const fmt = "yyyy-MM-dd'T'HH:mm:ssXXX"
    const apptResp = await fetch(`${GHL_BASE}/calendars/events/appointments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        calendarId,
        locationId,
        contactId: result.contactId,
        startTime: formatInTimeZone(new Date(input.startISO), input.tz, fmt),
        endTime: formatInTimeZone(new Date(input.endISO), input.tz, fmt),
        title: input.title ?? 'Free Design Meeting',
        appointmentStatus: 'confirmed',
        ignoreDateRange: true,
        toNotify: true,
      }),
    })
    if (!apptResp.ok) {
      console.error('[ghl] appointment create failed', apptResp.status, (await apptResp.text()).slice(0, 200))
      return result
    }
    const appt = (await apptResp.json()) as { id?: string; appointment?: { id?: string } }
    result.appointmentId = appt.id ?? appt.appointment?.id
    console.log(`[ghl] pushed contact=${result.contactId} appt=${result.appointmentId}`)
    return result
  } catch (err) {
    console.error('[ghl] pushBooking error', err)
    return result
  }
}
