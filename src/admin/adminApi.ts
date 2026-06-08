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
  isSocial?: boolean
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
}
export interface AdminData {
  health: AdminHealth
  warnings: Warning[]
  overall: Overall
  website: WebsiteSeg
  social: SocialSeg
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
