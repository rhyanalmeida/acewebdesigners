import React, { useEffect } from 'react'
import { Mail, Phone, MapPin, Calendar } from 'lucide-react'

import { BookingWidget } from './components/BookingWidget'
import { MAIN_CALENDAR } from './config/calendars'
import {
  Section,
  Container,
  Card,
  TrustBar,
  IconTile,
  BadgePill,
  PageHero,
  SectionHeading,
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
        sub="15 minutes with our team → free homepage mockup in 24-48 hours."
        className="!pb-12"
      >
        <div className="mt-6 flex justify-center">
          <TrustBar
            tone="inverted"
            guarantees={['SSL secured', 'No credit card required', 'No obligation']}
          />
        </div>
      </PageHero>

      {/* BOOKING WIDGET */}
      <Section tone="muted" padding="md" containerSize="md" className="-mt-10">
        <Card tone="default" padding="xl" rounded="xl3" className="shadow-lift">
          <div className="text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-surface-900">
              Schedule your free consultation
            </h2>
            <p className="mt-3 text-surface-600">
              Book a time to discuss your project and get your{' '}
              <span className="font-semibold text-brand-700">free</span> design mockup.
            </p>

            {initialData?.budget && (
              <div className="mt-5 inline-block text-left bg-brand-50 ring-1 ring-brand-100 rounded-xl px-4 py-3 text-sm text-brand-900">
                <p>
                  You selected the <span className="font-semibold">{labelForBudget(initialData.budget)}</span> package.
                </p>
                {initialData.message && (
                  <p className="mt-2 italic text-brand-800">&ldquo;{initialData.message}&rdquo;</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8">
            {/* LeadConnector booking widget — main calendar (containerId preserved) */}
            <BookingWidget calendarConfig={MAIN_CALENDAR} containerId="contact-page-booking" />
          </div>

          <p className="mt-6 max-w-xl mx-auto text-sm text-surface-700 bg-brand-50 border-l-4 border-brand-500 rounded-xl p-4 text-left">
            <strong className="text-brand-700">Please show up!</strong> We're real people who block time for you. Thanks!
          </p>
        </Card>
      </Section>

      {/* ALTERNATIVE CONTACT */}
      <Section tone="default" padding="lg" containerSize="md">
        <SectionHeading
          eyebrow="Other ways to reach us"
          heading="Prefer another way to connect?"
          sub="We're here to help however you prefer."
          maxWidth="max-w-none"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Card tone="default" padding="lg" rounded="xl2" interactive shine>
            <div className="flex items-start gap-4">
              <IconTile tone="brand" size="md">
                <Mail />
              </IconTile>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-500">Email</p>
                <a
                  href="mailto:support@acewebdesigners.com"
                  className="mt-1 inline-block text-base font-semibold text-surface-900 hover:text-brand-700 transition-colors ring-focus-brand rounded"
                >
                  support@acewebdesigners.com
                </a>
                <p className="mt-1 text-sm text-surface-500">Reply within 24 hours, Monday–Friday.</p>
              </div>
            </div>
          </Card>

          <Card tone="default" padding="lg" rounded="xl2" interactive shine>
            <div className="flex items-start gap-4">
              <IconTile tone="brand" size="md">
                <Phone />
              </IconTile>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-500">Phone</p>
                <a
                  href="tel:+17744467375"
                  className="mt-1 inline-block text-base font-semibold text-surface-900 hover:text-brand-700 transition-colors ring-focus-brand rounded"
                >
                  (774) 446-7375
                </a>
                <p className="mt-1 text-sm text-surface-500">Call or text — we usually answer fast.</p>
              </div>
            </div>
          </Card>
        </div>

        <Container size="md" className="mt-8 px-0">
          <div className="flex items-center justify-center gap-2 text-sm text-surface-500">
            <MapPin className="h-4 w-4" aria-hidden />
            Based in Leominster, MA — Serving Nationwide
            <BadgePill tone="success" className="ml-2">Available now</BadgePill>
          </div>
        </Container>
      </Section>
    </>
  )
}

export default Contact
