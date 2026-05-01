import React from 'react'
import {
  Sparkles,
  Calendar,
  Instagram,
  Facebook,
  Music2,
  Youtube,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Repeat,
  Camera,
  ExternalLink,
  TrendingUp,
} from 'lucide-react'

import {
  Section,
  Eyebrow,
  GradientHeading,
  Card,
  PageHero,
  SectionHeading,
  StaggerGrid,
  PriceCard,
  PhoneCta,
  TrustStack,
  BadgePill,
  IconTile,
  FinalCta,
} from './components/ui'
import { LandingFaq } from './components/landing'
import { SeoMeta, serviceLd, organizationLd, breadcrumbForPath } from './seo'

interface SocialMediaProps {
  // page is rendered inside PageShell; nav handled by SiteHeader/Footer
}

const STANDARD_FEATURES = [
  '3-5 hand-crafted posts per week',
  'Instagram + Facebook + TikTok',
  'Caption + hashtag research',
  'Monthly content calendar',
  'Reels + carousels included',
]

const DELUXE_FEATURES = [
  '7 days a week of content',
  'Instagram + Facebook + TikTok',
  'Google Business Profile posts',
  'Custom graphics + branded templates',
  'Priority response (same-day)',
  'Reels + short-form video included',
]

type PlatformKind = 'tiktok' | 'instagram' | 'facebook' | 'youtube'

const PLATFORM_LABEL: Record<PlatformKind, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
}

const CLIENT_ACCOUNTS: ReadonlyArray<{
  /** Display name shown on the card */
  name: string
  note: string
  /** Optional headline stat — rendered as a prominent badge on the card */
  stat?: string
  platforms: ReadonlyArray<{ kind: PlatformKind; url: string }>
}> = [
  {
    name: 'Told History',
    note: 'Our flagship account — viral history shorts on TikTok and YouTube.',
    stat: '21k+ followers',
    platforms: [
      { kind: 'tiktok', url: 'https://www.tiktok.com/@told.history' },
      { kind: 'youtube', url: 'https://www.youtube.com/@told.history' },
    ],
  },
  {
    name: 'Luxury Makeover',
    note: 'Started at 0 followers a few months ago — growing fast.',
    platforms: [
      { kind: 'tiktok', url: 'https://www.tiktok.com/@luxurymakeover_official' },
      { kind: 'instagram', url: 'https://www.instagram.com/luxurymakeover_ig' },
    ],
  },
  {
    name: '911 Local Plumbing',
    note: 'Built from scratch — generating real plumbing calls.',
    platforms: [
      { kind: 'tiktok', url: 'https://www.tiktok.com/@911localplumbing' },
      { kind: 'instagram', url: 'https://www.instagram.com/911localplumbing' },
    ],
  },
  {
    name: 'Conuco Restaurant Takeout',
    note: 'Established restaurant — steady growth.',
    platforms: [
      { kind: 'instagram', url: 'https://www.instagram.com/conucotakeout' },
      { kind: 'facebook', url: 'https://www.facebook.com/conucotakeout' },
    ],
  },
  {
    name: "Oliver's Cafe",
    note: 'Selected social posts for the cafe.',
    platforms: [
      { kind: 'instagram', url: 'https://www.instagram.com/oliverscafema' },
      { kind: 'facebook', url: 'https://www.facebook.com/oliverscafema' },
    ],
  },
]

const PROCESS = [
  {
    Icon: Sparkles,
    title: '1. Free trial week',
    desc: 'Pick Standard or Deluxe. We post for 7 days on us — no card on file, no commitment.',
  },
  {
    Icon: Camera,
    title: '2. We deliver posts',
    desc: 'You get a content calendar, captions, hashtags, and the actual posts published — all done for you.',
  },
  {
    Icon: Repeat,
    title: '3. Keep going or walk away',
    desc: 'Love it? Keep posting weekly. Not for you? No hard feelings. We only earn after you choose to stay.',
  },
] as const

const FAQS = [
  {
    question: 'How does the free trial work?',
    answer:
      "Pick Standard or Deluxe and we'll post on your accounts for one full week — completely free. No credit card to start. At the end of the week, decide if you want to continue. If yes, we bill you weekly going forward. If not, we wrap up cleanly and you keep all the posts we made.",
  },
  {
    question: "What if I don't like the posts?",
    answer:
      "Tell us. We'll rework anything that doesn't feel right — captions, graphics, tone, whatever. We'd rather get it perfect than ship something off-brand.",
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. There are no contracts. We bill weekly so you can pause or stop whenever you want — just give us 7 days notice so we can finish the queued content.',
  },
  {
    question: 'Do I have to provide content (photos, videos)?',
    answer:
      "Helpful but not required. If you can send us a few job-site photos or behind-the-scenes shots each week, the posts feel more authentic. If not, we use stock + custom graphics on Deluxe to fill the gaps.",
  },
  {
    question: 'What if I want a website AND social media?',
    answer:
      "That's the bundle deal — $250 off any website tier (Basic actually becomes free), plus a discount on the weekly social: Standard drops to $25/wk, Deluxe drops to $84/wk. See the combo section above.",
  },
] as const

const goContact = (data?: { budget?: string; message?: string }) => {
  window.dispatchEvent(
    new CustomEvent('navigate', {
      detail: { page: 'contact', data },
    }),
  )
}

const SocialMedia: React.FC<SocialMediaProps> = () => {
  return (
    <>
      <SeoMeta
        path="/socialmedia"
        jsonLd={[
          organizationLd(),
          serviceLd({
            name: 'Social Media Management for Small Business',
            description:
              'Done-for-you social posting on Instagram, Facebook, TikTok, and Google Business Profile. Standard $30/wk or Deluxe $99/wk. First week free.',
            serviceType: 'Social media management',
            url: 'https://acewebdesigners.com/socialmedia',
          }),
          breadcrumbForPath('/socialmedia')!,
        ]}
      />
      {/* HERO */}
      <PageHero
        eyebrow="Social media that works"
        eyebrowIcon={Sparkles}
        size="display"
        headline="Social media that"
        accent="brings work in"
        sub="Posts that show your craft, drive calls, and never sound like AI wrote them. Try a week free — pay only if you want to keep going."
      >
        <div className="mt-8 flex justify-center">
          <BadgePill tone="brand" glow>
            <Calendar className="h-3 w-3" aria-hidden />
            1 week free — both packages
          </BadgePill>
        </div>
        <div className="mt-8 flex justify-center">
          <PhoneCta showLabels={false} />
        </div>
        <div className="mt-10 flex justify-center">
          <TrustStack
            items={[
              { icon: 'star', label: '5.0 on Google' },
              { icon: 'shield', label: 'No card on file' },
              { icon: 'clock', label: 'Cancel anytime' },
            ]}
          />
        </div>
      </PageHero>

      {/* PRICING */}
      <Section id="pricing" tone="default" padding="lg">
        <SectionHeading
          eyebrow="Pricing"
          heading="Two ways to"
          accent="show up online"
          sub="Both packages start with a free trial week. Standard gets you on the big three. Deluxe adds Google Business Profile + daily posts."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-2 max-w-4xl mx-auto">
          <PriceCard
            tier="Standard"
            price="$30"
            priceSub="per week — billed weekly"
            description="3-5 posts a week across the platforms that matter most for local business."
            features={[...STANDARD_FEATURES]}
            ctaLabel="Start my free week"
            onCta={() =>
              goContact({
                budget: 'social-standard',
                message:
                  "I'm interested in the Standard Social Media package — start my free trial week.",
              })
            }
          />
          <PriceCard
            tier="Deluxe"
            price="$99"
            priceSub="per week — billed weekly"
            description="Daily content, Google Business Profile, custom graphics, priority response."
            features={[...DELUXE_FEATURES]}
            highlight
            ctaLabel="Start my free week"
            onCta={() =>
              goContact({
                budget: 'social-deluxe',
                message:
                  "I'm interested in the Deluxe Social Media package — start my free trial week.",
              })
            }
          />
        </div>

        <div className="mt-10 max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-ink-700/80">
            <span className="inline-flex items-center gap-1.5">
              <Instagram className="h-4 w-4 text-rust-600" aria-hidden /> Instagram
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Facebook className="h-4 w-4 text-rust-600" aria-hidden /> Facebook
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Music2 className="h-4 w-4 text-rust-600" aria-hidden /> TikTok
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-forest-700" aria-hidden /> Google Business Profile
              <span className="label-mono text-ink-700/55 ml-1">Deluxe only</span>
            </span>
          </div>
        </div>
      </Section>

      {/* PROOF — $20K + client accounts */}
      <Section id="proof" tone="inverted" padding="lg">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div data-reveal="up">
            <Eyebrow tone="inverted">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              Real numbers
            </Eyebrow>
            <GradientHeading
              level={2}
              size="xl"
              tone="inverted"
              className="mt-5"
              accent="for our clients"
            >
              We&rsquo;ve already brought in{' '}
              <span className="text-editorial-italic text-rust-300">$20,000+</span>{' '}
            </GradientHeading>
            <p className="mt-6 text-cream-100/80 text-base sm:text-lg leading-relaxed max-w-md">
              Posts that turn into calls, jobs, and orders. Here are accounts we manage today —
              click through and see for yourself.
            </p>
          </div>

          <div data-reveal="up" className="grid gap-4 sm:grid-cols-2">
            {CLIENT_ACCOUNTS.map(account => (
              <Card
                key={account.name}
                tone="inverted"
                padding="lg"
                rounded="xl2"
                className="flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="label-mono text-cream-100/55">Client</span>
                    <p className="mt-1 font-display text-lg sm:text-xl font-semibold text-cream-50">
                      {account.name}
                    </p>
                  </div>
                  {account.stat && (
                    <span className="shrink-0 inline-flex items-center rounded-full bg-rust-500 text-white px-2.5 py-1 text-xs font-semibold tracking-wide uppercase shadow-glow-rust">
                      {account.stat}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm text-cream-100/80 leading-relaxed flex-1">
                  {account.note}
                </p>
                <hr className="border-cream-50/15 my-4" />
                <div className="flex flex-wrap items-center gap-2">
                  {account.platforms.map(platform => {
                    const Icon =
                      platform.kind === 'tiktok'
                        ? Music2
                        : platform.kind === 'instagram'
                          ? Instagram
                          : platform.kind === 'youtube'
                            ? Youtube
                            : Facebook
                    return (
                      <a
                        key={platform.kind}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-cream-50/10 hover:bg-cream-50/20 ring-1 ring-cream-50/15 px-3 py-1.5 text-xs font-medium text-cream-50 transition-colors duration-200 ring-focus-rust"
                      >
                        <Icon className="h-3.5 w-3.5 text-rust-300" aria-hidden />
                        {PLATFORM_LABEL[platform.kind]}
                        <ExternalLink className="h-3 w-3 text-cream-100/55" aria-hidden />
                      </a>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* COMBO DEAL */}
      <Section id="bundle" tone="muted" padding="lg">
        <SectionHeading
          eyebrow="Bundle & save"
          heading="Pair social media with"
          accent="a website"
          sub="One bundle, two wins: $250 off any website AND a reduced rate on social. Basic websites become free with the bundle."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2 max-w-4xl mx-auto">
          {/* Standard combo */}
          <Card tone="default" padding="xl" rounded="xl3" className="flex flex-col">
            <span className="label-mono text-rust-700">Standard combo</span>
            <h3 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-ink-900 leading-tight">
              Any website +{' '}
              <span className="text-editorial-italic text-rust-600">$25/wk</span> social
            </h3>
            <hr className="rule-hairline my-6" />
            <ul className="space-y-3 flex-1">
              <li className="flex items-start gap-3 text-ink-800">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-rust-600" aria-hidden />
                <span><strong className="text-ink-900">$250 off</strong> any website tier (Basic becomes free)</span>
              </li>
              <li className="flex items-start gap-3 text-ink-800">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-rust-600" aria-hidden />
                <span>Standard SMM drops from $30/wk → <strong className="text-ink-900">$25/wk</strong></span>
              </li>
              <li className="flex items-start gap-3 text-ink-800">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-rust-600" aria-hidden />
                <span>3-5 posts/week on IG + FB + TikTok</span>
              </li>
              <li className="flex items-start gap-3 text-ink-800">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-rust-600" aria-hidden />
                <span>Free trial week + free homepage design — both before you pay</span>
              </li>
            </ul>
            <button
              onClick={() =>
                goContact({
                  budget: 'combo-standard',
                  message:
                    "I'm interested in the Website + Standard Social Media combo — $250 off any website + $25/wk social.",
                })
              }
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 hover:bg-ink-800 text-cream-50 font-semibold px-6 py-3.5 text-sm magnetic-btn ring-focus-rust transition-colors duration-300"
            >
              Get the Standard combo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </Card>

          {/* Deluxe combo */}
          <Card tone="inverted" padding="xl" rounded="xl3" className="flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-rust-500 text-white px-3 py-1 text-xs font-semibold tracking-wide uppercase shadow-glow-rust">
              Best value
            </span>
            <span className="label-mono text-cream-100/65">Deluxe combo</span>
            <h3 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-cream-50 leading-tight">
              Any website +{' '}
              <span className="text-editorial-italic text-rust-300">$84/wk</span> social
            </h3>
            <hr className="border-cream-50/15 my-6" />
            <ul className="space-y-3 flex-1">
              <li className="flex items-start gap-3 text-cream-100/90">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-rust-300" aria-hidden />
                <span><strong className="text-cream-50">$250 off</strong> any website tier (Basic becomes free)</span>
              </li>
              <li className="flex items-start gap-3 text-cream-100/90">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-rust-300" aria-hidden />
                <span>Deluxe SMM drops from $99/wk → <strong className="text-cream-50">$84/wk</strong></span>
              </li>
              <li className="flex items-start gap-3 text-cream-100/90">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-rust-300" aria-hidden />
                <span>Daily posts + Google Business Profile + custom graphics</span>
              </li>
              <li className="flex items-start gap-3 text-cream-100/90">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-rust-300" aria-hidden />
                <span>Free trial week + free homepage design — both before you pay</span>
              </li>
            </ul>
            <button
              onClick={() =>
                goContact({
                  budget: 'combo-deluxe',
                  message:
                    "I'm interested in the Website + Deluxe Social Media combo — $250 off any website + $84/wk social.",
                })
              }
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-semibold px-6 py-3.5 text-sm magnetic-btn ring-focus-rust transition-colors duration-300 shadow-glow-rust"
            >
              Get the Deluxe combo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </Card>
        </div>
      </Section>

      {/* PROCESS — 3 steps */}
      <Section tone="default" padding="lg">
        <SectionHeading
          eyebrow="How it works"
          heading="From handshake to"
          accent="first post live"
          sub="No long onboarding. No agency contract. We start posting within 48 hours."
        />
        <StaggerGrid
          items={PROCESS}
          className="mt-12 grid gap-6 md:grid-cols-3"
          delayMs={90}
          keyFn={s => s.title}
          childClassName="text-center"
          renderItem={s => (
            <>
              <IconTile tone="brand" size="lg" className="mx-auto">
                <s.Icon />
              </IconTile>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-ink-800 leading-relaxed">{s.desc}</p>
            </>
          )}
        />
      </Section>

      {/* FAQ */}
      <LandingFaq
        eyebrow="Questions"
        heading="The most common"
        accent="things owners ask"
        items={[...FAQS]}
      />

      {/* FINAL CTA */}
      <FinalCta
        eyebrow="No card. No catch."
        heading="Try one week,"
        accent="totally free."
        body="Pick a package, tell us about your business, and we'll start posting within 48 hours. If you don't love it, we walk away — no hard feelings."
        ctaLabel="Start my free week"
        onCta={() =>
          goContact({
            message:
              'I want to start my free social media trial week — please reach out to set it up.',
          })
        }
      />
    </>
  )
}

export default SocialMedia
