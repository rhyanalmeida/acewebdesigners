/**
 * `admin-data` — dashboard payload (admin-only).
 *
 * Returns: integration health, headline stats (leads, upcoming, showed,
 * purchased, MRR), and recent lists (appointments + contacts, CAPI events, GHL
 * messages). The browser can't read these RLS-locked tables directly, so this
 * authed function fetches them with the service role.
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'
import { ghlConfigured } from '../_shared/ghl.ts'
import { googleConfigured } from '../_shared/google.ts'

// Untyped client → embed selects infer GenericStringError; cast to the fields we read.
interface AdminApptRow {
  start_ts: string
  status: string
  purchased_at: string | null
  recurring_value: number | null
  recurring_interval: string | null
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre

  const adminUser = await requireAdmin(req)
  if (!adminUser) return json({ error: 'unauthorized' }, 401)

  const supa = admin()

  const [
    leadsRes,
    capiSentRes,
    capiErrorRes,
    appointmentsRes,
    capiEventsRes,
    ghlMessagesRes,
  ] = await Promise.all([
    supa.from('contacts').select('*', { count: 'exact', head: true }),
    supa.from('capi_events').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    supa.from('capi_events').select('*', { count: 'exact', head: true }).eq('status', 'error'),
    supa
      .from('appointments')
      .select(
        'id, start_ts, end_ts, tz, status, calendar, event_id, value, upfront_value, recurring_value, ' +
          'recurring_interval, plan_name, purchased_at, resulted_at, resulted_by, gcal_event_id, ' +
          'ghl_appointment_id, notes, created_at, ' +
          'contacts:contact_id ( email, phone, first_name, last_name, city, state, zip )',
      )
      .order('start_ts', { ascending: false })
      .limit(200),
    supa.from('capi_events').select('event_id, event_name, status, value, sent_at').order('sent_at', { ascending: false }).limit(50),
    supa.from('ghl_messages').select('*').order('received_at', { ascending: false }).limit(50),
  ])

  const leads = leadsRes.count ?? 0
  const capiSent = capiSentRes.count ?? 0
  const capiError = capiErrorRes.count ?? 0
  const appts = (appointmentsRes.data ?? []) as unknown as AdminApptRow[]
  const now = Date.now()
  const upcoming = appts.filter((a) => Date.parse(a.start_ts) > now && a.status === 'booked').length
  const showed = appts.filter((a) => a.status === 'showed').length
  const purchasedRows = appts.filter((a) => a.purchased_at)
  const purchased = purchasedRows.length
  // Monthly recurring revenue (normalize annual → /12).
  const mrr = purchasedRows.reduce((sum, a) => {
    const r = Number(a.recurring_value) || 0
    if (a.recurring_interval === 'annual') return sum + r / 12
    if (a.recurring_interval === 'one_time') return sum
    return sum + r
  }, 0)

  return json({
    health: {
      meta: Boolean(Deno.env.get('META_CAPI_TOKEN')),
      ghl: ghlConfigured(),
      google: googleConfigured(),
      stripe: Boolean(Deno.env.get('STRIPE_SECRET_KEY')),
    },
    stats: {
      leads,
      upcoming,
      showed,
      purchased,
      mrr: Math.round(mrr * 100) / 100,
      capiSent,
      capiError,
    },
    appointments: appts,
    capiEvents: capiEventsRes.data ?? [],
    ghlMessages: ghlMessagesRes.data ?? [],
  })
})
