import React, { useRef, useEffect, useCallback } from 'react'
import { HardHat, Zap, TrendingUp, MapPin, Camera, ArrowRight, Phone, Star, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { LandingFooter } from './components/ui'

import { CONTRACTOR_CALENDAR } from './config/calendars'
import { getAttribution } from './utils/attribution'
import { initializeContractorPixel, trackViewContent } from './utils/pixelTracking'
import { useScrollReveal } from './hooks/useScrollReveal'

import {
  LandingExamples,
  ProcessSteps,
  BookingSection,
  LandingFaq,
  TrustStrip,
  BlueprintReveal,
  ComparisonTable,
} from './components/landing'
import { SeoMeta, serviceLd, faqPageLd, organizationLd, localBusinessLd, breadcrumbForPath } from './seo'
import {
  Section,
  Container,
  Eyebrow,
  GradientHeading,
  Button,
  Card,
  IconTile,
} from './components/ui'
import { fadeUpHero } from './lib/motion'

// Real client work only. A quote appears ONLY where that client actually left one
// (see docs/REAL_TESTIMONIALS.md); the others show the work with a plain caption and
// a live link, which is stronger proof than a quote anyway — it can be checked.
// Previously two of these carried invented names ('Local Plumbing Co.', 'Trade
// Specialist') attached to real clients' screenshots.
const EXAMPLES = [
  {
    imageUrl: '/work/conuco.webp',
    imageAlt: 'Conuco Takeout website — menu, online ordering and food photography',
    quote:
      'Ace Web Designers built an amazing website for my business! Working with Rhyan and Valerie was a great experience. They delivered a website that truly represents my restaurant.',
    authorName: 'Pedro Dipre-Rojas — Conuco Takeout',
    href: 'https://conucotakeout.com/',
    rating: 5 as const,
  },
  {
    imageUrl: '/work/dunn.webp',
    imageAlt: 'Dunn Construction website — project gallery and quote form',
    caption: 'Project gallery, service listings and a quote form that reaches the owner’s phone.',
    authorName: 'Dunn Construction',
    href: 'https://dunnconstructionma.com/',
  },
  {
    imageUrl: '/work/hotpot.webp',
    imageAlt: 'Hot Pot One website — menu system and online ordering',
    caption: 'Menu system, online ordering and a mobile experience built for a phone in one hand.',
    authorName: 'Hot Pot One',
    href: 'https://hotpotone.net/',
  },
]

const BENEFITS = [
  'Same-day website launch available',
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

// Drawing title-block cells (decorative drafting metadata — not claims).
const TITLE_BLOCK: Array<{ label: string; value: string; accent?: boolean }> = [
  { label: 'Project', value: 'Free homepage + social' },
  { label: 'Trade', value: 'Contractors' },
  { label: 'Rev', value: 'A', accent: true },
  { label: 'Sheet', value: '01' },
  { label: 'Date', value: '2026' },
]

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
            The offer framed as a real drawing sheet: a ruled title-block box on the
            drafting-paper grid, project metadata along the bottom. This is the only
            section that animates on entry (matches the home page). */}
        <section
          className="relative isolate overflow-hidden surface-blueprint-major text-ink-900"
          aria-label="Introduction"
        >
          <Container size="lg" className="py-12 sm:py-16 lg:py-20">
            <motion.div
              className="border border-ink-900/70 bg-[#EDF0F2]/40"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } }}
            >
              <div className="p-6 sm:p-10 lg:p-12">
                <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div>
                    <motion.div variants={fadeUpHero}>
                      <Eyebrow tone="brand">For contractors &amp; home service pros</Eyebrow>
                    </motion.div>
                    <motion.div variants={fadeUpHero}>
                      <GradientHeading level={1} size="display" className="mt-6" accent="for free to start">
                        Get a website + social media that bring jobs in
                      </GradientHeading>
                    </motion.div>
                    <motion.p
                      className="mt-6 text-lg sm:text-xl text-ink-800 leading-relaxed max-w-xl"
                      variants={fadeUpHero}
                    >
                      We design your homepage <strong>and</strong> your first week of social posts — free.
                      Pay only if you love it.
                    </motion.p>

                    <motion.div className="mt-8 flex flex-col sm:flex-row gap-3" variants={fadeUpHero}>
                      <Button variant="primary" size="lg" onClick={scrollToBooking}>
                        Get my free design
                        <ArrowRight className="h-5 w-5 icon-nudge" aria-hidden />
                      </Button>
                    </motion.div>

                    <motion.p className="mt-3 text-sm text-ink-700/80" variants={fadeUpHero}>
                      No card. No commitment. See the design first — then decide.{' '}
                      <a
                        href="tel:+17744467375"
                        className="underline decoration-signal-500/40 underline-offset-4 hover:decoration-signal-500 hover:text-signal-700 inline-flex items-center gap-1"
                      >
                        <Phone className="h-3.5 w-3.5" aria-hidden /> Or call (774) 446-7375
                      </a>
                    </motion.p>

                    <div className="mt-6 flex items-center gap-3 text-sm text-ink-700">
                      <div className="flex items-center gap-0.5 text-ink-900" aria-label="5 out of 5 stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                        ))}
                      </div>
                      <span className="font-medium text-ink-800">Rated 5.0 / 5 on Google</span>
                    </div>
                  </div>

                  <motion.div variants={fadeUpHero} className="relative border border-ink-900/60 bg-cream-50">
                    <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                      <iframe
                        src="https://player.vimeo.com/video/1088261551?h=a19a5e95f4&badge=0&autopause=0&player_id=0&app_id=58479"
                        loading="lazy"
                        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                        referrerPolicy="strict-origin-when-cross-origin"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        title="Free contractor website preview"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Title block — the drawing's project metadata strip */}
              <dl className="grid grid-cols-2 sm:grid-cols-5 border-t border-ink-900/70">
                {TITLE_BLOCK.map((cell, i) => (
                  <div
                    key={cell.label}
                    className={`px-4 py-3 border-ink-900/20 border-t sm:border-t-0 ${
                      i === 0 ? 'sm:border-l-0' : 'sm:border-l'
                    } ${i % 2 === 1 ? 'border-l sm:border-l' : ''}`}
                  >
                    <dt className="label-mono text-ink-700/60">{cell.label}</dt>
                    <dd className={`mt-1 label-mono ${cell.accent ? 'text-signal-600' : 'text-ink-900'}`}>
                      {cell.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </Container>
        </section>

        <TrustStrip />

        {/* PAIN POINTS — concrete cards */}
        <Section tone="default" padding="lg">
          <div className="max-w-2xl">
            <Eyebrow tone="brand">Built for contractors</Eyebrow>
            <GradientHeading level={2} size="lg" className="mt-5" accent="contractors actually have">
              The four problems
            </GradientHeading>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {PAIN_POINTS.map(p => (
              <Card key={p.title} tone="default" padding="lg" interactive className="h-full">
                <div className="flex items-start gap-4">
                  <IconTile tone="neutral" size="md">
                    <p.Icon />
                  </IconTile>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink-900">{p.title}</h3>
                    <p className="mt-2 text-ink-800 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* ── DIMENSION-MARKED CALLOUT (blueprint moment 3) ──────────────────────
            The offer drawn as a detail, annotated with drafting dimension lines.
            Used exactly once — the memorable drawing detail on the page. Static,
            so it renders in screenshots and honours reduced motion. */}
        <Section tone="blueprint" padding="lg">
          <div className="max-w-2xl mb-10">
            <Eyebrow tone="brand">The offer, measured</Eyebrow>
            <GradientHeading level={2} size="lg" className="mt-5">
              What “free to start” actually means
            </GradientHeading>
          </div>

          <div className="relative pt-10 pl-12 max-w-3xl">
            {/* Top dimension line */}
            <div
              className="absolute left-12 right-0 top-5 h-px bg-ink-900/50 flex items-center justify-center"
              aria-hidden
            >
              <span className="bg-[#EDF0F2] px-2 label-mono text-signal-600 -translate-y-1/2">Free</span>
            </div>
            <div className="absolute left-12 top-3.5 h-3 w-px bg-ink-900/50" aria-hidden />
            <div className="absolute right-0 top-3.5 h-3 w-px bg-ink-900/50" aria-hidden />

            {/* Left dimension line */}
            <div
              className="absolute top-10 bottom-0 left-6 w-px bg-ink-900/50 flex items-center justify-center"
              aria-hidden
            >
              <span
                className="bg-[#EDF0F2] py-2 label-mono text-signal-600"
                style={{ writingMode: 'vertical-rl' }}
              >
                No card
              </span>
            </div>
            <div className="absolute left-[1.125rem] top-10 w-3 h-px bg-ink-900/50" aria-hidden />
            <div className="absolute left-[1.125rem] bottom-0 w-3 h-px bg-ink-900/50" aria-hidden />

            {/* The detail */}
            <figure className="relative border border-ink-900/70 bg-[#EDF0F2]">
              <figcaption className="absolute -top-3 left-4 bg-signal-500 text-white label-mono px-2 py-0.5">
                Detail A
              </figcaption>
              <div className="p-8 sm:p-10">
                <p className="label-mono text-signal-600">Included at no cost</p>
                <ul className="mt-4 space-y-3 text-lg text-ink-900">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 mt-1 text-signal-600" aria-hidden />
                    A custom homepage, built for your business
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 mt-1 text-signal-600" aria-hidden />
                    Your first week of social posts
                  </li>
                </ul>
                <p className="mt-5 text-ink-800 leading-relaxed">
                  You see it first. You pay only if you love it.
                </p>
              </div>
            </figure>
          </div>
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

        {/* ── WHAT YOU GET — BLUEPRINT SPEC SHEET (blueprint moment 2) ───────────
            The included list rendered as a bill of materials on the drafting grid:
            item number, spec, red annotation check. */}
        <Section tone="blueprint" padding="lg">
          <div className="max-w-2xl">
            <Eyebrow tone="brand">What's included</Eyebrow>
            <GradientHeading level={2} size="lg" className="mt-5">
              The spec sheet
            </GradientHeading>
            <p className="mt-5 text-base sm:text-lg text-ink-700 leading-relaxed">
              Every contractor combo ships with these. No surprise line items.
            </p>
          </div>

          <ul className="mt-12 border-t-2 border-ink-900/70">
            {BENEFITS.map((b, i) => (
              <li
                key={b}
                className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-4 border-b border-ink-900/20"
              >
                <span className="label-num text-ink-700/60">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-ink-900 leading-snug">{b}</span>
                <Check className="h-5 w-5 text-signal-600" aria-label="included" />
              </li>
            ))}
          </ul>
        </Section>

        <BookingSection
          ref={bookingFormRef}
          eyebrow="Book your free design"
          heading="Schedule your"
          accent="discovery call"
          sub="Pick a 15-minute slot. We'll cover your business, jobs, and service area, then send a free homepage mockup AND a sample social post within 24 hours."
          calendarConfig={CONTRACTOR_CALENDAR}
          containerId="landing-contractors-form-container"
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

        {/* Cross-sell and comparison sit AFTER the form on purpose. They invite a
            "let me weigh my options" beat, which is the wrong thing to hand a visitor
            immediately before the ask. Ad traffic that scrolls past the form still
            reaches them, and both CTAs scroll back up. */}
        <BlueprintReveal onCta={scrollToBooking} />

        <ComparisonTable />

        <LandingFaq
          eyebrow="Questions"
          heading="What contractors"
          accent="ask us most"
          items={FAQS}
        />

        {/* FINAL CTA — concrete inverted close */}
        <Section tone="inverted" padding="lg" containerSize="md">
          <div className="text-center">
            <hr className="border-0 h-px bg-cream-50/20 mb-12 max-w-[8rem] mx-auto" />
            <Eyebrow tone="inverted">One easy step</Eyebrow>
            <GradientHeading
              level={2}
              size="xl"
              tone="inverted"
              className="mt-6"
              accent="before you pay anything"
            >
              Free design. Free first week of social.
            </GradientHeading>
            <p className="mt-6 text-base sm:text-lg text-cream-100/75 max-w-xl mx-auto leading-relaxed">
              See it first. Decide later. The whole point is you don't risk a thing on the call.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="primary" size="lg" tone="inverted" onClick={scrollToBooking}>
                Get my free design
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Button>
              <a
                href="tel:+17744467375"
                className="inline-flex items-center gap-2 text-cream-50 hover:text-signal-300 underline decoration-cream-50/30 underline-offset-4 hover:decoration-signal-300 transition-colors"
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
        <Button variant="primary" size="lg" fullWidth onClick={scrollToBooking}>
          <HardHat className="h-5 w-5" aria-hidden />
          See available times
        </Button>
      </div>
      <div className="md:hidden h-24" aria-hidden />

      {/* DESKTOP sticky CTA — small floating button, bottom-right */}
      <div
        className="hidden md:block fixed bottom-6 right-6 z-40"
        role="region"
        aria-label="Quick book"
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={scrollToBooking}
          className="bg-cream-50 shadow-lift"
        >
          <HardHat className="h-4 w-4 text-signal-500" aria-hidden />
          Book my free design
          <ArrowRight className="h-4 w-4 icon-nudge" aria-hidden />
        </Button>
      </div>

      <LandingFooter
        tagline="Websites + social media built for contractors and home service pros across the United States."
        showTerms
        extras={
          <span className="label-mono inline-flex items-center gap-2 border border-cream-50/25 text-cream-100/80 px-3 py-1.5">
            <Star className="h-3 w-3 fill-current" aria-hidden />
            5.0 on Google
          </span>
        }
      />
    </div>
  )
}

export default LandingContractors
