import React from 'react'
import { ArrowRight, ChevronRight, Plus, Minus } from 'lucide-react'
import { motion } from 'framer-motion'

import {
  Container,
  Section,
  Eyebrow,
  GradientHeading,
  SectionHeading,
  FinalCta,
  TrustStack,
  PhoneCta,
  TestimonialEditorial,
} from '../components/ui'
import { fadeUpHero } from '../lib/motion'

import type { NavigateFn } from '../components/layout'
import { SeoMeta, organizationLd, localBusinessLd, faqPageLd } from '../seo'

interface HomeProps {
  onNavigate: NavigateFn
  pendingScroll: string | null
  onPendingScrollHandled: () => void
}

/**
 * Verbatim reviews from our Google Business Profile, pulled 2026-07-20.
 * Full set and provenance: docs/REAL_TESTIMONIALS.md
 *
 * Rules for this array:
 *   - Quotes are VERBATIM. Yolanda's broken English stays exactly as written —
 *     the imperfection is what makes it read as real. Do not tidy it.
 *   - No metric field, no avatar. TestimonialEditorial no longer accepts either.
 *   - Nothing may be attributed to anyone who did not say it.
 *   - All six are shown. The review COUNT is never printed (owner decision,
 *     2026-07-20): the quotes are the proof, and a small count stated as a
 *     headline turns real social proof into an implied volume claim.
 */
const TESTIMONIALS = [
  {
    name: 'Pedro Dipre-Rojas',
    business: 'Conuco Takeout',
    quote:
      "Hello. I'm Pedro Dipre-Rojas, the owner of Conuco Restaurant Takeout, and Ace Web Designers built an amazing website for my business! Working with Rhyan and Valerie was a great experience. They are super professional and delivered a website that truly represents my restaurant. Their communication is excellent, and this made the process smooth from start to finish. If you need a website, I highly recommend Ace Web Designers. They'll make sure you get exactly what you need for your business.",
  },
  {
    name: 'Aaron Brown',
    quote:
      'Ryan and his team did an outstanding job on my website. It looks spectacular. He helped me setup DNS settings and protect my customers. Also optimized everything so now I get a TON of leads coming in just with SEO… Blown away by what they accomplished - 10/10',
  },
  {
    name: 'Hank Lin',
    business: 'Hot Pot One',
    quote: 'Great service and excellent website design',
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
  {
    name: 'Francisco Oliveira',
    quote: 'Great experience! Highly recommend!',
  },
]

const GOOGLE_REVIEWS_URL =
  'https://www.google.com/maps/place/Ace+Web+Designers/@42.0369155,-71.6835355,8z/data=!4m8!3m7!1s0xad742ddaf4fd4307:0xeb30864a6eee77ea!9m1!1b1'

/** What actually happens, in the owner's own account of it. No invented steps. */
const CALL_STEPS = [
  {
    label: 'Before',
    title: 'We build the mockup first',
    desc: 'You book a time and we make a custom website mockup for your business. It exists before we ever speak. You are not paying for it and you have not agreed to anything.',
  },
  {
    label: 'On the call',
    title: 'You look at it and tell us what is wrong with it',
    desc: 'Ten to fifteen minutes. We put the mockup on the screen, you say what you like and what you do not, and we plan the changes. That is the whole meeting.',
  },
  {
    label: 'After',
    title: 'You decide, or you do not',
    desc: 'If you want to keep going, we keep going. If you do not, you have lost fifteen minutes and you keep the feedback. There is no second call to talk you into it.',
  },
]

/** Capability, framed as what it removes from your week. */
const WHAT_WE_BUILD = [
  {
    label: 'Website',
    title: 'A site built around the work you actually do',
    desc: 'Photos of your jobs, the services you want to be called about, and a way to be contacted that is not your personal inbox. Basic SEO is set up on every site. It is not an upsell.',
  },
  {
    label: 'Social',
    title: 'Valerie runs the posting',
    desc: 'Posts that show the craft, made and scheduled by someone whose actual job is making things look good. You do not write captions at nine at night.',
  },
  {
    label: 'Tools',
    title: 'The software you are probably overpaying for',
    desc: 'Email dashboards, automatic text and email reminders, full CRMs. Rhyan watched his dad pay thousands a month for tools that could have been better. That is the entire reason we build these.',
  },
]

const FAQS = [
  {
    q: 'What happens on the call?',
    a: 'It runs 10 to 15 minutes. We show you a custom made website mockup, you tell us what you like and what you don’t, and we plan the changes. It costs nothing to get on the call.',
  },
  {
    q: 'Do I have to pay before I see anything?',
    a: 'No. The mockup exists before the call. You look at it first and decide after.',
  },
  {
    q: 'Do you work outside Massachusetts?',
    a: 'Yes, anywhere in the United States. The call is a video call and the work happens the same either way.',
  },
  {
    q: 'Is SEO included?',
    a: 'Basic SEO is set up on every site we build. It is not an upsell.',
  },
  {
    q: 'Can you build more than a website?',
    a: 'Yes. Email dashboards, automatic text and email reminders, and full CRMs. These are the tools trades usually get gouged on, which is why we build them.',
  },
  {
    q: 'Who actually does the work?',
    a: 'Two people. Rhyan designs and builds the sites and runs the calls. Valerie does all the social. The person you talk to is the person doing it.',
  },
]

const Home: React.FC<HomeProps> = ({ onNavigate, pendingScroll, onPendingScrollHandled }) => {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!pendingScroll) return
    const el = document.getElementById(pendingScroll)
    if (!el) return
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth' })
      onPendingScrollHandled()
    }, 100)
    return () => window.clearTimeout(t)
  }, [pendingScroll, onPendingScrollHandled])

  return (
    <>
      <SeoMeta
        path="/"
        jsonLd={[
          organizationLd(),
          localBusinessLd(),
          faqPageLd(FAQS.map(f => ({ question: f.q, answer: f.a }))),
        ]}
      />

      {/* ── HERO ──────────────────────────────────────────────────────────────
          Left-aligned and asymmetric. The old hero was a centred stack with a
          rotating word cycling every 2.2s; both were removed. This is the only
          section on the page that animates on entry. */}
      <section
        className="relative isolate overflow-hidden bg-cream-50 text-ink-900 bg-paper-noise"
        aria-label="Introduction"
      >
        <Container size="lg" className="relative z-10 pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-28 lg:pb-24">
          <motion.div
            className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } }}
          >
            <div>
              <motion.div variants={fadeUpHero}>
                <Eyebrow tone="muted">Websites for contractors</Eyebrow>
              </motion.div>
              <motion.div variants={fadeUpHero}>
                <GradientHeading level={1} size="display" className="mt-6">
                  You are good at the work. The website is the job you keep not doing.
                </GradientHeading>
              </motion.div>
            </div>

            <motion.div variants={fadeUpHero} className="lg:pb-3">
              <p className="text-lg sm:text-xl text-ink-800 leading-relaxed">
                So we do it first. We build you a custom website mockup, show it to you on a
                fifteen-minute call, and you decide after you have seen it.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onNavigate('contact')}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-signal-500 hover:bg-signal-600 text-white font-semibold text-base sm:text-lg px-8 py-4 magnetic-btn ring-focus-signal transition-colors duration-300"
                >
                  See available times
                  <ArrowRight className="h-5 w-5 icon-nudge" aria-hidden />
                </button>
                <button
                  onClick={() => onNavigate('work')}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-cream-100 hover:bg-cream-200 text-ink-900 font-semibold text-base sm:text-lg px-7 py-4 ring-1 ring-ink-900/15 transition-colors duration-300 ease-premium ring-focus-signal"
                >
                  See the work
                  <ChevronRight className="h-5 w-5 icon-nudge" aria-hidden />
                </button>
              </div>

              <div className="mt-8">
                <PhoneCta showLabels={false} />
              </div>
            </motion.div>
          </motion.div>

          <div className="mt-16 pt-8 border-t border-ink-900/10">
            <TrustStack align="left" />
          </div>
        </Container>
      </section>

      {/* ── WHY ───────────────────────────────────────────────────────────────
          Asymmetric split. The origin story, told plainly and in first person.
          Every fact here came from Rhyan directly — see the interview record in
          the approved plan. Nothing may be added to it. */}
      <Section id="why" tone="muted" padding="lg">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Eyebrow tone="muted">Why we do this</Eyebrow>
            <p className="mt-6 font-display text-2xl sm:text-3xl leading-snug text-ink-900">
              My dad builds bathrooms. He is a master at it and he put a whole team together.
              He never had a website.
            </p>
          </div>
          <div className="space-y-5 text-ink-800 leading-relaxed lg:pt-14">
            <p>
              He works ten to thirteen hour days. When he gets home he wants to be with his family,
              not learning what a domain is. So the marketing never happened, and the work he was
              genuinely excellent at stayed invisible to anyone who had not already hired him.
            </p>
            <p>
              He also paid thousands a month for online tools that were worse than what we could
              build. Watching that is why we build the dashboards and the reminder systems and the
              CRMs ourselves, instead of pointing you at someone else&rsquo;s subscription.
            </p>
            <p>
              He used to say that if you take care of the customer, business comes back ten fold and
              everyone is happy. That is the whole operating principle here, and we did not come up
              with it.
            </p>
            <p className="text-ink-900 font-medium">
              We are two people doing this alongside other work, trying to build something of our
              own. Same thing you are doing. That is not a pitch, it is just where we are standing.
            </p>
          </div>
        </div>
      </Section>

      {/* ── THE CALL ──────────────────────────────────────────────────────────
          Ruled rows: mono label left, content right, hairline between. This is
          the layout that replaces the nine identical three-column icon grids. */}
      <Section id="the-call" tone="default" padding="lg">
        <SectionHeading
          eyebrow="What actually happens"
          heading="Fifteen minutes,"
          accent="and you have already seen it"
          sub="Nobody enjoys booking a call with a web designer, because usually it is a sales call about a thing that does not exist yet. This one is the opposite way round."
        />
        <ul className="mt-14 border-t border-ink-900/10">
          {CALL_STEPS.map((step, i) => (
            <li
              key={step.label}
              className="grid gap-3 py-8 border-b border-ink-900/10 sm:grid-cols-[10rem_1fr] sm:gap-8"
            >
              <div className="flex items-baseline gap-3 sm:flex-col sm:gap-1">
                <span className="label-num text-ink-700/50">{String(i + 1).padStart(2, '0')}</span>
                <span className="label-mono text-signal-600">{step.label}</span>
              </div>
              <div>
                <h3 className="font-display text-xl text-ink-900">{step.title}</h3>
                <p className="mt-2 text-ink-800 leading-relaxed max-w-2xl">{step.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── WHAT WE BUILD ─────────────────────────────────────────────────────
          Same ruled-row system, reversed emphasis. Deliberately NOT a feature
          grid — the tools item is a grievance with a solution attached, and a
          card grid would flatten it into a spec list. */}
      <Section id="what-we-build" tone="muted" padding="lg">
        <SectionHeading
          eyebrow="What we build"
          heading="Three things,"
          accent="and we say no to the rest"
          sub="We turn down work that looks like a scam or that we would not want our name on. We also will not build you something lazy, which is most of what is being sold."
        />
        <ul className="mt-14 border-t border-ink-900/10">
          {WHAT_WE_BUILD.map(item => (
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

      {/* ── REVIEWS ───────────────────────────────────────────────────────────
          All six, verbatim, in a masonry-ish column layout rather than a tidy
          3-up grid — the reviews are wildly different lengths and forcing them
          into equal cards is what made them look manufactured. */}
      <Section id="reviews" tone="default" padding="lg">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Reviews"
            heading="Every word of these"
            accent="is theirs"
            className="max-w-2xl"
          />
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono text-ink-700 hover:text-signal-600 underline underline-offset-4 transition-colors"
          >
            5.0 on Google — read them there
          </a>
        </div>

        <div className="mt-14 columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:balance]">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="mb-6 break-inside-avoid">
              <TestimonialEditorial
                quote={t.quote}
                authorName={t.name}
                business={t.business}
              />
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-ink-700/80 max-w-2xl">
          We have not edited these, including the spelling. Hank left his after we met him at his
          own restaurant, which is a story further down the About page.
        </p>
      </Section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────
          Ruled rows again, as a disclosure list. */}
      <Section id="faq" tone="muted" padding="lg">
        <SectionHeading eyebrow="Questions" heading="The ones we actually" accent="get asked" />
        <ul className="mt-12 border-t border-ink-900/10 max-w-3xl">
          {FAQS.map((f, i) => {
            const open = openFaq === i
            return (
              <li key={f.q} className="border-b border-ink-900/10">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-6 py-6 text-left ring-focus-signal"
                >
                  <span className="font-display text-lg text-ink-900">{f.q}</span>
                  {open ? (
                    <Minus className="h-5 w-5 shrink-0 text-signal-600 mt-1" aria-hidden />
                  ) : (
                    <Plus className="h-5 w-5 shrink-0 text-ink-700/60 mt-1" aria-hidden />
                  )}
                </button>
                {open && <p className="pb-6 -mt-1 text-ink-800 leading-relaxed">{f.a}</p>}
              </li>
            )
          })}
        </ul>
      </Section>

      <FinalCta
        eyebrow="Book a time"
        heading="Come look at it"
        accent="before you decide anything"
        body="Fifteen minutes, a mockup already built for your business, and nothing owed if you walk away."
        ctaLabel="See available times"
        onCta={() => onNavigate('contact')}
      />
    </>
  )
}

export default Home
