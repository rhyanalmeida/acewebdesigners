import React, { useEffect } from 'react'
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

const FEATURED_QUOTES = [
  {
    name: 'Mike Chen',
    business: 'Hot Pot One',
    city: 'Boston, MA',
    quote: "Ace created an amazing website for our small restaurant. The ordering system works flawlessly and we've seen a 40% increase in online orders since launch.",
    metric: '40% more orders',
  },
  {
    name: 'John Dunn',
    business: 'Dunn Construction',
    city: 'Leominster, MA',
    quote: "Within days, we had a professional website that perfectly represented our small construction business. We're already getting 3x more leads than before.",
    metric: '3× qualified leads',
  },
]

const WHY_CHOOSE = [
  { Icon: CheckCircle2, title: 'Proven results', desc: "We don't just build websites — we build websites that drive measurable ROI.", tone: 'brand' as const },
  { Icon: Users, title: 'Client-first approach', desc: 'Your success is our priority. We work closely with you to ensure every detail meets your vision.', tone: 'forest' as const },
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

  const goContact = () => {
    window.location.href = '/#contact'
  }

  return (
    <>
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
              business={t.business}
              city={t.city}
              result={t.metric}
              variant="feature"
            />
          )}
        />
      </Section>

      {/* GOOGLE REVIEWS LIVE WIDGET — replicated from Refer.tsx (locationId preserved on Refer too) */}
      <Section tone="default" padding="lg">
        <SectionHeading
          eyebrow={<><Star className="h-3.5 w-3.5 fill-current" aria-hidden />Live from Google</>}
          eyebrowTone="forest"
          heading="100+ verified reviews,"
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
            <Card tone="default" padding="lg" rounded="xl2" interactive shine className="h-full">
              <div className="flex items-start gap-5">
                <span className="text-5xl shrink-0" aria-hidden>{r.icon}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink-900">{r.industry}</h3>
                  <p className="mt-3 font-display text-5xl font-semibold text-rust-600">{r.avg}</p>
                  <p className="label-mono text-ink-700/70">{r.metric}</p>
                  <p className="mt-3 text-ink-700 leading-relaxed">{r.desc}</p>
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
              <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{w.title}</h3>
              <p className="mt-2 text-ink-700 leading-relaxed">{w.desc}</p>
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
