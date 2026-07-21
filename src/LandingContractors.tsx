import React, { useRef, useEffect, useCallback } from 'react'
import { HardHat, ArrowRight, Phone, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { LandingFooter } from './components/ui'

import { CONTRACTOR_CALENDAR } from './config/calendars'
import { getAttribution } from './utils/attribution'
import { initializeContractorPixel, trackViewContent } from './utils/pixelTracking'
import { useScrollReveal } from './hooks/useScrollReveal'

import {
  LandingExamples,
  BookingSection,
  LandingFaq,
  BlueprintReveal,
} from './components/landing'
import { SeoMeta, serviceLd, faqPageLd, organizationLd, localBusinessLd, breadcrumbForPath } from './seo'
import {
  Section,
  Container,
  Eyebrow,
  GradientHeading,
  Button,
  Figure,
} from './components/ui'
import { fadeUpHero } from './lib/motion'

// Real client work only. A quote appears ONLY where that client actually left one
// (see docs/REAL_TESTIMONIALS.md); the others show the work with a plain caption and
// a live link, which is stronger proof than a quote anyway — it can be checked.
// Previously two of these carried invented names ('Local Plumbing Co.', 'Trade
// Specialist') attached to real clients' screenshots.
// Trades only, because the ad sending traffic here is a trades ad. The row shows
// BOTH halves of the offer: one contractor website, and the two trade social
// accounts we actually run. It used to carry two restaurants (Conuco, Hot Pot
// One) — real clients, real work, but the wrong proof for a contractor who just
// clicked a contractor ad. They still lead /work and /socialmedia.
//
// Every figure below is read off the live account and is checkable via the link
// on the card. Follower counts are deliberately absent from the SCREENSHOTS too
// (they are crops of the video grid, not the profile header): the accounts are
// small — 198 and 55 — and cold ad traffic will not stop to read why that is not
// the point. The views and the client's contract value are the honest, stronger
// numbers. See src/SocialMedia.tsx for the full figures and the date they were
// read. If those go stale, re-read them; do not nudge them upward.
const EXAMPLES = [
  {
    imageUrl: '/work/dunn.webp',
    imageAlt: 'Dunn Construction website — project gallery and quote form',
    caption: 'Project gallery, service listings and a quote form that reaches the owner’s phone.',
    authorName: 'Dunn Construction — website',
    href: 'https://dunnconstructionma.com/',
    linkLabel: 'Visit site',
  },
  {
    imageUrl: '/work/luxury-makeover-social.webp',
    imageAlt: 'Bathroom remodel videos we produce and post for Luxury Makeover',
    caption:
      'Bathroom remodel content we shoot, write and post. It booked the owner two jobs worth over $20,000.',
    authorName: 'Luxury Makeover — social',
    href: 'https://www.tiktok.com/@luxurymakeover_official',
    linkLabel: 'See the account',
  },
  {
    imageUrl: '/work/911-plumbing-social.webp',
    imageAlt: 'Plumbing job videos we produce and post for 911 Local Plumbing',
    caption:
      'Plumbing jobs turned into posts, built from scratch. Top video: 71.3K views.',
    authorName: '911 Local Plumbing — social',
    href: 'https://www.tiktok.com/@911localplumbing',
    linkLabel: 'See the account',
  },
]

/** Public Google review listing. Used by the proof chips so the 5.0 can be checked
 *  rather than just claimed. No review count is shown — we don't have a verified one. */
const GOOGLE_REVIEWS_URL = 'https://share.google/w0mwRq1gix3xAbYkk'

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
    question: 'What does it cost?',
    answer:
      "There's no cost to find out — the homepage design and your first week of social posts are free. If you love it, we'll walk you through simple, contractor-friendly options on the call and tailor a plan to your trade. No card on file, no pressure.",
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

function HeroReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUpHero} className={className}>
      {children}
    </motion.div>
  )
}

function TeamMember({ src, alt, name, role }: { src: string; alt: string; name: string; role: string }) {
  return (
    <div className="flex items-center gap-5">
      <div className="w-24 shrink-0">
        <Figure src={src} alt={alt} treatment="mono" aspect="aspect-square" />
      </div>
      <div>
        <span className="label-mono text-signal-600">{name}</span>
        <p className="mt-1 text-ink-900 leading-snug">{role}</p>
      </div>
    </div>
  )
}

function LandingContractors() {
  const bookingFormRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (!urlParams.has('source')) {
      urlParams.append('source', 'landing-contractors')
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`
      window.history.replaceState({}, '', newUrl)
    }

    // Capture first-touch attribution (fbclid/fbc/utm) NOW, while the ad params are
    // still on the URL — waiting until form submit loses them on any navigation.
    getAttribution()

    initializeContractorPixel()

    trackViewContent('Contractor Landing Page', 'Landing Page', 'contractor_services')

    if (window.fbq) {
      window.fbq('trackCustom', 'ContractorLandingView', {
        page: 'contractor_landing',
        source: urlParams.get('source') || 'direct',
      })
    }

  }, [])

  useScrollReveal('contractorlanding')

  const scrollToBooking = useCallback(() => {
    // Land the visitor on the FORM itself, not the section heading — on mobile the
    // heading + trust copy push the form a full viewport below where the CTA drops
    // you, which reads as "the button didn't work".
    const element =
      document.getElementById('landing-contractors-form-container') ?? bookingFormRef.current
    if (!element) return

    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const isMobile = window.innerWidth < 768
      const offset = isMobile ? 16 : 96
      const targetPosition = rect.top + scrollTop - offset

      window.scrollTo({ top: targetPosition, behavior: 'smooth' })
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
        {/* ── HERO — BLUEPRINT TITLE BLOCK (blueprint moment 1) ──────────────────
            The offer framed as a ruled title-block box on the drafting-paper grid.
            This is the only section that animates on entry (matches the home page). */}
        <section
          className="relative isolate overflow-hidden surface-blueprint-major text-ink-900"
          aria-label="Introduction"
        >
          <Container size="lg" className="py-8 sm:py-10 lg:py-12">
            <motion.div
              className="border border-ink-900/70 bg-[#EDF0F2]/40"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } }}
            >
              <div className="p-6 sm:p-8">
                <div className="mx-auto max-w-3xl text-center">
                  <HeroReveal>
                    <GradientHeading level={1} size="display" accent="— before you pay a dollar">
                      Contractors: we build your website first
                    </GradientHeading>
                  </HeroReveal>
                  <motion.p
                    className="mt-5 text-lg sm:text-xl text-ink-800 leading-relaxed mx-auto max-w-xl"
                    variants={fadeUpHero}
                  >
                    Book a 15-minute call and we'll have a free homepage built for your business before
                    we talk — plus your first week of social posts. Pay only if you love it.
                  </motion.p>

                  <HeroReveal className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
                    <Button variant="primary" size="lg" onClick={scrollToBooking}>
                      Get my free design
                      <ArrowRight className="h-5 w-5 icon-nudge" aria-hidden />
                    </Button>
                  </HeroReveal>

                  <motion.p className="mt-3 text-sm text-ink-700/80" variants={fadeUpHero}>
                    No card. No commitment. See the design first — then decide.{' '}
                    <a
                      href="tel:+17744467375"
                      className="underline decoration-signal-500/40 underline-offset-4 hover:decoration-signal-500 hover:text-signal-700 inline-flex items-center gap-1"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden /> Or call (774) 446-7375
                    </a>
                  </motion.p>

                  <div className="mt-5 flex items-center justify-center text-sm text-ink-700">
                    <a
                      href={GOOGLE_REVIEWS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 hover:text-signal-700"
                    >
                      <span className="flex items-center gap-0.5 text-ink-900" aria-label="5 out of 5 stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                        ))}
                      </span>
                      <span className="font-medium text-ink-800 underline decoration-ink-900/25 underline-offset-4 hover:decoration-signal-500">
                        Rated 5.0 / 5 on Google
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </Container>
        </section>

        <LandingExamples
          eyebrow="Real work for trades"
          heading="See the work"
          accent="we've done"
          examples={EXAMPLES}
          padding="md"
        />

        <BlueprintReveal onCta={scrollToBooking} />

        <BookingSection
          ref={bookingFormRef}
          padding="md"
          eyebrow="Book your free design"
          heading="Schedule your"
          accent="discovery call"
          sub="Pick a 15-minute slot. We'll cover your business, jobs, and service area, then send a free homepage mockup AND a sample social post within 24 hours."
          calendarConfig={CONTRACTOR_CALENDAR}
          containerId="landing-contractors-form-container"
          valueItems={[
            'Free homepage concept',
            'Sample social post',
            'Clear pricing',
            'No obligation',
          ]}
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
              <strong className="text-signal-700">Please show up!</strong> We block real time for each
              call. We're contractor-friendly — we get how busy your day is.
            </>
          }
        />

        {/* ── TEAM STRIP — the two real faces right after the ask ────────────────
            Moved below BookingSection 2026-07-21 to cut the ad-click → form distance
            by a screen; the portraits (real, same ones as the About page) now back up
            the booking decision for anyone who scrolled past without converting.
            Kept at identifier scale on purpose — blown up they read as a corporate
            team page. No invented facts or quotes. */}
        <Section tone="muted" padding="md">
          <div className="max-w-2xl">
            <Eyebrow tone="brand">Who you'll actually talk to</Eyebrow>
            <GradientHeading level={2} size="lg" className="mt-5" accent="Direct access.">
              Small team.
            </GradientHeading>
            <p className="mt-5 text-base sm:text-lg text-ink-700 leading-relaxed">
              We're a two-person team based in Leominster, MA. You work directly with the people
              designing your website and managing your social media.
            </p>
          </div>

          <div className="mt-8 grid gap-8 sm:grid-cols-2 max-w-3xl">
            <TeamMember
              src="/team/rhyan.webp"
              alt="Rhyan, who designs and builds the sites at Ace Web Designers"
              name="Rhyan"
              role="Designs your website, leads strategy and handles your calls."
            />
            <TeamMember
              src="/team/valerie.webp"
              alt="Valerie, who runs all the social media at Ace Web Designers"
              name="Valerie"
              role="Plans, creates and manages your social media."
            />
          </div>
        </Section>

        <LandingFaq
          eyebrow="Questions"
          heading="What contractors"
          accent="ask us most"
          items={FAQS}
          padding="md"
        />

      </main>

      {/* MOBILE sticky CTA */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-cream-50 via-cream-50/95 to-cream-50/0"
        role="region"
        aria-label="Mobile call to action"
      >
        <Button variant="primary" size="lg" fullWidth onClick={scrollToBooking}>
          <HardHat className="h-5 w-5" aria-hidden />
          See available times
        </Button>
      </div>
      <div className="md:hidden h-24" aria-hidden />

      <LandingFooter
        tagline="Websites + social media built for contractors and home service pros across the United States."
        showTerms
        extras={
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono inline-flex items-center gap-2 border border-cream-50/25 text-cream-100/80 px-3 py-1.5 hover:border-cream-50/50 hover:text-cream-50"
          >
            <Star className="h-3 w-3 fill-current" aria-hidden />
            5.0 on Google
          </a>
        }
      />
    </div>
  )
}

export default LandingContractors
