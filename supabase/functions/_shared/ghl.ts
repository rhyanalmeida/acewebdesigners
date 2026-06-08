/**
 * GoHighLevel relay — the ONE deliberate, isolated GHL tie.
 *
 * GHL is no longer the CRM, booking system, or conversion sender. It's kept only
 * as the messaging engine (its A2P SMS, email, voicemail drops, workflows). On a
 * booking, we POST to a GHL workflow's **Inbound Webhook** trigger so that
 * workflow fires confirmations/reminders/follow-ups using all your GHL tools.
 *
 * We pass our own `appointment_id` in the payload; the GHL workflow echoes it
 * back to our `ghl-webhook` on each send, so every message is tracked against
 * the exact customer on the admin page (cross-platform linkage).
 *
 * No-ops when GHL_INBOUND_WEBHOOK_URL is unset; never throws into booking.
 */

import { formatInTimeZone } from 'npm:date-fns-tz@3'

export function ghlConfigured(): boolean {
  return Boolean(Deno.env.get('GHL_INBOUND_WEBHOOK_URL'))
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

/** Fire the GHL workflow (Inbound Webhook trigger) so it sends messages. */
export async function pushBooking(input: GhlBookingInput): Promise<void> {
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
    if (!resp.ok) console.error('[ghl] inbound webhook failed', resp.status, (await resp.text()).slice(0, 200))
    else console.log(`[ghl] booking sent to GHL workflow appt=${input.appointmentId}`)
  } catch (err) {
    console.error('[ghl] pushBooking error', err)
  }
}
