/**
 * /buildyoursite — self-serve "build your own restaurant website" landing page.
 *
 * A separate ad funnel from the contractor landing: the visitor configures a
 * restaurant site in a guided wizard (live preview) and subscribes monthly via
 * Stripe; we build & deliver the real site after purchase. Uses the MAIN pixel
 * (1703925480259996) — restaurants are NOT the contractor dataset.
 *
 * Bare page (no global header/footer) — see App.tsx BARE_PAGES.
 */

import { useEffect } from 'react'
import { Star, Sparkles, Clock, BadgeCheck } from 'lucide-react'

import { LandingFooter } from './components/ui'
import RestaurantWizard from './components/builder/RestaurantWizard'
import { RESTAURANT_PIXEL } from './config/pixels'
import { initializeRestaurantPixel, trackViewContent } from './utils/pixelTracking'
import { useScrollReveal } from './hooks/useScrollReveal'
import { SeoMeta } from './seo'

function BuildYourSite() {
  useEffect(() => {
    // Tag the visit source if the ad didn't (mirrors the contractor page).
    const params = new URLSearchParams(window.location.search)
    if (!params.has('source')) {
      params.append('source', 'restaurant-builder')
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
    }
    // Isolated funnel: index.html skips the main pixel here, so load + init the
    // restaurant pixel and fire ViewContent only to it.
    initializeRestaurantPixel()
    trackViewContent('Restaurant Website Builder', 'Landing Page', 'restaurant_builder')
  }, [])

  useScrollReveal('buildyoursite')

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900">
      <SeoMeta
        path="/buildyoursite"
        override={{
          title: 'Build Your Restaurant Website — from $99/mo | Ace Web Designers',
          description:
            'Design your restaurant’s website in minutes with a live preview, then go live on a simple monthly plan. Menu, reservations, online ordering — we build & host it.',
        }}
      />

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${RESTAURANT_PIXEL.pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      <main id="main">
        {/* HERO */}
        <section className="px-5 pt-10 pb-6 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-signal-50 px-3 py-1 text-sm font-medium text-signal-700">
              <Sparkles className="h-4 w-4" /> For restaurants & cafés
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
              Build your restaurant’s website
              <span className="block text-signal-600">in minutes — go live for less</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-600">
              Design it yourself with a live preview, then launch on a simple monthly plan
              from <strong>$99/mo</strong>. We build it, host it, and keep it updated.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-600">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-signal-500" /> No card to preview</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-signal-500" /> Live in days</span>
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-signal-500" /> Cancel anytime</span>
            </div>
          </div>
        </section>

        {/* WIZARD + PREVIEW */}
        <section className="px-5 pb-16">
          <div className="mx-auto max-w-5xl rounded-3xl border border-ink-100 bg-white/60 p-5 shadow-sm sm:p-8">
            <RestaurantWizard />
          </div>
        </section>
      </main>

      <LandingFooter tagline="Beautiful, done-for-you websites for restaurants — built, hosted, and kept fresh." showTerms />
    </div>
  )
}

export default BuildYourSite
