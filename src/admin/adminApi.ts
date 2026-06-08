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
export interface AdminStats {
  leads: number
  upcoming: number
  showed: number
  purchased: number
  mrr: number
  capiSent: number
  capiError: number
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
  end_ts: string
  tz: string
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
  gcal_event_id?: string | null
  ghl_appointment_id?: string | null
  notes?: string | null
  contacts?: ApptContact | null
}
export interface CapiEvent {
  event_id: string
  event_name: string
  status: string
  value?: number | null
  sent_at: string
}
export interface GhlMessage {
  id: string
  channel?: string | null
  message_type?: string | null
  status?: string | null
  received_at: string
  ghl_contact_id?: string | null
}
export interface AdminData {
  health: AdminHealth
  stats: AdminStats
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

export async function submitResult(payload: ResultPayload): Promise<void> {
  const { error } = await supabase.functions.invoke('result', { body: payload })
  if (error) {
    const { message } = await errorMessage(error, 'Could not save result')
    throw new Error(message)
  }
}
