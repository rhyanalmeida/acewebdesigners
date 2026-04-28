import React, { useEffect } from 'react'
import { Calendar } from 'lucide-react'

import { BookingWidget } from './components/BookingWidget'
import { MAIN_CALENDAR } from './config/calendars'
import {
  Section,
  Card,
  PageHero,
  SectionHeading,
  PhoneCta,
  TrustStack,
} from './components/ui'

interface ContactProps {
  initialData?: {
    budget?: string
    message?: string
  }
}

const labelForBudget = (budget?: string) => {
  if (budget === 'basic') return 'Website in a Day ($200)'
  if (budget === 'standard') return 'Standard Website ($1,000)'
  if (budget === 'ecommerce') return 'E-commerce Website ($1,500)'
  return 'Custom Project'
}

function Contact({ initialData }: ContactProps) {
  useEffect(() => {
    document.title = 'Schedule a Consultation | Web Design Services Nationwide'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Schedule a free consultation with our web design team. Book a time to discuss your project needs and learn how we can help grow your online presence.'
      )
    }
  }, [initialData])

  return (
    <>
      <PageHero
        eyebrow="Free consultation"
        eyebrowIcon={Calendar}
        size="xl"
        headline="Book your"
        accent="free design consultation"
        sub="15 minutes with our team — free homepage mockup in 24-48 hours."
        className="!pb-12"
      >
        <div className="mt-8 flex justify-center">
          <TrustStack
            items={[
              { icon: 'shield', label: 'No credit card required' },
              { icon: 'clock', label: 'No obligation' },
              { icon: 'star', label: '5.0 on Google', sub: '100+ reviews' },
            ]}
          />
        </div>
        <div className="mt-8 flex justify-center">
          <PhoneCta showLabels={false} />
        </div>
      </PageHero>

      {/* BOOKING WIDGET */}
      <Section tone="muted" padding="md" containerSize="md" className="-mt-10">
        <Card tone="default" padding="xl" rounded="xl3" className="shadow-lift">
          <div className="text-center">
            <span className="label-mono text-rust-700">Schedule</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-ink-900 leading-tight">
              Pick a time that works.{' '}
              <span className="text-editorial-italic text-rust-600">We&rsquo;ll show up.</span>
            </h2>
            <p className="mt-4 text-ink-700 max-w-xl mx-auto leading-relaxed">
              Book a 15-minute slot. We&rsquo;ll send your{' '}
              <span className="font-semibold text-ink-900">free</span> homepage design within 24-48 hours.
            </p>

            {initialData?.budget && (
              <div className="mt-5 inline-block text-left bg-rust-50 ring-1 ring-rust-100 rounded-xl px-4 py-3 text-sm text-ink-900">
                <p>
                  You selected the{' '}
                  <span className="font-semibold">{labelForBudget(initialData.budget)}</span> package.
                </p>
                {initialData.message && (
                  <p className="mt-2 italic text-ink-800">&ldquo;{initialData.message}&rdquo;</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-10">
            {/* LeadConnector booking widget — main calendar (containerId preserved) */}
            <BookingWidget calendarConfig={MAIN_CALENDAR} containerId="contact-page-booking" />
          </div>

          <p className="mt-6 max-w-xl mx-auto text-sm text-ink-800 bg-cream-100 border-l-4 border-rust-500 rounded-xl p-4 text-left">
            <strong className="text-rust-700">Please show up!</strong> We&rsquo;re real people who block time for you. Thanks!
          </p>
        </Card>
      </Section>

      {/* ALTERNATIVE CONTACT */}
      <Section tone="default" padding="lg" containerSize="md">
        <SectionHeading
          eyebrow="Other ways to reach us"
          heading="Prefer another"
          accent="way to connect?"
          sub="Call, text, or email — we usually reply within hours."
          maxWidth="max-w-none"
        />

        <Card tone="default" padding="xl" rounded="xl3" className="mt-12">
          <PhoneCta />
          <hr className="rule-hairline my-7" />
          <p className="text-sm text-ink-700">
            Based in Leominster, MA — serving small businesses{' '}
            <span className="text-editorial-italic text-rust-600">nationwide</span>.
          </p>
        </Card>
      </Section>
    </>
  )
}

export default Contact
