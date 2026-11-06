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
  netlify?: boolean // optional: old function payloads omit it
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
  business_name?: string
  business_type?: string
  years_in_business?: string
  has_website?: string
  city?: string
  state?: string
  zip?: string
}

export type SiteStatus = 'queued' | 'generating' | 'deployed' | 'failed' | 'deleted'
export type BriefStatus = 'queued' | 'generating' | 'ready' | 'failed'
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
  preview_url?: string | null
  netlify_site_id?: string | null
  site_status?: SiteStatus | null
  site_error?: string | null
  site_generated_at?: string | null
  sales_brief?: string | null
  brief_status?: BriefStatus | null
  brief_error?: string | null
  brief_generated_at?: string | null
  updated_at?: string | null
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
export interface AdminContact {
  id: string
  first_name?: string | null
  last_name?: string | null
  business_name?: string | null
  business_type?: string | null
  years_in_business?: string | null
  has_website?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
  created_at: string
  fbclid?: string | null
  landing_url?: string | null
  utm?: Record<string, string> | null
}
/** Outbound cold-email funnel prospect (see migration 0010). */
export interface Prospect {
  id: string
  business_name: string
  business_type?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
  batch?: string | null
  is_test?: boolean
  suppressed?: boolean
  suppressed_reason?: string | null
  site_status: 'none' | 'generating' | 'deployed' | 'failed'
  site_error?: string | null
  preview_url?: string | null
  demo_first_viewed_at?: string | null
  demo_view_count?: number
  plan?: string | null
  chosen_domain?: string | null
  domain_mode?: 'register' | 'own'
  domain_status:
    | 'none'
    | 'registering'
    | 'dns_set'
    | 'attached'
    | 'awaiting_dns'
    | 'ssl_pending'
    | 'live'
    | 'failed'
    | 'cancelled'
  domain_error?: string | null
  purchased_at?: string | null
  cancelled_at?: string | null
  emailed_at?: string | null
  replied_at?: string | null
  last_reply?: string | null
  reply_sentiment?: ReplyIntent | null
  auto_send?: boolean | null
  demo_link_sent_at?: string | null
  ai_turns?: number
  handoff_at?: string | null
  followup_at?: string | null
  nudge_count?: number
  created_at: string
}

export type ReplyIntent = 'yes' | 'question' | 'objection_price' | 'objection_timing' | 'later' | 'no' | 'remove' | 'hostile' | 'ooo_auto' | 'unknown'

/** One inbound reply or one outbound answer handled by the reply desk (migration 0015). */
export interface OutboundReply {
  id: string
  prospect_id: string
  direction: 'in' | 'out'
  kind: 'reply' | 'demo_link' | 'followup' | 'nudge'
  intent?: ReplyIntent | null
  confidence?: number | null
  needs_human?: boolean
  reason?: string | null
  status: 'queued' | 'ready' | 'sending' | 'sent' | 'needs_human' | 'suppressed' | 'cancelled' | 'failed' | 'answered' | 'ignored'
  body: string
  subject?: string | null
  release_after?: string | null
  sent_at?: string | null
  error?: string | null
  created_at: string
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
  contactsList?: AdminContact[] // optional: old function payloads omit it
  prospects?: Prospect[] // optional: old function payloads omit it
  outboundReplies?: OutboundReply[] // reply desk log (optional: pre-0015 payloads omit it)
}

// ── cold-email outreach ──────────────────────────────────────────────────────
export interface OutreachTally {
  emailed: number
  opened: number
  replied: number
  purchased: number
  openRate: number
  replyRate: number
}
export interface OutreachProspect {
  id: string
  business_name: string | null
  business_type: string | null
  first_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
  batch: string | null
  preview_url: string | null
  emailed_at: string | null
  demo_first_viewed_at: string | null
  demo_view_count: number | null
  replied_at: string | null
  reply_sentiment: string | null
  last_reply: string | null
  purchased_at: string | null
  plan: string | null
  suppressed: boolean | null
  openedToday: boolean
}
export interface OutreachData {
  totals: OutreachTally & { prospects: number; openedToday: number; repliedToday: number; suppressed: number }
  batches: (OutreachTally & { batch: string; prospects: number })[]
  engaged: OutreachProspect[]
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

/** Cold-email outreach stats: who opened their demo link, views, replies. */
export async function fetchOutreach(): Promise<OutreachData> {
  const { data, error } = await supabase.functions.invoke('admin-data', { body: { action: 'outreach' } })
  if (error) {
    const { status, message } = await errorMessage(error, 'Failed to load outreach')
    throw new Error(status === 401 ? 'not-admin' : message)
  }
  return data as OutreachData
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
  /** Mark the appointment as a test: Meta events go to Test Events, stats exclude it. */
  test?: boolean
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

/** Permanently delete all test appointments + test CAPI rows (contacts are kept). */
export async function discardTestData(): Promise<{ deletedCapiEvents: number; deletedAppointments: number }> {
  const { data, error } = await supabase.functions.invoke('admin-data', { body: { action: 'discardTests' } })
  if (error) {
    const { message } = await errorMessage(error, 'Could not discard test data')
    throw new Error(message)
  }
  return data as { deletedCapiEvents: number; deletedAppointments: number }
}

/**
 * Re-queue the auto-built preview website for an appointment. The hourly Claude
 * routine picks queued rows up (or generate-site fires instantly once
 * ANTHROPIC_API_KEY is set).
 */
export async function retrySiteGeneration(appointmentId: string): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action: 'requeueSite', appointmentId },
  })
  if (error) {
    const { message } = await errorMessage(error, 'Could not re-queue site build')
    throw new Error(message)
  }
  return data as { ok: boolean }
}

/** (Re)generate the pre-meeting sales brief for an appointment (generate-brief fn). */
export async function regenerateBrief(appointmentId: string): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action: 'regenerateBrief', appointmentId },
  })
  if (error) {
    const { message } = await errorMessage(error, 'Could not start the brief')
    throw new Error(message)
  }
  return data as { ok: boolean }
}

/** Outbound funnel: force-retry a prospect's demo-site build (generate-site). */
export async function retryProspectSite(prospectId: string): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action: 'retryProspectSite', prospectId },
  })
  if (error) {
    const { message } = await errorMessage(error, 'Could not restart the demo build')
    throw new Error(message)
  }
  return data as { ok: boolean }
}

/**
 * Outbound funnel: re-run domain provisioning (register → DNS → attach → SSL).
 * Pass `chosenDomain` to change the domain first — the taken-after-checkout
 * recovery path (e.g. "acmeplumbingfl.com").
 */
export async function retryProvisioning(
  prospectId: string,
  chosenDomain?: string,
): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action: 'retryProvisioning', prospectId, ...(chosenDomain ? { chosenDomain } : {}) },
  })
  if (error) {
    const { message } = await errorMessage(error, 'Could not restart provisioning')
    throw new Error(message)
  }
  return data as { ok: boolean }
}

/** Reply desk: edit the text, send now, re-arm a failed answer, or cancel a queued one. */
export async function replyDeskUpdate(
  replyId: string,
  patch: { body?: string; status?: 'cancelled' | 'ready'; releaseAfter?: 'now' | string },
): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action: 'replyDeskUpdate', replyId, ...patch },
  })
  if (error) {
    const { message } = await errorMessage(error, 'Could not update the reply')
    throw new Error(message)
  }
  return data as { ok: boolean }
}

/** Reply desk: a person handled the thread — let the desk answer again. */
export async function resolveHandoff(prospectId: string): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action: 'resolveHandoff', prospectId },
  })
  if (error) {
    const { message } = await errorMessage(error, 'Could not resolve the hand-off')
    throw new Error(message)
  }
  return data as { ok: boolean }
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

// ── lead pipeline (scripts/auto-wave.mjs ↔ admin-data `leadPipeline`) ─────────
/** One scrape→enrich→verify→import→upload run (migration 0019 `lead_waves`). */
export interface LeadWave {
  id: string
  status: 'requested' | 'running' | 'done' | 'skipped' | 'failed' | 'cancelled'
  requested_by: 'admin' | 'trigger' | 'manual' | string
  requested_at: string
  started_at?: string | null
  finished_at?: string | null
  search?: string | null
  cities?: string[] | null
  batch?: string | null
  counts: Partial<Record<'scraped' | 'real_sites' | 'emails' | 'verified' | 'verified_ok' | 'catch_all' | 'imported' | 'uploaded' | 'remaining_in_plan', number>>
  cost: Partial<Record<'haiku_usd' | 'verify_credits', number>>
  note?: string | null
  log_tail?: string | null
}
/** What the office-PC runner last reported (poll_state key 'lead-pipeline'). Local-only API keys
 *  (MillionVerifier, Anthropic) never reach Edge, so their balances arrive through this row. */
export interface LeadPipelineState {
  campaign_id?: string | null
  millionverifier_credits?: number | null
  millionverifier_checked_at?: string | null
  instantly_remaining_in_plan?: number | null
  instantly_remaining_checked_at?: string | null
  instantly_cap_resets_on?: string | null
  haiku_spend_usd_month?: number | null
  haiku_spend_month?: string | null
  new_leads_per_day?: number | null
  runway_days?: number | null
  next_cities?: string[] | null
  done_cities?: string[] | null
  last_tick_at?: string | null
  last_wave_at?: string | null
  runner_host?: string | null
  trigger?: { low: boolean; reason: string } | null
  updated_at?: string | null
}
export interface InstantlyCampaignStats {
  campaignId: string
  name: string
  /** 1 active · 2 paused · 3 completed (needs re-activation after an upload) */
  status: number
  leads: number
  contacted: number
  uncontacted: number
  sent: number
  replies: number
  bounced: number
  unsubscribed: number
  week: { sent: number; bounced: number; replies: number; newLeads: number } | null
}
export type CallReason = 'replied' | 'viewed' | 'finished'
export interface CallListEntry {
  prospect: Pick<Prospect, 'id' | 'business_name' | 'phone' | 'email' | 'city' | 'state' | 'business_type' | 'preview_url' | 'emailed_at' | 'replied_at' | 'reply_sentiment' | 'last_reply' | 'handoff_at' | 'demo_first_viewed_at' | 'demo_view_count'> & { token?: string | null; called_at?: string | null; call_note?: string | null }
  reason: CallReason
  why: string
  rank: number
}
export interface LeadPipeline {
  pool: { restaurants: number; contractors: number; byBatch: Record<string, number> }
  state: LeadPipelineState | null
  waves: LeadWave[]
  instantly: InstantlyCampaignStats | null
  callList: CallListEntry[]
  /** migration 0019 not applied yet */
  unavailable: boolean
}

export async function fetchLeadPipeline(): Promise<LeadPipeline> {
  const { data, error } = await supabase.functions.invoke('admin-data', { body: { action: 'leadPipeline' } })
  if (error) {
    const { status, message } = await errorMessage(error, 'Failed to load the lead pipeline')
    throw new Error(status === 401 ? 'not-admin' : message)
  }
  return data as LeadPipeline
}

/** "Scrape a new list": queue a wave for the office-PC runner. Returns the open request if one already exists. */
export async function requestWave(note?: string): Promise<{ ok: boolean; existing: boolean; wave: { id: string; status: string; requested_at: string } }> {
  const { data, error } = await supabase.functions.invoke('admin-data', { body: { action: 'requestWave', ...(note ? { note } : {}) } })
  if (error) {
    const { message } = await errorMessage(error, 'Could not request a new list')
    throw new Error(message)
  }
  return data as { ok: boolean; existing: boolean; wave: { id: string; status: string; requested_at: string } }
}

export async function cancelWave(waveId: string): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.functions.invoke('admin-data', { body: { action: 'cancelWave', waveId } })
  if (error) {
    const { message } = await errorMessage(error, 'Could not cancel the request')
    throw new Error(message)
  }
  return data as { ok: boolean }
}

/** Follow-up / call list: a person called this prospect (or undo). */
export async function markCalled(prospectId: string, note?: string, undo = false): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.functions.invoke('admin-data', { body: { action: 'markCalled', prospectId, ...(note ? { note } : {}), ...(undo ? { undo: true } : {}) } })
  if (error) {
    const { message } = await errorMessage(error, 'Could not update the call list')
    throw new Error(message)
  }
  return data as { ok: boolean }
}

/** Warm list: those demo views were our own clicks — clear them so the prospect stops looking warm. */
export async function dismissViews(prospectId: string): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.functions.invoke('admin-data', { body: { action: 'dismissViews', prospectId } })
  if (error) {
    const { message } = await errorMessage(error, 'Could not clear the views')
    throw new Error(message)
  }
  return data as { ok: boolean }
}
