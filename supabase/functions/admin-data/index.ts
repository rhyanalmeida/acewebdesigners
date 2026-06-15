/**
 * `admin-data` — dashboard payload (admin-only).
 *
 * Returns integration health, actionable setup WARNINGS, and three views of the
 * funnel: Overall, Website (all bookings), and Social (paid FB/IG-attributed),
 * plus recent appointments, CAPI events, and GHL messages.
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'
import { ghlConfigured } from '../_shared/ghl.ts'
import { googleConfigured } from '../_shared/google.ts'

interface ContactEmbed {
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  city?: string
  state?: string
  zip?: string
  fbclid?: string
}
interface ApptRow {
  id: string
  start_ts: string
  status: string
  calendar: string
  value: number | null
  upfront_value: number | null
  recurring_value: number | null
  recurring_interval: string | null
  plan_name: string | null
  purchased_at: string | null
  resulted_at: string | null
  resulted_by: string | null
  event_id: string
  notes: string | null
  utm: Record<string, string> | null
  created_at: string
  is_test: boolean | null
  contacts: ContactEmbed | ContactEmbed[] | null
}

interface CapiRollupRow {
  event_name: string
  status: string
  sent_at: string
  is_test: boolean | null
}

/** Per-event-type CAPI rollup (non-test only): Lead / Schedule / CompleteRegistration / Purchase. */
function rollupServerEvents(rows: CapiRollupRow[]) {
  const blank = () => ({ sent: 0, error: 0, pending: 0, lastAt: null as string | null })
  const out = { lead: blank(), schedule: blank(), completeRegistration: blank(), purchase: blank() }
  for (const r of rows) {
    if (r.is_test) continue
    const bucket =
      r.event_name === 'Lead' ? out.lead :
      r.event_name === 'Schedule' ? out.schedule :
      r.event_name === 'CompleteRegistration' ? out.completeRegistration :
      r.event_name === 'Purchase' ? out.purchase : null
    if (!bucket) continue
    if (r.status === 'sent') bucket.sent += 1
    else if (r.status === 'error') bucket.error += 1
    else bucket.pending += 1
    if (!bucket.lastAt || r.sent_at > bucket.lastAt) bucket.lastAt = r.sent_at
  }
  return out
}

const contactOf = (a: ApptRow): ContactEmbed =>
  (Array.isArray(a.contacts) ? a.contacts[0] : a.contacts) ?? {}

const isSocial = (a: ApptRow): boolean => {
  const src = (a.utm?.utm_source ?? '').toLowerCase()
  return Boolean(contactOf(a).fbclid) || /face|insta|fb|ig/.test(src)
}
const monthly = (a: ApptRow): number => {
  const r = Number(a.recurring_value) || 0
  if (a.recurring_interval === 'annual') return r / 12
  if (a.recurring_interval === 'one_time') return 0
  return r
}
const round2 = (n: number) => Math.round(n * 100) / 100

function segment(rows: ApptRow[]) {
  const active = rows.filter((a) => a.status !== 'cancelled')
  const showed = active.filter((a) => a.status === 'showed' || a.purchased_at).length
  const purchasedRows = active.filter((a) => a.purchased_at)
  const purchased = purchasedRows.length
  const revenue = round2(purchasedRows.reduce((s, a) => s + (Number(a.upfront_value) || 0), 0))
  const mrr = round2(purchasedRows.reduce((s, a) => s + monthly(a), 0))
  const bookings = active.length
  return {
    bookings,
    showed,
    purchased,
    revenue,
    mrr,
    showRate: bookings ? Math.round((showed / bookings) * 100) : 0,
    closeRate: showed ? Math.round((purchased / showed) * 100) : 0,
  }
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  const adminUser = await requireAdmin(req)
  if (!adminUser) return json({ error: 'unauthorized' }, 401)

  const supa = admin()
  // NOTE: test bookings still upsert a contacts row (FK), so the Leads count can
  // drift slightly until cleaned (scripts/clean-booking.mjs).
  const [leadsRes, availRes, capiRollupRes, apptRes, capiEventsRes, ghlMessagesRes] = await Promise.all([
    supa.from('contacts').select('*', { count: 'exact', head: true }),
    supa.from('availability').select('*', { count: 'exact', head: true }).eq('active', true),
    supa.from('capi_events').select('event_name, status, sent_at, is_test').order('sent_at', { ascending: false }).limit(5000),
    supa
      .from('appointments')
      .select(
        'id, start_ts, status, calendar, value, upfront_value, recurring_value, recurring_interval, ' +
          'plan_name, purchased_at, resulted_at, resulted_by, event_id, notes, utm, created_at, is_test, ' +
          'contacts:contact_id ( email, phone, first_name, last_name, city, state, zip, fbclid )',
      )
      .order('start_ts', { ascending: false })
      .limit(500),
    supa.from('capi_events').select('event_id, event_name, action_source, status, value, meta_response, sent_at, is_test, appointment_id').order('sent_at', { ascending: false }).limit(50),
    supa.from('ghl_messages').select('*').order('received_at', { ascending: false }).limit(50),
  ])

  const leads = leadsRes.count ?? 0
  const availabilityRows = availRes.count ?? 0
  const capiRollup = (capiRollupRes.data ?? []) as CapiRollupRow[]
  const serverEvents = rollupServerEvents(capiRollup)
  const capiSent = serverEvents.lead.sent + serverEvents.schedule.sent + serverEvents.completeRegistration.sent + serverEvents.purchase.sent
  const capiError = serverEvents.lead.error + serverEvents.schedule.error + serverEvents.completeRegistration.error + serverEvents.purchase.error
  const appts = (apptRes.data ?? []) as unknown as ApptRow[]
  const realAppts = appts.filter((a) => !a.is_test) // stats exclude test bookings

  const health = {
    meta: Boolean(Deno.env.get('META_CAPI_TOKEN')),
    ghl: ghlConfigured(),
    google: googleConfigured(),
    stripe: Boolean(Deno.env.get('STRIPE_SECRET_KEY')),
  }

  // ── actionable setup warnings ──────────────────────────────────────────────
  const warnings: { level: 'error' | 'warn' | 'info'; message: string; fix: string }[] = []
  if (!health.meta) warnings.push({ level: 'error', message: 'Meta Conversions API is not connected — ad conversions are NOT being tracked.', fix: 'Set META_CAPI_TOKEN in Supabase Edge secrets.' })
  if (availabilityRows === 0) warnings.push({ level: 'error', message: 'No booking hours are configured — visitors cannot book.', fix: 'Add availability rows (we can set your weekly hours).' })
  if (!health.ghl) warnings.push({ level: 'warn', message: 'GHL is not connected — confirmation texts/emails/voicemails will not send.', fix: 'Publish the GHL Inbound Webhook workflow and set GHL_INBOUND_WEBHOOK_URL.' })
  if (!health.google) warnings.push({ level: 'warn', message: 'Google Calendar is not connected — bookings will not appear on your calendar.', fix: 'Add GOOGLE_SERVICE_ACCOUNT_B64 + calendar IDs.' })
  if (!health.stripe) warnings.push({ level: 'info', message: 'Stripe is not connected — you cannot collect deposits online yet.', fix: 'Add STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET when ready.' })
  if (capiError > 0) warnings.push({ level: 'warn', message: `${capiError} conversion(s) failed to send to Meta.`, fix: 'Check the CAPI log; verify META_CAPI_TOKEN is valid.' })

  const socialRows = realAppts.filter(isSocial)
  const all = segment(realAppts)
  const social = segment(socialRows)

  // social campaign breakdown
  const campaigns = new Map<string, { campaign: string; leads: number; purchased: number; revenue: number }>()
  for (const a of socialRows) {
    const key = a.utm?.utm_campaign || 'unattributed'
    const c = campaigns.get(key) ?? { campaign: key, leads: 0, purchased: 0, revenue: 0 }
    c.leads += 1
    if (a.purchased_at) {
      c.purchased += 1
      c.revenue += Number(a.upfront_value) || 0
    }
    campaigns.set(key, c)
  }

  return json({
    health,
    warnings,
    overall: { leads, ...all, capiSent, capiError },
    website: { leads, ...all },
    social: { leads: social.bookings, showed: social.showed, purchased: social.purchased, revenue: social.revenue, mrr: social.mrr, showRate: social.showRate, closeRate: social.closeRate, byCampaign: [...campaigns.values()].sort((a, b) => b.leads - a.leads) },
    serverEvents,
    appointments: appts.map((a) => ({ ...a, isSocial: isSocial(a) })),
    capiEvents: (capiEventsRes.data ?? []).map((e) => {
      const row = e as { status?: string; meta_response?: unknown }
      const mr = row.meta_response as { events_received?: number; error?: { message?: string } | string } | null
      const { meta_response: _drop, ...rest } = e as Record<string, unknown>
      const errSrc = mr?.error
      const errorMessage =
        row.status === 'error'
          ? (String(typeof errSrc === 'object' && errSrc !== null ? errSrc.message ?? JSON.stringify(errSrc) : errSrc ?? JSON.stringify(mr ?? '')).slice(0, 200) || null)
          : null
      return {
        ...rest,
        events_received: typeof mr?.events_received === 'number' ? mr.events_received : null,
        error_message: errorMessage,
      }
    }),
    ghlMessages: ghlMessagesRes.data ?? [],
  })
})
