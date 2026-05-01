import React, { useRef, useEffect, useCallback } from 'react'
import { HardHat, Zap, TrendingUp, MapPin, Camera, ArrowRight, Phone } from 'lucide-react'
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
  TrustStrip,
  WebsiteSocialCombo,
  ComparisonTable,
} from './components/landing'
import { SeoMeta, serviceLd, faqPageLd, organizationLd, localBusinessLd, breadcrumbForPath } from './seo'
import {
  Section,
  Eyebrow,
  GradientHeading,
  Card,
  Reveal,
  IconTile,
  BadgePill,
  SectionHeading,
  Magnetic,
} from './components/ui'
import { Check, Star } from 'lucide-react'

const EXAMPLES = [
  {
    imageUrl: 'https://i.ibb.co/S1Yv7K9/dunn-consturction-gif.gif',
    imageAlt: 'Dunn Construction website example — project gallery and quote form',
    quote:
      "We were recommended to Rhyan and Valerie by a friend. Within days, we had a professional website that perfectly represented our construction business. We're already getting more leads!",
    authorName: 'Dunn Construction',
    rating: 5 as const,
  },
  {
    imageUrl: 'https://i.ibb.co/r2g1Q1Qp/hotpotonegif.gif',
    imageAlt: 'Local services website example with bookings and reviews',
    quote:
      "Best decision we've made for our business. The team built us a beautiful website that actually generates calls.",
    authorName: 'Local Plumbing Co.',
    rating: 5 as const,
  },
  {
    imageUrl: 'https://i.ibb.co/Myx4nrSr/concuo-gif.gif',
    imageAlt: 'Service business website example — services + lead form',
    quote:
      'Fast turnaround, professional design, and our phone hasn\'t stopped ringing since launch. Highly recommend.',
    authorName: 'Trade Specialist',
    rating: 5 as const,
  },
]

const BENEFITS = [
  '⚡ SAME-DAY website launch available — get online TODAY',
  'A free homepage mockup before paying a penny',
  'First week of social posts free — see the work first',
  'Mobile-friendly design that works on every device',
  'Project gallery to showcase your best jobs',
  'Lead capture forms that send leads to your phone',
  'Local SEO + Google Business Profile setup',
  'Professional hosting + ongoing support included',
]

const PROCESS = [
  {
    title: 'Quick discovery call',
    description: '15 minutes to understand your trade, service area, and the kind of work you want more of.',
  },
  {
    title: 'Free design + first social post',
    description: "We send a custom homepage design AND a sample social post within 24 hours — often same-day.",
  },
  {
    title: 'Launch fast — both channels',
    description: 'Approve and your site goes live in 1–3 days. We start posting that same week.',
  },
]

const PAIN_POINTS = [
  {
    title: 'Get found locally',
    desc: 'Modern site + Google Business Profile + local SEO so the homes near you actually find you when they search.',
    Icon: MapPin,
  },
  {
    title: 'Show the work',
    desc: 'Project galleries on your site, jobsite reels on social. Real photos of real jobs beat stock images every time.',
    Icon: Camera,
  },
  {
    title: 'Look bigger than you are',
    desc: 'A professional site and consistent posting make a 2-person crew look like the trusted local pro. Most competitors ghost online.',
    Icon: TrendingUp,
  },
  {
    title: 'Stop wasting nights posting',
    desc: 'You stay on jobs. We run the social. One team, one bill, no agency hand-offs.',
    Icon: Zap,
  },
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
  {
    question: 'How fast can I really get online?',
    answer:
      'Same-day launches are available for contractors. Most builds go live within 1–3 days from approving the design.',
  },
  {
    question: 'Is the design really free?',
    answer:
      'Yes. We design your homepage at no cost, and we throw in a sample social post too. Pay only if you love it. No catch, no card on file.',
  },
  {
    question: 'How much for the website + social combo?',
    answer:
      'Websites start at $200 (Basic), $1,000 (Standard), or $1,500 (E-commerce). Add Standard social media management at $30/wk or Deluxe at $99/wk. First week of posts is free, just like the design.',
  },
  {
    question: "What if I'm too busy to manage social myself?",
    answer:
      "That's the whole point. We post for you — we just need access to your jobsite photos and a quick approval window. You stay on jobs, we keep the feed warm.",
  },
  {
    question: 'What if I already have a website?',
    answer:
      "We can rebuild it, migrate it, or just refresh the homepage. Tell us what you have on the call and we'll recommend the right path.",
  },
  {
    question: 'Do you handle hosting and updates?',
    answer:
      'Yes. Hosting, SSL, backups, and small content updates are all included so you can focus on jobs.',
  },
  {
    question: 'How do I know you’re legit?',
    answer:
      "We're a Leominster, MA team with 5.0 on Google. The discovery call is 15 minutes with no card on file — you walk away with a free homepage design either way. That's the easiest way to find out.",
  },
]

function LandingContractors() {
  const bookingFormRef = useRef<HTMLElement>(null)

  const handleBookingComplete = useCallback(() => {
    const { event_id } = getAttribution()
    console.log(`✅ Contractor booking detected! event_id=${event_id}`)
    trackBookingComplete('contractor', undefined, event_id)
  }, [])

  useEffect(() => {
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
      <SeoMeta
        path="/contractorlanding"
        jsonLd={[
          organizationLd(),
          localBusinessLd(),
          serviceLd({
            name: 'Contractor Website + Social Media',
            description:
              'Professional websites and social media management for contractors and home service pros. Free homepage design + first week of social posts free.',
            serviceType: 'Web design and social media management for contractors',
            url: 'https://acewebdesigners.com/contractorlanding',
          }),
          faqPageLd(FAQS.map(f => ({ question: f.question, answer: f.answer }))),
          breadcrumbForPath('/contractorlanding')!,
        ]}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=4230021860577001&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>

      <main id="main">
        <LandingHero
          eyebrow="For contractors & home service pros"
          headline={<>Get a website + social media that bring jobs in</>}
          accent="for free to start"
          sub={
            <>
              We design your homepage <strong>and</strong> your first week of social posts — free.
              Pay only if you love it.
            </>
          }
          urgencyText="⚡ Same-day launch available"
          ctaLabel="Get my free design"
          onCta={scrollToBooking}
          riskReversal={
            <>
              No card. No commitment. See the design first — then decide.{' '}
              <a
                href="tel:+17744467375"
                className="underline decoration-rust-500/40 underline-offset-4 hover:decoration-rust-500 hover:text-rust-700 inline-flex items-center gap-1"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden /> Or call (774) 446-7375
              </a>
            </>
          }
          videoSrc="https://player.vimeo.com/video/1088261551?h=a19a5e95f4&badge=0&autopause=0&player_id=0&app_id=58479"
          videoTitle="Free contractor website preview"
          rating={5}
          ratingLabel="Rated 5.0 / 5 on Google"
        />

        <TrustStrip />

        {/* PAIN POINTS — combo-aware contractor problems */}
        <Section tone="default" padding="lg">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow tone="brand">Built for contractors</Eyebrow>
            <GradientHeading level={2} size="lg" className="mt-5" accent="contractors actually have">
              The four problems
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
                      <p className="mt-2 text-ink-800 leading-relaxed">{p.desc}</p>
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

        <ProcessSteps
          eyebrow="How it works"
          heading="Discovery call to launch"
          accent="in days, not months"
          steps={PROCESS}
          tone="muted"
        />

        {/* WEBSITE + SOCIAL MEDIA COMBO — cross-sell anchor */}
        <WebsiteSocialCombo
          websiteImage="https://i.ibb.co/S1Yv7K9/dunn-consturction-gif.gif"
          websiteAlt="Contractor website example showing project gallery and quote form"
          socialImage="https://i.ibb.co/Myx4nrSr/concuo-gif.gif"
          socialAlt="Contractor social media feed example with jobsite reels"
          onCta={scrollToBooking}
        />

        <ComparisonTable />

        <FreeDesignBenefits
          eyebrow="What's included"
          heading="Every contractor combo includes"
          accent="the essentials"
          benefits={BENEFITS}
          columns={2}
        />

        {/* COMPACT PRICING — websites + combo note */}
        <Section tone="muted" padding="lg">
          <SectionHeading
            eyebrow="Pricing"
            heading="Simple,"
            accent="no surprises"
            sub="Free design first — pay only if you love it. Add social management at $30/wk (Standard) or $99/wk (Deluxe)."
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
          <div className="mt-8 max-w-3xl mx-auto rounded-xl2 bg-cream-50 ring-1 ring-ink-900/10 p-5 sm:p-6 text-center shadow-soft">
            <BadgePill tone="brand">
              Add-on
            </BadgePill>
            <p className="mt-3 text-base sm:text-lg text-ink-800 leading-relaxed">
              <strong>Social media management</strong> from <strong>$30/wk</strong> (Standard) or{' '}
              <strong>$99/wk</strong> (Deluxe). Daily posting, jobsite reels, Google Business
              Profile on Deluxe. <span className="text-ink-700/70">First week free.</span>
            </p>
          </div>
          <p className="mt-6 text-center text-sm text-ink-700/70 max-w-xl mx-auto">
            Each tier includes hosting, mobile responsiveness, and basic SEO. Add-ons (e-commerce,
            booking, blog) at $200 each.
          </p>
        </Section>

        <BookingSection
          ref={bookingFormRef}
          eyebrow="Book your free design"
          heading="Schedule your"
          accent="discovery call"
          sub="Pick a 15-minute slot. We'll cover your business, jobs, and service area, then send a free homepage mockup AND a sample social post within 24 hours."
          calendarConfig={CONTRACTOR_CALENDAR}
          containerId="landing-contractors-form-container"
          onBookingComplete={handleBookingComplete}
          conversionType="free_design_contractors"
          trackerId="contractor-conversion-tracker"
          whatToExpect={[
            '15 minutes — mostly you talking about your trade',
            'We listen, ask a few questions, no pitch',
            'You leave with a free homepage design + sample social post',
          ]}
          scarcityNote={
            <>
              We only take a few new contractors each week to keep turnaround fast. Book the slot
              that fits — first come, first served.
            </>
          }
          reminder={
            <>
              <strong className="text-rust-700">Please show up!</strong> We block real time for each
              call. We're contractor-friendly — we get how busy your day is.
            </>
          }
        />

        <LandingFaq
          eyebrow="Questions"
          heading="What contractors"
          accent="ask us most"
          items={FAQS}
        />

        {/* FINAL CTA — full-bleed dark */}
        <Section tone="inverted" padding="lg">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow tone="inverted">One easy step</Eyebrow>
            <GradientHeading
              level={2}
              size="lg"
              className="mt-5"
              accent="before you pay anything"
              accentUnderline
            >
              Free design.
              <br />
              Free first week of social.
            </GradientHeading>
            <p className="mt-6 text-base sm:text-lg text-cream-100/85 leading-relaxed">
              See it first. Decide later. The whole point is you don't risk a thing on the call.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Magnetic strength={6}>
                <button
                  onClick={scrollToBooking}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-semibold text-base sm:text-lg px-8 py-4 shadow-glow-rust magnetic-btn ring-focus-rust transition-colors duration-300"
                >
                  Get my free design
                  <ArrowRight className="h-5 w-5 icon-nudge" aria-hidden />
                </button>
              </Magnetic>
              <a
                href="tel:+17744467375"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-cream-50 hover:text-rust-300 underline decoration-cream-50/30 underline-offset-4 hover:decoration-rust-300 transition-colors"
              >
                <Phone className="h-5 w-5" aria-hidden />
                Or call (774) 446-7375
              </a>
            </div>
          </div>
        </Section>
      </main>

      {/* MOBILE sticky CTA */}
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

      {/* DESKTOP sticky CTA — small floating pill, bottom-right */}
      <div
        className="hidden md:block fixed bottom-6 right-6 z-40"
        role="region"
        aria-label="Quick book"
      >
        <Magnetic strength={4}>
          <button
            onClick={scrollToBooking}
            className="group inline-flex items-center gap-2 rounded-full bg-ink-900 hover:bg-ink-800 text-cream-50 px-5 py-3 text-sm font-semibold shadow-lift ring-1 ring-ink-900/20 transition-colors duration-300"
          >
            <HardHat className="h-4 w-4 text-rust-300" aria-hidden />
            Book my free design
            <ArrowRight className="h-4 w-4 icon-nudge" aria-hidden />
          </button>
        </Magnetic>
      </div>

      <LandingFooter
        tagline="Websites + social media built for contractors and home service pros across the United States."
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
