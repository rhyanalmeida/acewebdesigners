import { useRef, useEffect, useCallback } from 'react'

import { MAIN_CALENDAR } from './config/calendars'
import { LandingFooter } from './components/ui'
import { MAIN_PIXEL } from './config/pixels'
import {
  trackViewContent,
  trackBookingComplete,
  setupTestingFunctions,
} from './utils/pixelTracking'
import { useScrollReveal } from './hooks/useScrollReveal'

import {
  LandingHero,
  FreeDesignBenefits,
  LandingExamples,
  ProcessSteps,
  BookingSection,
  LandingFaq,
} from './components/landing'

const EXAMPLES = [
  {
    imageUrl: 'https://i.ibb.co/r2g1Q1Qp/hotpotonegif.gif',
    imageAlt: 'Hot Pot One Website Example',
    quote: "Ace Web Designers created an amazing website for our restaurant. The ordering system works flawlessly and we've seen a significant increase in online orders.",
    authorName: 'Hot Pot One — Restaurant',
    rating: 5 as const,
  },
  {
    imageUrl: 'https://i.ibb.co/Myx4nrSr/concuo-gif.gif',
    imageAlt: 'Conuco Takeout Website Example',
    quote: 'The team at Ace Web Designers understood exactly what we needed. Our Dominican cuisine is now beautifully showcased online, and customers love ordering through our website.',
    authorName: 'Conuco Takeout — Restaurant',
    rating: 5 as const,
  },
  {
    imageUrl: 'https://i.ibb.co/S1Yv7K9/dunn-consturction-gif.gif',
    imageAlt: 'Dunn Construction Website Example',
    quote: "We were recommended to Rhyan and Valerie by a friend. Within days, we had a professional website that perfectly represented our construction business. We're already getting more leads!",
    authorName: 'Dunn Construction',
    rating: 5 as const,
  },
]

const BENEFITS = [
  'A free homepage mockup/design before paying a penny',
  'Professional hosting packages available',
  'Websites delivered within 1-3 weeks',
  'Basic SEO implemented in every website',
  'Ongoing SEO and local rankings available',
  'Ongoing support and website updates available',
]

const PROCESS = [
  { title: 'Discovery call', description: '15-minute call to understand your business and goals.' },
  { title: 'Free design mockup', description: 'See your custom homepage design within 24-48 hours — pay nothing yet.' },
  { title: 'Build & launch', description: "Approve the design and we'll build, test, and launch in 1-3 weeks." },
]

const FAQS = [
  { question: 'Is the design really free?', answer: 'Yes. We design your homepage at no cost so you can see exactly what your site will look like before deciding. Pay only if you love it.' },
  { question: 'How fast can I get a website?', answer: 'Most sites launch in 1-3 weeks. Same-day launches are available for urgent projects.' },
  { question: 'Do I own the website?', answer: 'Yes. After purchase the site is fully yours — we just keep it hosted, secure, and updated for you.' },
  { question: "What if I don't like the design?", answer: "No problem. There's no obligation. We'd rather build something you actually love than push a sale." },
]

function Landing() {
  const bookingFormRef = useRef<HTMLElement>(null)

  const handleBookingComplete = useCallback(() => {
    console.log('✅ Main Landing booking detected!')
    trackBookingComplete('main')
  }, [])

  useEffect(() => {
    document.title = 'Free Website Design for Your Business | Limited Time Offer'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Get a free website design for your business. No obligation, no hidden fees. Limited time offer - only 10 spots available!'
      )
    }

    const urlParams = new URLSearchParams(window.location.search)
    if (!urlParams.has('source')) {
      urlParams.append('source', 'landing')
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`
      window.history.replaceState({}, '', newUrl)
    }

    trackViewContent('Main Landing Page', 'Landing Page', 'general_services')

    if (window.fbq) {
      window.fbq('trackCustom', 'MainLandingView', {
        page: 'main_landing',
        source: urlParams.get('source') || 'direct',
      })
      console.log(`✅ ${MAIN_PIXEL.name} (${MAIN_PIXEL.pixelId}): Landing page view tracked`)
    }

    console.log(`✅ LeadConnector booking widget loaded on Main Landing page`)
    console.log(`📅 Using calendar: ${MAIN_CALENDAR.name}`)

    setupTestingFunctions('main')
  }, [])

  useScrollReveal('landing')

  const scrollToBooking = () => {
    bookingFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900">
      <main id="main">
        <LandingHero
          eyebrow="Free design — pay only if you love it"
          headline={<>Get a website that grows your business</>}
          accent="for free"
          sub={<>We'll design your website for free. If you like it, you can buy it. If not, no harm done.</>}
          urgencyText="Limited spots available this month"
          ctaLabel="Get my free design"
          onCta={scrollToBooking}
          videoSrc="https://player.vimeo.com/video/1088261551?h=a19a5e95f4&badge=0&autopause=0&player_id=0&app_id=58479"
          videoTitle="Free Preview Rhyan 1 - 526"
          rating={5}
          ratingLabel="Rated 5.0 / 5 on Google"
        />

        <LandingExamples
          eyebrow="Real client work"
          heading="See examples"
          accent="we've launched"
          examples={EXAMPLES}
        />

        <FreeDesignBenefits
          eyebrow="What you get"
          heading="Every site we build includes"
          accent="the essentials"
          benefits={BENEFITS}
          columns={2}
        />

        <ProcessSteps
          eyebrow="How it works"
          heading="From idea to live site"
          accent="in three steps"
          steps={PROCESS}
        />

        <BookingSection
          ref={bookingFormRef}
          eyebrow="Book your free design"
          heading="Schedule your"
          accent="free consultation"
          sub="Pick a 15-minute slot that works for you. We'll cover your goals and have a free homepage mockup in your inbox within 48 hours."
          calendarConfig={MAIN_CALENDAR}
          containerId="landing-form-container"
          onBookingComplete={handleBookingComplete}
          conversionType="free_design_landing"
          trackerId="landing-conversion-tracker"
          reminder={
            <>
              <strong className="text-rust-700">Please show up!</strong> We're real people who block time for you. Thanks!
            </>
          }
        />

        <LandingFaq
          eyebrow="Questions"
          heading="Everything you might want"
          accent="to ask"
          items={FAQS}
        />
      </main>

      <LandingFooter />
    </div>
  )
}

export default Landing
