/**
 * Load an appointment's full Meta identity (contact PII + stored attribution
 * snapshot) so post-booking events (CompleteRegistration / Purchase) match as
 * well as the original Lead. Shared by `result` and `stripe-webhook`.
 */

import { admin } from './supabaseAdmin.ts'
import type { CapiInput } from './meta.ts'

interface ContactRow {
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  fbc?: string
  fbp?: string
  fbclid?: string
}

// The untyped client infers a loose/GenericStringError row for embed selects, so
// we cast the result to this known shape.
interface ApptIdentityRow {
  id: string
  contact_id: string
  calendar: 'main' | 'contractor'
  event_source_url: string | null
  client_ip: string | null
  client_user_agent: string | null
  utm: Record<string, string> | null
  is_test: boolean | null
  contacts: ContactRow | ContactRow[] | null
}

/** The reusable identity fields for sendCapiEvent (everything except the event). */
export type IdentityBase = Pick<
  CapiInput,
  | 'dataset'
  | 'eventSourceUrl'
  | 'email'
  | 'phone'
  | 'firstName'
  | 'lastName'
  | 'city'
  | 'state'
  | 'zip'
  | 'country'
  | 'externalId'
  | 'fbc'
  | 'fbp'
  | 'fbclid'
  | 'clientIpAddress'
  | 'clientUserAgent'
  | 'contactId'
  | 'appointmentId'
>

export interface LoadedIdentity {
  calendar: 'main' | 'contractor'
  utm: Record<string, string>
  /** Booked via test mode — downstream events must carry a test code too. */
  isTest: boolean
  base: IdentityBase
}

/**
 * Load identity straight from a contact (no appointment) — used by the self-serve
 * restaurant subscription funnel, where the visitor never books a slot. Always the
 * `main` dataset. We can't know test-mode from a contact, so the caller passes it.
 */
export async function loadContactIdentity(contactId: string): Promise<LoadedIdentity | null> {
  const { data, error } = await admin()
    .from('contacts')
    .select(
      'id, email, phone, first_name, last_name, city, state, zip, country, ' +
        'fbc, fbp, fbclid, client_ip, client_user_agent, landing_url, utm',
    )
    .eq('id', contactId)
    .single()
  if (error || !data) return null
  const c = data as unknown as ContactRow & {
    id: string
    client_ip?: string
    client_user_agent?: string
    landing_url?: string
    utm?: Record<string, string> | null
  }
  return {
    calendar: 'main',
    utm: (c.utm ?? {}) as Record<string, string>,
    isTest: false,
    base: {
      dataset: 'main',
      eventSourceUrl: c.landing_url || undefined,
      email: c.email,
      phone: c.phone,
      firstName: c.first_name,
      lastName: c.last_name,
      city: c.city,
      state: c.state,
      zip: c.zip,
      country: c.country,
      externalId: c.id,
      fbc: c.fbc,
      fbp: c.fbp,
      fbclid: c.fbclid,
      clientIpAddress: c.client_ip || undefined,
      clientUserAgent: c.client_user_agent || undefined,
      contactId: c.id,
    },
  }
}

export async function loadAppointmentIdentity(appointmentId: string): Promise<LoadedIdentity | null> {
  const { data, error } = await admin()
    .from('appointments')
    .select(
      'id, contact_id, calendar, event_source_url, client_ip, client_user_agent, utm, is_test, ' +
        'contacts:contact_id ( email, phone, first_name, last_name, city, state, zip, country, fbc, fbp, fbclid )',
    )
    .eq('id', appointmentId)
    .single()
  if (error || !data) return null
  const appt = data as unknown as ApptIdentityRow

  // PostgREST returns an embedded to-one as an object, but normalize defensively.
  const rawC = appt.contacts
  const c: ContactRow = (Array.isArray(rawC) ? rawC[0] : rawC) ?? {}
  return {
    calendar: appt.calendar as 'main' | 'contractor',
    utm: (appt.utm ?? {}) as Record<string, string>,
    isTest: appt.is_test === true,
    base: {
      dataset: appt.calendar as 'main' | 'contractor',
      eventSourceUrl: (appt.event_source_url as string) || undefined,
      email: c.email,
      phone: c.phone,
      firstName: c.first_name,
      lastName: c.last_name,
      city: c.city,
      state: c.state,
      zip: c.zip,
      country: c.country,
      externalId: appt.contact_id as string,
      fbc: c.fbc,
      fbp: c.fbp,
      fbclid: c.fbclid,
      clientIpAddress: (appt.client_ip as string) || undefined,
      clientUserAgent: (appt.client_user_agent as string) || undefined,
      contactId: appt.contact_id as string,
      appointmentId: appt.id as string,
    },
  }
}
