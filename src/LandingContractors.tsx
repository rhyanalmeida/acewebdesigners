import React, { useRef, useEffect, useCallback } from 'react'
import { HardHat, Zap, TrendingUp, Star, CheckCircle2 } from 'lucide-react'
import { LandingFooter } from './components/ui'

import { CONTRACTOR_CALENDAR } from './config/calendars'
import { CONTRACTOR_PIXEL } from './config/pixels'
import {
  initializeContractorPixel,
  trackViewContent,
  trackBookingComplete,
  setupTestingFunctions,
} from './utils/pixelTracking'
import { initAttribution, getAttribution } from './utils/attribution'
import { useScrollReveal } from './hooks/useScrollReveal'

import {
  LandingHero,
  FreeDesignBenefits,
  LandingExamples,
  ProcessSteps,
  BookingSection,
  LandingFaq,
} from './components/landing'
import { Section, Eyebrow, GradientHeading, Card, Reveal, IconTile, BadgePill, SectionHeading } from './components/ui'
import { Check } from 'lucide-react'

const EXAMPLES = [
  {
    imageUrl: 'https://i.ibb.co/S1Yv7K9/dunn-consturction-gif.gif',
    imageAlt: 'Dunn Construction Website Example',
    quote: "We were recommended to Rhyan and Valerie by a friend. Within days, we had a professional website that perfectly represented our construction business. We're already getting more leads!",
    authorName: 'Dunn Construction',
    rating: 5 as const,
  },
  {
    imageUrl: 'https://i.ibb.co/r2g1Q1Qp/hotpotonegif.gif',
    imageAlt: 'Local services website example',
    quote: "Best decision we've made for our business. The team built us a beautiful website that actually generates calls.",
    authorName: 'Local Plumbing Co.',
    rating: 5 as const,
  },
  {
    imageUrl: 'https://i.ibb.co/Myx4nrSr/concuo-gif.gif',
    imageAlt: 'Service business website example',
    quote: 'Fast turnaround, professional design, and our phone hasn\'t stopped ringing since launch. Highly recommend.',
    authorName: 'Trade Specialist',
    rating: 5 as const,
  },
]

const BENEFITS = [
  '⚡ SAME-DAY website launch available — get online TODAY',
  'A free homepage mockup/design before paying a penny',
  'Mobile-friendly design that works on every device',
  'Project gallery to showcase your best work',
  'Lead capture forms to get more inquiries',
  'Local SEO to rank in your service area',
  'Easy-to-update content management',
  'Professional hosting included',
]

const PROCESS = [
  { title: 'Quick discovery call', description: '15 minutes to understand your service area, jobs, and goals.' },
  { title: 'Free design — same day', description: "We'll send you a custom homepage design within 24 hours, often same-day." },
  { title: 'Launch fast', description: 'Approve the design and your website can be live within 1-3 days.' },
]

const PAIN_POINTS = [
  { title: 'Get online TODAY', desc: "No waiting weeks or months. Your professional contractor website live and generating leads the same day. You're busy — we work fast.", Icon: Zap },
  { title: 'Get more leads', desc: 'Stop relying on word-of-mouth alone. A professional website helps potential clients find you 24/7 and generates qualified leads while you sleep.', Icon: TrendingUp },
  { title: 'Stand out', desc: 'Most contractors have outdated or no websites. A modern, professional site immediately sets you apart and builds trust with homeowners.', Icon: Star },
  { title: 'Showcase your work', desc: 'Display your best projects with before/after photos, testimonials, and detailed case studies that prove your quality.', Icon: CheckCircle2 },
]

const PRICING_COMPACT = [
  {
    tier: 'Basic',
    price: '$200',
    monthly: '$15',
    bullets: ['One-page site', 'Mobile + SEO ready', 'Hosting + SSL'],
  },
  {
    tier: 'Standard',
    price: '$1,000',
    monthly: '$30',
    bullets: ['Up to 5 pages', 'Custom copy', 'Contact form + Maps'],
    highlight: true,
  },
  {
    tier: 'E-commerce',
    price: '$1,500',
    monthly: '$45',
    bullets: ['Online store / booking', 'Secure payments', 'Inventory + admin'],
  },
] as const

const FAQS = [
  { question: 'How fast can I really get online?', answer: 'Same-day launches are available for contractors. Most builds go live within 1-3 days from approving the design.' },
  { question: 'Is the design really free?', answer: 'Yes. We design your homepage at no cost. Pay only if you love it. No catch, no card on file.' },
  { question: 'What if I already have a website?', answer: 'We can rebuild it, migrate it, or refresh it. Tell us what you have and we\'ll recommend the right path.' },
  { question: 'Do you handle hosting and updates?', answer: 'Yes. Hosting, SSL, backups, and small content updates are all included so you can focus on jobs.' },
]

function LandingContractors() {
  const bookingFormRef = useRef<HTMLElement>(null)

  // Handle booking completion callback.
  // We fire the client-side Pixel with the shared event_id. The matching
  // server-side CAPI event fires later from the GHL webhook → Netlify function,
  // and Meta dedupes the two by event_id.
  const handleBookingComplete = useCallback(() => {
    const { event_id } = getAttribution()
    console.log(`✅ Contractor booking detected! event_id=${event_id}`)
    trackBookingComplete('contractor', undefined, event_id)
  }, [])

  useEffect(() => {
    document.title = 'Free Website Design for Contractors | Get More Leads & Jobs'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Get a free website design for your contracting business. Attract more clients, showcase your work, and grow your business online. No payment until you love it!'
      )
    }

    // Capture attribution data (fbclid from URL, _fbc / _fbp cookies, generate event_id)
    // BEFORE modifying the URL — we need the original fbclid before we replace history.
    const attribution = initAttribution()
    console.log(
      `🎯 Attribution: event_id=${attribution.event_id} fbclid=${attribution.fbclid || 'none'} fbc=${attribution.fbc ? 'set' : 'none'} fbp=${attribution.fbp ? 'set' : 'none'}`
    )

    const urlParams = new URLSearchParams(window.location.search)
    if (!urlParams.has('source')) {
      urlParams.append('source', 'landing-contractors')
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`
      window.history.replaceState({}, '', newUrl)
    }

    // Initialize Contractor-Specific Facebook Pixel (separate from main site pixel)
    initializeContractorPixel()

    trackViewContent('Contractor Landing Page', 'Landing Page', 'contractor_services')

    if (window.fbq) {
      window.fbq('trackCustom', 'ContractorLandingView', {
        page: 'contractor_landing',
        source: urlParams.get('source') || 'direct',
      })
    }

    console.log(`✅ ${CONTRACTOR_PIXEL.name} (${CONTRACTOR_PIXEL.pixelId}): Initialized and tracking`)
    console.log(`✅ LeadConnector booking widget loaded on Contractor Landing page`)
    console.log(`📅 Using calendar: ${CONTRACTOR_CALENDAR.name}`)

    setupTestingFunctions('contractor')
  }, [])

  useScrollReveal('contractorlanding')

  // PRESERVED behavior from previous implementation:
  // - Use requestAnimationFrame so layout is stable before measuring
  // - Mobile gets 16px offset (no fixed header), desktop 96px
  const scrollToBooking = useCallback(() => {
    const element = bookingFormRef.current
    if (!element) return

    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const isMobile = window.innerWidth < 768
      const offset = isMobile ? 16 : 96
      const targetPosition = rect.top + scrollTop - offset

      window.scrollTo({ top: targetPosition, behavior: 'smooth' })
      console.log(`📜 Scrolling to booking form: offset=${offset}px, target=${targetPosition}px, mobile=${isMobile}`)
    })
  }, [])

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900">
      {/* Facebook Pixel noscript fallback for contractors */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1548487516424971&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>

      <main id="main">
        <LandingHero
          eyebrow="For contractors & home service pros"
          headline={<>Get a website for your contracting business</>}
          accent="for free"
          sub={<>We'll design your contractor website for free. If you like it, you can buy it. If not, no harm done.</>}
          urgencyText="⚡ Same-day launch available"
          ctaLabel="Get my free design"
          onCta={scrollToBooking}
          videoSrc="https://player.vimeo.com/video/1088261551?h=a19a5e95f4&badge=0&autopause=0&player_id=0&app_id=58479"
          videoTitle="Free contractor website preview"
          rating={5}
          ratingLabel="Rated 5.0 / 5 on Google"
        />

        {/* PAIN POINTS — contractor-specific value props */}
        <Section tone="default" padding="lg">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow tone="brand">Built for contractors</Eyebrow>
            <GradientHeading level={2} size="lg" className="mt-5" accent="contractors need">
              Everything
            </GradientHeading>
          </div>
          <Reveal variant="stagger" className="mt-12 grid gap-5 sm:grid-cols-2">
            {PAIN_POINTS.map((p, i) => (
              <div key={p.title} data-reveal-stagger-child style={{ transitionDelay: `${i * 70}ms` }}>
                <Card tone="default" padding="lg" rounded="xl2" interactive shine className="h-full">
                  <div className="flex items-start gap-4">
                    <IconTile tone={i === 0 ? 'accent' : 'brand'} size="md">
                      <p.Icon />
                    </IconTile>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink-900">{p.title}</h3>
                      <p className="mt-2 text-ink-700 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </Reveal>
        </Section>

        <LandingExamples
          eyebrow="Real contractor websites"
          heading="See the work"
          accent="we've done"
          examples={EXAMPLES}
        />

        <FreeDesignBenefits
          eyebrow="What's included"
          heading="Every contractor website includes"
          accent="the essentials"
          benefits={BENEFITS}
          columns={2}
        />

        <ProcessSteps
          eyebrow="How it works"
          heading="From quick call to live site"
          accent="in days, not months"
          steps={PROCESS}
        />

        {/* COMPACT PRICING — visible before booking */}
        <Section tone="default" padding="lg">
          <SectionHeading
            eyebrow="Pricing"
            heading="Simple,"
            accent="no surprises"
            sub="Free design first — pay only if you love it."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3 max-w-5xl mx-auto">
            {PRICING_COMPACT.map(p => {
              const isHighlight = 'highlight' in p && p.highlight
              return (
                <div
                  key={p.tier}
                  className={`relative flex flex-col rounded-xl2 p-6 ring-1 transition-all duration-500 ease-premium ${
                    isHighlight
                      ? 'bg-ink-900 text-cream-50 ring-ink-900'
                      : 'bg-cream-50 text-ink-900 ring-ink-900/10 hover:ring-ink-900/20'
                  }`}
                >
                  {isHighlight && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-rust-500 text-white px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                      Most popular
                    </span>
                  )}
                  <span className={`label-mono ${isHighlight ? 'text-cream-100/65' : 'text-ink-700/70'}`}>
                    {p.tier}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`font-display text-4xl font-semibold tracking-tight ${isHighlight ? 'text-cream-50' : 'text-ink-900'}`}>
                      {p.price}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${isHighlight ? 'text-cream-100/65' : 'text-ink-700/70'}`}>
                    + {p.monthly}/mo hosting
                  </p>
                  <ul className="mt-4 space-y-1.5 flex-1">
                    {p.bullets.map(b => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <Check
                          className={`h-4 w-4 mt-0.5 shrink-0 ${isHighlight ? 'text-rust-300' : 'text-rust-600'}`}
                          aria-hidden
                        />
                        <span className={isHighlight ? 'text-cream-100/90' : 'text-ink-800'}>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          <p className="mt-8 text-center text-sm text-ink-700/70 max-w-xl mx-auto">
            Each tier includes hosting, mobile responsiveness, and basic SEO. Add-ons (e-commerce, booking, blog) at $200 each.
          </p>
        </Section>

        <BookingSection
          ref={bookingFormRef}
          eyebrow="Book your free design"
          heading="Schedule your"
          accent="discovery call"
          sub="Pick a 15-minute slot. We'll cover your business, jobs, and service area, then send a free homepage mockup within 24 hours."
          calendarConfig={CONTRACTOR_CALENDAR}
          containerId="landing-contractors-form-container"
          onBookingComplete={handleBookingComplete}
          conversionType="free_design_contractors"
          trackerId="contractor-conversion-tracker"
          reminder={
            <>
              <strong className="text-rust-700">Please show up!</strong> We block real time for each call. We're contractors-friendly — we get how busy your day is.
            </>
          }
        />

        <LandingFaq
          eyebrow="Questions"
          heading="What contractors"
          accent="ask us most"
          items={FAQS}
        />
      </main>

      {/* Mobile sticky CTA — preserved with the same scroll-offset behavior */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-cream-50 via-cream-50/95 to-cream-50/0"
        role="region"
        aria-label="Mobile call to action"
      >
        <button
          onClick={scrollToBooking}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white py-4 px-6 font-semibold shadow-glow-rust magnetic-btn ring-focus-rust transition-colors duration-300"
        >
          <HardHat className="h-5 w-5" aria-hidden />
          GET MY FREE DESIGN NOW!
        </button>
      </div>
      <div className="md:hidden h-24" aria-hidden />

      <LandingFooter
        tagline="Websites built for contractors and home service pros across the United States."
        showTerms
        extras={
          <BadgePill tone="inverted">
            <Star className="h-3 w-3 fill-current" aria-hidden />
            5.0 on Google
          </BadgePill>
        }
      />
    </div>
  )
}

export default LandingContractors
