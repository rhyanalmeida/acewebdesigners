/**
 * Contact upsert — single source of truth for both `lead` and `book`.
 *
 * One row per lead (unique by email). This is the DURABLE attribution record:
 * it carries the Meta click ids (fbc/fbp/fbclid) AND ip/ua/landing_url/utm, so a
 * lead who fills the gate form but never books still has full attribution, and
 * later events (Schedule / CompleteRegistration / Purchase) can replay it.
 *
 * Upsert merges: we never null out a previously-captured field with a blank on a
 * re-submit (e.g. the booking step omitting something the lead step had).
 */

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export interface ContactInput {
  email: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  fbc?: string
  fbp?: string
  fbclid?: string
  clientIp?: string
  clientUserAgent?: string
  landingUrl?: string
  utm?: Record<string, string>
}

/** Drop undefined/empty values so an upsert never overwrites stored data with blanks. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue
    out[k] = v
  }
  return out as Partial<T>
}

/** Upsert a contact by email with full attribution; returns the contact id. */
export async function upsertContact(
  supa: SupabaseClient,
  input: ContactInput,
): Promise<string | null> {
  const row = compact({
    email: input.email,
    phone: input.phone,
    first_name: input.firstName,
    last_name: input.lastName,
    city: input.city,
    state: input.state,
    zip: input.zip,
    country: input.country ?? 'US',
    fbc: input.fbc,
    fbp: input.fbp,
    fbclid: input.fbclid,
    client_ip: input.clientIp,
    client_user_agent: input.clientUserAgent,
    landing_url: input.landingUrl,
    utm: input.utm && Object.keys(input.utm).length ? input.utm : undefined,
  })

  const { data, error } = await supa
    .from('contacts')
    .upsert(row, { onConflict: 'email' })
    .select('id')
    .single()
  if (error || !data) {
    console.error('[contacts] upsert failed', error?.message)
    return null
  }
  return data.id as string
}
