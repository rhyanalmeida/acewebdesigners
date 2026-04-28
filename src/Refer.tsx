import React, { useEffect } from 'react'
import { useForm, ValidationError } from '@formspree/react'
import {
  Gift,
  Users,
  DollarSign,
  CheckCircle2,
  Star,
  ArrowRight,
  MousePointer2,
} from 'lucide-react'

import {
  Container,
  Section,
  Eyebrow,
  GradientHeading,
  Card,
  Reveal,
  IconTile,
  BadgePill,
} from './components/ui'

const YOU_GET = [
  '$200 cash reward when your referral completes their website',
  'No limit on how many referrals you can make',
  'Help businesses grow their online presence',
]

const THEY_GET = [
  'FREE homepage design mockup',
  'Professional website starting at $200',
  'Same-day launches available',
]

function Refer() {
  // PRESERVED: same Formspree form ID — submissions go to the same endpoint.
  const [state, handleSubmit] = useForm('xvgbobpv')

  useEffect(() => {
    document.title = 'Refer a Client & Earn $200 | Ace Web Designers'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Refer a client to Ace Web Designers and earn $200 when they complete their website project. Help grow businesses while earning rewards!'
      )
    }
  }, [])

  if (state.succeeded) {
    const referralName =
      (state.result as { data?: { referralName?: string } } | undefined)?.data?.referralName ?? 'them'
    return (
      <div className="min-h-screen bg-surface-50">
        <Section tone="default" padding="xl" containerSize="md" className="pt-24">
          <Card tone="default" padding="xl" rounded="xl3" className="text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </div>
            <GradientHeading level={1} size="md" className="mt-6">
              Thank you for your referral!
            </GradientHeading>
            <p className="mt-4 text-lg text-surface-600">
              We've received your referral information and will be reaching out to {referralName} soon.
            </p>
            <p className="mt-2 text-surface-500">
              You'll receive your $200 reward once they complete their website project with us.
            </p>
          </Card>
        </Section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 text-surface-900">
      <main id="main">
        {/* HERO */}
        <Section tone="mesh" padding="lg">
          <div className="text-center max-w-3xl mx-auto" data-reveal="up">
            <Eyebrow tone="inverted">
              <Gift className="h-3.5 w-3.5" aria-hidden />
              Referral program
            </Eyebrow>
            <GradientHeading level={1} size="display" tone="inverted" className="mt-5" accent="earn $200">
              Refer a client,
            </GradientHeading>
            <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed">
              Know someone who needs a professional website? Refer them and earn $200 when they complete their project.
            </p>
            <Card tone="glass" padding="lg" rounded="xl2" className="mt-8 inline-flex flex-col items-center text-white max-w-sm mx-auto">
              <div className="flex items-baseline gap-1">
                <DollarSign className="h-7 w-7 text-emerald-300" aria-hidden />
                <span className="font-display text-5xl font-bold">200</span>
              </div>
              <p className="text-white/80 text-sm mt-1">Cash reward per successful referral</p>
            </Card>
          </div>
        </Section>

        {/* HOW IT WORKS */}
        <Section tone="default" padding="lg">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow>How it works</Eyebrow>
            <GradientHeading level={2} size="lg" className="mt-4" accent="earn $200">
              Three simple steps to
            </GradientHeading>
          </div>
          <Reveal variant="stagger" className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { Icon: Users, title: '1. Refer a client', desc: 'Share our contact information with someone who needs a website.' },
              { Icon: CheckCircle2, title: '2. They get a website', desc: 'Your referral completes their website project with us.' },
              { Icon: DollarSign, title: '3. You get paid', desc: 'Receive $200 cash once the project is completed.' },
            ].map((step, i) => (
              <div key={step.title} data-reveal-stagger-child style={{ transitionDelay: `${i * 80}ms` }} className="text-center">
                <IconTile tone={i === 2 ? 'accent' : 'brand'} size="lg" className="mx-auto">
                  <step.Icon />
                </IconTile>
                <h3 className="mt-5 font-display text-xl font-semibold text-surface-900">{step.title}</h3>
                <p className="mt-2 text-surface-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </Reveal>
        </Section>

        {/* BENEFITS */}
        <Section tone="muted" padding="lg">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow>Mutual win</Eyebrow>
            <GradientHeading level={2} size="lg" className="mt-4" accent="refer to us">
              Why
            </GradientHeading>
          </div>
          <Reveal variant="up" className="mt-12 grid gap-6 md:grid-cols-2">
            <Card tone="default" padding="lg" rounded="xl2" shine>
              <BadgePill tone="success">You get</BadgePill>
              <ul className="mt-5 space-y-3">
                {YOU_GET.map(item => (
                  <li key={item} className="flex items-start gap-3 text-surface-700">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card tone="default" padding="lg" rounded="xl2" shine>
              <BadgePill tone="brand">Your referral gets</BadgePill>
              <ul className="mt-5 space-y-3">
                {THEY_GET.map(item => (
                  <li key={item} className="flex items-start gap-3 text-surface-700">
                    <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" aria-hidden />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </Section>

        {/* GOOGLE REVIEWS WIDGET — preserved locationId attribute for external JS */}
        <Section tone="default" padding="lg">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow tone="accent">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
              Google reviews
            </Eyebrow>
            <GradientHeading level={2} size="lg" className="mt-4" accent="our reviews">
              See what clients say in
            </GradientHeading>
          </div>
          <div className="mt-12 flex justify-center">
            {/* PRESERVED: locationId attribute used by external review widget script */}
            <div locationId="10311921268967440718" className="review-widget-carousel" />
          </div>
        </Section>

        {/* REFERRAL FORM — Formspree (xvgbobpv) preserved */}
        <Section tone="muted" padding="lg" containerSize="md">
          <div className="text-center">
            <Eyebrow>Get started</Eyebrow>
            <GradientHeading level={2} size="lg" className="mt-4" accent="referral">
              Submit your
            </GradientHeading>
            <p className="mt-4 text-surface-600">
              Fill out the form below to submit a referral and start earning.
            </p>
          </div>
          <Card tone="default" padding="xl" rounded="xl3" className="mt-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <fieldset className="space-y-4">
                <legend className="font-display text-lg font-semibold text-surface-900">Your information</legend>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-surface-700 mb-2">Your name *</label>
                    <input
                      id="name" type="text" name="name" required placeholder="Your full name"
                      className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all duration-300 ease-premium"
                    />
                    <ValidationError prefix="Name" field="name" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-2">Your email *</label>
                    <input
                      id="email" type="email" name="email" required placeholder="your.email@example.com"
                      className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all duration-300 ease-premium"
                    />
                    <ValidationError prefix="Email" field="email" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-surface-700 mb-2">Your phone number *</label>
                  <input
                    id="phone" type="tel" name="phone" required placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all duration-300 ease-premium"
                  />
                  <ValidationError prefix="Phone" field="phone" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                </div>
              </fieldset>

              <fieldset className="space-y-4 border-t border-surface-200 pt-6">
                <legend className="font-display text-lg font-semibold text-surface-900">Referral information</legend>
                <div>
                  <label htmlFor="referralBusiness" className="block text-sm font-medium text-surface-700 mb-2">Business name *</label>
                  <input
                    id="referralBusiness" type="text" name="referralBusiness" required placeholder="ABC Construction, Joe's Restaurant, etc."
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all duration-300 ease-premium"
                  />
                  <ValidationError prefix="Referral Business" field="referralBusiness" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="referralName" className="block text-sm font-medium text-surface-700 mb-2">Contact person's name *</label>
                    <input
                      id="referralName" type="text" name="referralName" required placeholder="John Smith"
                      className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all duration-300 ease-premium"
                    />
                    <ValidationError prefix="Referral Name" field="referralName" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                  </div>
                  <div>
                    <label htmlFor="referralEmail" className="block text-sm font-medium text-surface-700 mb-2">Contact's email *</label>
                    <input
                      id="referralEmail" type="email" name="referralEmail" required placeholder="contact@business.com"
                      className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all duration-300 ease-premium"
                    />
                    <ValidationError prefix="Referral Email" field="referralEmail" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                  </div>
                </div>
                <div>
                  <label htmlFor="referralPhone" className="block text-sm font-medium text-surface-700 mb-2">Contact's phone number</label>
                  <input
                    id="referralPhone" type="tel" name="referralPhone" placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all duration-300 ease-premium"
                  />
                  <ValidationError prefix="Referral Phone" field="referralPhone" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                </div>
                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium text-surface-700 mb-2">Additional information (optional)</label>
                  <textarea
                    id="additionalInfo" name="additionalInfo" rows={3} placeholder="Any additional details about the referral or their website needs..."
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all duration-300 ease-premium"
                  />
                  <ValidationError prefix="Additional Info" field="additionalInfo" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={state.submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient text-white font-bold py-4 px-6 shadow-glow-brand magnetic-btn ring-focus-brand disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {state.submitting ? 'Submitting...' : 'Submit referral'}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
            </form>
          </Card>
        </Section>

        {/* FINAL CTA */}
        <Section tone="mesh" padding="lg" containerSize="md">
          <Reveal variant="up" className="text-center">
            <GradientHeading level={2} size="lg" tone="inverted">
              Start earning today.
            </GradientHeading>
            <p className="mt-5 text-white/80 max-w-xl mx-auto">
              The more referrals you make, the more you earn. Help businesses grow while building your income.
            </p>
            <Card tone="glass" padding="lg" rounded="xl2" className="mt-8 inline-flex flex-col items-center text-white max-w-sm mx-auto">
              <div className="font-display text-3xl font-bold">$200 per referral</div>
              <div className="text-white/80 text-sm">No limit on earnings</div>
            </Card>
          </Reveal>
        </Section>
      </main>

      {/* Slim referral page footer */}
      <footer className="bg-surface-950 text-surface-50" role="contentinfo">
        <Container size="lg" className="py-12">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <span className="inline-flex flex-col items-start text-white">
                <span className="flex items-center">
                  <span className="text-xl font-bold tracking-tight font-display">ACE</span>
                  <MousePointer2 className="w-4 h-4 ml-0.5 -mt-[2px]" aria-hidden />
                </span>
                <span className="text-sm text-white/60 -mt-1">Web Designers</span>
              </span>
              <p className="mt-4 text-sm text-white/60 max-w-md">
                Based in Leominster, MA, serving small businesses nationwide.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/60">Contact</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="mailto:support@acewebdesigners.com" className="text-white/70 hover:text-white transition-colors">support@acewebdesigners.com</a></li>
                <li><a href="tel:+17744467375" className="text-white/70 hover:text-white transition-colors">(774) 446-7375</a></li>
                <li className="text-white/70">Leominster, MA — Serving Nationwide</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-sm text-white/50">© {new Date().getFullYear()} Ace Web Designers. All rights reserved.</p>
            <a href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </Container>
      </footer>
    </div>
  )
}

export default Refer
