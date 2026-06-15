/**
 * Admin dashboard (/admin) — Supabase magic-link gated, ADMIN_EMAILS allow-list.
 *
 * Tabs: Overview (whole-business KPIs + setup warnings + integration health),
 * Website (booking funnel + appointments + Result actions + CAPI log), and
 * Social Media (paid FB/IG-attributed funnel + per-campaign breakdown).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { CheckCircle2, XCircle, AlertTriangle, Info, RefreshCw, LogOut, Globe, Share2, LayoutDashboard } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  fetchAdminData, submitResult, retryCapiEvent,
  type AdminData, type Appt, type CapiOutcome, type ResultKind, type ResultResponse, type ServerEventStat, type Warning,
} from './adminApi'

const usd = (n: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n) || 0)
const dateTime = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// ── login gate ──────────────────────────────────────────────────────────────────
const LoginCard: React.FC = () => {
  const [email, setEmail] = useState('hello@acewebdesigners.com')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErr(error.message)
    setBusy(false)
  }
  const magicLink = async () => {
    setErr('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/admin` } })
    if (error) setErr(error.message)
    else setSent(true)
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Ace Admin</h1>
        <p className="mt-1 text-sm text-gray-500">Access is restricted to authorized accounts.</p>
        <form onSubmit={signIn} className="mt-4 space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username" className={inputCls} />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className={inputCls} />
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
        <div className="mt-4 border-t border-gray-100 pt-4 text-center">
          {sent ? (
            <p className="text-sm text-gray-600">Check <strong>{email}</strong> for a sign-in link.</p>
          ) : (
            <button type="button" onClick={magicLink} className="text-sm text-blue-600 hover:underline">Email me a sign-in link instead</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── small UI pieces ───────────────────────────────────────────────────────────────
const Stat: React.FC<{ label: string; value: string | number; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
  </div>
)

const HealthChip: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${ok ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
    {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{label}
  </span>
)

const Warnings: React.FC<{ items: Warning[] }> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <CheckCircle2 size={16} /> Everything's set up correctly.
      </div>
    )
  }
  const style = (l: Warning['level']) =>
    l === 'error' ? 'border-red-200 bg-red-50 text-red-800' : l === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-800'
  const Icon = (l: Warning['level']) => (l === 'error' ? XCircle : l === 'warn' ? AlertTriangle : Info)
  return (
    <div className="space-y-2">
      {items.map((w, i) => {
        const I = Icon(w.level)
        return (
          <div key={i} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${style(w.level)}`}>
            <I size={16} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">{w.message}</span> <span className="opacity-80">→ {w.fix}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const Funnel: React.FC<{ bookings: number; showed: number; purchased: number; showRate: number; closeRate: number }> = ({ bookings, showed, purchased, showRate, closeRate }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="mb-3 text-sm font-semibold text-gray-700">Funnel</p>
    <div className="flex items-center justify-between text-center text-sm">
      <div><p className="text-xl font-bold text-gray-900">{bookings}</p><p className="text-gray-500">Booked</p></div>
      <div className="text-gray-400">→ {showRate}% →</div>
      <div><p className="text-xl font-bold text-gray-900">{showed}</p><p className="text-gray-500">Showed</p></div>
      <div className="text-gray-400">→ {closeRate}% →</div>
      <div><p className="text-xl font-bold text-green-700">{purchased}</p><p className="text-gray-500">Purchased</p></div>
    </div>
  </div>
)

const statusBadge = (s: string) => ({ booked: 'bg-blue-100 text-blue-800', showed: 'bg-green-100 text-green-800', no_show: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500' }[s] ?? 'bg-gray-100 text-gray-600')

const TestBadge: React.FC = () => (
  <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500" title="Test booking — excluded from stats and live Meta data">TEST</span>
)

// ── Meta server-event cards (Lead / Showed / Purchase) ─────────────────────────
const ServerEventCard: React.FC<{ title: string; sub: string; s: ServerEventStat }> = ({ title, sub, s }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-sm font-semibold text-gray-700">{title}</p>
    <p className="text-xs text-gray-400">{sub}</p>
    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span><span className="text-2xl font-bold text-green-700">{s.sent}</span> <span className="text-sm text-gray-500">sent</span></span>
      {s.error > 0 && <span className="text-sm font-semibold text-red-600">{s.error} failed</span>}
      {s.pending > 0 && <span className="text-sm font-semibold text-amber-600">{s.pending} pending</span>}
    </div>
    <p className="mt-1 text-xs text-gray-400">{s.lastAt ? `Last: ${dateTime(s.lastAt)}` : 'None yet'}</p>
  </div>
)

// ── result modal ──────────────────────────────────────────────────────────────────
/** One "did Meta take it?" line in the post-save confirmation. */
const OutcomeLine: React.FC<{ label: string; o?: CapiOutcome }> = ({ label, o }) => {
  if (!o) return null
  const ok = o.ok
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
      {ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
      <span>
        <span className="font-medium">{label}</span>{' — '}
        {ok ? (o.deduped ? 'already sent to Meta (deduped)' : 'sent to Meta') : `failed${o.error ? `: ${o.error}` : ''} · retry it from the CAPI log`}
      </span>
    </div>
  )
}

const ResultModal: React.FC<{ appt: Appt; onClose: () => void; onSaved: () => void }> = ({ appt, onClose, onSaved }) => {
  const [kind, setKind] = useState<ResultKind>('showed')
  const [upfront, setUpfront] = useState('')
  const [recurring, setRecurring] = useState('')
  const [interval, setIntervalVal] = useState<'monthly' | 'annual' | 'one_time'>('monthly')
  const [plan, setPlan] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [outcome, setOutcome] = useState<ResultResponse | null>(null)
  const save = async () => {
    setBusy(true); setErr('')
    try {
      const res = await submitResult({
        appointmentId: appt.id, result: kind,
        upfront: kind === 'purchase' ? Number(upfront) || 0 : undefined,
        recurring: kind === 'purchase' ? Number(recurring) || 0 : undefined,
        recurringInterval: kind === 'purchase' ? interval : undefined,
        plan: kind === 'purchase' ? plan : undefined,
        notes: notes || undefined,
      })
      setOutcome(res)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const name = `${appt.contacts?.first_name ?? ''} ${appt.contacts?.last_name ?? ''}`.trim() || appt.contacts?.email || 'Lead'
  const inputCls = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2'

  // Post-save: show what actually happened with Meta, then refresh on Done.
  if (outcome) {
    const capi = outcome.capi
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onSaved}>
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-gray-900">Result saved</h3>
          <p className="text-sm text-gray-500">{name} · {dateTime(appt.start_ts)}</p>
          <div className="mt-4 space-y-2">
            {capi === 'none' ? (
              <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <Info size={16} className="mt-0.5 shrink-0" /> Saved — no Meta event needed for a no-show.
              </div>
            ) : (
              <>
                <OutcomeLine label="Showed → CompleteRegistration" o={capi.completeRegistration} />
                <OutcomeLine label="Purchase" o={capi.purchase} />
              </>
            )}
            {appt.is_test && <p className="text-xs text-gray-400">Test booking — events were sent to Meta Test Events only.</p>}
          </div>
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={onSaved} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">Result meeting</h3>
        <p className="text-sm text-gray-500">{name} · {dateTime(appt.start_ts)}{appt.is_test && <TestBadge />}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(['showed', 'no_show', 'purchase'] as ResultKind[]).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${kind === k ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'}`}>{k === 'no_show' ? 'No-show' : k}</button>
          ))}
        </div>
        {kind === 'purchase' && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-600">Upfront ($)<input type="number" min="0" step="0.01" value={upfront} onChange={(e) => setUpfront(e.target.value)} className={inputCls} /></label>
              <label className="text-sm text-gray-600">Recurring ($)<input type="number" min="0" step="0.01" value={recurring} onChange={(e) => setRecurring(e.target.value)} className={inputCls} /></label>
            </div>
            <label className="block text-sm text-gray-600">Billing interval
              <select value={interval} onChange={(e) => setIntervalVal(e.target.value as 'monthly' | 'annual' | 'one_time')} className={inputCls}>
                <option value="monthly">Monthly</option><option value="annual">Annual</option><option value="one_time">One-time only</option>
              </select>
            </label>
            <label className="block text-sm text-gray-600">Plan / package<input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="e.g. Growth plan" className={inputCls} /></label>
          </div>
        )}
        <label className="mt-3 block text-sm text-gray-600">Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} /></label>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100">Cancel</button>
          <button type="button" onClick={save} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy ? 'Saving…' : 'Save & send to Meta'}</button>
        </div>
      </div>
    </div>
  )
}

type Tab = 'overview' | 'website' | 'social'

// ── dashboard ──────────────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [data, setData] = useState<AdminData | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [resulting, setResulting] = useState<Appt | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) { setAuthReady(true); return }
    supabase.auth.getSession().then(({ data: d }) => { setSession(d.session); setAuthReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('')
    try { setData(await fetchAdminData()) } catch (e) { setLoadErr(e instanceof Error ? e.message : 'Failed to load') } finally { setLoading(false) }
  }, [])

  // per-row retry of failed/pending CAPI events
  const [retrying, setRetrying] = useState<string | null>(null)
  const [retryErr, setRetryErr] = useState<Record<string, string>>({})
  const retry = useCallback(async (eventId: string) => {
    setRetrying(eventId)
    setRetryErr((prev) => ({ ...prev, [eventId]: '' }))
    try {
      const o = await retryCapiEvent(eventId)
      if (!o.ok) setRetryErr((prev) => ({ ...prev, [eventId]: o.error || 'Meta rejected the event' }))
    } catch (e) {
      setRetryErr((prev) => ({ ...prev, [eventId]: e instanceof Error ? e.message : 'Retry failed' }))
    } finally {
      setRetrying(null)
      load()
    }
  }, [load])

  useEffect(() => { if (session) load() }, [session, load])

  const socialPct = useMemo(() => {
    if (!data) return 0
    return data.overall.bookings ? Math.round((data.social.leads / data.overall.bookings) * 100) : 0
  }, [data])

  if (!authReady) return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading…</div>
  if (!isSupabaseConfigured) return <div className="flex min-h-screen items-center justify-center text-red-600">Supabase is not configured.</div>
  if (!session) return <LoginCard />

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'website', label: 'Website', icon: <Globe size={16} /> },
    { id: 'social', label: 'Social Media', icon: <Share2 size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Ace Web Designers — Admin</h1>
          <div className="flex items-center gap-2">
            <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"><RefreshCw size={14} /> Refresh</button>
            <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"><LogOut size={14} /> Sign out</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 px-4">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{t.icon}{t.label}</button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        {loadErr === 'not-admin' ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">This account isn't authorized. Sign out and use an approved email, or add it to <code>ADMIN_EMAILS</code>.</div>
        ) : loadErr ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{loadErr}</div>
        ) : !data ? (
          <div className="p-10 text-center text-gray-500">{loading ? 'Loading dashboard…' : '—'}</div>
        ) : tab === 'overview' ? (
          <>
            <Warnings items={data.warnings} />
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Leads" value={data.overall.leads} />
              <Stat label="Booked" value={data.overall.bookings} />
              <Stat label="Showed" value={data.overall.showed} />
              <Stat label="Purchased" value={data.overall.purchased} />
              <Stat label="Revenue" value={usd(data.overall.revenue)} sub="upfront collected" />
              <Stat label="MRR" value={usd(data.overall.mrr)} sub="monthly recurring" />
            </section>
            <Funnel bookings={data.overall.bookings} showed={data.overall.showed} purchased={data.overall.purchased} showRate={data.overall.showRate} closeRate={data.overall.closeRate} />
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Integrations</h2>
              <div className="flex flex-wrap gap-2">
                <HealthChip label="Meta CAPI" ok={data.health.meta} />
                <HealthChip label="GHL messaging" ok={data.health.ghl} />
                <HealthChip label="Google Calendar" ok={data.health.google} />
                <HealthChip label="Stripe" ok={data.health.stripe} />
                <span className="ml-auto text-sm text-gray-500">CAPI sent {data.overall.capiSent} · errors {data.overall.capiError}</span>
              </div>
            </section>
          </>
        ) : tab === 'website' ? (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Leads" value={data.website.leads} />
              <Stat label="Booked" value={data.website.bookings} />
              <Stat label="Show rate" value={`${data.website.showRate}%`} />
              <Stat label="Close rate" value={`${data.website.closeRate}%`} />
            </section>
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Appointments</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr>
                    <th className="px-4 py-2">When</th><th className="px-4 py-2">Lead</th><th className="px-4 py-2">Source</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Result</th><th className="px-4 py-2"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.appointments.map((a) => (
                      <tr key={a.id}>
                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">{dateTime(a.start_ts)}</td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-900">{`${a.contacts?.first_name ?? ''} ${a.contacts?.last_name ?? ''}`.trim() || '—'}</div>
                          <div className="text-xs text-gray-500">{a.contacts?.email}{a.contacts?.phone ? ` · ${a.contacts.phone}` : ''}</div>
                        </td>
                        <td className="px-4 py-2">{a.isSocial ? <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Paid social</span> : <span className="text-xs text-gray-400">Direct</span>}</td>
                        <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(a.status)}`}>{a.status}</span>{a.is_test && <TestBadge />}</td>
                        <td className="px-4 py-2 text-gray-600">{a.purchased_at ? <span className="text-green-700">{usd(a.upfront_value)}{a.recurring_value ? ` + ${usd(a.recurring_value)}/${a.recurring_interval === 'annual' ? 'yr' : 'mo'}` : ''}</span> : '—'}</td>
                        <td className="px-4 py-2 text-right"><button onClick={() => setResulting(a)} className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">Result</button></td>
                      </tr>
                    ))}
                    {data.appointments.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No appointments yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
            {data.serverEvents && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Meta server events</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <ServerEventCard title="Lead" sub="gate form submitted" s={data.serverEvents.lead} />
                  <ServerEventCard title="Booked" sub="Schedule · slot picked" s={data.serverEvents.schedule} />
                  <ServerEventCard title="Showed" sub="CompleteRegistration · offline" s={data.serverEvents.completeRegistration} />
                  <ServerEventCard title="Purchase" sub="closed + value · offline" s={data.serverEvents.purchase} />
                </div>
              </section>
            )}
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Recent CAPI events</h2>
              <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
                {data.capiEvents.length === 0 ? <p className="text-gray-400">None yet.</p> : (
                  <ul className="divide-y divide-gray-100">{data.capiEvents.map((e) => {
                    const offline = e.action_source === 'system_generated'
                    const accepted = e.status === 'sent' && e.events_received === 1
                    const unconfirmed = e.status === 'sent' && e.events_received !== 1
                    const canRetry = e.status !== 'sent' && Boolean(e.appointment_id)
                    const rowErr = retryErr[e.event_id] || e.error_message
                    return (
                    <li key={e.event_id} className="py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">{e.event_name}{e.value ? ` · ${usd(e.value)}` : ''}
                          <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${offline ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{offline ? 'offline' : 'website'}</span>
                          {e.is_test && <TestBadge />}
                        </span>
                        <span className="flex items-center gap-2 text-xs">
                          {accepted && <span className="text-green-600" title={`Meta confirmed: events_received ${e.events_received}`}>✓ Meta got it</span>}
                          {unconfirmed && <span className="text-amber-600" title="Sent, but Meta did not confirm events_received — check Events Manager">⚠ unconfirmed</span>}
                          <span
                            className={e.status === 'sent' ? 'text-green-600' : e.status === 'error' ? 'text-red-600' : 'text-amber-600'}
                            title={e.status === 'pending' ? 'Claimed but no Meta response — retry if it persists' : undefined}
                          >{e.status}</span>
                          <span className="text-gray-400">{dateTime(e.sent_at)}</span>
                          {canRetry && (
                            <button
                              type="button"
                              onClick={() => retry(e.event_id)}
                              disabled={retrying === e.event_id}
                              className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >{retrying === e.event_id ? 'Retrying…' : 'Retry'}</button>
                          )}
                        </span>
                      </div>
                      {rowErr && <p className="mt-0.5 truncate text-xs text-red-600" title={rowErr}>{rowErr}</p>}
                    </li>
                    )
                  })}</ul>
                )}
              </div>
            </section>
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Recent messages (GHL)</h2>
              <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
                {data.ghlMessages.length === 0 ? <p className="text-gray-400">None yet.</p> : (
                  <ul className="divide-y divide-gray-100">{data.ghlMessages.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-1.5">
                      <span className="capitalize text-gray-700">{m.channel || 'message'}{m.message_type ? ` · ${m.message_type}` : ''}</span>
                      <span className="flex items-center gap-2 text-xs">
                        <span className={/sent|deliver/i.test(m.status ?? '') ? 'text-green-600' : /fail|error/i.test(m.status ?? '') ? 'text-red-600' : 'text-gray-400'}>{m.status || '—'}</span>
                        <span className="text-gray-400">{dateTime(m.received_at)}</span>
                      </span>
                    </li>
                  ))}</ul>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">Leads driven by Facebook / Instagram ads (matched via click ID + UTM). {socialPct}% of all bookings came from paid social.</p>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Social leads" value={data.social.leads} />
              <Stat label="Showed" value={data.social.showed} />
              <Stat label="Purchased" value={data.social.purchased} />
              <Stat label="Social revenue" value={usd(data.social.revenue)} />
            </section>
            <Funnel bookings={data.social.leads} showed={data.social.showed} purchased={data.social.purchased} showRate={data.social.showRate} closeRate={data.social.closeRate} />
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">By campaign (utm_campaign)</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-2">Campaign</th><th className="px-4 py-2">Leads</th><th className="px-4 py-2">Purchased</th><th className="px-4 py-2">Revenue</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.social.byCampaign.map((c) => (
                      <tr key={c.campaign}><td className="px-4 py-2 text-gray-800">{c.campaign}</td><td className="px-4 py-2">{c.leads}</td><td className="px-4 py-2">{c.purchased}</td><td className="px-4 py-2 text-green-700">{usd(c.revenue)}</td></tr>
                    ))}
                    {data.social.byCampaign.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No paid-social leads yet. Add <code>utm_source=facebook</code> &amp; <code>utm_campaign</code> to your ad URLs to track by campaign.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {resulting && <ResultModal appt={resulting} onClose={() => setResulting(null)} onSaved={() => { setResulting(null); load() }} />}
    </div>
  )
}

export default AdminDashboard
