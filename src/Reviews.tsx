import React, { useEffect } from 'react'
import { Star, Users, TrendingUp, Award, CheckCircle2, ArrowRight } from 'lucide-react'

import {
  Section,
  Eyebrow,
  GradientHeading,
  Card,
  Reveal,
  IconTile,
  StatBlock,
  TrustBar,
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
      {/* HERO */}
      <Section tone="mesh" padding="lg">
        <div className="text-center max-w-3xl mx-auto" data-reveal="up">
          <Eyebrow tone="inverted">
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
            Client reviews
          </Eyebrow>
          <GradientHeading level={1} size="display" tone="inverted" className="mt-5" accent="our clients say">
            What
          </GradientHeading>
          <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed">
            Real reviews from real businesses who trusted us with their digital success.
          </p>
          <div className="mt-8 inline-flex">
            <TrustBar tone="inverted" reviewsCount="100+ reviews" />
          </div>
        </div>
      </Section>

      {/* STATS */}
      <Section tone="default" padding="md">
        <Reveal variant="stagger" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEW_STATS.map((s, i) => (
            <div key={s.l} data-reveal-stagger-child style={{ transitionDelay: `${i * 70}ms` }}>
              <StatBlock value={s.v} label={s.l} sub={s.s} />
            </div>
          ))}
        </Reveal>
      </Section>

      {/* INDUSTRY RESULTS */}
      <Section tone="muted" padding="lg">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow>By industry</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-4" accent="industry">
            Results by
          </GradientHeading>
          <p className="mt-4 text-surface-600">See how different types of businesses benefit from our work.</p>
        </div>
        <Reveal variant="stagger" className="mt-12 grid gap-6 md:grid-cols-2">
          {INDUSTRY_RESULTS.map((r, i) => (
            <div key={r.industry} data-reveal-stagger-child style={{ transitionDelay: `${i * 80}ms` }}>
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
            </div>
          ))}
        </Reveal>
      </Section>

      {/* WHY CLIENTS CHOOSE US */}
      <Section tone="default" padding="lg">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow>The difference</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-4" accent="keep coming back">
            Why clients
          </GradientHeading>
        </div>
        <Reveal variant="stagger" className="mt-12 grid gap-6 md:grid-cols-3">
          {WHY_CHOOSE.map((w, i) => (
            <div key={w.title} data-reveal-stagger-child style={{ transitionDelay: `${i * 80}ms` }} className="text-center">
              <IconTile tone={w.tone} size="lg" className="mx-auto">
                <w.Icon />
              </IconTile>
              <h3 className="mt-5 font-display text-xl font-semibold text-surface-900">{w.title}</h3>
              <p className="mt-2 text-surface-600 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* FINAL CTA */}
      <Section tone="mesh" padding="lg" containerSize="md">
        <Reveal variant="up" className="text-center">
          <Eyebrow tone="inverted">Be next</Eyebrow>
          <GradientHeading level={2} size="lg" tone="inverted" className="mt-4">
            Ready to join our happy clients?
          </GradientHeading>
          <p className="mt-5 text-white/80 max-w-xl mx-auto">
            See why businesses choose Ace Web Designers for their digital success. Get your free design mockup today.
          </p>
          <a
            href="/#contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-surface-900 font-bold text-base sm:text-lg px-8 py-4 shadow-lift magnetic-btn ring-focus-brand"
          >
            Get my free design
            <ArrowRight className="h-5 w-5" aria-hidden />
          </a>
        </Reveal>
      </Section>
    </>
  )
}

export default Reviews
