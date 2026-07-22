/**
 * Admin dashboard (/admin) — Supabase email+password (magic-link fallback),
 * ADMIN_EMAILS allow-list. The operations cockpit for the funnel.
 *
 * Tabs: Overview (health + KPIs + funnel + conversion flow + meetings to result),
 * Website (booking funnel + appointments + Result actions + CAPI log + GHL messages),
 * Social Media (paid FB/IG-attributed funnel + per-campaign breakdown).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import ReactMarkdown from 'react-markdown'
import {
  CheckCircle2, XCircle, AlertTriangle, Info, RefreshCw, LogOut, Globe, Share2, LayoutDashboard,
  Users, CalendarCheck, CircleDollarSign, Target, Zap, Clock, ArrowRight, Activity, Sparkles,
  Repeat, ChevronRight, TrendingUp, Wifi, Link2, Copy, ExternalLink, FileText,
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  fetchAdminData, submitResult, retryCapiEvent, createPaymentLink, discardTestData, retrySiteGeneration, regenerateBrief,
  type AdminData, type AdminContact, type Appt, type CapiOutcome, type ResultKind, type ResultResponse, type ServerEventStat,
} from './adminApi'

// ── formatting helpers ────────────────────────────────────────────────────────
const usd = (n: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n) || 0)
const dateTime = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 0) return 'soon'
  if (s < 60) return 'just now'
  const m = s / 60; if (m < 60) return `${Math.floor(m)}m ago`
  const h = m / 60; if (h < 24) return `${Math.floor(h)}h ago`
  const d = h / 24; if (d < 30) return `${Math.floor(d)}d ago`
  return `${Math.floor(d / 30)}mo ago`
}
type NameLike = { first_name?: string | null; last_name?: string | null; email?: string | null } | null
const fullName = (c?: NameLike) =>
  `${c?.first_name ?? ''} ${c?.last_name ?? ''}`.trim() || c?.email || 'Lead'
/**
 * Qualifying answers from the scheduler's done screen. Rendered wherever a contact
 * is listed — the whole point of collecting them is that they're visible before the call.
 */
type QualifierLike = { years_in_business?: string | null; has_website?: string | null } | null
const Qualifiers: React.FC<{ c?: QualifierLike }> = ({ c }) => {
  const parts = [c?.years_in_business, c?.has_website].filter(Boolean)
  if (!parts.length) return null
  return <div className="truncate text-xs text-slate-400">{parts.join(' · ')}</div>
}
const initials = (c?: NameLike) => {
  const f = c?.first_name?.[0] ?? c?.email?.[0] ?? '?'
  const l = c?.last_name?.[0] ?? ''
  return (f + l).toUpperCase()
}

// ── login gate ────────────────────────────────────────────────────────────────
const LoginCard: React.FC = () => {
  const [email, setEmail] = useState('hello@acewebdesigners.com')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErr(error.message)
    setBusy(false)
  }
  const magicLink = async () => {
    setErr('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/admin` } })
    if (error) setErr(error.message); else setSent(true)
  }
  const inputCls = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none'
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/50 to-violet-200/50 blur-3xl" />
      <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-slate-200/60 backdrop-blur">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm"><Sparkles size={20} /></div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Ace Admin</h1>
            <p className="text-xs text-slate-500">Authorized accounts only</p>
          </div>
        </div>
        <form onSubmit={signIn} className="space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username" className={inputCls} />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className={inputCls} />
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {err && <p className="text-sm text-rose-600">{err}</p>}
        </form>
        <div className="mt-4 border-t border-slate-100 pt-4 text-center">
          {sent ? <p className="text-sm text-slate-600">Check <strong>{email}</strong> for a sign-in link.</p>
            : <button type="button" onClick={magicLink} className="text-sm font-medium text-indigo-600 hover:underline">Email me a sign-in link instead</button>}
        </div>
      </div>
    </div>
  )
}

// ── primitives ──────────────────────────────────────────────────────────────────
const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm'
const sectionTitle = 'text-xs font-semibold uppercase tracking-wider text-slate-400'

type Accent = 'indigo' | 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate'
const ACCENT: Record<Accent, { chip: string; value: string }> = {
  indigo: { chip: 'bg-indigo-50 text-indigo-600', value: 'text-slate-900' },
  sky: { chip: 'bg-sky-50 text-sky-600', value: 'text-slate-900' },
  emerald: { chip: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-600' },
  violet: { chip: 'bg-violet-50 text-violet-600', value: 'text-slate-900' },
  amber: { chip: 'bg-amber-50 text-amber-600', value: 'text-slate-900' },
  rose: { chip: 'bg-rose-50 text-rose-600', value: 'text-slate-900' },
  slate: { chip: 'bg-slate-100 text-slate-600', value: 'text-slate-900' },
}

const Kpi: React.FC<{ icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: Accent }> =
  ({ icon: Icon, label, value, sub, accent = 'slate' }) => {
    const a = ACCENT[accent]
    return (
      <div className={`${card} p-4 transition hover:shadow-md`}>
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${a.chip}`}><Icon size={16} /></span>
        </div>
        <p className={`mt-2 text-3xl font-bold tracking-tight ${a.value}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
    )
  }

const HealthChip: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ok ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />{label}
  </span>
)

const TestBadge: React.FC = () => (
  <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-500" title="Test booking — excluded from stats and live Meta data">TEST</span>
)

const statusPill = (s: string) =>
  ({ booked: 'bg-sky-50 text-sky-700 ring-sky-200', showed: 'bg-emerald-50 text-emerald-700 ring-emerald-200', no_show: 'bg-rose-50 text-rose-700 ring-rose-200', cancelled: 'bg-slate-100 text-slate-500 ring-slate-200' }[s] ?? 'bg-slate-100 text-slate-600 ring-slate-200')

// ── health banner (the at-a-glance "is everything ok?" hero) ──────────────────
const HealthBanner: React.FC<{ data: AdminData }> = ({ data }) => {
  const errors = data.warnings.filter((w) => w.level === 'error').length
  const warns = data.warnings.filter((w) => w.level === 'warn').length
  const allOk = errors === 0 && warns === 0
  return (
    <div className={`overflow-hidden rounded-2xl border ${allOk ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white' : errors ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-white' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'}`}>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-xl text-white shadow-sm ${allOk ? 'bg-emerald-500' : errors ? 'bg-rose-500' : 'bg-amber-500'}`}>
            {allOk ? <CheckCircle2 size={24} /> : errors ? <XCircle size={24} /> : <AlertTriangle size={24} />}
          </span>
          <div>
            <p className="text-base font-bold text-slate-900">
              {allOk ? 'All systems operational' : `${errors + warns} ${errors + warns === 1 ? 'item needs' : 'items need'} attention`}
            </p>
            <p className="text-sm text-slate-500">
              {allOk ? 'Conversions flowing, integrations healthy.' : 'Review the items below to keep the funnel running.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <HealthChip label="Meta CAPI" ok={data.health.meta} />
          <HealthChip label="GHL" ok={data.health.ghl} />
          <HealthChip label="Google" ok={data.health.google} />
          <HealthChip label="Stripe" ok={data.health.stripe} />
          {data.health.netlify !== undefined && <HealthChip label="Netlify" ok={data.health.netlify} />}
        </div>
      </div>
      {!allOk && (
        <div className="space-y-2 border-t border-slate-200/70 bg-white/50 p-4">
          {data.warnings.map((w, i) => {
            const I = w.level === 'error' ? XCircle : w.level === 'warn' ? AlertTriangle : Info
            const c = w.level === 'error' ? 'text-rose-600' : w.level === 'warn' ? 'text-amber-600' : 'text-sky-600'
            return (
              <div key={i} className="flex items-start gap-2 text-sm">
                <I size={16} className={`mt-0.5 shrink-0 ${c}`} />
                <div><span className="font-medium text-slate-800">{w.message}</span> <span className="text-slate-500">→ {w.fix}</span></div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── visual funnel (proportional bars + conversion rates) ───────────────────────
const VisualFunnel: React.FC<{ leads: number; bookings: number; showed: number; purchased: number; title?: string }> =
  ({ leads, bookings, showed, purchased, title = 'Funnel' }) => {
    const top = Math.max(leads, bookings, 1)
    const stages = [
      { label: 'Leads', value: leads, color: 'from-indigo-500 to-indigo-400', icon: Users },
      { label: 'Booked', value: bookings, color: 'from-sky-500 to-sky-400', icon: CalendarCheck },
      { label: 'Showed', value: showed, color: 'from-violet-500 to-violet-400', icon: CheckCircle2 },
      { label: 'Purchased', value: purchased, color: 'from-emerald-500 to-emerald-400', icon: CircleDollarSign },
    ]
    const rate = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
    return (
      <div className={`${card} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <span className="text-xs text-slate-400">{rate(purchased, leads || bookings)}% lead→close</span>
        </div>
        <div className="space-y-2.5">
          {stages.map((s, i) => {
            const pct = Math.max((s.value / top) * 100, s.value > 0 ? 8 : 3)
            const Icon = s.icon
            const conv = i > 0 ? rate(s.value, stages[i - 1].value) : null
            return (
              <div key={s.label}>
                {conv !== null && (
                  <div className="ml-1 flex items-center gap-1 py-0.5 text-[11px] text-slate-400">
                    <ChevronRight size={12} /> {conv}% conversion
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex w-24 shrink-0 items-center gap-1.5 text-sm font-medium text-slate-600">
                    <Icon size={14} className="text-slate-400" />{s.label}
                  </div>
                  <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-slate-100">
                    <div className={`flex h-full items-center justify-end rounded-lg bg-gradient-to-r ${s.color} px-3`} style={{ width: `${pct}%` }}>
                      <span className="text-sm font-bold text-white drop-shadow-sm">{s.value}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

// ── conversion flow (Meta server events at a glance) ───────────────────────────
const FlowStat: React.FC<{ title: string; sub: string; s: ServerEventStat; tone: Accent }> = ({ title, sub, s, tone }) => {
  const a = ACCENT[tone]
  const issues = s.error + s.pending
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="text-[11px] text-slate-400">{sub}</p>
        </div>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${a.chip}`}><Zap size={14} /></span>
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        <span className="text-2xl font-bold text-slate-900">{s.sent}</span>
        <span className="pb-0.5 text-xs text-slate-400">accepted</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px]">
        {issues === 0 ? (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-600"><CheckCircle2 size={12} /> all sent</span>
        ) : (
          <>
            {s.error > 0 && <span className="font-semibold text-rose-600">{s.error} failed</span>}
            {s.pending > 0 && <span className="font-semibold text-amber-600">{s.pending} pending</span>}
          </>
        )}
        <span className="ml-auto text-slate-400">{s.lastAt ? timeAgo(s.lastAt) : '—'}</span>
      </div>
    </div>
  )
}

const ConversionFlow: React.FC<{ se: NonNullable<AdminData['serverEvents']> }> = ({ se }) => {
  const totalFail = se.lead.error + se.schedule.error + se.completeRegistration.error + se.purchase.error
  const totalPend = se.lead.pending + se.schedule.pending + se.completeRegistration.pending + se.purchase.pending
  const healthy = totalFail === 0 && totalPend === 0
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className={sectionTitle}>Conversions to Meta</h2>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${healthy ? 'text-emerald-600' : 'text-amber-600'}`}>
          <Activity size={13} />{healthy ? 'All flowing' : `${totalFail + totalPend} need a look`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FlowStat title="Lead" sub="gate form" s={se.lead} tone="indigo" />
        <FlowStat title="Booked" sub="slot picked" s={se.schedule} tone="sky" />
        <FlowStat title="Showed" sub="offline" s={se.completeRegistration} tone="violet" />
        <FlowStat title="Purchase" sub="offline · value" s={se.purchase} tone="emerald" />
      </div>
    </section>
  )
}

// ── appointments ───────────────────────────────────────────────────────────────
const Avatar: React.FC<{ c?: NameLike }> = ({ c }) => (
  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600">{initials(c)}</span>
)

/** Auto-generated preview website status/actions for one appointment. */
const PreviewSiteCell: React.FC<{ appt: Appt }> = ({ appt }) => {
  const [busy, setBusy] = useState(false)
  const [started, setStarted] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)

  const regenerate = async () => {
    setBusy(true); setErr('')
    try { await retrySiteGeneration(appt.id); setStarted(true) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Failed to start') }
    finally { setBusy(false) }
  }
  const copy = async () => {
    if (!appt.preview_url) return
    try { await navigator.clipboard.writeText(appt.preview_url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ }
  }

  const status = appt.site_status
  // "generating" for >2h means the build crashed (the hourly routine also retakes
  // such rows automatically) — surface Retry.
  const stalled =
    status === 'generating' && appt.updated_at && Date.now() - new Date(appt.updated_at).getTime() > 2 * 60 * 60 * 1000

  if (started || (!stalled && (status === 'queued' || status === 'generating'))) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200" title="The site builder picks this up on its hourly run — usually live within the hour">
        <RefreshCw size={11} className="animate-spin" /> Building…
      </span>
    )
  }
  if (status === 'deployed' && appt.preview_url) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <a href={appt.preview_url} target="_blank" rel="noreferrer" title={appt.preview_url}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50">
          <ExternalLink size={12} /> Preview
        </a>
        <button type="button" onClick={copy} title="Copy the preview link"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-50">
          <Copy size={12} /> {copied ? 'Copied' : 'Copy'}
        </button>
      </span>
    )
  }
  if (status === 'failed' || stalled) {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200" title={appt.site_error || 'Generation did not finish'}>
          {stalled ? 'Stalled' : 'Failed'}
        </span>
        <button type="button" onClick={regenerate} disabled={busy}
          className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50">
          {busy ? 'Starting…' : 'Retry'}
        </button>
        {err && <span className="text-[10px] text-rose-600">{err}</span>}
      </span>
    )
  }
  if (status === 'deleted') {
    return <span className="text-xs text-slate-400" title="Preview site was removed (no-show)">removed</span>
  }
  return <span className="text-slate-300">—</span>
}

const AppointmentsTable: React.FC<{ appts: Appt[]; onResult: (a: Appt) => void; onPaymentLink: (a: Appt) => void; onBrief?: (a: Appt) => void; emptyHint?: string }> = ({ appts, onResult, onPaymentLink, onBrief, emptyHint }) => {
  const now = Date.now()
  return (
    <div className={`overflow-hidden ${card}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-2.5">When</th><th className="px-4 py-2.5">Lead</th>
              <th className="px-4 py-2.5">Source</th><th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Website</th>
              <th className="px-4 py-2.5">Deal</th><th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appts.map((a) => {
              const needs = a.status === 'booked' && new Date(a.start_ts).getTime() < now && !a.is_test
              return (
                <tr key={a.id} className={needs ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'}>
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <div className="font-medium text-slate-800">{dateTime(a.start_ts)}</div>
                    <div className="text-xs text-slate-400">{timeAgo(a.start_ts)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar c={a.contacts} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900">{fullName(a.contacts)}</div>
                        {a.contacts?.business_name && (
                          <div className="truncate text-xs font-medium text-slate-500">
                            {a.contacts.business_name}
                            {a.contacts.business_type ? <span className="font-normal text-slate-400"> · {a.contacts.business_type}</span> : ''}
                          </div>
                        )}
                        <div className="truncate text-xs text-slate-400">{a.contacts?.email}{a.contacts?.phone ? ` · ${a.contacts.phone}` : ''}</div>
                        <Qualifiers c={a.contacts} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col items-start gap-1">
                      {a.calendar === 'contractor'
                        ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">Contractor</span>
                        : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">Main site</span>}
                      {a.isSocial
                        ? <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-200">Paid social</span>
                        : <span className="text-xs text-slate-400">Direct</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ${statusPill(a.status)}`}>{a.status.replace('_', '-')}</span>
                    {a.is_test && <TestBadge />}
                    {needs && <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600"><Clock size={11} /> needs result</div>}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <PreviewSiteCell appt={a} />
                  </td>
                  <td className="px-4 py-3 align-top text-slate-600">
                    {a.purchased_at
                      ? <span className="font-semibold text-emerald-600">{usd(a.upfront_value)}{a.recurring_value ? <span className="font-normal text-slate-400"> +{usd(a.recurring_value)}/{a.recurring_interval === 'annual' ? 'yr' : 'mo'}</span> : ''}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex items-center justify-end gap-2">
                      {onBrief && (
                        <button onClick={() => onBrief(a)} title="Pre-meeting sales brief for this appointment"
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition ${a.brief_status === 'ready' ? 'border-violet-300 text-violet-700 hover:bg-violet-50' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                          <FileText size={14} /> Brief
                        </button>
                      )}
                      {!a.is_test && (
                        <button onClick={() => onPaymentLink(a)} title="Create a Stripe payment link to send this client"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                          <Link2 size={14} /> Pay link
                        </button>
                      )}
                      <button onClick={() => onResult(a)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${needs ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                        {a.status === 'booked' ? 'Result' : 'Update'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {appts.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">{emptyHint ?? 'No appointments yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── CAPI log ───────────────────────────────────────────────────────────────────
const CapiLog: React.FC<{ data: AdminData; retrying: string | null; retryErr: Record<string, string>; onRetry: (id: string) => void }> =
  ({ data, retrying, retryErr, onRetry }) => (
    <div className={`${card} p-1.5`}>
      {data.capiEvents.length === 0 ? <p className="p-4 text-sm text-slate-400">No conversion events yet.</p> : (
        <ul className="divide-y divide-slate-100">{data.capiEvents.map((e) => {
          const offline = e.action_source === 'system_generated'
          const accepted = e.status === 'sent' && e.events_received === 1
          const unconfirmed = e.status === 'sent' && e.events_received !== 1
          const canRetry = e.status !== 'sent' && Boolean(e.appointment_id)
          const rowErr = retryErr[e.event_id] || e.error_message
          return (
            <li key={e.event_id} className="px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium text-slate-700">{e.event_name}{e.value ? ` · ${usd(e.value)}` : ''}</span>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${offline ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}`}>{offline ? 'offline' : 'website'}</span>
                  {e.is_test && <TestBadge />}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs">
                  {accepted && <span className="inline-flex items-center gap-1 font-medium text-emerald-600" title={`Meta confirmed: events_received ${e.events_received}`}><CheckCircle2 size={13} /> Meta got it</span>}
                  {unconfirmed && <span className="text-amber-600" title="Sent, but Meta did not confirm events_received">⚠ unconfirmed</span>}
                  {!accepted && !unconfirmed && <span className={e.status === 'error' ? 'font-medium text-rose-600' : 'font-medium text-amber-600'}>{e.status}</span>}
                  <span className="text-slate-400">{timeAgo(e.sent_at)}</span>
                  {canRetry && (
                    <button type="button" onClick={() => onRetry(e.event_id)} disabled={retrying === e.event_id}
                      className="rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                      {retrying === e.event_id ? '…' : 'Retry'}</button>
                  )}
                </span>
              </div>
              {rowErr && <p className="mt-0.5 truncate text-xs text-rose-600" title={rowErr}>{rowErr}</p>}
            </li>
          )
        })}</ul>
      )}
    </div>
  )

// ── customer overview ───────────────────────────────────────────────────────────
type CustomerSeg = 'leads' | 'showed' | 'no_show' | 'purchased'

const STAGE_PILL: Record<string, string> = {
  lead: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  booked: 'bg-sky-50 text-sky-700 ring-sky-200',
  showed: 'bg-violet-50 text-violet-700 ring-violet-200',
  'no-show': 'bg-rose-50 text-rose-700 ring-rose-200',
  purchased: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const LeadsTable: React.FC<{ contacts: AdminContact[]; stageOf: (email?: string | null) => string }> = ({ contacts, stageOf }) => (
  <div className={`overflow-hidden ${card}`}>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-2.5">Lead</th><th className="px-4 py-2.5">Journey</th>
            <th className="px-4 py-2.5">Source</th><th className="px-4 py-2.5">Location</th>
            <th className="px-4 py-2.5">Added</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {contacts.map((c) => {
            const stage = stageOf(c.email)
            const social = Boolean(c.fbclid) || /face|insta|fb|ig/.test((c.utm?.utm_source ?? '').toLowerCase())
            return (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar c={c} />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">{fullName(c)}</div>
                      {c.business_name && (
                        <div className="truncate text-xs font-medium text-slate-500">
                          {c.business_name}
                          {c.business_type ? <span className="font-normal text-slate-400"> · {c.business_type}</span> : ''}
                        </div>
                      )}
                      <div className="truncate text-xs text-slate-400">{c.email}{c.phone ? ` · ${c.phone}` : ''}</div>
                      <Qualifiers c={c} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ${STAGE_PILL[stage] ?? STAGE_PILL.lead}`}>{stage}</span>
                </td>
                <td className="px-4 py-3 align-middle">
                  {social
                    ? <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-200">Paid social</span>
                    : <span className="text-xs text-slate-400">Direct</span>}
                </td>
                <td className="px-4 py-3 align-middle text-xs text-slate-500">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 align-middle">
                  <div className="text-slate-700">{dateTime(c.created_at)}</div>
                  <div className="text-xs text-slate-400">{timeAgo(c.created_at)}</div>
                </td>
              </tr>
            )
          })}
          {contacts.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No leads yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
)

const CustomerOverview: React.FC<{ data: AdminData; onResult: (a: Appt) => void; onPaymentLink: (a: Appt) => void }> =
  ({ data, onResult, onPaymentLink }) => {
    const [seg, setSeg] = useState<CustomerSeg>('leads')
    const realAppts = useMemo(() => data.appointments.filter((a) => !a.is_test), [data])
    const stageOf = useCallback((email?: string | null) => {
      if (!email) return 'lead'
      const mine = realAppts.filter((a) => a.contacts?.email === email)
      if (mine.some((a) => a.purchased_at)) return 'purchased'
      if (mine.some((a) => a.status === 'showed')) return 'showed'
      if (mine.some((a) => a.status === 'no_show')) return 'no-show'
      if (mine.some((a) => a.status === 'booked')) return 'booked'
      return 'lead'
    }, [realAppts])

    const contacts = data.contactsList ?? []
    const showedAppts = useMemo(() => realAppts.filter((a) => a.status === 'showed' || a.purchased_at), [realAppts])
    const noShowAppts = useMemo(() => realAppts.filter((a) => a.status === 'no_show'), [realAppts])
    const purchasedAppts = useMemo(() => realAppts.filter((a) => a.purchased_at), [realAppts])

    const segs: { id: CustomerSeg; label: string; count: number; icon: React.ElementType }[] = [
      { id: 'leads', label: 'Leads', count: data.overall.leads, icon: Users },
      { id: 'showed', label: 'Showed', count: showedAppts.length, icon: CheckCircle2 },
      { id: 'no_show', label: 'No-shows', count: noShowAppts.length, icon: XCircle },
      { id: 'purchased', label: 'Purchased', count: purchasedAppts.length, icon: CircleDollarSign },
    ]

    return (
      <>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi icon={Users} label="Leads" value={data.overall.leads} sub="all contacts captured" accent="indigo" />
          <Kpi icon={CheckCircle2} label="Showed" value={showedAppts.length} sub={`${data.overall.showRate}% show rate`} accent="violet" />
          <Kpi icon={XCircle} label="No-shows" value={noShowAppts.length} accent="rose" />
          <Kpi icon={CircleDollarSign} label="Purchased" value={purchasedAppts.length} sub={`${usd(data.overall.revenue)} upfront`} accent="emerald" />
        </section>
        <div className="flex flex-wrap gap-2">
          {segs.map((s) => {
            const Icon = s.icon
            return (
              <button key={s.id} type="button" onClick={() => setSeg(s.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${seg === s.id ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>
                <Icon size={14} />{s.label}
                <span className={`rounded-full px-1.5 text-xs font-bold ${seg === s.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{s.count}</span>
              </button>
            )
          })}
        </div>
        {seg === 'leads' ? (
          data.contactsList
            ? <LeadsTable contacts={contacts} stageOf={stageOf} />
            : <div className={`${card} p-6 text-sm text-slate-400`}>Lead list unavailable — redeploy the <code className="rounded bg-slate-100 px-1">admin-data</code> function to enable it.</div>
        ) : (
          <AppointmentsTable
            appts={seg === 'showed' ? showedAppts : seg === 'no_show' ? noShowAppts : purchasedAppts}
            onResult={onResult} onPaymentLink={onPaymentLink}
            emptyHint={seg === 'showed' ? 'No meetings marked Showed yet.' : seg === 'no_show' ? 'No no-shows — nice.' : 'No purchases yet.'}
          />
        )}
      </>
    )
  }

// ── payment link modal ──────────────────────────────────────────────────────────
const PaymentLinkModal: React.FC<{ appt: Appt; onClose: () => void }> = ({ appt, onClose }) => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('Deposit — Ace Web Designers')
  const [creating, setCreating] = useState(false)
  const [url, setUrl] = useState('')
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState<string | undefined>()
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const hasPhone = Boolean(appt.contacts?.phone)

  const create = async (send: boolean) => {
    setErr('')
    const amt = Number(amount)
    if (!(amt > 0)) { setErr('Enter an amount greater than 0.'); return }
    setCreating(true)
    try {
      const res = await createPaymentLink({ appointmentId: appt.id, amount: amt, description: description.trim() || undefined, send })
      setUrl(res.url)
      setSent(res.sent)
      setSendError(res.sendError)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create link')
    } finally {
      setCreating(false)
    }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center gap-2"><Link2 className="text-indigo-500" size={20} /><h3 className="text-lg font-semibold text-slate-900">Send payment link</h3></div>
        <p className="mb-4 text-sm text-slate-500">{fullName(appt.contacts)}{appt.contacts?.phone ? ` · ${appt.contacts.phone}` : appt.contacts?.email ? ` · ${appt.contacts.email}` : ''}</p>

        {url ? (
          <div className="space-y-3">
            {sent ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                ✓ Texted to {fullName(appt.contacts)} via GHL. On payment, the Meta Purchase fires automatically.
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Link ready{sendError ? ` — auto-send didn't go through (${sendError}); copy & send it manually.` : ' — copy & send it to the client.'} On payment, the Meta Purchase fires automatically.
              </div>
            )}
            <div className="flex items-center gap-2">
              <input readOnly value={url} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700" />
              <button onClick={copy} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Copy size={14} /> {copied ? 'Copied' : 'Copy'}</button>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"><ExternalLink size={14} /> Open link</a>
            <div className="flex justify-end pt-1"><button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Done</button></div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Amount (USD)</span>
              <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" autoFocus />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <div className="flex gap-2">
                <button onClick={() => create(false)} disabled={creating} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  {creating ? '…' : 'Just create'}
                </button>
                <button onClick={() => create(true)} disabled={creating || !hasPhone} title={hasPhone ? 'Generate the link and text it to the client via GHL' : 'No phone on file — use Just create, then copy'}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                  <Link2 size={14} /> {creating ? 'Working…' : 'Create & text'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── sales brief modal ──────────────────────────────────────────────────────────
// Tailwind preflight strips element styles, so give the markdown explicit ones.
const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h2: (p) => <h2 className="mb-2 mt-5 text-sm font-bold uppercase tracking-wide text-slate-900 first:mt-0" {...p} />,
  h3: (p) => <h3 className="mb-1.5 mt-4 text-sm font-semibold text-slate-800" {...p} />,
  p: (p) => <p className="mb-2 text-sm leading-relaxed text-slate-700" {...p} />,
  ul: (p) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-slate-700" {...p} />,
  ol: (p) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-slate-700" {...p} />,
  li: (p) => <li className="leading-relaxed" {...p} />,
  strong: (p) => <strong className="font-semibold text-slate-900" {...p} />,
  a: (p) => <a className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer" {...p} />,
  table: (p) => <div className="mb-3 overflow-x-auto"><table className="min-w-full border-collapse text-sm" {...p} /></div>,
  th: (p) => <th className="border-b border-slate-300 px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" {...p} />,
  td: (p) => <td className="border-b border-slate-100 px-2 py-1.5 align-top text-slate-700" {...p} />,
}

const BriefModal: React.FC<{ appt: Appt; onClose: () => void; onRefresh: () => void }> = ({ appt, onClose, onRefresh }) => {
  const [busy, setBusy] = useState(false)
  const [started, setStarted] = useState(false)
  const [err, setErr] = useState('')

  const regenerate = async () => {
    setBusy(true); setErr('')
    try { await regenerateBrief(appt.id); setStarted(true) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Failed to start') }
    finally { setBusy(false) }
  }

  const status = appt.brief_status
  const name = fullName(appt.contacts)
  const business = [appt.contacts?.business_name, appt.contacts?.business_type].filter(Boolean).join(' · ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><FileText size={18} className="text-violet-500" /> Sales brief</h3>
            <p className="text-sm text-slate-500">{name}{business ? ` · ${business}` : ''} · {dateTime(appt.start_ts)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {started || status === 'queued' || status === 'generating' ? (
            <p className="flex items-center gap-2 text-sm text-slate-500"><RefreshCw size={14} className="animate-spin" /> Generating the brief — researching the niche and this business. Refresh in a minute or two.</p>
          ) : status === 'ready' && appt.sales_brief ? (
            <ReactMarkdown components={MD_COMPONENTS}>{appt.sales_brief}</ReactMarkdown>
          ) : status === 'failed' ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Brief generation failed{appt.brief_error ? `: ${appt.brief_error}` : ''}.
            </div>
          ) : (
            <p className="text-sm text-slate-500">No brief yet for this appointment.</p>
          )}
          {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <span className="text-xs text-slate-400">{appt.brief_generated_at ? `Generated ${timeAgo(appt.brief_generated_at)}` : ''}</span>
          <div className="flex gap-2">
            <button type="button" onClick={regenerate} disabled={busy || started}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> {started ? 'Started…' : 'Regenerate'}
            </button>
            <button type="button" onClick={() => { onRefresh(); onClose() }} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">Done</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── result modal ───────────────────────────────────────────────────────────────
const OutcomeLine: React.FC<{ label: string; o?: CapiOutcome }> = ({ label, o }) => {
  if (!o) return null
  const ok = o.ok
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
      {ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
      <span><span className="font-medium">{label}</span>{' — '}{ok ? (o.deduped ? 'already sent to Meta (deduped)' : 'sent to Meta') : `failed${o.error ? `: ${o.error}` : ''} · retry it from the CAPI log`}</span>
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
  const [asTest, setAsTest] = useState(Boolean(appt.is_test))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [outcome, setOutcome] = useState<ResultResponse | null>(null)
  const save = async () => {
    setBusy(true); setErr('')
    try {
      setOutcome(await submitResult({
        appointmentId: appt.id, result: kind,
        upfront: kind === 'purchase' ? Number(upfront) || 0 : undefined,
        recurring: kind === 'purchase' ? Number(recurring) || 0 : undefined,
        recurringInterval: kind === 'purchase' ? interval : undefined,
        plan: kind === 'purchase' ? plan : undefined,
        notes: notes || undefined,
        test: asTest || undefined,
      }))
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const name = fullName(appt.contacts)
  const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none'
  const tone: Record<ResultKind, string> = {
    showed: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    no_show: 'border-rose-500 bg-rose-50 text-rose-700',
    purchase: 'border-indigo-500 bg-indigo-50 text-indigo-700',
  }

  if (outcome) {
    const capi = outcome.capi
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onSaved}>
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-1 flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20} /><h3 className="text-lg font-semibold text-slate-900">Result saved</h3></div>
          <p className="text-sm text-slate-500">{name} · {dateTime(appt.start_ts)}</p>
          <div className="mt-4 space-y-2">
            {capi === 'none' ? (
              <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"><Info size={16} className="mt-0.5 shrink-0" /> Saved — no Meta event needed for a no-show.</div>
            ) : (<><OutcomeLine label="Showed → CompleteRegistration" o={capi.completeRegistration} /><OutcomeLine label="Purchase" o={capi.purchase} /></>)}
            {(appt.is_test || asTest) && <p className="text-xs text-slate-400">Test booking — events were sent to Meta Test Events only.</p>}
          </div>
          <div className="mt-5 flex justify-end"><button type="button" onClick={onSaved} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">Done</button></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900">Result meeting</h3>
        <p className="text-sm text-slate-500">{name} · {dateTime(appt.start_ts)}{appt.is_test && <TestBadge />}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(['showed', 'no_show', 'purchase'] as ResultKind[]).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${kind === k ? tone[k] : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{k === 'no_show' ? 'No-show' : k}</button>
          ))}
        </div>
        {kind === 'purchase' && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-600">Upfront ($)<input type="number" min="0" step="0.01" value={upfront} onChange={(e) => setUpfront(e.target.value)} className={inputCls} /></label>
              <label className="text-sm text-slate-600">Recurring ($)<input type="number" min="0" step="0.01" value={recurring} onChange={(e) => setRecurring(e.target.value)} className={inputCls} /></label>
            </div>
            <label className="block text-sm text-slate-600">Billing interval
              <select value={interval} onChange={(e) => setIntervalVal(e.target.value as 'monthly' | 'annual' | 'one_time')} className={inputCls}>
                <option value="monthly">Monthly</option><option value="annual">Annual</option><option value="one_time">One-time only</option>
              </select>
            </label>
            <label className="block text-sm text-slate-600">Plan / package<input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="e.g. Growth plan" className={inputCls} /></label>
          </div>
        )}
        <label className="mt-3 block text-sm text-slate-600">Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} /></label>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={asTest} disabled={Boolean(appt.is_test)} onChange={(e) => setAsTest(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
          Test — send to Meta Test Events only & exclude from stats{appt.is_test ? ' (already a test booking)' : ''}
        </label>
        {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={save} disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? 'Saving…' : kind === 'no_show' ? 'Save (no Meta event)' : 'Save & send to Meta'}</button>
        </div>
      </div>
    </div>
  )
}

type Tab = 'overview' | 'customers' | 'website' | 'conversions' | 'social'

// ── dashboard ───────────────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [data, setData] = useState<AdminData | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadedAt, setLoadedAt] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [resulting, setResulting] = useState<Appt | null>(null)
  const [payLinking, setPayLinking] = useState<Appt | null>(null)
  const [briefing, setBriefing] = useState<Appt | null>(null)
  const [showResolved, setShowResolved] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) { setAuthReady(true); return }
    supabase.auth.getSession().then(({ data: d }) => { setSession(d.session); setAuthReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('')
    try { setData(await fetchAdminData()); setLoadedAt(Date.now()) }
    catch (e) { setLoadErr(e instanceof Error ? e.message : 'Failed to load') } finally { setLoading(false) }
  }, [])

  const [discarding, setDiscarding] = useState(false)
  const discardTests = useCallback(async () => {
    if (!window.confirm('Permanently delete ALL test appointments and their conversion-log rows? (Contacts are kept.)')) return
    setDiscarding(true)
    try { await discardTestData(); await load() }
    catch (e) { setLoadErr(e instanceof Error ? e.message : 'Discard failed') }
    finally { setDiscarding(false) }
  }, [load])

  const [retrying, setRetrying] = useState<string | null>(null)
  const [retryErr, setRetryErr] = useState<Record<string, string>>({})
  const retry = useCallback(async (eventId: string) => {
    setRetrying(eventId); setRetryErr((p) => ({ ...p, [eventId]: '' }))
    try {
      const o = await retryCapiEvent(eventId)
      if (!o.ok) setRetryErr((p) => ({ ...p, [eventId]: o.error || 'Meta rejected the event' }))
    } catch (e) { setRetryErr((p) => ({ ...p, [eventId]: e instanceof Error ? e.message : 'Retry failed' })) }
    finally { setRetrying(null); load() }
  }, [load])

  useEffect(() => { if (session) load() }, [session, load])

  const needsResult = useMemo(
    () => (data?.appointments ?? []).filter((a) => a.status === 'booked' && new Date(a.start_ts).getTime() < Date.now() && !a.is_test),
    [data],
  )
  const upcoming = useMemo(
    () => (data?.appointments ?? []).filter((a) => a.status === 'booked' && new Date(a.start_ts).getTime() >= Date.now() && !a.is_test).length,
    [data],
  )
  const socialPct = useMemo(() => (data && data.overall.bookings ? Math.round((data.social.leads / data.overall.bookings) * 100) : 0), [data])
  const websiteAppts = useMemo(
    () => showResolved ? (data?.appointments ?? []) : (data?.appointments ?? []).filter((a) => a.status === 'booked'),
    [data, showResolved],
  )

  if (!authReady) return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
  if (!isSupabaseConfigured) return <div className="flex min-h-screen items-center justify-center text-rose-600">Supabase is not configured.</div>
  if (!session) return <LoginCard />

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'customers', label: 'Customer Overview', icon: <Users size={16} /> },
    { id: 'website', label: 'Website', icon: <Globe size={16} /> },
    { id: 'conversions', label: 'Conversion Log', icon: <Activity size={16} /> },
    { id: 'social', label: 'Social', icon: <Share2 size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm"><Sparkles size={16} /></span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Ace Web Designers</p>
              <p className="text-[11px] text-slate-400">Admin dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loadedAt && <span className="hidden text-xs text-slate-400 sm:inline">Updated {timeAgo(new Date(loadedAt).toISOString())}</span>}
            <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Refresh</span></button>
            <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"><LogOut size={14} /> <span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 sm:px-6">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t.icon}{t.label}</button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
        {loadErr === 'not-admin' ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">This account isn't authorized. Sign out and use an approved email, or add it to <code className="rounded bg-amber-100 px-1">ADMIN_EMAILS</code>.</div>
        ) : loadErr ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{loadErr}</div>
        ) : !data ? (
          <div className="grid gap-3 sm:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className={`${card} h-24 animate-pulse`} />)}</div>
        ) : tab === 'overview' ? (
          <>
            <HealthBanner data={data} />
            {needsResult.length > 0 && (
              <button onClick={() => { setTab('website'); setShowResolved(false) }} className="flex w-full items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3.5 text-left transition hover:bg-indigo-100">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-white"><Clock size={18} /></span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-indigo-900">{needsResult.length} meeting{needsResult.length > 1 ? 's' : ''} to result</span>
                  <span className="block text-xs text-indigo-600">Mark Showed / No-show / Purchase to fire the offline conversions.</span>
                </span>
                <ArrowRight size={18} className="text-indigo-500" />
              </button>
            )}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Kpi icon={Users} label="Leads" value={data.overall.leads} accent="indigo" />
              <Kpi icon={CalendarCheck} label="Booked" value={data.overall.bookings} sub={`${upcoming} upcoming`} accent="sky" />
              <Kpi icon={CheckCircle2} label="Showed" value={data.overall.showed} sub={`${data.overall.showRate}% show rate`} accent="violet" />
              <Kpi icon={Target} label="Purchased" value={data.overall.purchased} sub={`${data.overall.closeRate}% close rate`} accent="amber" />
              <Kpi icon={CircleDollarSign} label="Revenue" value={usd(data.overall.revenue)} sub="upfront collected" accent="emerald" />
              <Kpi icon={Repeat} label="MRR" value={usd(data.overall.mrr)} sub="monthly recurring" accent="emerald" />
            </section>
            <div className="grid gap-4 lg:grid-cols-2">
              <VisualFunnel leads={data.overall.leads} bookings={data.overall.bookings} showed={data.overall.showed} purchased={data.overall.purchased} />
              <div className={`${card} flex flex-col p-5`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Conversion health</p>
                  <Wifi size={15} className="text-slate-300" />
                </div>
                <div className="grid flex-1 grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-50 p-4"><p className="text-2xl font-bold text-emerald-600">{data.overall.capiSent}</p><p className="text-xs text-emerald-700">conversions accepted by Meta</p></div>
                  <div className={`rounded-xl p-4 ${data.overall.capiError ? 'bg-rose-50' : 'bg-slate-50'}`}><p className={`text-2xl font-bold ${data.overall.capiError ? 'text-rose-600' : 'text-slate-400'}`}>{data.overall.capiError}</p><p className={`text-xs ${data.overall.capiError ? 'text-rose-700' : 'text-slate-400'}`}>failed{data.overall.capiError ? ' — retry in Website tab' : ''}</p></div>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400"><TrendingUp size={13} /> {socialPct}% of bookings come from paid social</p>
              </div>
            </div>
            {data.serverEvents && <ConversionFlow se={data.serverEvents} />}
          </>
        ) : tab === 'customers' ? (
          <CustomerOverview data={data} onResult={setResulting} onPaymentLink={setPayLinking} />
        ) : tab === 'conversions' ? (
          <>
            {data.serverEvents && <ConversionFlow se={data.serverEvents} />}
            <section>
              <h2 className={`${sectionTitle} mb-2`}>Recent conversion log</h2>
              <CapiLog data={data} retrying={retrying} retryErr={retryErr} onRetry={retry} />
            </section>
          </>
        ) : tab === 'website' ? (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi icon={Users} label="Leads" value={data.website.leads} accent="indigo" />
              <Kpi icon={CalendarCheck} label="Booked" value={data.website.bookings} accent="sky" />
              <Kpi icon={CheckCircle2} label="Show rate" value={`${data.website.showRate}%`} accent="violet" />
              <Kpi icon={Target} label="Close rate" value={`${data.website.closeRate}%`} accent="emerald" />
            </section>
            {data.serverEvents && <ConversionFlow se={data.serverEvents} />}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className={sectionTitle}>Appointments{needsResult.length > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{needsResult.length} to result</span>}</h2>
                <div className="flex items-center gap-3">
                  {websiteAppts.some((a) => a.is_test) && (
                    <button onClick={discardTests} disabled={discarding} className="text-xs font-medium text-rose-500 hover:underline disabled:opacity-50">
                      {discarding ? 'Discarding…' : 'Discard test data'}
                    </button>
                  )}
                  <button onClick={() => setShowResolved((v) => !v)} className="text-xs font-medium text-indigo-600 hover:underline">{showResolved ? 'Show only un-resulted' : 'Show all'}</button>
                </div>
              </div>
              <AppointmentsTable appts={websiteAppts} onResult={setResulting} onPaymentLink={setPayLinking} onBrief={setBriefing} emptyHint={showResolved ? 'No appointments yet.' : 'Nothing waiting to be resulted. 🎉'} />
            </section>
            <section>
              <h2 className={`${sectionTitle} mb-2`}>Recent messages (GHL)</h2>
              <div className={`${card} p-1.5`}>
                {data.ghlMessages.length === 0 ? <p className="p-4 text-sm text-slate-400">No messages logged yet.</p> : (
                  <ul className="divide-y divide-slate-100">{data.ghlMessages.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="capitalize text-slate-700">{m.channel || 'message'}{m.message_type ? <span className="text-slate-400"> · {m.message_type}</span> : ''}</span>
                      <span className="flex items-center gap-2 text-xs">
                        <span className={/sent|deliver/i.test(m.status ?? '') ? 'font-medium text-emerald-600' : /fail|error/i.test(m.status ?? '') ? 'font-medium text-rose-600' : 'text-slate-400'}>{m.status || '—'}</span>
                        <span className="text-slate-400">{timeAgo(m.received_at)}</span>
                      </span>
                    </li>
                  ))}</ul>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <div className={`${card} flex items-center gap-3 p-4`}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"><Share2 size={18} /></span>
              <p className="text-sm text-slate-600">Leads driven by Facebook / Instagram ads (matched via click ID + UTM). <span className="font-semibold text-slate-900">{socialPct}%</span> of all bookings came from paid social.</p>
            </div>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi icon={Users} label="Social leads" value={data.social.leads} accent="violet" />
              <Kpi icon={CheckCircle2} label="Showed" value={data.social.showed} accent="sky" />
              <Kpi icon={Target} label="Purchased" value={data.social.purchased} accent="amber" />
              <Kpi icon={CircleDollarSign} label="Social revenue" value={usd(data.social.revenue)} accent="emerald" />
            </section>
            <VisualFunnel leads={data.social.leads} bookings={data.social.leads} showed={data.social.showed} purchased={data.social.purchased} title="Paid-social funnel" />
            <section>
              <h2 className={`${sectionTitle} mb-2`}>By campaign (utm_campaign)</h2>
              <div className={`overflow-hidden ${card}`}>
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-2.5">Campaign</th><th className="px-4 py-2.5">Leads</th><th className="px-4 py-2.5">Purchased</th><th className="px-4 py-2.5">Revenue</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.social.byCampaign.map((c) => (
                      <tr key={c.campaign} className="hover:bg-slate-50/60"><td className="px-4 py-2.5 font-medium text-slate-800">{c.campaign}</td><td className="px-4 py-2.5">{c.leads}</td><td className="px-4 py-2.5">{c.purchased}</td><td className="px-4 py-2.5 font-semibold text-emerald-600">{usd(c.revenue)}</td></tr>
                    ))}
                    {data.social.byCampaign.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">No paid-social leads yet. Add <code className="rounded bg-slate-100 px-1">utm_source=facebook</code> &amp; <code className="rounded bg-slate-100 px-1">utm_campaign</code> to your ad URLs.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {resulting && <ResultModal appt={resulting} onClose={() => setResulting(null)} onSaved={() => { setResulting(null); load() }} />}
      {payLinking && <PaymentLinkModal appt={payLinking} onClose={() => setPayLinking(null)} />}
      {briefing && <BriefModal appt={briefing} onClose={() => setBriefing(null)} onRefresh={load} />}
    </div>
  )
}

export default AdminDashboard
