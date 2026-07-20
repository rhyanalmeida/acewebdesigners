import React from 'react'

import { BookingWidget } from './components/BookingWidget'
import { MAIN_CALENDAR } from './config/calendars'
import { Section, Eyebrow, GradientHeading, PhoneCta, TrustStack } from './components/ui'
import { SeoMeta, organizationLd, localBusinessLd, breadcrumbForPath } from './seo'

/**
 * The booking widget and its containerId are LOAD-BEARING. `contact-page-booking`
 * is targeted by CSS in src/index.css and the Scheduler inside it owns every
 * payload to the `lead` and `book` edge functions plus both trackLead /
 * trackSchedule pixel calls. Restyle around it; do not rewire it.
 *
 * The package/budget banner was removed 2026-07-20 along with public pricing —
 * it printed "Website in a Day ($200)" and friends, and nothing sets that state
 * any more now that the pricing tiers are gone.
 */

interface ContactProps {
  initialData?: {
    budget?: string
    message?: string
  }
}

function Contact({ initialData }: ContactProps) {
  return (
    <>
      <SeoMeta
        path="/contact"
        jsonLd={[organizationLd(), localBusinessLd(), breadcrumbForPath('/contact')!]}
      />

      {/* ── OPENING ── left-aligned; the old PageHero was a centred stack.
          Says exactly what the call is, because the thing keeping a contractor
          from booking is not knowing what he is walking into. */}
      <section className="relative bg-cream-50 text-ink-900 bg-paper-noise" aria-label="Book a call">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-12 sm:pt-24 lg:pt-28">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:items-end">
            <div>
              <Eyebrow tone="muted">Book a call</Eyebrow>
              <GradientHeading level={1} size="xl" className="mt-6">
                Ten to fifteen minutes, and there is already something to look at.
              </GradientHeading>
            </div>
            <div className="lg:pb-2">
              <p className="text-lg text-ink-800 leading-relaxed">
                We build a custom made website mockup for your business before you join. On the
                call you tell us what you like and what you do not, and we plan the changes.
                Getting on the call costs nothing.
              </p>
              <div className="mt-7">
                <PhoneCta showLabels={false} />
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-ink-900/10">
            <TrustStack
              align="left"
              items={[
                { icon: 'clock', label: '10–15 minutes' },
                { icon: 'shield', label: 'No card, no commitment' },
                { icon: 'sparkles', label: 'A mockup already built for you' },
                { icon: 'star', label: '5.0 on Google' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── SCHEDULER ── */}
      <Section tone="muted" padding="lg" containerSize="md">
        {initialData?.message && (
          <p className="mb-8 border-l-2 border-signal-500 pl-4 text-ink-800 italic">
            &ldquo;{initialData.message}&rdquo;
          </p>
        )}

        {/* LeadConnector booking widget — main calendar (containerId preserved) */}
        <BookingWidget calendarConfig={MAIN_CALENDAR} containerId="contact-page-booking" />

        <p className="mt-8 border-l-2 border-signal-500 pl-4 text-sm text-ink-800">
          If you book, please turn up. It is two of us and we block the time out for you.
        </p>
      </Section>

      {/* ── OTHER WAYS ── */}
      <Section tone="default" padding="lg">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <Eyebrow tone="muted">Or just ring us</Eyebrow>
            <h2 className="mt-6 font-display text-3xl leading-tight text-ink-900">
              You do not have to book anything to ask a question.
            </h2>
            <p className="mt-5 text-ink-800 leading-relaxed">
              Call or text. We work anywhere in the United States, so it does not matter where you
              are.
            </p>
          </div>
          <div className="lg:pt-8">
            <PhoneCta />
          </div>
        </div>
      </Section>
    </>
  )
}

export default Contact
