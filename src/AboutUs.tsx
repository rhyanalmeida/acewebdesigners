import React from 'react'
import { motion } from 'framer-motion'

import {
  Section,
  Eyebrow,
  Figure,
  GradientHeading,
  SectionHeading,
  FinalCta,
  PhoneCta,
} from './components/ui'
import { fadeUpHero } from './lib/motion'
import { SeoMeta, organizationLd, localBusinessLd, breadcrumbForPath } from './seo'

/**
 * Every biographical fact on this page came from Rhyan directly (interview,
 * 2026-07-20). Nothing here may be embellished, and no fact may be added that
 * he did not give us — no invented credentials, no years-in-business number, no
 * client count, no "we've helped X businesses".
 *
 * Deliberately absent:
 *   - The name of Rhyan's dad's business. He asked us not to name it.
 *   - Any claim that we do not use AI. We run an Opus chain to build client
 *     previews; claiming purity would be the same dishonesty this page argues
 *     against. The position is that the tool was never the problem.
 *
 * The photo below is a placeholder. Rhyan is supplying a real photo of them
 * both. Do not substitute stock or generated imagery to fill the space.
 */

const goContact = () =>
  window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'contact' } }))

const AboutUs: React.FC = () => (
  <>
    <SeoMeta
      path="/about"
      jsonLd={[organizationLd(), localBusinessLd(), breadcrumbForPath('/about', 'About')]}
    />

    {/* ── OPENING ───────────────────────────────────────────────────────────
        The dad. This is the origin and the customer portrait at the same time. */}
    <section className="relative bg-cream-50 text-ink-900 bg-paper-noise" aria-label="About us">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 lg:pt-28">
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUpHero}>
            <Eyebrow tone="muted">Rhyan and Valerie</Eyebrow>
          </motion.div>
          <motion.div variants={fadeUpHero}>
            <GradientHeading level={1} size="display" className="mt-6 max-w-4xl">
              My dad built bathrooms for a living and never had a website.
            </GradientHeading>
          </motion.div>
          <motion.p
            className="mt-8 max-w-2xl text-lg text-ink-800 leading-relaxed"
            variants={fadeUpHero}
          >
            He is a master at the work. He put a whole team together. But after a ten to
            thirteen hour day he wanted to be home with his family, not figuring out marketing,
            so it never got done. That is the person this company was built for, and it is why
            we work with trades instead of whoever turns up.
          </motion.p>
        </motion.div>
      </div>
      <hr className="rule-hairline" />
    </section>

    {/* ── THE FIRST JOB ─────────────────────────────────────────────────────
        Asymmetric split. Told plainly, in the order it happened. The detail
        about calling Hank over to the table is the point — do not smooth it out
        into "we approached a local restaurant owner". */}
    <Section tone="muted" padding="lg">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <Eyebrow tone="muted">How it started</Eyebrow>
          <h2 className="mt-6 font-display text-3xl sm:text-4xl leading-tight text-ink-900">
            We were eating dinner and called the owner over to our table.
          </h2>
        </div>
        <div className="space-y-5 text-ink-800 leading-relaxed lg:pt-16">
          <p>
            We were at Hank&rsquo;s restaurant, Hot Pot One, having dinner. We noticed he did not
            have a website. So we called him over to the table, mid-meal, and asked him about it.
          </p>
          <p>
            He was interested. A couple of meetings later his site was up. That was our first paid
            job, and it is what got us moving on finding the next one.
          </p>
          <p className="text-ink-900 font-medium">
            He later left us a Google review. Four words: &ldquo;Great service and excellent
            website design.&rdquo; We will take it.
          </p>
        </div>
      </div>
    </Section>

    {/* ── THE TWO OF US ─────────────────────────────────────────────────────
        Full-width ruled rows, one per person. Not a team grid of headshot
        cards — there are two of us and a card grid would be pretending. */}
    <Section tone="default" padding="lg">
      <SectionHeading
        eyebrow="Who does what"
        heading="Two people."
        accent="That is the whole company"
        sub="We do this alongside other work, building something of our own — the same thing our clients are doing. The person you talk to is the person doing the work."
      />

      {/*
        Both portraits are real, supplied by Rhyan 2026-07-20, and shot on the
        same backdrop — which is why they can sit side by side without looking
        like two unrelated photos. Rendered through Figure at `mono` so the warm
        cast on one and the cooler cast on the other resolve to one set.
        Deliberately kept at identifier scale rather than hero scale: these are
        studio headshots, and blown up large they read as a corporate team page,
        which is the register this site argues against.

        NOTE: the file they replaced, /public/rhyan.jpg, was not an image at all
        — it was 14 bytes of ASCII reading "404: Not Found", so the About page
        had been rendering a broken image since long before this redesign.
      */}
      <ul className="mt-14 border-t border-ink-900/15">
        <li className="grid gap-5 py-10 border-b border-ink-900/15 sm:grid-cols-[7rem_1fr] sm:gap-10">
          <Figure
            src="/team/rhyan.webp"
            alt="Rhyan, who designs and builds the sites at Ace Web Designers"
            treatment="mono"
            aspect="aspect-square"
          />
          <div>
            <span className="label-mono text-signal-600">Rhyan</span>
            <h3 className="mt-2 font-display text-xl text-ink-900">
              Designs the sites, runs the calls
            </h3>
            <p className="mt-2 text-ink-800 leading-relaxed max-w-2xl">
              He builds the mockup before you turn up, sits on the call, and does the site itself.
              He grew up watching his dad do excellent work that nobody online could find, and
              separately watching him pay thousands a month for software that was worse than what
              we could make. Both of those are why this exists.
            </p>
          </div>
        </li>
        <li className="grid gap-5 py-10 border-b border-ink-900/15 sm:grid-cols-[7rem_1fr] sm:gap-10">
          <Figure
            src="/team/valerie.webp"
            alt="Valerie, who runs all the social media at Ace Web Designers"
            treatment="mono"
            aspect="aspect-square"
          />
          <div>
            <span className="label-mono text-signal-600">Valerie</span>
            <h3 className="mt-2 font-display text-xl text-ink-900">
              Does every bit of the social
            </h3>
            <p className="mt-2 text-ink-800 leading-relaxed max-w-2xl">
              She is also an esthetician, and she says beautifying a social page works the same way
              as beautifying anything else. She wants things to look genuine and feel good, and she
              likes watching people do well. One reviewer put it more directly than we would:
              Valerie made my social media explode.
            </p>
          </div>
        </li>
      </ul>
    </Section>

    {/* ── WHAT WE WILL NOT DO ──────────────────────────────────────────────────
        Built from Rhyan's own answer. Kept short — a long list of refusals
        starts to sound like posturing. */}
    <Section tone="muted" padding="lg">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <Eyebrow tone="muted">What we turn down</Eyebrow>
          <h2 className="mt-6 font-display text-3xl sm:text-4xl leading-tight text-ink-900">
            We say no to work that looks like a scam, and to lazy websites.
          </h2>
        </div>
        <div className="space-y-5 text-ink-800 leading-relaxed lg:pt-16">
          <p>
            If a business looks like it is set up to take advantage of people, or it goes against
            what we think is right, we do not take it. That has cost us jobs and it will again.
          </p>
          <p>
            The other one is lazier and more common: sites with nothing in them. Somebody
            generates the photos, generates the page, ships it, and never looks at it again.
          </p>
          <p>
            We are not precious about the tools — that is not the problem. The problem is when
            nobody put any care in and nobody is being genuine. You can usually tell within about
            five seconds, and so can your customers.
          </p>
          <p className="text-ink-900 font-medium">
            Business and profit are not everything. You are a person trying to do work you are
            proud of, provide for the people you care about, and still be there for them. We are
            trying to do the same thing. That is the actual job.
          </p>
        </div>
      </div>
    </Section>

    <Section tone="default" padding="md">
      <div className="flex flex-col items-start gap-6">
        <p className="max-w-2xl font-display text-2xl sm:text-3xl leading-snug text-ink-900">
          &ldquo;Take care of the customer and business will come ten fold, and everyone will be
          happy.&rdquo;
        </p>
        <p className="label-mono text-ink-700/70">Rhyan&rsquo;s dad</p>
        <PhoneCta showLabels />
      </div>
    </Section>

    <FinalCta
      eyebrow="Book a time"
      heading="Come look at what we made you"
      accent="before you decide"
      body="Fifteen minutes. We show you a custom made website mockup for your business. Nothing owed if you walk away."
      ctaLabel="See available times"
      onCta={goContact}
    />
  </>
)

export default AboutUs
