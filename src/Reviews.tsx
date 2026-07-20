import React from 'react'
import { Star, Users, Award, CheckCircle2 } from 'lucide-react'

import {
  Section,
  Card,
  IconTile,
  StatBlock,
  PageHero,
  SectionHeading,
  StaggerGrid,
  TestimonialEditorial,
  TrustStack,
  FinalCta,
} from './components/ui'
import { SeoMeta, organizationLd, localBusinessLd, breadcrumbForPath } from './seo'

const REVIEW_STATS = [
  { v: '5.0', l: 'Google rating', s: 'From verified reviews' },
  { v: 'Local', l: 'Leominster, MA', s: 'Serving owners nationwide' },
  { v: 'Free', l: 'Design first', s: 'Pay only if you love it' },
  { v: '100%', l: 'Satisfaction', s: 'Money-back guarantee' },
]

// These previously carried invented aggregate statistics — "38% Online Orders",
// "3.2× More Leads", "52% Bookings", "2.8× Inquiries" — presented as our measured
// results. We have never measured those. They are replaced with what we actually
// build, which is verifiable by looking at the live sites on /work.
// Emoji icons removed: they break the editorial type treatment and read as unfinished.
const INDUSTRY_RESULTS = [
  {
    industry: 'Restaurants & Food',
    build: 'Online ordering',
    desc: 'Menus that stay current, ordering that works on a phone, and photography that sells the food.',
  },
  {
    industry: 'Construction & Trades',
    build: 'Project galleries',
    desc: 'Your finished work up front, service areas made obvious, and a quote form that reaches your phone.',
  },
  {
    industry: 'Healthcare',
    build: 'Appointment booking',
    desc: 'Clear services, practitioner bios, and booking that does not make a patient call during work hours.',
  },
  {
    industry: 'Professional Services',
    build: 'Lead capture',
    desc: 'Credibility first — who you are, who you help, and one obvious way to start a conversation.',
  },
]

// Verbatim Google reviews. Provenance: docs/REAL_TESTIMONIALS.md
// No `metric` — the reviewers stated no figures, so we print none.
const FEATURED_QUOTES = [
  {
    name: 'Pedro Dipre-Rojas',
    business: 'Conuco Takeout',
    quote:
      "Ace Web Designers built an amazing website for my business! Working with Rhyan and Valerie was a great experience. They are super professional and delivered a website that truly represents my restaurant. Their communication is excellent, and this made the process smooth from start to finish.",
  },
  {
    name: 'Aaron Brown',
    quote:
      'Ryan and his team did an outstanding job on my website. It looks spectacular. He helped me setup DNS settings and protect my customers. Also optimized everything so now I get a TON of leads coming in just with SEO. Blown away by what they accomplished - 10/10',
  },
  {
    name: 'Yolanda Quesada',
    quote:
      'I needed website. I saw in Facebook. And felt. I could do great. He did it. And people are going to my website. Thank you. I will continue to work with this company Ace web Designers',
  },
  {
    name: 'Philosophy Try',
    quote:
      'I love my philosophy site I highly recommend Valerie and Rhyan, very professional communication and Valerie made my social media explode',
  },
]

const GOOGLE_REVIEWS_URL =
  'https://www.google.com/maps/place/Ace+Web+Designers/@42.0369155,-71.6835355,8z/data=!4m8!3m7!1s0xad742ddaf4fd4307:0xeb30864a6eee77ea!9m1!1b1'

const WHY_CHOOSE = [
  { Icon: CheckCircle2, title: 'Proven results', desc: "We don't just build websites — we build websites that drive measurable ROI.", tone: 'brand' as const },
  { Icon: Users, title: 'Client-first approach', desc: 'Your success is our priority. We work closely with you to ensure every detail meets your vision.', tone: 'forest' as const },
  { Icon: Award, title: 'Quality guarantee', desc: "We're so confident in our work that we offer a money-back guarantee if you're not 100% satisfied.", tone: 'brand' as const },
]

function Reviews() {
  const goContact = () => {
    window.location.href = '/#contact'
  }

  return (
    <>
      <SeoMeta
        path="/reviews"
        jsonLd={[organizationLd(), localBusinessLd(), breadcrumbForPath('/reviews')!]}
      />
      <PageHero
        eyebrow={<><Star className="h-3.5 w-3.5 fill-current" aria-hidden />Client reviews</>}
        headline="What our"
        accent="clients say"
        sub="Real reviews from real businesses who trusted us with their digital success."
      >
        <div className="mt-10 flex justify-center">
          <TrustStack />
        </div>
      </PageHero>

      {/* STATS */}
      <Section tone="default" padding="md">
        <StaggerGrid
          items={REVIEW_STATS}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          keyFn={s => s.l}
          renderItem={s => <StatBlock value={s.v} label={s.l} sub={s.s} />}
        />
      </Section>

      {/* FEATURED PULL-QUOTES */}
      <Section tone="muted" padding="lg">
        <SectionHeading
          eyebrow="In their words"
          heading="Stories from"
          accent="local owners"
        />
        <StaggerGrid
          items={FEATURED_QUOTES}
          className="mt-14 grid gap-6 lg:grid-cols-2"
          delayMs={100}
          keyFn={t => t.name}
          renderItem={t => (
            <TestimonialEditorial
              quote={t.quote}
              authorName={t.name}
              business={'business' in t ? t.business : undefined}
              variant="feature"
            />
          )}
        />
        <p className="mt-8 text-center text-sm text-ink-700/70">
          Every quote is a verbatim{' '}
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-rust-600 underline decoration-rust-300 underline-offset-4 hover:text-rust-700"
          >
            Google review
          </a>
          . 5.0 average across 6 reviews.
        </p>
      </Section>

      {/* GOOGLE REVIEWS LIVE WIDGET — replicated from Refer.tsx (locationId preserved on Refer too) */}
      <Section tone="default" padding="lg">
        <SectionHeading
          eyebrow={<><Star className="h-3.5 w-3.5 fill-current" aria-hidden />Live from Google</>}
          eyebrowTone="forest"
          heading="Verified reviews,"
          accent="straight from Google"
          sub="Updated automatically — see what our clients are saying right now."
        />
        <div className="mt-12 flex justify-center">
          {/* PRESERVED behavior: external review widget script reads `locationId` */}
          <div locationId="10311921268967440718" className="review-widget-carousel" />
        </div>
      </Section>

      {/* INDUSTRY RESULTS */}
      <Section tone="muted" padding="lg">
        <SectionHeading
          eyebrow="By industry"
          heading="Results by"
          accent="industry"
          sub="See how different types of businesses benefit from our work."
        />
        <StaggerGrid
          items={INDUSTRY_RESULTS}
          className="mt-12 grid gap-6 md:grid-cols-2"
          delayMs={80}
          keyFn={r => r.industry}
          renderItem={r => (
            <Card tone="default" padding="lg" rounded="xl2" interactive className="h-full">
              <p className="label-mono text-ink-700/70">{r.industry}</p>
              <h3 className="mt-3 font-display text-3xl font-semibold text-ink-900">{r.build}</h3>
              <p className="mt-3 text-ink-800 leading-relaxed">{r.desc}</p>
            </Card>
          )}
        />
      </Section>

      {/* WHY CLIENTS CHOOSE US */}
      <Section tone="default" padding="lg">
        <SectionHeading
          eyebrow="The difference"
          heading="Why clients"
          accent="keep coming back"
        />
        <StaggerGrid
          items={WHY_CHOOSE}
          className="mt-12 grid gap-6 md:grid-cols-3"
          delayMs={80}
          keyFn={w => w.title}
          childClassName="text-center"
          renderItem={w => (
            <>
              <IconTile tone={w.tone} size="lg" className="mx-auto">
                <w.Icon />
              </IconTile>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{w.title}</h3>
              <p className="mt-2 text-ink-800 leading-relaxed">{w.desc}</p>
            </>
          )}
        />
      </Section>

      {/* FINAL CTA */}
      <FinalCta
        eyebrow="Be next"
        heading="Ready to join our"
        accent="happy clients?"
        body="See why businesses choose Ace Web Designers for their digital success. Get your free design mockup today."
        ctaLabel="Get my free design"
        onCta={goContact}
      />
    </>
  )
}

export default Reviews
