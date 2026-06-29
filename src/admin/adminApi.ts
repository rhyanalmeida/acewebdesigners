/**
 * Typed client for the admin Edge Functions (admin-data + result).
 * supabase-js attaches the signed-in admin's JWT automatically; the functions
 * enforce the ADMIN_EMAILS allow-list server-side.
 */

import { supabase } from '../lib/supabase'

export interface AdminHealth {
  meta: boolean
  ghl: boolean
  google: boolean
  stripe: boolean
}
export interface Warning {
  level: 'error' | 'warn' | 'info'
  message: string
  fix: string
}
export interface Segment {
  bookings: number
  showed: number
  purchased: number
  revenue: number
  mrr: number
  showRate: number
  closeRate: number
}
export interface Overall extends Segment {
  leads: number
  capiSent: number
  capiError: number
}
export interface WebsiteSeg extends Segment {
  leads: number
}
export interface CampaignRow {
  campaign: string
  leads: number
  purchased: number
  revenue: number
}
export interface SocialSeg extends Segment {
  leads: number
  byCampaign: CampaignRow[]
}
export interface ApptContact {
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  city?: string
  state?: string
  zip?: string
}
export interface Appt {
  id: string
  start_ts: string
  status: string
  calendar: string
  value?: number | null
  upfront_value?: number | null
  recurring_value?: number | null
  recurring_interval?: string | null
  plan_name?: string | null
  purchased_at?: string | null
  resulted_at?: string | null
  resulted_by?: string | null
  notes?: string | null
  is_test?: boolean
  isSocial?: boolean
  contacts?: ApptContact | null
}
export interface CapiEvent {
  event_id: string
  event_name: string
  action_source?: string | null
  status: string
  value?: number | null
  events_received?: number | null
  error_message?: string | null
  is_test?: boolean
  appointment_id?: string | null
  sent_at: string
}
/** Per-event-type CAPI rollup (Lead / Showed→CompleteRegistration / Purchase). */
export interface ServerEventStat {
  sent: number
  error: number
  pending: number
  lastAt: string | null
}
export interface ServerEvents {
  lead: ServerEventStat
  schedule: ServerEventStat
  completeRegistration: ServerEventStat
  purchase: ServerEventStat
}
/** Outcome of one sendCapiEvent call, as returned by `result` / `capi`. */
export interface CapiOutcome {
  ok: boolean
  status: number
  deduped?: boolean
  error?: string
}
export interface GhlMessage {
  id: string
  channel?: string | null
  message_type?: string | null
  status?: string | null
  received_at: string
}
export interface AdminData {
  health: AdminHealth
  warnings: Warning[]
  overall: Overall
  website: WebsiteSeg
  social: SocialSeg
  serverEvents?: ServerEvents // optional: old function payloads omit it
  appointments: Appt[]
  capiEvents: CapiEvent[]
  ghlMessages: GhlMessage[]
}

async function errorMessage(error: unknown, fallback: string): Promise<{ status: number; message: string }> {
  const ctx = (error as { context?: Response })?.context
  let status = 0
  let message = fallback
  if (ctx) {
    status = ctx.status
    try {
      const j = (await ctx.json()) as { error?: string }
      if (j?.error) message = j.error
    } catch {
      /* ignore */
    }
  }
  return { status, message }
}

export async function fetchAdminData(): Promise<AdminData> {
  const { data, error } = await supabase.functions.invoke('admin-data')
  if (error) {
    const { status, message } = await errorMessage(error, 'Failed to load dashboard')
    throw new Error(status === 401 ? 'not-admin' : message)
  }
  return data as AdminData
}

export type ResultKind = 'showed' | 'no_show' | 'purchase'
export interface ResultPayload {
  appointmentId: string
  result: ResultKind
  upfront?: number
  recurring?: number
  recurringInterval?: 'monthly' | 'annual' | 'one_time'
  plan?: string
  notes?: string
}

export interface ResultResponse {
  ok: boolean
  result: ResultKind
  capi: 'none' | { completeRegistration?: CapiOutcome; purchase?: CapiOutcome }
}

export async function submitResult(payload: ResultPayload): Promise<ResultResponse> {
  const { data, error } = await supabase.functions.invoke('result', { body: payload })
  if (error) {
    const { message } = await errorMessage(error, 'Could not save result')
    throw new Error(message)
  }
  return data as ResultResponse
}

/**
 * Create a Stripe Checkout link for a booked appointment's deposit/payment.
 * Returns a hosted Stripe URL to send the client; on payment the
 * `stripe-webhook` fires the deduped Purchase CAPI automatically.
 */
export async function createPaymentLink(payload: {
  appointmentId: string
  amount: number
  description?: string
  /** When true, the link is auto-texted to the client via GHL. */
  send?: boolean
}): Promise<{ url: string; sent: boolean; sendError?: string }> {
  const { data, error } = await supabase.functions.invoke('create-checkout', { body: payload })
  if (error) {
    const { message } = await errorMessage(error, 'Could not create payment link')
    throw new Error(message)
  }
  if (!data?.url) throw new Error('No checkout URL returned')
  return data as { url: string; sent: boolean; sendError?: string }
}

/** Re-fire a failed/pending CAPI event from its stored attribution. */
export async function retryCapiEvent(eventId: string): Promise<CapiOutcome> {
  const { data, error } = await supabase.functions.invoke('capi', { body: { retryEventId: eventId } })
  if (error) {
    const { message } = await errorMessage(error, 'Retry failed')
    throw new Error(message)
  }
  return data as CapiOutcome
}
