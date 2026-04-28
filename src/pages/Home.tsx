import React from 'react'
import {
  ArrowRight,
  ChevronRight,
  Users,
  Star,
  Clock,
  Shield,
  Zap,
  Trophy,
  MessageCircle,
  Smartphone,
  Lock,
  Globe,
  TrendingUp,
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
  TestimonialCard,
  TrustBar,
  BadgePill,
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
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    quote: "Ace Web Designers created an amazing website for our small restaurant. The ordering system works flawlessly and we've seen a 40% increase in online orders since launch.",
    rating: 5 as const,
    metric: '40% more online orders',
  },
  {
    name: 'Maria Rodriguez',
    business: 'Conuco Takeout',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    quote: 'The team understood exactly what we needed for our small Dominican cuisine restaurant. Our website beautifully showcases our food and customers love ordering online.',
    rating: 5 as const,
    metric: '35% more takeout orders',
  },
  {
    name: 'John Dunn',
    business: 'Dunn Construction',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    quote: "Within days, we had a professional website that perfectly represented our small construction business. We're already getting 3x more leads than before!",
    rating: 5 as const,
    metric: '3× more qualified leads',
  },
  {
    name: 'Sarah Thompson',
    business: 'Thompson Fitness',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    quote: 'Professional, fast, and exactly what we needed for our small fitness business. Our new website has helped us book 50% more personal training sessions.',
    rating: 5 as const,
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

const GUARANTEES = [
  { title: 'See Before You Pay', desc: "No payment until you approve your design. See exactly what you're getting first.", Icon: Shield },
  { title: 'Love It Guarantee', desc: "Only pay if you're thrilled with your design. Your satisfaction is our priority.", Icon: Star },
  { title: 'Quality Promise', desc: 'Professional design, every time. We deliver excellence you can count on.', Icon: Trophy },
]

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
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-surface-950 text-white" aria-label="Hero">
        <div className="absolute inset-0 bg-mesh-2 opacity-90" aria-hidden />
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl animate-float-soft" aria-hidden />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-3xl animate-float-soft" style={{ animationDelay: '2s' }} aria-hidden />
        <Container size="lg" className="relative z-10 py-24 sm:py-32 lg:py-40">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow tone="inverted">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                Trusted by 100+ small businesses nationwide
              </Eyebrow>
              <GradientHeading
                level={1}
                size="display"
                tone="inverted"
                className="mt-5"
                accent="that converts"
              >
                Beautiful websites for small business
              </GradientHeading>
              <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed max-w-xl">
                We design websites that look incredible and turn visitors into customers — and you only pay if you love what we build first.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onNavigate('contact')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient text-white font-bold text-base sm:text-lg px-8 py-4 shadow-glow-brand magnetic-btn ring-focus-brand"
                >
                  Get my free design
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </button>
                <button
                  onClick={() => onNavigate('work')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-base sm:text-lg px-7 py-4 ring-1 ring-white/15 transition-colors duration-300 ease-premium ring-focus-brand"
                >
                  See our work
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="mt-8">
                <TrustBar tone="inverted" reviewsCount="100+ reviews" />
              </div>
            </div>

            <div className="relative" data-reveal="right">
              <div className="grid grid-cols-2 gap-4">
                <Card tone="glass" rounded="xl2" padding="lg" className="text-white">
                  <span className="text-3xl">🎨</span>
                  <p className="mt-3 font-display text-2xl font-bold">Free design</p>
                  <p className="text-sm text-white/80">Pay nothing until you love it.</p>
                </Card>
                <Card tone="glass" rounded="xl2" padding="lg" className="text-white mt-8">
                  <span className="text-3xl">⚡</span>
                  <p className="mt-3 font-display text-2xl font-bold">1–3 weeks</p>
                  <p className="text-sm text-white/80">From mockup to live site.</p>
                </Card>
                <Card tone="glass" rounded="xl2" padding="lg" className="text-white -mt-4">
                  <span className="text-3xl">📈</span>
                  <p className="mt-3 font-display text-2xl font-bold">SEO ready</p>
                  <p className="text-sm text-white/80">Built to rank from day one.</p>
                </Card>
                <Card tone="glass" rounded="xl2" padding="lg" className="text-white mt-4">
                  <span className="text-3xl">🔒</span>
                  <p className="mt-3 font-display text-2xl font-bold">SSL secure</p>
                  <p className="text-sm text-white/80">Hosting + security included.</p>
                </Card>
              </div>
            </div>
          </div>
        </Container>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
      </section>

      {/* STATS */}
      <Section tone="default" padding="md">
        <Reveal variant="stagger" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: '100+', l: 'Websites launched', s: 'Across 15+ industries' },
            { v: '5.0★', l: 'Google rating', s: 'From 100+ clients' },
            { v: '1–3wk', l: 'Average delivery', s: 'Same-day option available' },
            { v: '100%', l: 'See before you pay', s: 'Free mockup, no obligation' },
          ].map((s, i) => (
            <div key={s.l} data-reveal-stagger-child style={{ transitionDelay: `${i * 70}ms` }}>
              <StatBlock value={s.v} label={s.l} sub={s.s} />
            </div>
          ))}
        </Reveal>
      </Section>

      {/* INDUSTRIES */}
      <Section id="industries" tone="muted" padding="lg">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow>Who we serve</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-4" accent="every industry">
            Built for small businesses across
          </GradientHeading>
        </div>
        <Reveal variant="stagger" className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => (
            <div key={ind.name} data-reveal-stagger-child style={{ transitionDelay: `${i * 60}ms` }}>
              <Card tone="default" padding="lg" rounded="xl2" interactive shine className="h-full">
                <div className="flex items-start gap-4">
                  <span className="text-4xl shrink-0" aria-hidden>{ind.icon}</span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-surface-900">{ind.name}</h3>
                    <p className="mt-2 text-surface-600 leading-relaxed">{ind.desc}</p>
                    <BadgePill tone="brand" className="mt-4">{ind.count}</BadgePill>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* PROCESS */}
      <Section id="process" tone="default" padding="lg">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow>How it works</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-4" accent="four simple steps">
            From idea to live site in
          </GradientHeading>
        </div>
        <Reveal variant="stagger" className="mt-14 grid gap-8 lg:grid-cols-4 relative">
          <div className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" aria-hidden />
          {PROCESS_STEPS.map((step, i) => (
            <div key={step.title} data-reveal-stagger-child style={{ transitionDelay: `${i * 90}ms` }} className="text-center relative">
              <div className="relative inline-flex">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white text-base font-bold shadow-glow-brand ring-4 ring-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-surface-900">{step.title}</h3>
              <p className="mt-2 text-surface-600 leading-relaxed">{step.desc}</p>
              <BadgePill tone="neutral" className="mt-4">
                <Clock className="h-3 w-3" aria-hidden />
                {step.duration}
              </BadgePill>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* PERFORMANCE & SECURITY */}
      <Section tone="muted" padding="lg">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow tone="accent">Performance & security</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-4" accent="without compromise">
            Fast, secure, reliable —
          </GradientHeading>
        </div>
        <Reveal variant="stagger" className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PERFORMANCE.map((p, i) => (
            <div key={p.label} data-reveal-stagger-child style={{ transitionDelay: `${i * 70}ms` }}>
              <Card tone="default" padding="lg" rounded="xl2" interactive shine className="h-full">
                <IconTile tone="brand" size="md">
                  <p.Icon />
                </IconTile>
                <p className="mt-4 font-display text-3xl font-bold text-surface-900">{p.metric}</p>
                <p className="mt-1 text-sm font-semibold text-surface-700">{p.label}</p>
                <p className="mt-2 text-sm text-surface-500">{p.desc}</p>
              </Card>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* TESTIMONIALS */}
      <Section id="testimonials" tone="default" padding="lg">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow>Real results</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-4" accent="our clients say">
            Don't take our word for it — here's what
          </GradientHeading>
        </div>
        <Reveal variant="stagger" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} data-reveal-stagger-child style={{ transitionDelay: `${i * 80}ms` }}>
              <TestimonialCard
                quote={t.quote}
                authorName={t.name}
                authorRole={t.business}
                rating={t.rating}
                resultMetric={t.metric}
                avatarUrl={t.image}
              />
            </div>
          ))}
        </Reveal>
      </Section>

      {/* GUARANTEES */}
      <Section tone="muted" padding="lg">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow tone="accent">Our promise</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-4" accent="every project">
            Three guarantees we make on
          </GradientHeading>
        </div>
        <Reveal variant="stagger" className="mt-12 grid gap-5 md:grid-cols-3">
          {GUARANTEES.map((g, i) => (
            <div key={g.title} data-reveal-stagger-child style={{ transitionDelay: `${i * 90}ms` }}>
              <Card tone="default" padding="lg" rounded="xl2" interactive shine className="h-full">
                <IconTile tone="accent" size="md">
                  <g.Icon />
                </IconTile>
                <h3 className="mt-5 font-display text-xl font-semibold text-surface-900">{g.title}</h3>
                <p className="mt-2 text-surface-600 leading-relaxed">{g.desc}</p>
              </Card>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* CALCULATOR */}
      <Section id="calculator" tone="default" padding="lg" containerSize="md">
        <div className="text-center">
          <Eyebrow>Quick estimate</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-4" accent="ballpark price">
            Get an instant
          </GradientHeading>
          <p className="mt-4 text-surface-600 max-w-xl mx-auto">
            A rough estimate based on what you need. Final price comes after the free design call.
          </p>
        </div>
        <Card tone="default" padding="xl" rounded="xl3" className="mt-10">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-7">
              <div>
                <label className="font-semibold text-surface-900 block mb-3">Number of pages</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 5, 8, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCalcPages(n)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold ring-1 transition-all duration-300 ease-premium ring-focus-brand ${
                        calcPages === n
                          ? 'bg-brand-gradient text-white ring-transparent shadow-glow-brand'
                          : 'bg-white text-surface-700 ring-surface-200 hover:ring-brand-300'
                      }`}
                    >
                      {n} page{n > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold text-surface-900 block mb-3">Features</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CALC_FEATURES.map(f => {
                    const active = calcFeatures.includes(f.id)
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFeature(f.id)}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl ring-1 transition-all duration-300 ease-premium text-left ring-focus-brand ${
                          active
                            ? 'bg-brand-50 ring-brand-300 text-brand-800'
                            : 'bg-white ring-surface-200 text-surface-700 hover:ring-brand-200'
                        }`}
                      >
                        <span className="text-sm font-medium">{f.label}</span>
                        {active ? <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" aria-hidden /> : <Plus className="h-4 w-4 text-surface-400 shrink-0" aria-hidden />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="font-semibold text-surface-900 block mb-3">Timeline</label>
                <div className="flex gap-2">
                  {(['standard', 'rush'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCalcTimeline(t)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold ring-1 transition-all duration-300 ease-premium ring-focus-brand ${
                        calcTimeline === t
                          ? 'bg-brand-gradient text-white ring-transparent shadow-glow-brand'
                          : 'bg-white text-surface-700 ring-surface-200 hover:ring-brand-300'
                      }`}
                    >
                      {t === 'standard' ? 'Standard (1-3 weeks)' : 'Rush (under 1 week, +50%)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl3 bg-brand-gradient p-8 text-white shadow-glow-brand flex flex-col justify-between">
              <div>
                <CalcIcon className="h-8 w-8 text-white/80" aria-hidden />
                <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/80">Estimated</p>
                <p className="mt-2 font-display text-5xl font-bold">${calcEstimate.toLocaleString()}</p>
                <p className="mt-3 text-sm text-white/85">
                  Includes hosting, mobile responsiveness, and basic SEO. Final price after free consultation.
                </p>
              </div>
              <button
                onClick={() => onNavigate('contact')}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white text-surface-900 font-bold px-6 py-3 magnetic-btn ring-focus-brand"
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
        <div className="text-center">
          <Eyebrow>Questions</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-4" accent="frequently asked">
            Everything you need to know,
          </GradientHeading>
        </div>
        <Reveal variant="up" className="mt-12 space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i
            return (
              <div
                key={i}
                className={`rounded-xl2 ring-1 transition-all duration-500 ease-premium ${
                  isOpen ? 'bg-white ring-brand-200 shadow-soft' : 'bg-white ring-surface-200 hover:ring-surface-300'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`home-faq-panel-${i}`}
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left ring-focus-brand rounded-xl2"
                >
                  <span className="font-display font-semibold text-base sm:text-lg text-surface-900">{faq.q}</span>
                  <span className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-brand-500 text-white' : 'bg-surface-50 text-surface-700 ring-1 ring-surface-200'}`}>
                    {isOpen ? <Minus className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                  </span>
                </button>
                <div
                  id={`home-faq-panel-${i}`}
                  className={`grid transition-[grid-template-rows] duration-500 ease-premium ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-surface-600 leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </Reveal>
      </Section>

      {/* FINAL CTA */}
      <Section tone="mesh" padding="lg" containerSize="md">
        <Reveal variant="up" className="text-center">
          <Eyebrow tone="inverted">Ready when you are</Eyebrow>
          <GradientHeading level={2} size="lg" tone="inverted" className="mt-4">
            Let's build something your customers will love.
          </GradientHeading>
          <p className="mt-5 text-white/80 max-w-xl mx-auto">
            Book a 15-minute consultation. We'll send a free homepage design — pay only if you want to keep it.
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white text-surface-900 font-bold text-base sm:text-lg px-8 py-4 shadow-lift magnetic-btn ring-focus-brand"
          >
            Get my free design
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
          <div className="mt-6 flex justify-center">
            <TrustBar tone="inverted" />
          </div>
        </Reveal>
      </Section>
    </>
  )
}

export default Home
