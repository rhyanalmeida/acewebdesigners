import React from 'react'

import { Section, Eyebrow, GradientHeading, SectionHeading, FinalCta, TrustStack } from './components/ui'
import { SeoMeta, organizationLd, serviceLd, breadcrumbForPath } from './seo'

/**
 * No pricing on this page, or anywhere public. The three-tier PriceCard grid
 * and the estimate calculator were removed 2026-07-20 (owner decision): what a
 * job costs depends on the job, and publishing tiers meant the site argued
 * about money before it had said anything worth paying for.
 *
 * The tools section is written as a grievance with a solution attached, not a
 * feature list, because that is what it is — Rhyan watched his dad pay
 * thousands a month for software that was worse than what we could build.
 */

const goContact = () =>
  window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'contact' } }))

const WEBSITE_INCLUDES = [
  {
    label: 'Built for you',
    title: 'Not a template with your logo dropped in',
    desc: 'The pages you actually need, the services you want to get called about, and photos of your own jobs rather than somebody else’s.',
  },
  {
    label: 'Findable',
    title: 'Basic SEO on every site, not as an extra',
    desc: 'Set up when we build it. One reviewer put it better than we would: he gets a TON of leads coming in just with SEO.',
  },
  {
    label: 'Contactable',
    title: 'Enquiries that do not land in your personal inbox',
    desc: 'Right now every potential customer probably arrives in the same Gmail as your receipts and your family photos. That is where jobs go to be forgotten.',
  },
  {
    label: 'Looked after',
    title: 'Hosting and changes handled',
    desc: 'You are not going to log in and edit anything. We know that. When something needs changing, you tell us and it changes.',
  },
]

const TOOLS = [
  { title: 'Email dashboards', desc: 'Enquiries in one place, separate from everything else in your inbox.' },
  { title: 'Automatic text and email reminders', desc: 'For quotes, appointments, and the follow-ups you meant to send and did not.' },
  { title: 'Full CRMs', desc: 'When a spreadsheet has stopped being enough and the off-the-shelf option costs more than it should.' },
]

const Services: React.FC = () => (
  <>
    <SeoMeta
      path="/services"
      jsonLd={[
        organizationLd(),
        serviceLd({
          name: 'Websites and social media for contractors',
          description:
            'Websites, social media management, and business software for contractors and trades. A custom made mockup is shown on a call before you pay. Basic SEO on every site.',
          serviceType: 'Web design and social media management',
          url: 'https://acewebdesigners.com/services',
        }),
        breadcrumbForPath('/services')!,
      ]}
    />

    {/* ── OPENING ── asymmetric and left-aligned. PageHero was a centred stack. */}
    <section className="relative bg-cream-50 text-ink-900 bg-paper-noise" aria-label="What we build">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 lg:pt-28">
        <Eyebrow tone="muted">What we build</Eyebrow>
        <GradientHeading level={1} size="display" className="mt-6 max-w-4xl">
          Three things, done properly.
        </GradientHeading>
        <p className="mt-8 max-w-2xl text-lg text-ink-800 leading-relaxed">
          A website, the social media around it, and the software you are probably being
          overcharged for. We would rather do three things well than list twenty.
        </p>
        <div className="mt-12 pt-8 border-t border-ink-900/10">
          <TrustStack align="left" />
        </div>
      </div>
    </section>

    {/* ── WEBSITE ── ruled rows */}
    <Section tone="muted" padding="lg">
      <SectionHeading
        eyebrow="01 — The website"
        heading="What is actually"
        accent="in it"
        sub="You see a custom made mockup on the call before any of this is agreed."
      />
      <ul className="mt-14 border-t border-ink-900/10">
        {WEBSITE_INCLUDES.map(item => (
          <li
            key={item.label}
            className="grid gap-3 py-8 border-b border-ink-900/10 sm:grid-cols-[10rem_1fr] sm:gap-8"
          >
            <span className="label-mono text-signal-600">{item.label}</span>
            <div>
              <h3 className="font-display text-xl text-ink-900">{item.title}</h3>
              <p className="mt-2 text-ink-800 leading-relaxed max-w-2xl">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>

    {/* ── SOCIAL ── asymmetric split, leading with the real result */}
    <Section tone="default" padding="lg">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <Eyebrow tone="muted">02 — Social media</Eyebrow>
          <h2 className="mt-6 font-display text-3xl sm:text-4xl leading-tight text-ink-900">
            Valerie runs it. You do not write captions at nine at night.
          </h2>
        </div>
        <div className="space-y-5 text-ink-800 leading-relaxed lg:pt-16">
          <p>
            One of the accounts she runs has fewer than two hundred followers. It has also brought
            its owner two bathrooms on a contract worth more than twenty thousand dollars.
          </p>
          <p>
            That is the whole argument. Follower counts are the thing everyone sells and mostly
            they do not matter. Getting the right work in front of someone who is ready to hire
            does.
          </p>
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'socialmedia' } }))
            }
            className="label-mono text-signal-600 underline underline-offset-4 hover:text-signal-700 transition-colors ring-focus-signal rounded"
          >
            See the accounts and the numbers
          </button>
        </div>
      </div>
    </Section>

    {/* ── TOOLS ── the grievance section, deliberately not a feature grid */}
    <Section tone="muted" padding="lg">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <Eyebrow tone="muted">03 — The tools</Eyebrow>
          <h2 className="mt-6 font-display text-3xl sm:text-4xl leading-tight text-ink-900">
            The software trades get gouged on.
          </h2>
          <p className="mt-6 text-ink-800 leading-relaxed">
            Rhyan watched his dad pay thousands a month for online tools that could have been
            better, while trying to provide for a family. We build these ourselves for that
            reason, and we price them like people who saw that happen.
          </p>
        </div>
        <ul className="border-t border-ink-900/10 lg:mt-2">
          {TOOLS.map((t, i) => (
            <li
              key={t.title}
              className="grid gap-2 py-7 border-b border-ink-900/10 sm:grid-cols-[3rem_1fr] sm:gap-6"
            >
              <span className="label-num text-ink-700/50">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="font-display text-lg text-ink-900">{t.title}</h3>
                <p className="mt-1.5 text-ink-800 leading-relaxed">{t.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>

    <FinalCta
      eyebrow="Book a time"
      heading="Tell us what you need"
      accent="on a fifteen-minute call"
      body="We will have a custom made website mockup on the screen when you join. What it costs depends on what you want, and we will tell you straight."
      ctaLabel="See available times"
      onCta={goContact}
    />
  </>
)

export default Services
