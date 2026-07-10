/**
 * RestaurantWizard — the self-serve "build your own restaurant website" flow.
 *
 * Guided steps with a LIVE PREVIEW, then a monthly Stripe subscription:
 *   1 Basics      restaurant name + cuisine
 *   2 Sections    which parts the site should have
 *   3 Style       color theme
 *   4 Preview     see the mock site + contact gate  → fires Lead (CAPI + pixel)
 *   5 Plan        pick a monthly plan               → Stripe subscription Checkout
 *
 * Funnel/dedup mirrors the scheduler: the gate fires a deduped browser `Lead`
 * (shared event_id with the `lead` Edge Function) on the RESTAURANT dataset; on plan
 * selection we open a `create-subscription` Checkout whose completion fires the
 * server-side Purchase from the contact's stored attribution (`stripe-webhook`).
 *
 * No site data is ever read/written from the browser — everything goes through
 * the `lead` / `create-subscription` Edge Functions.
 */

import React, { useMemo, useState, useCallback } from 'react'
import { Check, ArrowRight, ArrowLeft, MapPin, Clock, Utensils, Star, Loader2, Sparkles } from 'lucide-react'

import { supabase } from '../../lib/supabase'
import { getAttribution } from '../../utils/attribution'
import { trackLead } from '../../utils/pixelTracking'
import {
  RESTAURANT_PLANS,
  SITE_SECTIONS,
  SITE_THEMES,
  CUISINES,
  type Cuisine,
  type PlanKey,
} from '../../config/restaurantPlans'

const newEventId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

const STEPS = ['Basics', 'Sections', 'Style', 'Preview', 'Plan'] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RestaurantWizard() {
  const [step, setStep] = useState(0)

  // Test mode: /buildyoursite?test=1 routes Lead + Purchase to Meta Test Events
  // and skips GHL — drive the whole funnel without firing live conversions.
  const isTest =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === '1'

  // wizard selections
  const [restaurantName, setRestaurantName] = useState('')
  const [cuisine, setCuisine] = useState<Cuisine>('Italian')
  const [sections, setSections] = useState<string[]>(
    SITE_SECTIONS.filter((s) => s.default).map((s) => s.id),
  )
  const [themeId, setThemeId] = useState(SITE_THEMES[0].id)

  // contact gate
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // flow state
  const [contactId, setContactId] = useState<string | null>(null)
  const [leadEventId, setLeadEventId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // optional AI copy (cost-controlled: capped per session, one cheap call fills all)
  const AI_MAX_USES = 5
  const [aiCopy, setAiCopy] = useState<{
    tagline: string
    description: string
    items: { name: string; blurb: string }[]
  } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiUsesLeft, setAiUsesLeft] = useState(AI_MAX_USES)

  const theme = useMemo(
    () => SITE_THEMES.find((t) => t.id === themeId) ?? SITE_THEMES[0],
    [themeId],
  )
  const displayName = restaurantName.trim() || 'Your Restaurant'

  const toggleSection = (id: string) =>
    setSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))

  const builderConfig = useMemo(
    () => ({ restaurantName: displayName, cuisine, sections, themeId }),
    [displayName, cuisine, sections, themeId],
  )

  // Optional AI copy — explicit click only, capped per session (cost guardrail).
  const generateCopy = useCallback(async () => {
    if (aiLoading || aiUsesLeft <= 0 || restaurantName.trim().length < 2) return
    setAiLoading(true)
    setError('')
    try {
      const { data, error: invErr } = await supabase.functions.invoke('generate-copy', {
        body: { restaurantName: displayName, cuisine, sections },
      })
      const d = data as { tagline?: string; description?: string; items?: { name: string; blurb: string }[] } | null
      if (invErr || !d?.tagline) {
        setError('AI copy is unavailable right now — your own wording works fine.')
        return
      }
      setAiCopy({ tagline: d.tagline, description: d.description ?? '', items: d.items ?? [] })
      setAiUsesLeft((n) => n - 1)
    } catch {
      setError('AI copy is unavailable right now — your own wording works fine.')
    } finally {
      setAiLoading(false)
    }
  }, [aiLoading, aiUsesLeft, restaurantName, displayName, cuisine, sections])

  const canAdvance = useMemo(() => {
    if (step === 0) return restaurantName.trim().length >= 2
    if (step === 1) return sections.length >= 1
    return true
  }, [step, restaurantName, sections])

  // ── Step 4: contact gate → Lead, then advance to plans ──────────────────────
  const submitGate = useCallback(async () => {
    setError('')
    if (!firstName.trim()) return setError('Please enter your name.')
    if (!EMAIL_RE.test(email.trim())) return setError('Please enter a valid email.')
    if (phone.replace(/[^0-9]/g, '').length < 7) return setError('Please enter a valid phone number.')

    setSubmitting(true)
    const eventId = leadEventId || newEventId('lead')
    if (!leadEventId) setLeadEventId(eventId)
    const attr = getAttribution()

    try {
      const { data, error: invErr } = await supabase.functions.invoke('lead', {
        body: {
          calendar: 'restaurant', // isolated funnel → restaurant pixel/dataset + restaurant GHL
          firstName,
          lastName,
          email,
          phone,
          country: 'US',
          fbc: attr.fbc,
          fbp: attr.fbp,
          fbclid: attr.fbclid,
          eventId,
          eventSourceUrl: window.location.href,
          landingUrl: attr.landingUrl,
          utm: { ...attr.utm, builder: 'restaurant', cuisine, sections: sections.join(',') },
          test: isTest,
        },
      })
      if (invErr) {
        setError("Couldn't save your details — please try again.")
        return
      }
      const cid = (data as { contactId?: string } | null)?.contactId ?? null
      setContactId(cid)
      // Fire the browser Lead only after the server Lead succeeds (shared event_id).
      trackLead(eventId, { content_name: 'Restaurant builder', content_category: cuisine })
      setStep(4)
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [firstName, lastName, email, phone, leadEventId, cuisine, sections, isTest])

  // ── Step 5: pick a plan → Stripe subscription Checkout ──────────────────────
  const choosePlan = useCallback(
    async (plan: PlanKey) => {
      setError('')
      if (!contactId) {
        setError('Please complete your details first.')
        setStep(3)
        return
      }
      setSubmitting(true)
      try {
        const { data, error: invErr } = await supabase.functions.invoke('create-subscription', {
          body: { plan, contactId, email, config: builderConfig, test: isTest },
        })
        const url = (data as { url?: string } | null)?.url
        if (invErr || !url) {
          setError('Checkout is temporarily unavailable — please try again shortly.')
          return
        }
        window.location.href = url // hosted Stripe Checkout
      } catch {
        setError('Could not start checkout — please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [contactId, email, builderConfig, isTest],
  )

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8 lg:gap-12 items-start">
      {/* ── LEFT: wizard controls ─────────────────────────────────────────── */}
      <div>
        <StepDots step={step} />

        {step === 0 && (
          <StepCard title="Tell us about your restaurant" sub="We'll preset your site for it.">
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Restaurant name</label>
            <input
              autoFocus
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="e.g. Bella Napoli"
              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/20"
            />
            <label className="block text-sm font-medium text-ink-800 mt-5 mb-1.5">Type of food</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCuisine(c)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    cuisine === c
                      ? 'border-rust-500 bg-rust-50 text-rust-700'
                      : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === 1 && (
          <StepCard title="What should your site include?" sub="Toggle the sections you want.">
            <div className="grid gap-2.5">
              {SITE_SECTIONS.map((s) => {
                const on = sections.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSection(s.id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      on ? 'border-rust-500 bg-rust-50' : 'border-ink-200 bg-white hover:border-ink-300'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        on ? 'border-rust-500 bg-rust-500 text-white' : 'border-ink-300 bg-white'
                      }`}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span>
                      <span className="block font-medium text-ink-900">{s.label}</span>
                      <span className="block text-sm text-ink-500">{s.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard title="Pick a look" sub="You can fine-tune everything after you subscribe.">
            <div className="grid grid-cols-2 gap-3">
              {SITE_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    themeId === t.id ? 'border-rust-500 shadow-lift' : 'border-ink-200 hover:border-ink-300'
                  }`}
                  style={{ background: t.bg }}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full" style={{ background: t.accent }} />
                    <span className="font-semibold" style={{ color: t.text }}>{t.name}</span>
                  </span>
                  <span className="mt-3 block h-2 w-3/4 rounded-full" style={{ background: t.accent }} />
                  <span className="mt-1.5 block h-2 w-1/2 rounded-full opacity-40" style={{ background: t.text }} />
                </button>
              ))}
            </div>

            {/* OPTIONAL AI copy — explicit click, capped per session */}
            <div className="mt-5 rounded-xl border border-dashed border-ink-200 bg-white/60 p-4">
              <button
                type="button"
                onClick={generateCopy}
                disabled={aiLoading || aiUsesLeft <= 0}
                className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-ink-800 disabled:opacity-40 transition-colors"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {aiCopy ? 'Rewrite my copy' : 'Write my copy with AI'}
              </button>
              <p className="mt-2 text-xs text-ink-500">
                Optional. Fills the preview’s tagline, description & sample menu — you can edit it all later.
                {aiUsesLeft <= 0 ? ' (limit reached for this session)' : ` (${aiUsesLeft} left)`}
              </p>
            </div>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard title="See it live" sub="Enter your details to unlock your preview & plans.">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="rounded-xl border border-ink-200 bg-white px-4 py-3 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/20"
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="rounded-xl border border-ink-200 bg-white px-4 py-3 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/20"
              />
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              className="mt-3 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/20"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="Phone"
              className="mt-3 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/20"
            />
            <p className="mt-3 text-xs text-ink-500">
              No card required to preview. We'll only use this to build & launch your site.
            </p>
          </StepCard>
        )}

        {step === 4 && (
          <StepCard title="Choose your plan" sub="Cancel anytime. We build & launch your site after you subscribe.">
            <div className="grid gap-3">
              {RESTAURANT_PLANS.map((p) => (
                <div
                  key={p.key}
                  className={`rounded-2xl border-2 p-5 ${
                    p.highlighted ? 'border-rust-500 bg-rust-50/40' : 'border-ink-200 bg-white'
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-xl font-semibold text-ink-900">
                      {p.name}
                      {p.highlighted && (
                        <span className="ml-2 rounded-full bg-rust-500 px-2 py-0.5 text-xs font-semibold text-white align-middle">
                          Popular
                        </span>
                      )}
                    </h3>
                    <span className="text-ink-900">
                      <span className="text-2xl font-bold">${p.monthly}</span>
                      <span className="text-sm text-ink-500">/mo</span>
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-600">{p.tagline}</p>
                  <ul className="mt-3 space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-rust-500" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => choosePlan(p.key)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-rust-500 px-6 py-3 font-semibold text-white hover:bg-rust-600 disabled:opacity-60 transition-colors"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Start with {p.name} <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </div>
              ))}
            </div>
          </StepCard>
        )}

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        {/* nav */}
        {step < 4 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-900 disabled:opacity-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              disabled={!canAdvance || submitting}
              onClick={() => (step === 3 ? submitGate() : setStep((s) => s + 1))}
              className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-7 py-3 font-semibold text-cream-50 hover:bg-ink-800 disabled:opacity-40 transition-colors"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>{step === 3 ? 'See my site' : 'Continue'} <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: live preview ───────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-8">
        <SitePreview
          name={displayName}
          cuisine={cuisine}
          sections={sections}
          accent={theme.accent}
          bg={theme.bg}
          text={theme.text}
          copy={aiCopy}
        />
      </div>
    </div>
  )
}

/* ── presentational bits ─────────────────────────────────────────────────── */

function StepDots({ step }: { step: number }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              i < step ? 'bg-rust-500 text-white' : i === step ? 'bg-ink-900 text-cream-50' : 'bg-ink-100 text-ink-400'
            }`}
          >
            {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          {i < STEPS.length - 1 && <span className={`h-px w-5 ${i < step ? 'bg-rust-500' : 'bg-ink-200'}`} />}
        </div>
      ))}
    </div>
  )
}

function StepCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-ink-900">{title}</h2>
      {sub && <p className="mt-1 text-ink-600">{sub}</p>}
      <div className="mt-5">{children}</div>
    </div>
  )
}

/** A mock restaurant homepage painted from the live wizard selections. */
function SitePreview({
  name,
  cuisine,
  sections,
  accent,
  bg,
  text,
  copy,
}: {
  name: string
  cuisine: Cuisine
  sections: string[]
  accent: string
  bg: string
  text: string
  copy?: { tagline: string; description: string; items: { name: string; blurb: string }[] } | null
}) {
  const has = (id: string) => sections.includes(id)
  const tagline = copy?.tagline || `Authentic ${cuisine.toLowerCase()} done right — fresh every day.`
  const featured =
    copy?.items && copy.items.length
      ? copy.items.map((it, i) => ({ name: it.name, price: 14 + i * 3 }))
      : [
          { name: 'House Special', price: 14 },
          { name: 'Chef’s Pick', price: 17 },
          { name: 'Seasonal Plate', price: 20 },
        ]
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 shadow-lift">
      {/* browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-black/5 bg-ink-100/70 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-3 truncate rounded bg-white px-2 py-0.5 text-[10px] text-ink-400">
          {name.toLowerCase().replace(/\s+/g, '')}.com
        </span>
      </div>

      <div style={{ background: bg, color: text }} className="px-6 py-7">
        {/* nav */}
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold" style={{ color: accent }}>{name}</span>
          <div className="hidden gap-3 text-[11px] sm:flex" style={{ opacity: 0.7 }}>
            {has('menu') && <span>Menu</span>}
            {has('about') && <span>Our Story</span>}
            {has('events') && <span>Events</span>}
            {has('hours') && <span>Visit</span>}
          </div>
        </div>

        {/* hero */}
        <div className="mt-6 text-center">
          <span className="text-[11px] uppercase tracking-widest" style={{ color: accent }}>{cuisine}</span>
          <h3 className="mt-1 font-display text-3xl font-bold leading-tight">{name}</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm" style={{ opacity: 0.7 }}>
            {tagline}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {has('reservations') && (
              <span className="rounded-full px-4 py-1.5 text-xs font-semibold text-white" style={{ background: accent }}>
                Book a table
              </span>
            )}
            {has('ordering') && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: accent, color: accent }}>
                Order online
              </span>
            )}
          </div>
        </div>

        {/* gallery */}
        {has('gallery') && (
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-lg" style={{ background: accent, opacity: 0.18 + i * 0.12 }} />
            ))}
          </div>
        )}

        {/* menu */}
        {has('menu') && (
          <div className="mt-6">
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: accent }}>
              <Utensils className="h-4 w-4" /> Featured
            </div>
            <div className="mt-2 space-y-1.5">
              {featured.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm" style={{ opacity: 0.85 }}>
                  <span className="truncate pr-2">{d.name}</span>
                  <span className="font-medium">${d.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* footer info */}
        <div className="mt-6 flex flex-wrap gap-4 border-t pt-4 text-[11px]" style={{ borderColor: `${text}22`, opacity: 0.7 }}>
          {has('hours') && (
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Open 11–10 daily</span>
          )}
          {has('hours') && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> 123 Main St</span>
          )}
          {has('reviews') && (
            <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" /> 4.9 · 200+ reviews</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default RestaurantWizard
