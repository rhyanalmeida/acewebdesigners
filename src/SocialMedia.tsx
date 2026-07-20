import React from 'react'
import { ExternalLink } from 'lucide-react'

import { Section, Eyebrow, GradientHeading, SectionHeading, FinalCta } from './components/ui'
import { SeoMeta, organizationLd, serviceLd, breadcrumbForPath } from './seo'

/**
 * Numbers on this page are LIVE COUNTS, read off the accounts on 2026-07-20 and
 * stamped with that date. They will drift. When they are updated, re-read them —
 * do not nudge them upward.
 *
 * Two claims that used to be here were false and are not coming back:
 *   - "21k+ followers" for Told History. The real figure is 20.8K, i.e. BELOW
 *     21k. A rounded-up follower count on a page selling honesty is a bad trade.
 *   - "Started at 0 followers a few months ago — growing fast" for Luxury
 *     Makeover. It has 198 followers. It is not growing fast, and it does not
 *     need to be: it produced a $20,000+ contract anyway, which is a far better
 *     story than the vague one that was covering for it.
 *
 * The $20,000+ is the CLIENT's contract revenue from Valerie's work. It is not
 * our revenue. Do not blur that.
 */

const STATS_AS_OF = 'July 2026'

const goContact = () =>
  window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'contact' } }))

interface Account {
  name: string
  what: string
  /** Live counts, read on 2026-07-20. Omit rather than estimate. */
  followers?: string
  likes?: string
  links: Array<{ label: string; url: string }>
}

const ACCOUNTS: Account[] = [
  {
    name: 'Luxury Makeover',
    what: 'Bathroom remodels. Valerie built the account from nothing.',
    followers: '198',
    likes: '51.4K',
    links: [
      { label: 'TikTok', url: 'https://www.tiktok.com/@luxurymakeover_official' },
      { label: 'Instagram', url: 'https://www.instagram.com/luxurymakeover_ig' },
    ],
  },
  {
    name: 'Told History',
    what: 'History shorts. Our own account, which is where we learned most of this.',
    followers: '20.8K',
    likes: '1.9M',
    links: [
      { label: 'TikTok', url: 'https://www.tiktok.com/@told.history' },
      { label: 'YouTube', url: 'https://www.youtube.com/@told.history' },
    ],
  },
  {
    name: '911 Local Plumbing',
    what: 'Plumbing. Built from scratch and running.',
    links: [
      { label: 'TikTok', url: 'https://www.tiktok.com/@911localplumbing' },
      { label: 'Instagram', url: 'https://www.instagram.com/911localplumbing' },
    ],
  },
  {
    name: 'Conuco Restaurant Takeout',
    what: 'Dominican takeout. We built their site too.',
    links: [
      { label: 'Instagram', url: 'https://www.instagram.com/conucotakeout' },
      { label: 'Facebook', url: 'https://www.facebook.com/conucotakeout' },
    ],
  },
]

const SocialMedia: React.FC = () => (
  <>
    <SeoMeta
      path="/socialmedia"
      jsonLd={[
        organizationLd(),
        serviceLd({
          name: 'Social media management for trades',
          description:
            'Social media run for contractors and trades by Valerie at Ace Web Designers. One account we run has 198 followers and brought its owner a contract worth over $20,000.',
          serviceType: 'Social media management',
          url: 'https://acewebdesigners.com/socialmedia',
        }),
        breadcrumbForPath('/socialmedia')!,
      ]}
    />

    {/* ── OPENING ──────────────────────────────────────────────────────────
        Leads with the number that disproves the premise everyone else sells. */}
    <section className="relative bg-cream-50 text-ink-900 bg-paper-noise" aria-label="Social media">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 lg:pt-28">
        <Eyebrow tone="muted">Social media</Eyebrow>
        <GradientHeading level={1} size="display" className="mt-6 max-w-4xl">
          198 followers. Two bathrooms. Over $20,000.
        </GradientHeading>
        <p className="mt-8 max-w-2xl text-lg text-ink-800 leading-relaxed">
          That is one of Valerie&rsquo;s accounts. It has fewer than two hundred followers and it
          put a five-figure contract on a remodeler&rsquo;s calendar. Everyone in this business
          sells you follower growth. Follower counts do not pay for bathrooms.
        </p>
      </div>
      <hr className="rule-hairline" />
    </section>

    {/* ── THE ARGUMENT ── asymmetric split */}
    <Section tone="muted" padding="lg">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <Eyebrow tone="muted">Why that number is the point</Eyebrow>
          <h2 className="mt-6 font-display text-3xl sm:text-4xl leading-tight text-ink-900">
            You are not trying to be famous. You are trying to fill next month.
          </h2>
        </div>
        <div className="space-y-5 text-ink-800 leading-relaxed lg:pt-16">
          <p>
            A follower is someone who saw a video once. A customer is someone who needed a
            bathroom done and found somebody they trusted to do it. Those are not the same person
            and they do not arrive the same way.
          </p>
          <p>
            The Luxury Makeover account has 198 followers and 51,400 likes as of {STATS_AS_OF}.
            The likes matter more than the followers here, because they mean the work is being
            watched by people it is landing on.
          </p>
          <p className="text-ink-900 font-medium">
            If someone is quoting you a follower target, ask them what it is worth.
          </p>
        </div>
      </div>
    </Section>

    {/* ── ACCOUNTS ── ruled rows with live figures and links out, so anyone can
        check the numbers themselves rather than take ours. */}
    <Section tone="default" padding="lg">
      <SectionHeading
        eyebrow="Accounts we run"
        heading="Go and look"
        accent="at them yourself"
        sub={`Follower and like counts read directly from the accounts in ${STATS_AS_OF}. They will have moved since — the links go to the live profiles.`}
      />
      <ul className="mt-14 border-t border-ink-900/10">
        {ACCOUNTS.map(a => (
          <li
            key={a.name}
            className="grid gap-4 py-8 border-b border-ink-900/10 lg:grid-cols-[1fr_auto_14rem] lg:items-center lg:gap-10"
          >
            <div>
              <h3 className="font-display text-xl text-ink-900">{a.name}</h3>
              <p className="mt-1.5 text-ink-800 leading-relaxed max-w-xl">{a.what}</p>
            </div>

            {(a.followers || a.likes) && (
              <dl className="flex gap-8 lg:gap-10">
                {a.followers && (
                  <div>
                    <dt className="label-mono text-ink-700/60">Followers</dt>
                    <dd className="mt-1 font-mono text-lg text-ink-900">{a.followers}</dd>
                  </div>
                )}
                {a.likes && (
                  <div>
                    <dt className="label-mono text-ink-700/60">Likes</dt>
                    <dd className="mt-1 font-mono text-lg text-ink-900">{a.likes}</dd>
                  </div>
                )}
              </dl>
            )}

            <div className="flex gap-4 lg:justify-end">
              {a.links.map(l => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 label-mono text-ink-700 hover:text-signal-600 transition-colors"
                >
                  {l.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Section>

    {/* ── WHO ── Valerie */}
    <Section tone="muted" padding="lg">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <Eyebrow tone="muted">Who makes them</Eyebrow>
          <h2 className="mt-6 font-display text-3xl sm:text-4xl leading-tight text-ink-900">
            Valerie does all of it.
          </h2>
        </div>
        <div className="space-y-5 text-ink-800 leading-relaxed lg:pt-16">
          <p>
            She is also an esthetician, and she reckons beautifying a social page works the same
            way as beautifying anything else: you are trying to make something look genuine and
            feel good, and you have to actually care how it turns out.
          </p>
          <p>
            She writes the posts, designs them, and puts them out. You are not sent a content
            calendar to approve at eleven at night.
          </p>
        </div>
      </div>
    </Section>

    <FinalCta
      eyebrow="Book a time"
      heading="Show us the work you do"
      accent="and we will show you the posts"
      body="Fifteen minutes. Bring photos of a job you are proud of, and we will tell you honestly whether social is worth it for your trade."
      ctaLabel="See available times"
      onCta={goContact}
    />
  </>
)

export default SocialMedia
