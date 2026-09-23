/**
 * DemoPage — the outbound cold-email funnel's personalized landing page at
 * /demo/<token>. The token (32 hex chars from the prospect's email link) is the
 * only credential; everything goes through the `demo-site` / `domain-search` /
 * `create-subscription` Edge Functions.
 *
 * Flow (reply-gated, 2026-09-22): the link is only ever sent AFTER the site is built
 * (instantly-webhook auto-builds on a "yes" reply; the poller sends the link once
 * deployed), so a prospect normally lands straight on Ready. If a link is opened
 * early (status none) the build starts silently on view — no button, no "AI" —
 * and the page shows a finishing-touches state (owner rule: the prospect opens a
 * DONE preview, never a build-it-yourself pitch). Generating polls every 5s (a
 * build takes ~5-10 min) → Ready (iframe preview + single monthly plan + domain
 * picker; the customer confirms the EXACT domain before paying — registrations
 * are non-refundable) → Purchased (domain being provisioned).
 *
 * NO Meta pixel events here — this funnel is cold-email driven, not ad-driven.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Check, Globe, Loader2, Search } from 'lucide-react'

import { supabase } from '../lib/supabase'
import { GOOGLE_REVIEW_URL, OUTBOUND_PLAN, SUPPORT_EMAIL } from '../config/outboundPlan'

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

const POLL_MS = 5000

function tokenFromPath(): string {
  const m = window.location.pathname.match(/\/demo\/([0-9a-f]{32})/i)
  return m ? m[1].toLowerCase() : ''
}

export default function DemoPage() {
  const token = useRef(tokenFromPath()).current
  const [state, setState] = useState<DemoState | null>(null)
  const [notFound, setNotFound] = useState(!token)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState('')

  // domain picker
  const [domainQuery, setDomainQuery] = useState('')
  const [checking, setChecking] = useState(false)
  const [domainResult, setDomainResult] = useState<DomainCheck>(null)
  const [checkingOut, setCheckingOut] = useState(false)

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

  // A link opened before the build exists: start it silently (one build ever — the
  // server's none→generating gate makes repeat views free).
  useEffect(() => {
    if (state?.siteStatus === 'none' && !building) void startBuild()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.siteStatus])

  // poll while generating
  useEffect(() => {
    if (state?.siteStatus !== 'generating') return
    const t = setInterval(() => void fetchState(), POLL_MS)
    return () => clearInterval(t)
  }, [state?.siteStatus, fetchState])

  // seed the domain query from the business name once known
  useEffect(() => {
    if (state && !domainQuery) setDomainQuery(state.businessName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

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

  const checkDomain = useCallback(async () => {
    if (checking || domainQuery.trim().length < 3) return
    setChecking(true)
    setError('')
    setDomainResult(null)
    try {
      const { data, error: invErr } = await supabase.functions.invoke('domain-search', {
        body: { token, query: domainQuery },
      })
      const d = data as { domain?: string; available?: boolean; price?: string; error?: string } | null
      if (invErr || !d?.domain) {
        setError(d?.error ?? 'Domain check failed — please try again.')
        return
      }
      setDomainResult({ domain: d.domain, available: Boolean(d.available), price: d.price })
    } catch {
      setError('Domain check failed — please try again.')
    } finally {
      setChecking(false)
    }
  }, [checking, domainQuery, token])

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

  const purchasedFromUrl =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('purchased') === '1'

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <Helmet>
        <title>Your Website Preview — Ace Web Designers</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="font-semibold tracking-tight">Ace Web Designers</span>
          <a href="https://acewebdesigners.com" className="text-sm text-white/60 hover:text-white">
            acewebdesigners.com
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 sm:py-16">
        {notFound && (
          <div className="text-center py-24">
            <h1 className="text-2xl font-bold mb-3">This link isn't valid</h1>
            <p className="text-white/60">
              Double-check the link from your email, or reach us at{' '}
              <a className="underline" href="https://acewebdesigners.com/contact">
                acewebdesigners.com/contact
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

        {state && (state.purchased || purchasedFromUrl) && (
          <div className="text-center py-20 max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 mb-5">
              <Check className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold mb-3">You're in{state.firstName ? `, ${state.firstName}` : ''}!</h1>
            <p className="text-white/70 mb-2">
              {state.chosenDomain ? (
                <>
                  <span className="font-semibold text-white">{state.chosenDomain}</span> is being registered and
                  connected right now — your site is usually live within the hour.
                </>
              ) : (
                'Your site is being set up right now.'
              )}
            </p>
            <p className="text-white/50 text-sm">We'll email you as soon as it's live.</p>

            <div className="mt-8 text-left bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="font-semibold mb-2">Unlimited updates, included</h2>
              <p className="text-white/70 text-sm">
                Want a photo swapped, a new service added, hours changed, anything at all? Email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="underline text-white">
                  {SUPPORT_EMAIL}
                </a>{' '}
                any time — there's no limit and no extra charge. That's your support line from here on.
              </p>
            </div>

            <div className="mt-4 text-left bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="font-semibold mb-2">Once it's live — one small favor</h2>
              <p className="text-white/70 text-sm mb-3">
                If we did right by you, a quick Google review helps other contractors find us. No rush — take a
                look at the finished site first.
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

            {state.previewUrl && (
              <a
                href={state.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-6 text-sm underline text-white/70 hover:text-white"
              >
                View your site preview meanwhile
              </a>
            )}
          </div>
        )}

        {state && !state.purchased && !purchasedFromUrl && (
          <>
            {/* ── Not built yet / building: finishing touches (no button, no "AI") ── */}
            {(state.siteStatus === 'none' || state.siteStatus === 'generating') && (
              <div className="text-center py-20 max-w-xl mx-auto">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-signal-400 mb-6" />
                <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                  Putting the finishing touches on {state.businessName}'s new website…
                </h1>
                <p className="text-white/70">
                  It'll be ready to view here in a few minutes. Keep this tab open or come back to this same link —
                  it refreshes on its own.
                </p>
                {error && <p className="text-amber-400/90 text-sm mt-4">{error}</p>}
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

            {/* ── Ready: preview + plan + domain picker ────────────────────── */}
            {state.siteStatus === 'deployed' && state.previewUrl && (
              <div>
                <div className="text-center mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                    Here's {state.businessName}'s new website
                  </h1>
                  <p className="text-white/70">
                    Live preview below — scroll around, open it full-screen.{' '}
                    <a href={state.previewUrl} target="_blank" rel="noreferrer" className="underline">
                      Open in a new tab
                    </a>
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-12 bg-white">
                  <iframe
                    src={state.previewUrl}
                    title={`${state.businessName} website preview`}
                    className="w-full h-[70vh]"
                  />
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-start max-w-4xl mx-auto">
                  {/* plan card */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
                    <h2 className="text-xl font-bold mb-1">{OUTBOUND_PLAN.name}</h2>
                    <p className="text-white/60 text-sm mb-5">{OUTBOUND_PLAN.tagline}</p>
                    <div className="mb-5">
                      <span className="text-4xl font-bold">${OUTBOUND_PLAN.monthly}</span>
                      <span className="text-white/60">/month</span>
                    </div>
                    <ul className="space-y-2.5">
                      {OUTBOUND_PLAN.features.map((f) => (
                        <li key={f} className="flex gap-2.5 text-sm text-white/80">
                          <Check className="w-4 h-4 text-signal-400 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* domain picker + checkout */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-signal-400" /> Pick your domain
                    </h2>
                    <p className="text-white/60 text-sm mb-5">
                      We register it for you the moment you subscribe — it's included.
                    </p>
                    <div className="flex gap-2 mb-3">
                      <input
                        value={domainQuery}
                        onChange={(e) => {
                          setDomainQuery(e.target.value)
                          setDomainResult(null)
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && void checkDomain()}
                        placeholder="yourbusinessname"
                        className="flex-1 rounded-xl border border-white/15 bg-ink-900 px-4 py-3 text-white outline-none focus:border-signal-500"
                      />
                      <button
                        onClick={() => void checkDomain()}
                        disabled={checking || domainQuery.trim().length < 3}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-3 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
                      >
                        {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Check
                      </button>
                    </div>

                    {domainResult && (
                      <div
                        className={`rounded-xl px-4 py-3 text-sm mb-4 ${
                          domainResult.available
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
                        }`}
                      >
                        {domainResult.available ? (
                          <>
                            <span className="font-semibold">{domainResult.domain}</span> is available — it's yours when
                            you subscribe.
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">{domainResult.domain}</span> is taken — try another name.
                          </>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => void checkout()}
                      disabled={!domainResult?.available || checkingOut}
                      className="w-full inline-flex items-center justify-center gap-2 bg-signal-500 hover:bg-signal-400 disabled:opacity-50 text-white font-semibold px-6 py-4 rounded-xl transition-colors"
                    >
                      {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                      Take my site live
                    </button>
                    <p className="text-white/40 text-xs mt-3">
                      Secure checkout via Stripe. Cancel anytime. Domain registrations are non-refundable, so please
                      double-check the spelling above.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-center text-amber-400 mt-8">{error}</p>}
          </>
        )}
      </main>

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
