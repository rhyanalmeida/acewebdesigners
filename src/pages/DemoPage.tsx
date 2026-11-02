/**
 * DemoPage — the outbound cold-email funnel's personalized landing page at
 * /demo/<token>. The token (32 hex chars from the prospect's email link) is the
 * only credential; everything goes through the `demo-site` / `domain-search` /
 * `create-subscription` Edge Functions.
 *
 * Flow (reply-gated, 2026-09-22): the link is only ever sent AFTER the site is built
 * (instantly-webhook auto-builds on a "yes" reply; the poller sends the link once
 * deployed), so a prospect normally lands straight on Ready. A link opened early
 * (status none) starts the build the moment it is opened — the click on the email link
 * is the interest signal (owner, 2026-11-02), and the build is the FAST single-page
 * Haiku path (~50s, ~$0.005), so nobody who never clicks costs anything. Generating
 * polls every 4s. Copy lives in config/outboundPlan.ts.
 *
 * Ready (2026-11-01 redesign — "a contractor who likes it should have nothing left
 * to figure out"): offer summary + price above the fold, device-toggle preview,
 * then ONE go-live card: the domain is pre-suggested from the business name and
 * auto-checked on load (the old flow made them type + click Check before the pay
 * button would enable), pay button, then a what-happens-next timeline, what the
 * plan covers after launch (updates / hosting / cancel), and a FAQ. A sticky
 * bottom bar keeps the price + CTA in reach while they scroll the preview. The
 * customer still confirms the EXACT domain before paying — registrations are
 * non-refundable.
 *
 * Purchased: polls domain_status and renders a live progress stepper
 * (paid → registering → connecting → securing → live, with the live link), plus
 * the unlimited-updates support line and the post-purchase review ask.
 *
 * NO Meta pixel events here — this funnel is cold-email driven, not ad-driven.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Mail,
  Monitor,
  Pencil,
  Smartphone,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import {
  AFTER_LIVE,
  BUILDING_COPY,
  FAQ,
  GO_LIVE_STEPS,
  GOOGLE_REVIEW_URL,
  OUTBOUND_PLAN,
  SUPPORT_EMAIL,
} from '../config/outboundPlan'

interface DemoState {
  businessName: string
  firstName: string | null
  city: string | null
  state: string | null
  siteStatus: string
  previewUrl: string | null
  purchased: boolean
  chosenDomain: string | null
  domainStatus: string | null
}

type DomainCheck = { domain: string; available: boolean; price?: string } | null

const POLL_MS = 4000
const PURCHASED_POLL_MS = 10000

function tokenFromPath(): string {
  const m = window.location.pathname.match(/\/demo\/([0-9a-f]{32})/i)
  return m ? m[1].toLowerCase() : ''
}

/** Mirror of domain-search's slug (minus legal suffixes) so the suggestion shown == the domain checked. */
function suggestDomain(businessName: string): string {
  return businessName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\b(llc|inc|co|corp|ltd)\b\.?/g, '')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** domain_status → which step of the go-live stepper is active (0-based). */
function provisioningStep(status: string | null): number {
  switch (status) {
    case 'dns_set':
      return 2
    case 'attached':
    case 'ssl_pending':
      return 3
    case 'live':
      return 4
    default:
      return 1 // paid; registering (or the webhook hasn't stamped the row yet)
  }
}

const PROVISIONING_STEPS = [
  'Payment received',
  'Registering your domain',
  'Connecting it to your site',
  'Securing it (SSL)',
  'Live',
]

export default function DemoPage() {
  const token = useRef(tokenFromPath()).current
  const [state, setState] = useState<DemoState | null>(null)
  const [notFound, setNotFound] = useState(!token)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState('')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // domain picker
  const [domainQuery, setDomainQuery] = useState('')
  const [editingDomain, setEditingDomain] = useState(false)
  const [checking, setChecking] = useState(false)
  const [domainResult, setDomainResult] = useState<DomainCheck>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const autoChecked = useRef(false)

  const fetchState = useCallback(
    async (action?: 'build') => {
      const { data, error: invErr } = await supabase.functions.invoke('demo-site', {
        body: action ? { token, action } : { token },
      })
      if (invErr || !(data as { ok?: boolean } | null)?.ok) {
        if (!state) setNotFound(true)
        return null
      }
      const d = data as unknown as DemoState & { ok: boolean }
      setState(d)
      return d
    },
    [token, state],
  )

  // initial load
  useEffect(() => {
    if (token) void fetchState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Link opened before a build exists: the click IS the interest signal — start the
  // fast build on open (server gate makes repeat opens free; ~$0.005 per first open).
  useEffect(() => {
    if (state?.siteStatus === 'none' && !building && !error) void startBuild()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.siteStatus])

  // poll while generating
  useEffect(() => {
    if (state?.siteStatus !== 'generating') return
    const t = setInterval(() => void fetchState(), POLL_MS)
    return () => clearInterval(t)
  }, [state?.siteStatus, fetchState])

  const purchasedFromUrl =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('purchased') === '1'
  const showPurchased = Boolean(state && (state.purchased || purchasedFromUrl))

  // After purchase: poll until the domain is live (or failed). Also covers the
  // gap between the ?purchased=1 redirect and the Stripe webhook stamping the row.
  useEffect(() => {
    if (!showPurchased) return
    const st = state?.domainStatus
    if (st === 'live' || st === 'failed' || st === 'cancelled') return
    const t = setInterval(() => void fetchState(), PURCHASED_POLL_MS)
    return () => clearInterval(t)
  }, [showPurchased, state?.domainStatus, fetchState])

  const startBuild = useCallback(async () => {
    if (building) return
    setBuilding(true)
    setError('')
    try {
      const d = await fetchState('build')
      if (!d) setError("Couldn't start the build — please try again.")
    } finally {
      setBuilding(false)
    }
  }, [building, fetchState])

  const checkDomain = useCallback(
    async (query: string) => {
      if (checking || query.trim().length < 3) return
      setChecking(true)
      setError('')
      setDomainResult(null)
      try {
        const { data, error: invErr } = await supabase.functions.invoke('domain-search', {
          body: { token, query },
        })
        const d = data as { domain?: string; available?: boolean; price?: string; error?: string } | null
        if (invErr || !d?.domain) {
          setError(d?.error ?? 'Domain check failed — please try again.')
          setEditingDomain(true)
          return
        }
        setDomainResult({ domain: d.domain, available: Boolean(d.available), price: d.price })
        setEditingDomain(!d.available) // a taken suggestion drops straight into edit mode
      } catch {
        setError('Domain check failed — please try again.')
        setEditingDomain(true)
      } finally {
        setChecking(false)
      }
    },
    [checking, token],
  )

  // Ready: suggest a domain from the business name and check it once, automatically.
  useEffect(() => {
    if (!state || state.siteStatus !== 'deployed' || showPurchased || autoChecked.current) return
    autoChecked.current = true
    const suggestion = suggestDomain(state.businessName)
    setDomainQuery(suggestion)
    if (suggestion.length >= 3) void checkDomain(suggestion)
    else setEditingDomain(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.siteStatus, showPurchased])

  const checkout = useCallback(async () => {
    if (checkingOut || !domainResult?.available) return
    setCheckingOut(true)
    setError('')
    try {
      const { data, error: invErr } = await supabase.functions.invoke('create-subscription', {
        body: { plan: OUTBOUND_PLAN.key, prospectToken: token, domain: domainResult.domain },
      })
      const d = data as { url?: string; error?: string; domainTaken?: boolean } | null
      if (invErr || !d?.url) {
        if (d?.domainTaken) {
          setDomainResult({ ...domainResult, available: false })
          setEditingDomain(true)
          setError('That domain was just taken — please pick another.')
        } else {
          setError(d?.error ?? 'Checkout is temporarily unavailable — please try again shortly.')
        }
        return
      }
      window.location.href = d.url // hosted Stripe Checkout
    } catch {
      setError('Could not start checkout — please try again.')
    } finally {
      setCheckingOut(false)
    }
  }, [checkingOut, domainResult, token])

  const scrollToGoLive = () =>
    document.getElementById('go-live')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const isReady = Boolean(state && !showPurchased && state.siteStatus === 'deployed' && state.previewUrl)
  const price = `$${OUTBOUND_PLAN.monthly}/mo`
  const cityHint = (state?.city ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

  return (
    <div className="min-h-screen bg-ink-950 text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white">
      <Helmet>
        <title>Your Website Preview — Ace Web Designers</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <span className="font-semibold tracking-tight">Ace Web Designers</span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1.5 truncate"
          >
            <Mail className="w-4 h-4 shrink-0" /> <span className="truncate">{SUPPORT_EMAIL}</span>
          </a>
        </div>
      </header>

      <main className={`max-w-5xl mx-auto px-5 py-10 sm:py-14 ${isReady ? 'pb-28' : ''}`}>
        {notFound && (
          <div className="text-center py-24">
            <h1 className="text-2xl font-bold mb-3">This link isn't valid</h1>
            <p className="text-white/60">
              Double-check the link from your email, or write us at{' '}
              <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>
        )}

        {!notFound && !state && (
          <div className="flex items-center justify-center py-24 text-white/60">
            <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading…
          </div>
        )}

        {state && showPurchased && <PurchasedView state={state} />}

        {state && !showPurchased && (
          <>
            {/* ── Starting / building: the build began when the link was opened ── */}
            {(state.siteStatus === 'none' || state.siteStatus === 'generating') && (
              <div className="text-center py-20 max-w-xl mx-auto">
                {error ? (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-3">{BUILDING_COPY.failed}</h1>
                    <p className="text-white/70 mb-6">{error}</p>
                    <button
                      onClick={() => void startBuild()}
                      disabled={building}
                      className="inline-flex items-center justify-center gap-2 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
                    >
                      {building ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                      {BUILDING_COPY.retry}
                    </button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-signal-400 mb-6" />
                    <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                      {BUILDING_COPY.heading.replace('{business}', state.businessName)}
                    </h1>
                    <p className="text-white/70">{BUILDING_COPY.body}</p>
                  </>
                )}
              </div>
            )}

            {/* ── Failed: never a self-serve retry — staff are alerted ─────── */}
            {state.siteStatus === 'failed' && (
              <div className="text-center py-20 max-w-xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                  {state.businessName}'s preview is on its way
                </h1>
                <p className="text-white/70">
                  We hit a snag on our end getting it published and our team has been notified. We'll email you the
                  finished preview shortly — no need to do anything.
                </p>
              </div>
            )}

            {/* ── Ready ─────────────────────────────────────────────────────── */}
            {isReady && state.previewUrl && (
              <div>
                {/* offer summary — the whole deal in three lines, above the fold */}
                <div className="text-center mb-8 max-w-2xl mx-auto">
                  <p className="text-signal-300 text-sm font-semibold uppercase tracking-wider mb-3">
                    Your preview is ready
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-4">Here's {state.businessName}'s new website</h1>
                  <p className="text-white/70 text-lg">
                    Like it? <span className="text-white font-semibold">{price}</span> takes it live on your own .com,
                    usually within the hour. Domain, hosting and every future update are included.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={scrollToGoLive}
                      className="inline-flex items-center justify-center gap-2 bg-signal-500 hover:bg-signal-400 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
                    >
                      Take it live — {price} <ArrowRight className="w-5 h-5" />
                    </button>
                    <a
                      href={state.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 font-medium px-6 py-3.5 rounded-xl transition-colors"
                    >
                      Open full screen <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* preview with device toggle */}
                <div className="flex items-center justify-between mb-3 text-sm gap-3">
                  <span className="text-white/50">Live preview — scroll around inside it</span>
                  <div className="inline-flex rounded-lg border border-white/15 p-0.5 shrink-0">
                    <button
                      onClick={() => setDevice('desktop')}
                      aria-pressed={device === 'desktop'}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md ${
                        device === 'desktop' ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-4 h-4" /> Desktop
                    </button>
                    <button
                      onClick={() => setDevice('mobile')}
                      aria-pressed={device === 'mobile'}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md ${
                        device === 'mobile' ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" /> Phone
                    </button>
                  </div>
                </div>
                <div
                  className={`mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-14 bg-white transition-all ${
                    device === 'mobile' ? 'max-w-[390px]' : ''
                  }`}
                >
                  <iframe
                    src={state.previewUrl}
                    title={`${state.businessName} website preview`}
                    className={device === 'mobile' ? 'w-full h-[720px]' : 'w-full h-[70vh]'}
                  />
                </div>

                {/* ── go live: ONE card — domain pre-filled, pay, what's included ── */}
                <section id="go-live" className="scroll-mt-6 max-w-3xl mx-auto">
                  <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="p-7 sm:p-8 border-b border-white/10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">Take {state.businessName} live</h2>
                        <p className="text-white/60">{OUTBOUND_PLAN.tagline}</p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div>
                          <span className="text-4xl font-bold">${OUTBOUND_PLAN.monthly}</span>
                          <span className="text-white/60">/month</span>
                        </div>
                        <p className="text-white/50 text-xs">No setup fee · no contract</p>
                      </div>
                    </div>

                    <div className="p-7 sm:p-8 grid md:grid-cols-5 gap-8">
                      {/* domain + pay */}
                      <div className="md:col-span-3">
                        <h3 className="font-semibold flex items-center gap-2 mb-1">
                          <Globe className="w-4 h-4 text-signal-300" /> 1. Your domain
                        </h3>
                        <p className="text-white/60 text-sm mb-4">
                          Registered for you the moment you subscribe — included.
                        </p>

                        {checking && !domainResult && (
                          <div className="flex items-center gap-2 text-white/70 text-sm rounded-xl border border-white/10 px-4 py-3 mb-4">
                            <Loader2 className="w-4 h-4 animate-spin" /> Checking {domainQuery || 'your domain'}.com…
                          </div>
                        )}

                        {domainResult?.available && !editingDomain && (
                          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 mb-4 flex items-center justify-between gap-3">
                            <div className="text-sm text-emerald-200">
                              <Check className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                              <span className="font-semibold text-white">{domainResult.domain}</span> is available
                            </div>
                            <button
                              onClick={() => setEditingDomain(true)}
                              className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white shrink-0"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Change
                            </button>
                          </div>
                        )}

                        {(editingDomain || (!checking && !domainResult)) && (
                          <div className="mb-4">
                            <div className="flex gap-2">
                              <div className="flex-1 flex items-center rounded-xl border border-white/15 bg-ink-900 focus-within:border-signal-500 min-w-0">
                                <input
                                  value={domainQuery}
                                  onChange={(e) => {
                                    setDomainQuery(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                                    setDomainResult(null)
                                  }}
                                  onKeyDown={(e) => e.key === 'Enter' && void checkDomain(domainQuery)}
                                  placeholder="yourbusinessname"
                                  aria-label="Domain name"
                                  className="flex-1 bg-transparent px-4 py-3 text-white outline-none min-w-0"
                                />
                                <span className="pr-4 text-white/50">.com</span>
                              </div>
                              <button
                                onClick={() => void checkDomain(domainQuery)}
                                disabled={checking || domainQuery.trim().length < 3}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-3 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
                              >
                                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Check
                              </button>
                            </div>
                            {domainResult && !domainResult.available && (
                              <p className="text-amber-300 text-sm mt-2">
                                <span className="font-semibold">{domainResult.domain}</span> is taken — try adding your
                                town or trade
                                {cityHint ? (
                                  <>
                                    {' '}
                                    (for example <span className="text-white">{domainQuery}{cityHint}.com</span>)
                                  </>
                                ) : null}
                                .
                              </p>
                            )}
                            {domainResult?.available && editingDomain && (
                              <p className="text-emerald-300 text-sm mt-2">
                                <span className="font-semibold text-white">{domainResult.domain}</span> is available.{' '}
                                <button onClick={() => setEditingDomain(false)} className="underline">
                                  Use it
                                </button>
                              </p>
                            )}
                          </div>
                        )}

                        <h3 className="font-semibold flex items-center gap-2 mb-1 mt-6">
                          <Lock className="w-4 h-4 text-signal-300" /> 2. Secure checkout
                        </h3>
                        <p className="text-white/60 text-sm mb-4">{price} on Stripe. Card on file, cancel anytime by email.</p>
                        <button
                          onClick={() => void checkout()}
                          disabled={!domainResult?.available || checkingOut}
                          className="w-full inline-flex items-center justify-center gap-2 bg-signal-500 hover:bg-signal-400 disabled:opacity-50 text-white font-semibold px-6 py-4 rounded-xl transition-colors text-lg"
                        >
                          {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                          Take my site live — {price}
                        </button>
                        <p className="text-white/40 text-xs mt-3">
                          Secure checkout via Stripe. Domain registrations are non-refundable, so please double-check
                          the spelling of <span className="text-white/70">{domainResult?.domain ?? 'your domain'}</span>{' '}
                          above.
                        </p>
                        {error && <p className="text-amber-400 text-sm mt-3">{error}</p>}
                      </div>

                      {/* what's included */}
                      <div className="md:col-span-2">
                        <h3 className="font-semibold mb-3">Everything included</h3>
                        <ul className="space-y-2.5">
                          {OUTBOUND_PLAN.features.map((f) => (
                            <li key={f} className="flex gap-2.5 text-sm text-white/80">
                              <Check className="w-4 h-4 text-signal-300 shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <p className="text-white/50 text-sm mt-5">
                          Want something changed first? Reply to the email this link came from, or write{' '}
                          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline text-white/80">
                            {SUPPORT_EMAIL}
                          </a>
                          . You only pay when you're happy with it.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* what happens next */}
                  <h2 className="text-2xl font-bold mt-14 mb-6 text-center">What happens when you click pay</h2>
                  <ol className="grid sm:grid-cols-3 gap-4">
                    {GO_LIVE_STEPS.map((s, i) => (
                      <li key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="w-8 h-8 rounded-full bg-signal-500/20 text-signal-200 font-bold flex items-center justify-center mb-3">
                          {i + 1}
                        </div>
                        <h3 className="font-semibold mb-1">{s.title}</h3>
                        <p className="text-white/60 text-sm">{s.body}</p>
                      </li>
                    ))}
                  </ol>

                  {/* after it's live */}
                  <h2 className="text-2xl font-bold mt-14 mb-2 text-center">After it's live</h2>
                  <p className="text-white/60 text-center mb-6">
                    The monthly price isn't just hosting — it's us looking after the site for you.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {AFTER_LIVE.map((s) => (
                      <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h3 className="font-semibold mb-1">{s.title}</h3>
                        <p className="text-white/60 text-sm">{s.body}</p>
                      </div>
                    ))}
                  </div>

                  {/* FAQ */}
                  <h2 className="text-2xl font-bold mt-14 mb-6 text-center">Common questions</h2>
                  <div className="divide-y divide-white/10 border-y border-white/10">
                    {FAQ.map((f, i) => (
                      <div key={f.q}>
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          aria-expanded={openFaq === i}
                          className="w-full flex items-center justify-between gap-4 py-4 text-left font-medium hover:text-white/90"
                        >
                          {f.q}
                          <ChevronDown
                            className={`w-5 h-5 text-white/50 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {openFaq === i && <p className="pb-4 text-white/60 text-sm -mt-1">{f.a}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-12">
                    <button
                      onClick={scrollToGoLive}
                      className="inline-flex items-center justify-center gap-2 bg-signal-500 hover:bg-signal-400 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
                    >
                      Take {state.businessName} live — {price} <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="text-white/40 text-sm mt-3">Cancel anytime. Questions? {SUPPORT_EMAIL}</p>
                  </div>
                </section>
              </div>
            )}

            {!isReady && error && <p className="text-center text-amber-400 mt-8">{error}</p>}
          </>
        )}
      </main>

      {/* sticky CTA — keeps price + action in reach while they scroll the preview */}
      {isReady && (
        <div className="fixed bottom-0 inset-x-0 z-20 border-t border-white/10 bg-ink-950/90 backdrop-blur">
          <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
            <div className="text-sm min-w-0">
              <span className="font-semibold">{price}</span>
              <span className="text-white/60 hidden sm:inline">
                {' '}
                · domain, hosting + unlimited updates included · cancel anytime
              </span>
              <span className="text-white/60 sm:hidden"> · everything included</span>
            </div>
            <button
              onClick={scrollToGoLive}
              className="inline-flex items-center gap-2 bg-signal-500 hover:bg-signal-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              Take it live <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-5xl mx-auto px-5 py-6 text-xs text-white/40 flex flex-col sm:flex-row gap-2 sm:justify-between">
          <span>© {new Date().getFullYear()} Ace Web Designers</span>
          <a href="https://acewebdesigners.com/privacy" className="hover:text-white/70">
            Privacy
          </a>
        </div>
      </footer>
    </div>
  )
}

function PurchasedView({ state }: { state: DemoState }) {
  const status = state.domainStatus
  const failed = status === 'failed' || status === 'cancelled'
  const live = status === 'live'
  const active = provisioningStep(status)
  const liveUrl = state.chosenDomain ? `https://${state.chosenDomain}` : null

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 mb-5">
          <Check className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold mb-3">
          {live ? `${state.businessName} is live!` : `You're in${state.firstName ? `, ${state.firstName}` : ''}!`}
        </h1>
        <p className="text-white/70">
          {live && liveUrl ? (
            <>
              Your website is up at{' '}
              <a href={liveUrl} target="_blank" rel="noreferrer" className="font-semibold text-white underline">
                {state.chosenDomain}
              </a>
              .
            </>
          ) : state.chosenDomain ? (
            <>
              Payment received. <span className="font-semibold text-white">{state.chosenDomain}</span> is being
              registered and connected right now — usually live within the hour. Nothing for you to do.
            </>
          ) : (
            'Payment received. Your domain is being set up right now — nothing for you to do.'
          )}
        </p>
        {!live && !failed && (
          <p className="text-white/50 text-sm mt-2">
            This page updates on its own — a welcome email is on its way too.
          </p>
        )}
      </div>

      {/* progress stepper */}
      <ol className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
        {PROVISIONING_STEPS.map((label, i) => {
          const done = live || i < active
          const current = !live && i === active
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  done
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : current
                      ? 'bg-signal-500/20 text-signal-200'
                      : 'bg-white/10 text-white/40'
                }`}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5" />
                ) : current && !failed ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  i + 1
                )}
              </span>
              <span className={done || current ? 'text-white' : 'text-white/50'}>{label}</span>
            </li>
          )
        })}
      </ol>
      {failed && (
        <p className="mt-3 text-amber-300 text-sm text-center">
          This step is taking longer than usual and our team has been notified — we'll finish it by hand and email
          you when it's live. No action needed.
        </p>
      )}

      {live && liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-signal-500 hover:bg-signal-400 text-white font-semibold px-6 py-4 rounded-xl transition-colors"
        >
          Open {state.chosenDomain} <ExternalLink className="w-4 h-4" />
        </a>
      )}

      <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-2">Unlimited updates, included</h2>
        <p className="text-white/70 text-sm">
          Want a photo swapped, a new service added, hours changed, anything at all? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline text-white">
            {SUPPORT_EMAIL}
          </a>{' '}
          any time — there's no limit and no extra charge. That's your support line from here on, for changes,
          questions or cancelling.
        </p>
      </div>

      <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-2">Once it's live — one small favor</h2>
        <p className="text-white/70 text-sm mb-3">
          If we did right by you, a quick Google review helps other contractors find us. No rush — take a look at
          the finished site first.
        </p>
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold underline text-white"
        >
          Leave a Google review <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {!live && state.previewUrl && (
        <p className="text-center mt-6">
          <a
            href={state.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline text-white/70 hover:text-white"
          >
            View your site preview meanwhile
          </a>
        </p>
      )}
    </div>
  )
}
