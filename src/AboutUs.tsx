import React from 'react'
import {
  Mail,
  Phone,
  MapPin,
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
} from './components/ui'

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
  { v: '100+', l: 'Websites launched' },
  { v: '5.0★', l: 'Google rating' },
  { v: '15+', l: 'Industries served' },
  { v: '1–3wk', l: 'Avg. delivery' },
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
      {/* HERO */}
      <Section tone="mesh" padding="lg">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div data-reveal="up">
            <Eyebrow tone="inverted">About us</Eyebrow>
            <GradientHeading
              level={1}
              size="display"
              tone="inverted"
              className="mt-5"
              accent="Rhyan & Valerie"
            >
              Meet
            </GradientHeading>
            <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed max-w-xl">
              Your partners in creating exceptional digital experiences. We design websites that are beautiful, fast, and built to grow your business.
            </p>
            <button
              onClick={goContact}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-surface-900 font-bold px-7 py-3.5 magnetic-btn ring-focus-brand"
            >
              Get my free design
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div data-reveal="right" className="relative max-w-md mx-auto lg:ml-auto w-full">
            <div className="absolute inset-0 bg-brand-gradient rounded-xl3 blur-2xl opacity-50" aria-hidden />
            <img
              src="/rhyan.jpg"
              alt="Lead web designers and developers"
              className="relative rounded-xl3 shadow-glow-brand w-full h-[420px] object-cover ring-1 ring-white/20"
              loading="lazy"
              decoding="async"
            />
          </div>
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

      {/* WHY FREE DESIGNS */}
      <Section tone="muted" padding="lg" containerSize="md">
        <SectionHeading
          eyebrow="Our story"
          heading="Why we offer"
          accent="free designs"
          maxWidth="max-w-none"
        />

        <Reveal variant="up" className="mt-10 space-y-6 text-lg text-surface-700 leading-relaxed">
          <p>
            We believe every business deserves to see their vision come to life before making any commitment. Too many business owners have been burned by designers who promise the world but deliver disappointment.
          </p>
          <p className="text-xl font-semibold text-brand-700">
            That's why we do things differently. We create your complete design mockup first, completely free.
          </p>
          <p>
            When you see exactly what your website will look like, how it will function, and how it represents your brand, you can make an informed decision. No surprises, no regrets — just confidence in your investment.
          </p>
        </Reveal>

        <Card tone="default" padding="xl" rounded="xl3" className="mt-10" shine>
          <p className="font-display text-xl text-surface-900 italic">
            &ldquo;We only succeed when you're absolutely thrilled with your website. The free design ensures we're the perfect fit before you invest a single dollar.&rdquo;
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/rhyan.jpg"
                alt="Rhyan — Lead Developer"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-soft"
                loading="lazy"
              />
              <div>
                <p className="font-semibold text-surface-900">Rhyan</p>
                <p className="text-sm text-surface-500">Lead Developer</p>
              </div>
            </div>
            <span className="text-surface-300" aria-hidden>•</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white font-bold ring-2 ring-white shadow-soft" aria-hidden>
                V
              </span>
              <div>
                <p className="font-semibold text-surface-900">Valerie</p>
                <p className="text-sm text-surface-500">Design Lead</p>
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
              <h3 className="mt-5 font-display text-xl font-semibold text-surface-900">{v.title}</h3>
              <p className="mt-2 text-surface-600 leading-relaxed">{v.desc}</p>
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
              <h3 className="mt-5 font-display text-lg font-semibold text-surface-900">{e.label}</h3>
            </>
          )}
        />
      </Section>

      {/* CONTACT */}
      <Section tone="default" padding="lg" containerSize="lg">
        <Card tone="default" padding="xl" rounded="xl3" className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Eyebrow>Let's connect</Eyebrow>
            <GradientHeading level={2} size="md" className="mt-4">
              Ready to start your next project?
            </GradientHeading>
            <p className="mt-4 text-surface-600 leading-relaxed">
              We're here to help turn your vision into reality. Reach out — we usually reply within a few hours.
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-center gap-4">
                <IconTile tone="brand" size="sm"><Mail /></IconTile>
                <a href="mailto:support@acewebdesigners.com" className="text-surface-800 hover:text-brand-700 transition-colors ring-focus-brand rounded">
                  support@acewebdesigners.com
                </a>
              </li>
              <li className="flex items-center gap-4">
                <IconTile tone="brand" size="sm"><Phone /></IconTile>
                <a href="tel:+17744467375" className="text-surface-800 hover:text-brand-700 transition-colors ring-focus-brand rounded">
                  (774) 446-7375
                </a>
              </li>
              <li className="flex items-center gap-4">
                <IconTile tone="brand" size="sm"><MapPin /></IconTile>
                <span className="text-surface-700">Based in Leominster, MA • Serving Nationwide</span>
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-brand-gradient rounded-xl3 blur-2xl opacity-30" aria-hidden />
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3"
              alt="Workspace"
              loading="lazy"
              decoding="async"
              className="relative rounded-xl3 shadow-soft w-full object-cover aspect-[4/3]"
            />
          </div>
        </Card>
      </Section>

      {/* FINAL CTA */}
      <FinalCta
        eyebrow="Risk-free"
        heading="Experience our work with zero commitment."
        body="See why businesses choose us. Get your free design mockup and experience our quality firsthand."
        ctaLabel="Get my free design"
        onCta={goContact}
      />
    </>
  )
}

export default AboutUs
