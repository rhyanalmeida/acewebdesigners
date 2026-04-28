import React from 'react'
import {
  ArrowRight,
  ChevronRight,
  Star,
  Clock,
  Shield,
  Zap,
  Trophy,
  MessageCircle,
  Smartphone,
  Lock,
  Calculator as CalcIcon,
  CheckCircle2,
  Plus,
  Minus,
} from 'lucide-react'

import {
  Container,
  Section,
  Eyebrow,
  GradientHeading,
  Card,
  Reveal,
  IconTile,
  StatBlock,
  BadgePill,
  SectionHeading,
  StaggerGrid,
  FinalCta,
  PriceCard,
  TrustStack,
  PhoneCta,
  TestimonialEditorial,
  LiveProof,
} from '../components/ui'

import type { NavigateFn } from '../components/layout'

interface HomeProps {
  onNavigate: NavigateFn
  pendingScroll: string | null
  onPendingScrollHandled: () => void
}

const TESTIMONIALS = [
  {
    name: 'Mike Chen',
    business: 'Hot Pot One',
    city: 'Boston, MA',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    quote: "Ace created an amazing website for our small restaurant. The ordering system works flawlessly and we've seen a 40% increase in online orders since launch.",
    metric: '40% more orders',
  },
  {
    name: 'Maria Rodriguez',
    business: 'Conuco Takeout',
    city: 'Worcester, MA',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    quote: 'The team understood exactly what we needed. Our site beautifully showcases our food and customers love ordering online.',
    metric: '35% more takeout',
  },
  {
    name: 'John Dunn',
    business: 'Dunn Construction',
    city: 'Leominster, MA',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    quote: "Within days, we had a professional website that perfectly represented our small construction business. We're already getting 3x more leads than before.",
    metric: '3× qualified leads',
  },
  {
    name: 'Sarah Thompson',
    business: 'Thompson Fitness',
    city: 'Nashua, NH',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    quote: 'Professional, fast, and exactly what we needed for our small fitness business. Our new website has helped us book 50% more personal training sessions.',
    metric: '50% more bookings',
  },
]

const PROCESS_STEPS = [
  { title: 'Discovery Call', desc: 'We discuss your business goals, target audience, and website requirements in a 15-minute consultation.', duration: '15 minutes', Icon: MessageCircle },
  { title: 'Free Design Mockup', desc: 'We create a free homepage design mockup so you can see exactly what your website will look like before paying anything.', duration: '24-48 hours', Icon: Star },
  { title: 'Development & Build', desc: 'Once approved, we build your complete website with all pages, features, and functionality you need.', duration: '1-3 weeks', Icon: Zap },
  { title: 'Launch & Support', desc: 'We launch your website and provide ongoing support to ensure everything runs smoothly and continues to drive results.', duration: 'Ongoing', Icon: Trophy },
]

const FAQS = [
  { q: 'How much does a website cost?', a: 'Our websites start at $200 for a basic one-page site, $1,000 for a standard multi-page website, and $1,500 for e-commerce. All packages include hosting, mobile responsiveness, and basic SEO. We provide a free design mockup before you pay anything.' },
  { q: 'How long does it take to build a website?', a: "Most websites are completed within 1-3 weeks. Our 'Website in a Day' option delivers a professional site in just 24 hours. Timeline depends on complexity and how quickly you provide content and feedback." },
  { q: 'Do you provide hosting and maintenance?', a: "Yes! All our packages include professional hosting. We also offer ongoing maintenance, updates, and support for a small monthly fee. You'll never have to worry about technical issues." },
  { q: 'Will my website work on mobile devices?', a: 'Absolutely! Every website we build is fully responsive and optimized for mobile, tablet, and desktop. With 60%+ of web traffic coming from mobile, this is essential for your success.' },
  { q: 'Can you help with SEO and getting found on Google?', a: "Yes! We include basic SEO setup with every small business website and offer advanced SEO services to help you rank higher on Google. We'll optimize your site for your target keywords and help small business owners get found nationwide." },
  { q: "What if I don't like the design?", a: "That's why we create a free mockup first! You can see exactly what your website will look like before paying. If you don't love it, there's no obligation to proceed. We want you to be 100% happy." },
  { q: 'Do you work with small businesses outside your local area?', a: "Yes! We specialize in helping small businesses nationwide. Most of our communication is done remotely through video calls, email, and phone. Location doesn't limit our ability to create an amazing website for your small business." },
  { q: 'Can you add e-commerce/online ordering to my website?', a: "Definitely! We specialize in e-commerce websites and online ordering systems. Whether you're selling products or services, we can set up secure payment processing and inventory management." },
]

const INDUSTRIES = [
  { name: 'Restaurants & Food Service', icon: '🍽️', desc: 'Online ordering, menu displays, and reservation booking.', count: '15+ projects' },
  { name: 'Construction', icon: '🏗️', desc: 'Project portfolios, service listings, lead generation.', count: '20+ projects' },
  { name: 'Healthcare Practices', icon: '⚕️', desc: 'Appointment scheduling, service info, patient portals.', count: '12+ projects' },
  { name: 'Professional Services', icon: '💼', desc: 'Service showcases, testimonials, consultation booking.', count: '25+ projects' },
  { name: 'Retail & E-commerce', icon: '🛍️', desc: 'Online stores, inventory, secure payments.', count: '18+ projects' },
  { name: 'Fitness Studios', icon: '💪', desc: 'Class scheduling, memberships, training programs.', count: '10+ projects' },
]

const PERFORMANCE = [
  { metric: '2.3s', label: 'Avg Load Time', desc: 'Google recommends under 3 seconds', Icon: Zap },
  { metric: '99.9%', label: 'Uptime Guarantee', desc: 'Reliable hosting with minimal downtime', Icon: Shield },
  { metric: '95+', label: 'Mobile Score', desc: 'Google PageSpeed mobile optimization', Icon: Smartphone },
  { metric: 'SSL', label: 'Security Included', desc: 'Free SSL certificates for all sites', Icon: Lock },
]

const STATS = [
  { v: '100+', l: 'Websites launched', s: 'Across 15+ industries' },
  { v: '5.0★', l: 'Google rating', s: 'From 100+ clients' },
  { v: '1–3wk', l: 'Average delivery', s: 'Same-day option available' },
  { v: '100%', l: 'See before you pay', s: 'Free mockup, no obligation' },
]

const PRICING = [
  {
    tier: 'Basic',
    price: '$200',
    description: 'A polished one-page site for small businesses just getting started.',
    features: [
      'One-page site, mobile responsive',
      'Professional copywriting',
      'Hosting + SSL included',
      'Basic SEO setup',
      'Launch in days, not weeks',
    ],
  },
  {
    tier: 'Standard',
    price: '$1,000',
    description: 'A multi-page site that tells your full story and converts visitors.',
    features: [
      'Up to 5 pages, fully responsive',
      'Custom copy + photo treatment',
      'Hosting, SSL, basic SEO',
      'Contact form + Google Maps',
      'Free design before you pay',
    ],
    highlight: true,
  },
  {
    tier: 'E-commerce',
    price: '$1,500',
    description: 'A full online store or booking flow with secure payments.',
    features: [
      'Online store or booking system',
      'Secure payment processing',
      'Inventory + product management',
      'Order notifications + admin',
      'Hosting, SSL, SEO included',
    ],
  },
] as const

const CALC_FEATURES = [
  { id: 'ecom', label: 'E-commerce / Online ordering', cost: 200 },
  { id: 'booking', label: 'Booking / appointments', cost: 200 },
  { id: 'blog', label: 'Blog / content management', cost: 200 },
  { id: 'seo', label: 'Advanced SEO setup', cost: 200 },
  { id: 'gallery', label: 'Image / project gallery', cost: 200 },
] as const

const Home: React.FC<HomeProps> = ({ onNavigate, pendingScroll, onPendingScrollHandled }) => {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)
  const [calcPages, setCalcPages] = React.useState(1)
  const [calcFeatures, setCalcFeatures] = React.useState<string[]>([])
  const [calcTimeline, setCalcTimeline] = React.useState<'standard' | 'rush'>('standard')

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

  const calcEstimate = React.useMemo(() => {
    let base = 200
    if (calcPages > 5) base = 1500
    else if (calcPages > 1) base = 1000
    const addons = calcFeatures.length * 200
    const rush = calcTimeline === 'rush' ? base * 0.5 : 0
    return Math.round(base + addons + rush)
  }, [calcPages, calcFeatures, calcTimeline])

  const toggleFeature = (id: string) =>
    setCalcFeatures(prev => (prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]))

  return (
    <>
      {/* HERO — editorial cream paper, single-col, type-led */}
      <section className="relative isolate overflow-hidden bg-cream-50 text-ink-900 bg-paper-noise" aria-label="Hero">
        <Container size="lg" className="relative z-10 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto" data-reveal="up">
            <LiveProof className="mb-8" />
            <Eyebrow tone="brand">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
              Trusted by 100+ small businesses nationwide
            </Eyebrow>
            <GradientHeading
              level={1}
              size="display"
              className="mt-6"
              accent="small business"
            >
              Beautiful websites for
            </GradientHeading>
            <p className="mt-7 text-lg sm:text-xl text-ink-700 leading-relaxed max-w-2xl mx-auto">
              We design websites that look incredible and turn visitors into customers — and you only pay if you love what we build first.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-semibold text-base sm:text-lg px-8 py-4 shadow-glow-rust magnetic-btn ring-focus-rust transition-colors duration-300"
              >
                Get my free design
                <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
              <button
                onClick={() => onNavigate('work')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cream-100 hover:bg-cream-200 text-ink-900 font-semibold text-base sm:text-lg px-7 py-4 ring-1 ring-ink-900/15 transition-colors duration-300 ease-premium ring-focus-rust"
              >
                See our work
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <span className="label-num">
                <span className="text-ink-700/50">001 — </span>
                <span className="text-ink-800">Sites from</span>{' '}
                <span className="font-display text-ink-900 font-semibold not-italic">$200</span>
                <span className="text-ink-700/50"> · No payment until you love the design</span>
              </span>
              <PhoneCta showLabels={false} />
            </div>

            <div className="mt-12 flex justify-center">
              <TrustStack />
            </div>
          </div>
        </Container>
        <hr className="rule-hairline" />
      </section>

      {/* PRICING — prominent (was buried in FAQ before) */}
      <Section id="pricing" tone="default" padding="lg">
        <SectionHeading
          eyebrow="Pricing"
          heading="Simple pricing,"
          accent="no surprises"
          sub="Three packages. No hidden fees. Free design first — pay only if you love it."
        />
        <StaggerGrid
          items={PRICING as unknown as Array<typeof PRICING[number]>}
          className="mt-14 grid gap-6 lg:grid-cols-3"
          delayMs={80}
          keyFn={p => p.tier}
          renderItem={p => (
            <PriceCard
              tier={p.tier}
              price={p.price}
              description={p.description}
              features={[...p.features]}
              highlight={'highlight' in p ? p.highlight : false}
              ctaLabel="Start my free design"
              onCta={() => onNavigate('contact')}
            />
          )}
        />
        <p className="mt-10 text-center text-sm text-ink-700/70 max-w-2xl mx-auto">
          Each package includes hosting, mobile responsiveness, and basic SEO. Add-ons available at $200 each: e-commerce, booking, blog, advanced SEO, or photo gallery.
        </p>
      </Section>

      {/* STATS */}
      <Section tone="muted" padding="md">
        <StaggerGrid
          items={STATS}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          keyFn={s => s.l}
          renderItem={s => <StatBlock value={s.v} label={s.l} sub={s.s} />}
        />
      </Section>

      {/* INDUSTRIES */}
      <Section id="industries" tone="default" padding="lg">
        <SectionHeading
          eyebrow="Who we serve"
          heading="Built for small businesses across"
          accent="every industry"
        />
        <StaggerGrid
          items={INDUSTRIES}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          delayMs={60}
          keyFn={ind => ind.name}
          renderItem={ind => (
            <Card tone="default" padding="lg" rounded="xl2" interactive shine className="h-full">
              <div className="flex items-start gap-4">
                <span className="text-4xl shrink-0" aria-hidden>{ind.icon}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink-900">{ind.name}</h3>
                  <p className="mt-2 text-ink-700 leading-relaxed">{ind.desc}</p>
                  <BadgePill tone="brand" className="mt-4">{ind.count}</BadgePill>
                </div>
              </div>
            </Card>
          )}
        />
      </Section>

      {/* PROCESS */}
      <Section id="process" tone="muted" padding="lg">
        <SectionHeading
          eyebrow="How it works"
          heading="From idea to live site in"
          accent="four simple steps"
        />
        <div className="mt-14 relative">
          <div
            className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-ink-900/15 to-transparent"
            aria-hidden
          />
          <StaggerGrid
            items={PROCESS_STEPS}
            className="grid gap-8 lg:grid-cols-4 relative"
            delayMs={90}
            keyFn={step => step.title}
            childClassName="text-center relative"
            renderItem={(step, i) => (
              <>
                <div className="relative inline-flex">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-cream-50 font-display text-base font-semibold ring-4 ring-cream-100">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-ink-700 leading-relaxed">{step.desc}</p>
                <BadgePill tone="neutral" className="mt-4">
                  <Clock className="h-3 w-3" aria-hidden />
                  {step.duration}
                </BadgePill>
              </>
            )}
          />
        </div>
      </Section>

      {/* PERFORMANCE & SECURITY */}
      <Section tone="default" padding="lg">
        <SectionHeading
          eyebrow="Performance & security"
          eyebrowTone="forest"
          heading="Fast, secure, reliable —"
          accent="without compromise"
        />
        <StaggerGrid
          items={PERFORMANCE}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          keyFn={p => p.label}
          renderItem={p => (
            <Card tone="default" padding="lg" rounded="xl2" interactive shine className="h-full">
              <IconTile tone="brand" size="md">
                <p.Icon />
              </IconTile>
              <p className="mt-4 font-display text-3xl font-semibold text-ink-900">{p.metric}</p>
              <p className="mt-1 text-sm font-semibold text-ink-800">{p.label}</p>
              <p className="mt-2 text-sm text-ink-700/80">{p.desc}</p>
            </Card>
          )}
        />
      </Section>

      {/* TESTIMONIALS — editorial */}
      <Section id="testimonials" tone="muted" padding="lg">
        <SectionHeading
          eyebrow="Real results"
          heading="What our clients"
          accent="actually say"
        />
        <StaggerGrid
          items={TESTIMONIALS}
          className="mt-14 grid gap-6 lg:grid-cols-2"
          delayMs={100}
          keyFn={t => t.name}
          renderItem={t => (
            <TestimonialEditorial
              quote={t.quote}
              authorName={t.name}
              business={t.business}
              city={t.city}
              avatar={t.image}
              result={t.metric}
              variant="compact"
            />
          )}
        />
      </Section>

      {/* CALCULATOR */}
      <Section id="calculator" tone="default" padding="lg" containerSize="md">
        <SectionHeading
          eyebrow="Quick estimate"
          heading="Get an instant"
          accent="ballpark price"
          sub="A rough estimate based on what you need. Final price comes after the free design call."
        />
        <Card tone="default" padding="xl" rounded="xl3" className="mt-10">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-7">
              <div>
                <label className="font-display text-lg font-semibold text-ink-900 block mb-3">Number of pages</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 5, 8, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCalcPages(n)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold ring-1 transition-all duration-300 ease-premium ring-focus-rust ${
                        calcPages === n
                          ? 'bg-ink-900 text-cream-50 ring-transparent'
                          : 'bg-cream-50 text-ink-800 ring-ink-900/15 hover:ring-ink-900/30'
                      }`}
                    >
                      {n} page{n > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-display text-lg font-semibold text-ink-900 block mb-3">Features</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CALC_FEATURES.map(f => {
                    const active = calcFeatures.includes(f.id)
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFeature(f.id)}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl ring-1 transition-all duration-300 ease-premium text-left ring-focus-rust ${
                          active
                            ? 'bg-rust-50 ring-rust-300 text-rust-800'
                            : 'bg-cream-50 ring-ink-900/15 text-ink-800 hover:ring-ink-900/30'
                        }`}
                      >
                        <span className="text-sm font-medium">{f.label}</span>
                        {active ? <CheckCircle2 className="h-4 w-4 text-rust-600 shrink-0" aria-hidden /> : <Plus className="h-4 w-4 text-ink-700/50 shrink-0" aria-hidden />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="font-display text-lg font-semibold text-ink-900 block mb-3">Timeline</label>
                <div className="flex gap-2">
                  {(['standard', 'rush'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCalcTimeline(t)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold ring-1 transition-all duration-300 ease-premium ring-focus-rust ${
                        calcTimeline === t
                          ? 'bg-ink-900 text-cream-50 ring-transparent'
                          : 'bg-cream-50 text-ink-800 ring-ink-900/15 hover:ring-ink-900/30'
                      }`}
                    >
                      {t === 'standard' ? 'Standard (1-3 weeks)' : 'Rush (under 1 week, +50%)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl3 bg-ink-900 p-8 text-cream-50 flex flex-col justify-between">
              <div>
                <CalcIcon className="h-8 w-8 text-rust-300" aria-hidden />
                <p className="mt-4 label-mono text-cream-100/55">Estimated</p>
                <p className="mt-2 font-display text-6xl font-semibold tracking-tight">${calcEstimate.toLocaleString()}</p>
                <p className="mt-3 text-sm text-cream-100/80 leading-relaxed">
                  Includes hosting, mobile responsiveness, and basic SEO. Final price after free consultation.
                </p>
              </div>
              <button
                onClick={() => onNavigate('contact')}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-semibold px-6 py-3 magnetic-btn ring-focus-rust transition-colors duration-300"
              >
                Book free consultation
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </Card>
      </Section>

      {/* FAQ */}
      <Section id="faq" tone="muted" padding="lg" containerSize="md">
        <SectionHeading
          eyebrow="Questions"
          heading="Everything you need to know,"
          accent="frequently asked"
        />
        <Reveal variant="up" className="mt-12 space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i
            return (
              <div
                key={i}
                className={`rounded-xl2 ring-1 transition-all duration-500 ease-premium ${
                  isOpen ? 'bg-cream-50 ring-rust-300 shadow-soft' : 'bg-cream-50 ring-ink-900/10 hover:ring-ink-900/20'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`home-faq-panel-${i}`}
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left ring-focus-rust rounded-xl2"
                >
                  <span className="font-display font-semibold text-base sm:text-lg text-ink-900">{faq.q}</span>
                  <span className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-rust-500 text-white' : 'bg-cream-100 text-ink-800 ring-1 ring-ink-900/10'}`}>
                    {isOpen ? <Minus className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                  </span>
                </button>
                <div
                  id={`home-faq-panel-${i}`}
                  className={`grid transition-[grid-template-rows] duration-500 ease-premium ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-ink-700 leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </Reveal>
      </Section>

      {/* FINAL CTA */}
      <FinalCta
        eyebrow="Ready when you are"
        heading="Let's build something your customers"
        accent="will love."
        body="Book a 15-minute consultation. We'll send a free homepage design — pay only if you want to keep it."
        ctaLabel="Get my free design"
        onCta={() => onNavigate('contact')}
      />
    </>
  )
}

export default Home
