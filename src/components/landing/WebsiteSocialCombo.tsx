import React from 'react'
import { Instagram, Globe, ArrowRight, MapPin, Users, Sparkles } from 'lucide-react'
import Section from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import Button from '../ui/Button'

interface WebsiteSocialComboProps {
  /** Image URL for the website screenshot panel (right side on desktop). */
  websiteImage: string
  websiteAlt: string
  /** Image URL for the social-feed mock (left side on desktop). */
  socialImage: string
  socialAlt: string
  /** CTA click → scrolls to booking. */
  onCta: () => void
  ctaLabel?: string
}

const COMBO_BENEFITS = [
  {
    Icon: Sparkles,
    title: 'Posts that show real work',
    desc: 'Job-site photos and reels — no stock images, no AI fluff.',
  },
  {
    Icon: MapPin,
    title: 'Found by neighbors',
    desc: 'Google Business Profile and local SEO so the right homes find you.',
  },
  {
    Icon: Users,
    title: 'One team, no hand-offs',
    desc: 'Same people who built your site run your social. Calls land where they convert.',
  },
]

const WebsiteSocialCombo: React.FC<WebsiteSocialComboProps> = ({
  websiteImage,
  websiteAlt,
  socialImage,
  socialAlt,
  onCta,
  ctaLabel = 'Book a call to set up the combo',
}) => (
  <Section tone="inverted" padding="lg">
    <div className="max-w-2xl">
      <Eyebrow tone="inverted">Website + Social Media</Eyebrow>
      <GradientHeading level={2} size="lg" tone="inverted" className="mt-5" accent="that work together">
        Two channels,
      </GradientHeading>
      <p className="mt-5 text-base sm:text-lg text-cream-100/85 leading-relaxed">
        Your website turns clicks into booked jobs. Your social keeps you top-of-mind for the next
        one. We handle both so neither falls behind.
      </p>
    </div>

    <div className="mt-14 grid items-center gap-10 lg:grid-cols-[0.85fr_1fr] max-w-6xl">
      {/* Social feed mock — flat framed screenshot */}
      <div className="relative mx-auto w-full max-w-[280px] sm:max-w-xs">
        <div className="border border-cream-50/15 bg-ink-800 p-2">
          <div className="overflow-hidden bg-cream-50 aspect-[9/19]">
            <img
              src={socialImage}
              alt={socialAlt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <div className="absolute -top-3 left-4 inline-flex items-center gap-1.5 bg-signal-500 text-white label-mono px-3 py-1">
          <Instagram className="h-3 w-3" aria-hidden />
          Social
        </div>
      </div>

      {/* Connector + Website mock */}
      <div className="relative">
        <div
          aria-hidden
          className="hidden lg:block absolute -left-10 top-1/2 -translate-y-1/2 text-signal-300"
        >
          <ArrowRight className="h-7 w-7" />
        </div>
        <div className="relative border border-cream-50/15 bg-ink-800 p-3">
          <div className="flex items-center gap-1.5 px-2 pb-2">
            <span className="h-2.5 w-2.5 bg-cream-50/30" aria-hidden />
            <span className="h-2.5 w-2.5 bg-cream-50/30" aria-hidden />
            <span className="h-2.5 w-2.5 bg-cream-50/30" aria-hidden />
          </div>
          <div className="overflow-hidden bg-cream-50 aspect-[16/10] border border-cream-50/10">
            <img
              src={websiteImage}
              alt={websiteAlt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 bg-cream-50 text-ink-900 label-mono px-3 py-1">
          <Globe className="h-3 w-3" aria-hidden />
          Website
        </div>
      </div>
    </div>

    {/* Benefits row */}
    <div className="mt-14 grid gap-6 md:grid-cols-3 max-w-5xl">
      {COMBO_BENEFITS.map(({ Icon, title, desc }) => (
        <div key={title} className="border border-cream-50/12 p-5 sm:p-6">
          <span className="inline-flex h-10 w-10 items-center justify-center border border-signal-300/40 text-signal-300">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold text-cream-50">{title}</h3>
          <p className="mt-2 text-sm text-cream-100/80 leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>

    {/* Bundle pitch + CTA */}
    <div className="mt-12 flex flex-col items-start gap-5 max-w-2xl">
      <span className="label-mono inline-flex items-center gap-2 border border-signal-400/40 text-signal-400 px-3 py-1.5">
        Most contractors take the combo
      </span>
      <p className="text-cream-100/85 leading-relaxed">
        Most contractors add social on top of their site so neither channel goes quiet.{' '}
        <span className="text-cream-50 font-semibold">First week of posts free</span> — same risk
        reversal as the design. We'll tailor a plan to your trade on the call.
      </p>
      <Button variant="primary" size="md" tone="inverted" onClick={onCta}>
        {ctaLabel}
        <ArrowRight className="h-5 w-5 icon-nudge" aria-hidden />
      </Button>
      <p className="text-xs text-cream-100/60">
        No card on file. Discuss the combo on the call — buy only if you love it.
      </p>
    </div>
  </Section>
)

export default WebsiteSocialCombo
