import React, { useEffect } from 'react'
import { Star, Users, TrendingUp, Award, CheckCircle2, ArrowRight } from 'lucide-react'

import {
  Section,
  Card,
  IconTile,
  StatBlock,
  TrustBar,
  PageHero,
  SectionHeading,
  StaggerGrid,
} from './components/ui'

const REVIEW_STATS = [
  { v: '5.0', l: 'Average rating', s: 'From 100+ verified reviews' },
  { v: '100+', l: 'Happy clients', s: 'Businesses nationwide' },
  { v: '95%', l: 'Success rate', s: 'Clients see increased results' },
  { v: '100%', l: 'Satisfaction', s: 'Money-back guarantee' },
]

const INDUSTRY_RESULTS = [
  { industry: 'Restaurants & Food', icon: '🍽️', avg: '38%', metric: 'Online Orders', desc: 'Restaurants see significant increases in online ordering and takeout sales.' },
  { industry: 'Construction', icon: '🏗️', avg: '3.2×', metric: 'More Leads', desc: 'Contractors generate more qualified leads through professional websites.' },
  { industry: 'Healthcare', icon: '⚕️', avg: '52%', metric: 'Bookings', desc: 'Healthcare practices see more online appointment bookings.' },
  { industry: 'Professional Services', icon: '💼', avg: '2.8×', metric: 'Inquiries', desc: 'Service businesses receive more qualified client inquiries.' },
]

const WHY_CHOOSE = [
  { Icon: CheckCircle2, title: 'Proven results', desc: "We don't just build websites — we build websites that drive measurable ROI.", tone: 'brand' as const },
  { Icon: Users, title: 'Client-first approach', desc: 'Your success is our priority. We work closely with you to ensure every detail meets your vision.', tone: 'accent' as const },
  { Icon: Award, title: 'Quality guarantee', desc: "We're so confident in our work that we offer a money-back guarantee if you're not 100% satisfied.", tone: 'brand' as const },
]

function Reviews() {
  useEffect(() => {
    document.title = 'Client Reviews & Testimonials | Ace Web Designers'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Read real client reviews and testimonials from businesses who trusted Ace Web Designers with their website projects. See the results we deliver!'
      )
    }
  }, [])

  return (
    <>
      <PageHero
        eyebrow={<><Star className="h-3.5 w-3.5 fill-current" aria-hidden />Client reviews</>}
        headline="What"
        accent="our clients say"
        sub="Real reviews from real businesses who trusted us with their digital success."
      >
        <div className="mt-8 inline-flex">
          <TrustBar tone="inverted" reviewsCount="100+ reviews" />
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
            <Card tone="default" padding="lg" rounded="xl2" interactive shine className="h-full">
              <div className="flex items-start gap-5">
                <span className="text-5xl shrink-0" aria-hidden>{r.icon}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-surface-900">{r.industry}</h3>
                  <p className="mt-3 font-display text-4xl font-bold text-gradient-brand">{r.avg}</p>
                  <p className="text-sm font-semibold uppercase tracking-[0.15em] text-surface-500">{r.metric}</p>
                  <p className="mt-3 text-surface-600 leading-relaxed">{r.desc}</p>
                </div>
              </div>
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
              <h3 className="mt-5 font-display text-xl font-semibold text-surface-900">{w.title}</h3>
              <p className="mt-2 text-surface-600 leading-relaxed">{w.desc}</p>
            </>
          )}
        />
      </Section>

      {/* FINAL CTA — uses <a href="/#contact"> rather than onCta callback (Reviews has no SPA route registered) */}
      <Section tone="mesh" padding="lg" containerSize="md">
        <div className="text-center" data-reveal="up">
          <SectionHeading
            eyebrow="Be next"
            heading="Ready to join our happy clients?"
            sub="See why businesses choose Ace Web Designers for their digital success. Get your free design mockup today."
            tone="inverted"
            eyebrowTone="inverted"
            maxWidth="max-w-xl"
          />
          <a
            href="/#contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-surface-900 font-bold text-base sm:text-lg px-8 py-4 shadow-lift magnetic-btn ring-focus-brand"
          >
            Get my free design
            <ArrowRight className="h-5 w-5" aria-hidden />
          </a>
        </div>
      </Section>
    </>
  )
}

export default Reviews
