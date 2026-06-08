/**
 * Admin dashboard (/admin) — Supabase magic-link gated.
 *
 *  - Status: integration health + headline stats (leads, upcoming, showed,
 *    purchased, MRR, CAPI sent/error).
 *  - Appointments: every booking, with a "Result" action to mark
 *    Showed / No-Show / Purchase (upfront + recurring $ + plan) → fires the
 *    matching Meta event server-side (see the `result` function).
 *  - Logs: recent CAPI events and recent GHL messaging webhooks (so you can
 *    confirm the kept GHL confirmation/reminder messaging is firing).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { CheckCircle2, XCircle, RefreshCw, LogOut } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  fetchAdminData,
  submitResult,
  type AdminData,
  type Appt,
  type ResultKind,
} from './adminApi'

const usd = (n: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0)
const dateTime = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// ── login gate ──────────────────────────────────────────────────────────────────
const LoginCard: React.FC = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })
    if (error) setErr(error.message)
    else setSent(true)
  }
  return (
    <div className="mx-auto mt-24 max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">Ace Admin</h1>
      {sent ? (
        <p className="mt-4 text-gray-600">Check <strong>{email}</strong> for a sign-in link.</p>
      ) : (
        <form onSubmit={send} className="mt-4 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@acewebdesigners.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            Email me a sign-in link
          </button>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
      )}
    </div>
  )
}

const HealthChip: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${ok ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
    {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
    {label}
  </span>
)

const StatTile: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
)

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    booked: 'bg-blue-100 text-blue-800',
    showed: 'bg-green-100 text-green-800',
    no_show: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  return map[s] ?? 'bg-gray-100 text-gray-600'
}

// ── result modal ──────────────────────────────────────────────────────────────────
const ResultModal: React.FC<{ appt: Appt; onClose: () => void; onSaved: () => void }> = ({ appt, onClose, onSaved }) => {
  const [kind, setKind] = useState<ResultKind>('showed')
  const [upfront, setUpfront] = useState('')
  const [recurring, setRecurring] = useState('')
  const [interval, setIntervalVal] = useState<'monthly' | 'annual' | 'one_time'>('monthly')
  const [plan, setPlan] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setBusy(true)
    setErr('')
    try {
      await submitResult({
        appointmentId: appt.id,
        result: kind,
        upfront: kind === 'purchase' ? Number(upfront) || 0 : undefined,
        recurring: kind === 'purchase' ? Number(recurring) || 0 : undefined,
        recurringInterval: kind === 'purchase' ? interval : undefined,
        plan: kind === 'purchase' ? plan : undefined,
        notes: notes || undefined,
      })
      onSaved()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const name = `${appt.contacts?.first_name ?? ''} ${appt.contacts?.last_name ?? ''}`.trim() || appt.contacts?.email || 'Lead'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">Result meeting</h3>
        <p className="text-sm text-gray-500">{name} · {dateTime(appt.start_ts)}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(['showed', 'no_show', 'purchase'] as ResultKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${kind === k ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'}`}
            >
              {k === 'no_show' ? 'No-show' : k}
            </button>
          ))}
        </div>

        {kind === 'purchase' && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-600">
                Upfront ($)
                <input type="number" min="0" step="0.01" value={upfront} onChange={(e) => setUpfront(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
              <label className="text-sm text-gray-600">
                Recurring ($)
                <input type="number" min="0" step="0.01" value={recurring} onChange={(e) => setRecurring(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
            </div>
            <label className="block text-sm text-gray-600">
              Billing interval
              <select value={interval} onChange={(e) => setIntervalVal(e.target.value as 'monthly' | 'annual' | 'one_time')} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="one_time">One-time only</option>
              </select>
            </label>
            <label className="block text-sm text-gray-600">
              Plan / package
              <input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="e.g. Growth plan" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
          </div>
        )}

        <label className="mt-3 block text-sm text-gray-600">
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100">Cancel</button>
          <button type="button" onClick={save} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {busy ? 'Saving…' : 'Save & send to Meta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── dashboard ──────────────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [data, setData] = useState<AdminData | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [resulting, setResulting] = useState<Appt | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true)
      return
    }
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadErr('')
    try {
      setData(await fetchAdminData())
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) load()
  }, [session, load])

  const purchasedTotal = useMemo(
    () => (data?.appointments ?? []).filter((a) => a.purchased_at).reduce((s, a) => s + (Number(a.upfront_value) || 0), 0),
    [data],
  )

  if (!authReady) return <div className="p-10 text-center text-gray-500">Loading…</div>
  if (!isSupabaseConfigured) return <div className="p-10 text-center text-red-600">Supabase is not configured (VITE_SUPABASE_URL / ANON_KEY).</div>
  if (!session) return <LoginCard />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Ace Web Designers — Admin</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 p-6">
        {loadErr === 'not-admin' ? (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-800">
            This account isn't on the admin allow-list. Sign out and use an authorized email, or add it to <code>ADMIN_EMAILS</code>.
          </div>
        ) : loadErr ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{loadErr}</div>
        ) : !data ? (
          <div className="p-10 text-center text-gray-500">{loading ? 'Loading dashboard…' : '—'}</div>
        ) : (
          <>
            {/* health */}
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Integrations</h2>
              <div className="flex flex-wrap gap-2">
                <HealthChip label="Meta CAPI" ok={data.health.meta} />
                <HealthChip label="GHL messaging" ok={data.health.ghl} />
                <HealthChip label="Google Calendar" ok={data.health.google} />
                <HealthChip label="Stripe" ok={data.health.stripe} />
              </div>
            </section>

            {/* stats */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile label="Leads" value={data.stats.leads} />
              <StatTile label="Upcoming" value={data.stats.upcoming} />
              <StatTile label="Showed" value={data.stats.showed} />
              <StatTile label="Purchased" value={data.stats.purchased} />
              <StatTile label="MRR" value={usd(data.stats.mrr)} />
              <StatTile label="CAPI sent / err" value={`${data.stats.capiSent} / ${data.stats.capiError}`} />
            </section>

            {/* appointments */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Appointments</h2>
                <span className="text-sm text-gray-500">Collected upfront: {usd(purchasedTotal)}</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2">When</th>
                      <th className="px-4 py-2">Lead</th>
                      <th className="px-4 py-2">Calendar</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Result</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.appointments.map((a) => (
                      <tr key={a.id}>
                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">{dateTime(a.start_ts)}</td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-900">
                            {`${a.contacts?.first_name ?? ''} ${a.contacts?.last_name ?? ''}`.trim() || '—'}
                          </div>
                          <div className="text-xs text-gray-500">{a.contacts?.email}{a.contacts?.phone ? ` · ${a.contacts.phone}` : ''}</div>
                        </td>
                        <td className="px-4 py-2 capitalize text-gray-600">{a.calendar}</td>
                        <td className="px-4 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(a.status)}`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {a.purchased_at ? (
                            <span className="text-green-700">
                              {usd(a.upfront_value)}{a.recurring_value ? ` + ${usd(a.recurring_value)}/${a.recurring_interval === 'annual' ? 'yr' : 'mo'}` : ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => setResulting(a)} className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">
                            Result
                          </button>
                        </td>
                      </tr>
                    ))}
                    {data.appointments.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No appointments yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* logs */}
            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Recent CAPI events</h2>
                <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
                  {data.capiEvents.length === 0 ? (
                    <p className="text-gray-400">None yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {data.capiEvents.map((e) => (
                        <li key={e.event_id} className="flex items-center justify-between py-1.5">
                          <span className="text-gray-700">{e.event_name}{e.value ? ` · ${usd(e.value)}` : ''}</span>
                          <span className="flex items-center gap-2 text-xs">
                            <span className={e.status === 'sent' ? 'text-green-600' : e.status === 'error' ? 'text-red-600' : 'text-gray-400'}>{e.status}</span>
                            <span className="text-gray-400">{dateTime(e.sent_at)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">GHL messages</h2>
                <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
                  {data.ghlMessages.length === 0 ? (
                    <p className="text-gray-400">No GHL webhook events yet. Add a Webhook action to your GHL workflow → <code>/functions/v1/ghl-webhook</code>.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {data.ghlMessages.map((m) => (
                        <li key={m.id} className="flex items-center justify-between py-1.5">
                          <span className="text-gray-700">{m.message_type ?? 'message'}{m.channel ? ` · ${m.channel}` : ''}</span>
                          <span className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">{m.status}</span>
                            <span className="text-gray-400">{dateTime(m.received_at)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {resulting && (
        <ResultModal
          appt={resulting}
          onClose={() => setResulting(null)}
          onSaved={() => {
            setResulting(null)
            load()
          }}
        />
      )}
    </div>
  )
}

export default AdminDashboard
