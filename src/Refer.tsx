import React, { useEffect } from 'react'
import { useForm, ValidationError } from '@formspree/react'
import {
  Gift,
  Users,
  DollarSign,
  CheckCircle2,
  Star,
  ArrowRight,
} from 'lucide-react'

import {
  Section,
  Eyebrow,
  GradientHeading,
  Card,
  IconTile,
  BadgePill,
  Reveal,
  SectionHeading,
  StaggerGrid,
  LandingFooter,
  Input,
  Textarea,
  TrustStack,
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

const HOW_STEPS = [
  { Icon: Users, title: '1. Refer a client', desc: 'Share our contact information with someone who needs a website.' },
  { Icon: CheckCircle2, title: '2. They get a website', desc: 'Your referral completes their website project with us.' },
  { Icon: DollarSign, title: '3. You get paid', desc: 'Receive $200 cash once the project is completed.' },
] as const

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
      <div className="min-h-screen bg-cream-50">
        <Section tone="default" padding="xl" containerSize="md" className="pt-24">
          <Card tone="default" padding="xl" rounded="xl3" className="text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-forest-50 text-forest-700 ring-1 ring-forest-100">
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </div>
            <GradientHeading level={1} size="lg" className="mt-6" accent="for your referral!">
              Thank you
            </GradientHeading>
            <p className="mt-5 text-lg text-ink-700">
              We&rsquo;ve received your referral information and will be reaching out to {referralName} soon.
            </p>
            <p className="mt-3 text-ink-700/80">
              You&rsquo;ll receive your <span className="text-rust-700 font-semibold">$200</span> reward once they complete their website project with us.
            </p>
          </Card>
        </Section>
      </div>
    )
  }

  // Form field input class — consistent across all fields
  const labelCls = 'block label-mono text-ink-700 mb-2'

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900">
      <main id="main">
        {/* HERO */}
        <Section tone="mesh" padding="lg">
          <hr className="rule-hairline mb-12 sm:mb-14" />
          <div className="text-center max-w-3xl mx-auto" data-reveal="up">
            <Eyebrow tone="brand">
              <Gift className="h-3.5 w-3.5" aria-hidden />
              Referral program
            </Eyebrow>
            <GradientHeading level={1} size="display" className="mt-6" accent="earn $200">
              Refer a client,
            </GradientHeading>
            <p className="mt-6 text-lg sm:text-xl text-ink-700 leading-relaxed">
              Know someone who needs a professional website? Refer them and earn{' '}
              <span className="text-editorial-italic text-rust-600">$200</span> when they complete their project.
            </p>
            <Card tone="default" padding="lg" rounded="xl2" className="mt-9 inline-flex flex-col items-center max-w-sm mx-auto">
              <span className="label-mono text-ink-700/70">Cash reward</span>
              <div className="mt-1 flex items-baseline gap-1 text-ink-900">
                <span className="font-display text-7xl font-semibold tracking-tight">$200</span>
              </div>
              <p className="text-ink-700/80 text-sm mt-1">per successful referral</p>
            </Card>
          </div>
        </Section>

        {/* HOW IT WORKS */}
        <Section tone="default" padding="lg">
          <SectionHeading
            eyebrow="How it works"
            heading="Three simple steps to"
            accent="earn $200"
          />
          <StaggerGrid
            items={HOW_STEPS}
            className="mt-12 grid gap-6 md:grid-cols-3"
            delayMs={80}
            keyFn={s => s.title}
            childClassName="text-center"
            renderItem={(step, i) => (
              <>
                <IconTile tone={i === 2 ? 'accent' : 'brand'} size="lg" className="mx-auto">
                  <step.Icon />
                </IconTile>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-ink-700 leading-relaxed">{step.desc}</p>
              </>
            )}
          />
        </Section>

        {/* BENEFITS */}
        <Section tone="muted" padding="lg">
          <SectionHeading
            eyebrow="Mutual win"
            heading="Why"
            accent="refer to us"
          />
          <Reveal variant="up" className="mt-12 grid gap-6 md:grid-cols-2">
            <Card tone="default" padding="lg" rounded="xl2" shine>
              <BadgePill tone="forest">You get</BadgePill>
              <ul className="mt-5 space-y-3">
                {YOU_GET.map(item => (
                  <li key={item} className="flex items-start gap-3 text-ink-800">
                    <CheckCircle2 className="h-5 w-5 text-forest-700 shrink-0 mt-0.5" aria-hidden />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card tone="default" padding="lg" rounded="xl2" shine>
              <BadgePill tone="brand">Your referral gets</BadgePill>
              <ul className="mt-5 space-y-3">
                {THEY_GET.map(item => (
                  <li key={item} className="flex items-start gap-3 text-ink-800">
                    <CheckCircle2 className="h-5 w-5 text-rust-600 shrink-0 mt-0.5" aria-hidden />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </Section>

        {/* GOOGLE REVIEWS WIDGET — preserved locationId attribute for external JS */}
        <Section tone="default" padding="lg">
          <SectionHeading
            eyebrow={<><Star className="h-3.5 w-3.5 fill-current" aria-hidden />Google reviews</>}
            eyebrowTone="forest"
            heading="See what clients say in"
            accent="our reviews"
          />
          <div className="mt-12 flex justify-center">
            {/* PRESERVED: locationId attribute used by external review widget script */}
            <div locationId="10311921268967440718" className="review-widget-carousel" />
          </div>
        </Section>

        {/* REFERRAL FORM — Formspree (xvgbobpv) preserved */}
        <Section tone="muted" padding="lg" containerSize="md">
          <SectionHeading
            eyebrow="Get started"
            heading="Submit your"
            accent="referral"
            sub="Fill out the form below to submit a referral and start earning."
            maxWidth="max-w-none"
          />
          <Card tone="default" padding="xl" rounded="xl3" className="mt-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <fieldset className="space-y-4">
                <legend className="font-display text-lg font-semibold text-ink-900 mb-2">Your information</legend>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className={labelCls}>Your name *</label>
                    <Input id="name" type="text" name="name" required placeholder="Your full name" />
                    <ValidationError prefix="Name" field="name" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelCls}>Your email *</label>
                    <Input id="email" type="email" name="email" required placeholder="your.email@example.com" />
                    <ValidationError prefix="Email" field="email" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className={labelCls}>Your phone number *</label>
                  <Input id="phone" type="tel" name="phone" required placeholder="(555) 123-4567" />
                  <ValidationError prefix="Phone" field="phone" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                </div>
              </fieldset>

              <fieldset className="space-y-4 border-t border-ink-900/10 pt-7">
                <legend className="font-display text-lg font-semibold text-ink-900 mb-2">Referral information</legend>
                <div>
                  <label htmlFor="referralBusiness" className={labelCls}>Business name *</label>
                  <Input id="referralBusiness" type="text" name="referralBusiness" required placeholder="ABC Construction, Joe's Restaurant, etc." />
                  <ValidationError prefix="Referral Business" field="referralBusiness" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="referralName" className={labelCls}>Contact person&rsquo;s name *</label>
                    <Input id="referralName" type="text" name="referralName" required placeholder="John Smith" />
                    <ValidationError prefix="Referral Name" field="referralName" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                  </div>
                  <div>
                    <label htmlFor="referralEmail" className={labelCls}>Contact&rsquo;s email *</label>
                    <Input id="referralEmail" type="email" name="referralEmail" required placeholder="contact@business.com" />
                    <ValidationError prefix="Referral Email" field="referralEmail" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                  </div>
                </div>
                <div>
                  <label htmlFor="referralPhone" className={labelCls}>Contact&rsquo;s phone number</label>
                  <Input id="referralPhone" type="tel" name="referralPhone" placeholder="(555) 123-4567" />
                  <ValidationError prefix="Referral Phone" field="referralPhone" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                </div>
                <div>
                  <label htmlFor="additionalInfo" className={labelCls}>Additional information (optional)</label>
                  <Textarea id="additionalInfo" name="additionalInfo" rows={3} placeholder="Any additional details about the referral or their website needs..." />
                  <ValidationError prefix="Additional Info" field="additionalInfo" errors={state.errors} className="mt-1 text-sm text-rose-600" />
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={state.submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-semibold py-4 px-6 shadow-glow-rust magnetic-btn ring-focus-rust disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-300"
              >
                {state.submitting ? 'Submitting...' : 'Submit referral'}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
            </form>
          </Card>
        </Section>

        {/* FINAL CTA */}
        <Section tone="inverted" padding="lg" containerSize="md">
          <Reveal variant="up" className="text-center">
            <hr className="border-cream-50/15 mb-12 max-w-xs mx-auto" />
            <GradientHeading level={2} size="xl" tone="inverted" accent="today.">
              Start earning
            </GradientHeading>
            <p className="mt-6 text-cream-100/80 max-w-xl mx-auto leading-relaxed">
              The more referrals you make, the more you earn. Help businesses grow while building your income.
            </p>
            <Card tone="inverted" padding="lg" rounded="xl2" className="mt-10 inline-flex flex-col items-center max-w-sm mx-auto">
              <div className="font-display text-4xl font-semibold text-cream-50">$200 per referral</div>
              <div className="text-cream-100/65 text-sm mt-1">No limit on earnings</div>
            </Card>
            <div className="mt-10 flex justify-center">
              <TrustStack tone="inverted" />
            </div>
          </Reveal>
        </Section>
      </main>

      <LandingFooter tagline="Based in Leominster, MA, serving small businesses nationwide." />
    </div>
  )
}

export default Refer
