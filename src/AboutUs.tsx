import React from 'react'
import {
  Code,
  Briefcase,
  Star,
  Users,
  Zap,
  Brain,
  Target,
  Rocket,
  ArrowRight,
} from 'lucide-react'

import { motion } from 'framer-motion'

import {
  Section,
  Eyebrow,
  GradientHeading,
  Card,
  Reveal,
  IconTile,
  StatBlock,
  SectionHeading,
  StaggerGrid,
  FinalCta,
  PhoneCta,
  TrustStack,
  Magnetic,
} from './components/ui'
import { fadeUpHero } from './lib/motion'

const VALUES = [
  { Icon: Target, title: 'Results-driven', desc: 'We focus on delivering measurable results that help your business grow.' },
  { Icon: Brain, title: 'Innovation', desc: 'Staying ahead with the latest technologies and design trends.' },
  { Icon: Users, title: 'Client-focused', desc: 'Your success is our priority. We build lasting partnerships.' },
  { Icon: Rocket, title: 'Fast delivery', desc: 'Quick turnaround without compromising on quality.' },
]

const EXPERTISE = [
  { Icon: Code, label: 'Custom development' },
  { Icon: Star, label: 'UI/UX design' },
  { Icon: Zap, label: 'Performance optimization' },
  { Icon: Briefcase, label: 'Business strategy' },
]

const STATS = [
  { v: 'Many', l: 'Websites launched' },
  { v: 'Happy', l: 'Social media clients' },
  { v: '100%', l: 'Satisfaction rate' },
  { v: '1–7d', l: 'Avg. delivery' },
]

function AboutUs() {
  React.useEffect(() => {
    document.title = 'About Our Web Design Team | Expert Developers Nationwide'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Meet our experienced web design and development team. We specialize in creating custom digital solutions that drive business growth and user engagement for companies nationwide.'
      )
    }
  }, [])

  const goContact = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'contact' } }))
  }

  return (
    <>
      {/* HERO — editorial 2-col with owner photo */}
      <Section tone="mesh" padding="lg">
        <hr className="rule-hairline mb-12 sm:mb-14" />
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } }}
          >
            <motion.div variants={fadeUpHero}>
              <Eyebrow tone="brand">About us</Eyebrow>
            </motion.div>
            <motion.div variants={fadeUpHero}>
              <GradientHeading
                level={1}
                size="display"
                className="mt-6"
                accent="Rhyan & Valerie"
                accentUnderline
              >
                Meet
              </GradientHeading>
            </motion.div>
            <motion.p
              className="mt-6 text-lg sm:text-xl text-ink-700 leading-relaxed max-w-xl"
              variants={fadeUpHero}
            >
              Your partners in creating exceptional digital experiences. We design websites that are beautiful, fast, and built to grow your business.
            </motion.p>
            <motion.div className="mt-9 flex flex-wrap items-center gap-4" variants={fadeUpHero}>
              <Magnetic strength={6}>
                <button
                  onClick={goContact}
                  className="group inline-flex items-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-semibold text-base sm:text-lg px-7 py-3.5 shadow-glow-rust magnetic-btn ring-focus-rust transition-colors duration-300"
                >
                  Get my free design
                  <ArrowRight className="h-4 w-4 icon-nudge" aria-hidden />
                </button>
              </Magnetic>
            </motion.div>
            <motion.div className="mt-8" variants={fadeUpHero}>
              <PhoneCta />
            </motion.div>
          </motion.div>
          <motion.div
            className="relative max-w-md mx-auto lg:ml-auto w-full"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute -inset-3 bg-rust-100/60 rounded-xl3 -z-10" aria-hidden />
            <div className="relative rounded-xl3 overflow-hidden ring-1 ring-ink-900/10 shadow-lift">
              <img
                src="/rhyan.jpg"
                alt="Rhyan, lead developer at Ace Web Designers"
                className="block w-full h-[420px] object-cover motion-safe:animate-ken-burns"
                loading="lazy"
                decoding="async"
              />
            </div>
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-50/95 backdrop-blur-sm ring-1 ring-ink-900/10 text-xs">
              <span className="label-mono text-ink-700">Rhyan</span>
              <span className="text-ink-700/60">·</span>
              <span className="text-ink-800">Lead Developer</span>
            </span>
          </motion.div>
        </div>
      </Section>

      {/* STATS */}
      <Section tone="default" padding="md">
        <StaggerGrid
          items={STATS}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          keyFn={s => s.l}
          renderItem={s => <StatBlock value={s.v} label={s.l} />}
        />
      </Section>

      {/* WHY FREE DESIGNS — editorial story */}
      <Section tone="muted" padding="lg" containerSize="md">
        <SectionHeading
          eyebrow="Our story"
          heading="Why we offer"
          accent="free designs"
          maxWidth="max-w-none"
        />

        <Reveal variant="up" className="mt-10 space-y-6 text-lg text-ink-800 leading-relaxed">
          <p>
            We believe every business deserves to see their vision come to life before making any commitment. Too many business owners have been burned by designers who promise the world but deliver disappointment.
          </p>
          <p className="font-display text-2xl sm:text-3xl text-ink-900 leading-snug">
            That&rsquo;s why we do things differently.{' '}
            <span className="text-editorial-italic text-rust-600">
              We create your complete design mockup first
            </span>
            , completely free.
          </p>
          <p>
            When you see exactly what your website will look like, how it will function, and how it represents your brand, you can make an informed decision. No surprises, no regrets — just confidence in your investment.
          </p>
        </Reveal>

        <Card tone="default" padding="xl" rounded="xl3" className="mt-12">
          <span className="label-mono text-rust-700">Quote · Founder</span>
          <p className="mt-4 font-display text-xl sm:text-2xl text-ink-900 leading-snug">
            <span className="text-rust-500 text-3xl leading-none mr-1 align-[-0.15em] text-editorial-italic">&ldquo;</span>
            We only succeed when you&rsquo;re absolutely thrilled with your website. The free design ensures we&rsquo;re the perfect fit before you invest a single dollar.
            <span className="text-rust-500 text-3xl leading-none ml-0.5 align-[-0.15em] text-editorial-italic">&rdquo;</span>
          </p>
          <hr className="rule-hairline my-7" />
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/rhyan.jpg"
                alt=""
                className="h-12 w-12 rounded-full object-cover ring-1 ring-ink-900/10"
                loading="lazy"
              />
              <div>
                <p className="label-mono text-ink-700">Rhyan</p>
                <p className="text-sm text-ink-800">Lead Developer</p>
              </div>
            </div>
            <span className="text-ink-700/30" aria-hidden>·</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-900 text-cream-50 font-display font-semibold ring-1 ring-ink-900/10" aria-hidden>
                V
              </span>
              <div>
                <p className="label-mono text-ink-700">Valerie</p>
                <p className="text-sm text-ink-800">Design Lead</p>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* CORE VALUES */}
      <Section tone="default" padding="lg">
        <SectionHeading eyebrow="What we believe" heading="Our" accent="core values" />
        <StaggerGrid
          items={VALUES}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          keyFn={v => v.title}
          renderItem={v => (
            <Card tone="default" padding="lg" rounded="xl2" interactive shine className="h-full">
              <IconTile tone="brand" size="md">
                <v.Icon />
              </IconTile>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{v.title}</h3>
              <p className="mt-2 text-ink-700 leading-relaxed">{v.desc}</p>
            </Card>
          )}
        />
      </Section>

      {/* EXPERTISE */}
      <Section tone="muted" padding="lg">
        <SectionHeading eyebrow="What we do" heading="Our areas of" accent="expertise" />
        <StaggerGrid
          items={EXPERTISE}
          className="mt-12 grid gap-6 grid-cols-2 lg:grid-cols-4"
          delayMs={80}
          keyFn={e => e.label}
          childClassName="text-center"
          renderItem={e => (
            <>
              <IconTile tone="brand" size="lg" className="mx-auto">
                <e.Icon />
              </IconTile>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">{e.label}</h3>
            </>
          )}
        />
      </Section>

      {/* CONTACT — editorial */}
      <Section tone="default" padding="lg" containerSize="md">
        <Card tone="default" padding="xl" rounded="xl3">
          <Eyebrow tone="forest">Let&rsquo;s connect</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-5" accent="we&rsquo;ll reply within hours">
            Ready to start? —
          </GradientHeading>
          <p className="mt-5 text-ink-700 leading-relaxed max-w-xl">
            Reach out and we&rsquo;ll send a free homepage design within 24 hours, often same day. Based in Leominster, MA — serving small businesses nationwide.
          </p>
          <hr className="rule-hairline my-8" />
          <PhoneCta />
          <div className="mt-8">
            <TrustStack align="left" />
          </div>
        </Card>
      </Section>

      {/* FINAL CTA */}
      <FinalCta
        eyebrow="Risk-free"
        heading="Experience our work with"
        accent="zero commitment."
        body="See why businesses choose us. Get your free design mockup and experience our quality firsthand."
        ctaLabel="Get my free design"
        onCta={goContact}
      />
    </>
  )
}

export default AboutUs
