import React, { useRef, useEffect } from 'react'
import {
  CheckCircle2,
  Star,
  MousePointer2,
  Hammer,
  HardHat,
  Wrench,
  TrendingUp,
} from 'lucide-react'
import { trackContractorBooking, testOfflineConversion } from './utils/facebookConversions'

function LandingContractors() {
  const bookingFormRef = useRef(null)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = React.useState(false)
  const [showTermsOfService, setShowTermsOfService] = React.useState(false)

  useEffect(() => {
    document.title = 'Free Website Design for Contractors | Get More Leads & Jobs'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Get a free website design for your contracting business. Attract more clients, showcase your work, and grow your business online. No payment until you love it!'
      )
    }

    // Set a URL parameter that can be tracked
    const urlParams = new URLSearchParams(window.location.search)
    if (!urlParams.has('source')) {
      urlParams.append('source', 'landing-contractors')
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`
      window.history.replaceState({}, '', newUrl)
    }

    // Initialize Contractor-Specific Facebook Pixel (4230021860577001)
    // This is separate from the main site pixel
    const initContractorPixel = () => {
      if (!window.fbq) {
        // Load Facebook Pixel if not already loaded
        !(function (f, b, e, v, n, t, s) {
          if (f.fbq) return
          n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
          }
          if (!f._fbq) f._fbq = n
          n.push = n
          n.loaded = !0
          n.version = '2.0'
          n.queue = []
          t = b.createElement(e)
          t.async = !0
          t.src = v
          s = b.getElementsByTagName(e)[0]
          s.parentNode.insertBefore(t, s)
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
      }

      // Initialize contractor pixel ID: 4230021860577001
      if (window.fbq) {
        window.fbq('init', '4230021860577001')
        window.fbq('track', 'PageView')

        // Track ViewContent event (standard event for landing pages)
        window.fbq('track', 'ViewContent', {
          content_name: 'Contractor Landing Page',
          content_category: 'Landing Page',
          content_type: 'contractor_services',
        })

        // Track custom event for contractor-specific tracking
        window.fbq('trackCustom', 'ContractorLandingView', {
          page: 'contractor_landing',
          source: urlParams.get('source') || 'direct',
        })

        console.log('✅ Contractor Facebook Pixel (4230021860577001): Initialized and tracking')
      }
    }

    // Initialize contractor pixel
    initContractorPixel()

    console.log('✅ LeadConnector booking widget loaded on Contractor Landing page')

    // Debug: Log ALL postMessage events to identify LeadConnector's format
    const debugAllMessages = (e: MessageEvent) => {
      console.log('📨 PostMessage received:', {
        origin: e.origin,
        data: e.data,
        type: typeof e.data,
        dataType: e.data?.type,
        dataEvent: e.data?.event,
        fullData: JSON.stringify(e.data, null, 2),
      })
    }

    window.addEventListener('message', debugAllMessages)

    // Add booking event listener for LeadConnector widget
    const handleBookingComplete = (e: MessageEvent) => {
      let isBooking = false

      // Log for debugging
      if (e.origin.includes('leadconnectorhq.com') || e.origin.includes('msgsndr.com')) {
        console.log('🎯 LeadConnector message detected:', e.data)
      }

      if (e.data && typeof e.data === 'object') {
        // Check multiple possible event patterns
        if (
          // Standard patterns
          e.data.type === 'booking_completed' ||
          e.data.type === 'appointment_scheduled' ||
          e.data.event === 'booking_completed' ||
          e.data.event === 'appointment_scheduled' ||
          // GHL-specific patterns
          e.data.type === 'form_submitted' ||
          e.data.type === 'calendar_booking' ||
          e.data.event === 'form_submitted' ||
          e.data.event === 'calendar_booking' ||
          // Check for success/complete in message
          (typeof e.data === 'string' &&
            (e.data.includes('success') || e.data.includes('complete'))) ||
          // Check nested event property
          e.data.message?.type === 'booking_completed' ||
          // Check for any booking-related keywords
          (e.data.action && e.data.action.includes('book'))
        ) {
          isBooking = true
        }
      }

      // Also check string messages
      if (typeof e.data === 'string') {
        const lowerData = e.data.toLowerCase()
        if (
          lowerData.includes('booking') ||
          lowerData.includes('appointment') ||
          lowerData.includes('scheduled') ||
          lowerData.includes('confirmed')
        ) {
          console.log('🔍 Possible booking message (string):', e.data)
          isBooking = true
        }
      }

      if (isBooking && window.fbq) {
        console.log('✅ Contractor booking detected!')

        // Track with browser pixel
        window.fbq('track', 'CompleteRegistration', {
          content_name: 'Contractor Booking',
          content_category: 'Contractor Consultation',
          currency: 'USD',
          value: 0,
        })

        window.fbq('track', 'Lead', {
          content_name: 'Contractor Consultation Booking',
          content_category: 'Free Contractor Consultation',
        })

        window.fbq('trackCustom', 'ContractorBookingComplete', {
          content_name: 'Contractor Booking',
          content_category: 'Contractor Consultation',
          currency: 'USD',
          value: 0,
        })

        console.log('✅ Contractor booking events sent to Facebook Pixel (4230021860577001)')

        // ALSO send via Conversions API (Offline Conversion) for better reliability
        trackContractorBooking({
          content_name: 'Contractor Booking',
          content_category: 'Contractor Consultation',
        }).then(() => {
          console.log('✅ Offline conversion sent via Conversions API')
        })
      }
    }

    window.addEventListener('message', handleBookingComplete)

    // Add to window for testing
    if (typeof window !== 'undefined') {
      ;(window as any).testContractorPixel = () => {
        console.log('🧪 Manual pixel test triggered')
        if (window.fbq) {
          window.fbq('track', 'CompleteRegistration', {
            content_name: 'TEST Contractor Booking',
            content_category: 'Contractor Consultation',
            currency: 'USD',
            value: 0,
          })
          console.log('✅ Test event sent to Facebook Pixel (4230021860577001)')
          alert('Test event sent! Check Meta Events Manager.')
        } else {
          console.error('❌ Facebook Pixel not loaded')
          alert('Facebook Pixel not loaded!')
        }
      }

      // Add offline conversion test
      ;(window as any).testOfflineConversion = () => {
        testOfflineConversion('4230021860577001')
      }
    }

    // Check if GHL script provides callbacks
    const checkGHLCallback = setInterval(() => {
      if ((window as any).leadConnectorBooking) {
        console.log('✅ GHL booking object found')
        clearInterval(checkGHLCallback)

        // Hook into GHL's callback if available
        const originalCallback = (window as any).leadConnectorBooking.onComplete
        ;(window as any).leadConnectorBooking.onComplete = function (...args: any[]) {
          console.log('✅ GHL callback triggered:', args)

          // Track with Facebook Pixel
          if (window.fbq) {
            window.fbq('track', 'CompleteRegistration', {
              content_name: 'Contractor Booking',
              content_category: 'Contractor Consultation',
              currency: 'USD',
              value: 0,
            })
          }

          // Call original callback if exists
          if (originalCallback) originalCallback.apply(this, args)
        }
      }
    }, 500)

    // Cleanup after 10 seconds
    setTimeout(() => clearInterval(checkGHLCallback), 10000)

    // Track iframe load
    const iframe = document.getElementById('MseWjwAf3rDlJRoj1p75_booking_widget_contractor')
    if (iframe) {
      iframe.addEventListener('load', () => {
        console.log('✅ LeadConnector iframe loaded successfully')
      })
    }

    // Testing instructions
    console.log('🧪 Testing commands available:')
    console.log('  - testContractorPixel() - Manually test Facebook Pixel (browser)')
    console.log('  - testOfflineConversion() - Test Conversions API (server-side)')
    console.log('  - Check console for all postMessage events after booking')

    // Cleanup
    return () => {
      window.removeEventListener('message', handleBookingComplete)
      window.removeEventListener('message', debugAllMessages)
      clearInterval(checkGHLCallback)
    }
  }, [])

  const handleGetStarted = () => {
    bookingFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const contractorTypes = [
    'General Contractors',
    'Home Builders',
    'Remodeling Contractors',
    'Roofing Contractors',
    'Plumbing Companies',
    'Electrical Contractors',
    'HVAC Companies',
    'Landscaping Contractors',
    'Painting Contractors',
    'Concrete & Masonry',
  ]

  const benefits = [
    'A free homepage mockup/design before paying a penny',
    'Mobile-friendly design that works on all devices',
    'Project gallery to showcase your best work',
    'Lead capture forms to get more inquiries',
    'Fast 1-3 week turnaround time',
    'Local SEO to rank in your service area',
    'Easy-to-update content management',
    'Professional hosting included',
  ]

  const contractorPainPoints = [
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      title: 'Get More Leads',
      description:
        'Stop relying on word-of-mouth alone. A professional website helps potential clients find you 24/7 and generates qualified leads while you sleep.',
    },
    {
      icon: <Star className="w-8 h-8 text-blue-600" />,
      title: 'Stand Out From Competition',
      description:
        'Most contractors have outdated or no websites. A modern, professional site immediately sets you apart and builds trust with homeowners.',
    },
    {
      icon: <CheckCircle2 className="w-8 h-8 text-blue-600" />,
      title: 'Showcase Your Work',
      description:
        'Display your best projects with before/after photos, testimonials, and detailed case studies that prove your quality and expertise.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-white">
      {/* Facebook Pixel noscript fallback for contractors */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=4230021860577001&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-300 rounded-full blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-300 rounded-full blur-3xl opacity-30 animate-float animation-delay-2000"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-50 to-blue-50 px-4 py-2 rounded-full mb-6 animate-fade-in-down border border-orange-100">
                <HardHat className="w-5 h-5 text-orange-600" />
                <span className="text-orange-800 font-semibold">
                  For Contractors & Home Service Pros
                </span>
              </div>
              <h1 className="heading-lg mb-8 leading-tight animate-fade-in-up">
                GET A{' '}
                <span className="text-gradient-blue relative animate-glow-pulse inline-block px-2 font-extrabold">
                  FREE
                </span>{' '}
                WEBSITE DESIGN FOR YOUR CONTRACTING BUSINESS
              </h1>
              <p className="text-2xl md:text-3xl mb-8 text-gray-800 font-semibold leading-relaxed animate-fade-in-up delay-100">
                We'll design your contractor website for FREE. If you like it, you can buy it. If
                not, no harm done!
              </p>
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-6 mb-6 animate-fade-in-up delay-200">
                <div className="flex items-start gap-4">
                  <Hammer className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <p className="text-lg font-bold text-gray-900 mb-2">
                      Perfect for contractors who need:
                    </p>
                    <ul className="space-y-1 text-gray-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>More leads and project inquiries</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>A portfolio to showcase their work</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>Professional online presence</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-xl font-bold mb-6 text-red-600 bg-red-50 inline-block px-6 py-3 rounded-full border-2 border-red-200 animate-fade-in-up delay-200">
                Free design mockup — no payment until you love it
              </p>
              <button
                onClick={handleGetStarted}
                className="group bg-gradient-blue-purple text-white text-2xl font-bold py-5 px-10 rounded-full hover:shadow-2xl transition-smooth transform hover:scale-110 flex items-center mx-auto md:mx-0 relative overflow-hidden animate-gradient-shift animate-glow-pulse"
              >
                <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
                <div className="absolute right-4 w-10 h-10 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              <div className="flex justify-center md:justify-start mt-6 gap-1 animate-fade-in-up delay-300">
                {[1, 2, 3, 4, 5].map((_, index) => (
                  <Star
                    key={index}
                    className={`w-6 h-6 text-yellow-400 fill-yellow-400 animate-scale-in delay-${(index + 3) * 100}`}
                  />
                ))}
              </div>
              <p className="text-gray-700 mt-3 font-semibold text-lg animate-fade-in-up delay-400">
                ⭐ Rated 5.0 / 5 on Google by Contractors Like You!
              </p>
            </div>
            <div className="video-container relative rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-smooth duration-500 border-4 border-blue-200 hover:border-purple-300 animate-fade-in-right">
              <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                <iframe
                  src="https://player.vimeo.com/video/1148381897?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  title="Ace Winter"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Contractors Need a Website Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(249,115,22,0.05),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="heading-xl text-gradient-blue text-center mb-16 animate-fade-in-up">
            WHY CONTRACTORS NEED A PROFESSIONAL WEBSITE
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {contractorPainPoints.map((point, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-smooth hover-lift border-2 border-blue-100 animate-fade-in-up delay-${index * 100}`}
              >
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-levitate">
                  {point.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{point.title}</h3>
                <p className="text-gray-700 leading-relaxed text-lg">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contractor Examples Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(147,51,234,0.05),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="heading-xl text-gradient-blue text-center mb-16 animate-fade-in-up">
            CONTRACTOR WEBSITES WE'VE BUILT
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Dunn Construction - Featured */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-smooth hover-lift duration-300 border-2 border-gray-100 animate-fade-in-up md:col-span-2">
              <img
                src="https://i.ibb.co/S1Yv7K9/dunn-consturction-gif.gif"
                alt="Dunn Construction Website Example"
                className="w-full h-72 object-cover hover:scale-110 transition-smooth duration-500"
              />
              <div className="p-8">
                <p className="text-center font-bold text-xl text-gray-900">
                  Dunn Construction - Happy Client
                </p>
              </div>
            </div>

            {/* Additional contractor testimonial */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-smooth hover-lift duration-300 border-2 border-gray-100 animate-fade-in-up delay-100">
              <div className="p-8 h-full flex flex-col justify-center">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Wrench className="w-10 h-10 text-orange-600" />
                </div>
                <div className="flex justify-center mb-4 gap-1">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Star key={index} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-center text-base italic mb-6 text-gray-700 leading-relaxed">
                  "As a small plumbing contractor, I needed a way to compete with bigger companies.
                  This website has been a game-changer for getting new customers online."
                </p>
                <p className="text-center font-bold text-lg text-gray-900">
                  Mike S. - Local Plumbing Contractor
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 via-blue-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.05),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-5 gap-12 items-center">
            <div className="md:col-span-2 animate-fade-in-left">
              <img
                src="/rhyan.jpg"
                alt="Web Designers"
                className="rounded-3xl shadow-2xl object-cover w-full aspect-[3/4] hover:shadow-2xl transition-smooth duration-500 transform hover:scale-105 border-4 border-white hover-lift"
              />
            </div>
            <div className="md:col-span-3 animate-fade-in-right">
              <h2 className="heading-md mb-6 text-gray-900">
                👋 Hey We're Rhyan & Valerie... We Help Contractors Get More Business Online!
              </h2>
              <p className="text-xl mb-5 bg-gradient-to-r from-orange-100 to-yellow-100 p-4 rounded-2xl text-orange-900 font-semibold border border-orange-200 shadow-sm">
                We know contractors are busy running their business. That's why we make getting a
                website EASY.
              </p>
              <p className="text-lg mb-5 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-2xl text-blue-900 leading-relaxed border border-blue-200 shadow-sm">
                Most contractors lose jobs to competitors simply because they don't have a
                professional online presence. Homeowners search online first, and if they can't find
                you or your website looks outdated, they'll call someone else.
              </p>
              <p className="text-lg mb-8 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-2xl text-blue-900 leading-relaxed border border-blue-200 shadow-sm">
                We've helped dozens of contractors get professional websites that showcase their
                work, build trust, and generate leads 24/7.
              </p>
              <div className="font-bold text-2xl mb-6 text-gradient-blue">
                We build websites for contractors including...
              </div>
              <div className="grid grid-cols-2 gap-3 mb-10">
                {contractorTypes.map((type, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 group hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 p-3 rounded-xl transition-smooth hover-lift border border-transparent hover:border-orange-200 animate-fade-in-up delay-${index * 50}`}
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-600 group-hover:scale-125 transition-smooth" />
                    <span className="font-semibold text-gray-800">{type}</span>
                  </div>
                ))}
              </div>
              <p className="text-xl mb-10 text-gray-700 leading-relaxed font-semibold">
                Simply book a quick 15-minute call below, tell us about your contracting business,
                and we'll have your free design ready within 48 hours.
              </p>
              <div className="text-center bg-gradient-to-br from-orange-50 to-yellow-50 p-8 rounded-3xl border-2 border-orange-200 shadow-xl">
                <p className="text-xl font-bold mb-6 text-red-600 bg-red-50 inline-block px-6 py-3 rounded-full border-2 border-red-200">
                  Free design mockup — no payment until you love it
                </p>
                <button
                  onClick={handleGetStarted}
                  className="bg-gradient-blue-purple text-white text-2xl font-bold py-5 px-10 rounded-full hover:shadow-2xl transition-smooth transform hover:scale-110 flex items-center justify-center mx-auto relative overflow-hidden animate-gradient-shift animate-glow-pulse"
                >
                  <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
                  <div className="absolute right-4 w-10 h-10 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <div className="flex justify-center mt-6 gap-1">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Star key={index} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mt-3 font-semibold text-lg">
                  ⭐ Rated 5.0 / 5 on Google!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="heading-xl text-gradient-blue text-center mb-16 animate-fade-in-up">
            WHAT YOUR CONTRACTOR WEBSITE INCLUDES...
          </h2>
          <div className="max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`flex items-center gap-5 bg-gradient-to-r from-white to-green-50 shadow-xl rounded-2xl p-6 mb-5 transform transition-smooth hover:shadow-2xl hover-lift hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 border-2 border-green-100 animate-fade-in-up delay-${index * 100}`}
              >
                <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0 animate-levitate" />
                <p className="text-xl font-semibold text-gray-800 leading-relaxed">{benefit}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <p className="text-xl font-bold mb-6 text-red-600 bg-red-50 inline-block px-6 py-3 rounded-full border-2 border-red-200">
              Free design mockup — no payment until you love it
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-gradient-blue-purple text-white text-2xl font-bold py-5 px-10 rounded-full hover:shadow-2xl transition-smooth transform hover:scale-110 flex items-center justify-center mx-auto relative overflow-hidden animate-gradient-shift animate-glow-pulse"
            >
              <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
              <div className="absolute right-4 w-10 h-10 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section
        ref={bookingFormRef}
        className="py-20 bg-gradient-to-b from-blue-50 via-purple-50 to-blue-50 scroll-mt-24 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="heading-xl text-gradient-blue text-center mb-8 animate-fade-in-up">
            BOOK YOUR FREE DESIGN CONSULTATION
          </h2>
          <p className="text-xl text-center mb-12 text-gray-700 font-semibold animate-fade-in-up delay-100">
            Schedule a quick 15-minute call to discuss your contracting business and get your free
            website design!
          </p>

          <div
            className="bg-white rounded-3xl shadow-2xl p-4 md:p-10 animate-glow-pulse border-2 border-blue-200 animate-scale-in"
            id="landing-contractors-form-container"
          >
            {/* LeadConnector booking widget */}
            <iframe
              src="https://api.leadconnectorhq.com/widget/booking/MseWjwAf3rDlJRoj1p75"
              style={{ width: '100%', border: 'none', overflow: 'hidden', minHeight: '700px' }}
              scrolling="no"
              id="MseWjwAf3rDlJRoj1p75_booking_widget_contractor"
              title="Book Consultation"
            />
          </div>

          {/* Respectful meeting reminder */}
          <div className="mt-8 text-center">
            <p className="text-base text-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border-l-4 border-blue-500 shadow-lg">
              <strong className="text-blue-700">Please show up!</strong> We're real people who block
              time for you. Thanks!
            </p>
          </div>
        </div>
      </section>

      {/* Hidden element for URL-based custom conversion tracking */}
      <div
        id="landing-contractors-conversion-tracker"
        style={{ display: 'none' }}
        data-conversion-type="free_design_contractors"
      ></div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4">
          {/* Main Footer */}
          <div className="py-12 grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex flex-col items-start mb-4">
                <div className="flex items-center">
                  <span className="text-xl font-bold tracking-tight">ACE</span>
                  <MousePointer2
                    className="w-4 h-4 ml-0.5"
                    style={{ marginTop: '-2px' }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-sm text-gray-400" style={{ marginTop: '-4px' }}>
                  Web Designers
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Based in Leominster, MA, serving contractors nationwide. Professional web design
                services helping contractors across America build their online presence and get more
                leads.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="mailto:support@acewebdesigners.com"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    support@acewebdesigners.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+17743151951"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    (774) 315-1951
                  </a>
                </li>
                <li className="text-gray-400">Based in Leominster, MA • Serving Nationwide</li>
              </ul>
            </div>
          </div>

          {/* Privacy Policy and Copyright */}
          <div className="py-6 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} Ace Web Designers. All rights reserved.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setShowTermsOfService(true)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowPrivacyPolicy(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-sm text-gray-600 mb-6">Last updated: January 14, 2026</p>
            
            <div className="space-y-6 text-gray-700">
              <p>
                Ace Web Designers ("we," "us," or "our") values your privacy. This Privacy Policy explains how we collect, use, and protect your information.
              </p>

              <div>
                <h2 className="text-xl font-bold mb-2">Information We Collect</h2>
                <p>We may collect:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Business information</li>
                  <li>Any information you submit through forms or calendars</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">How We Use Your Information</h2>
                <p>We use your information to:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Contact you regarding your inquiry or services</li>
                  <li>Schedule and confirm appointments</li>
                  <li>Provide customer support</li>
                  <li>Send service-related messages</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">SMS & A2P Compliance</h2>
                <p>If you provide your phone number, you agree to receive SMS messages from Ace Web Designers related to your inquiry or services.</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Message frequency varies</li>
                  <li>Message & data rates may apply</li>
                  <li>You may opt out anytime by replying STOP</li>
                  <li>Reply HELP for assistance</li>
                </ul>
                <p className="mt-2">We do not sell or share your phone number with third parties for marketing purposes.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Data Sharing</h2>
                <p>
                  We may share information only with trusted service providers (such as scheduling, CRM, or messaging platforms) strictly to operate our business.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Data Security</h2>
                <p>
                  We take reasonable steps to protect your personal information from unauthorized access or disclosure.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Your Rights</h2>
                <p>
                  You may request access, correction, or deletion of your personal data by contacting us.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Contact Information</h2>
                <p>
                  Ace Web Designers<br />
                  Massachusetts, USA<br />
                  Phone: +1 (774) 315-1951<br />
                  Email: hello@acewebdesigners.com
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowTermsOfService(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
            <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
            <p className="text-sm text-gray-600 mb-6">Last updated: January 14, 2026</p>
            
            <div className="space-y-6 text-gray-700">
              <p>
                Welcome to Ace Web Designers ("Company," "we," "us," or "our"). By accessing our website or submitting your information, you agree to these Terms of Service.
              </p>

              <div>
                <h2 className="text-xl font-bold mb-2">Services</h2>
                <p>
                  We provide web design, landing pages, marketing automation, and related digital services for businesses. Any free or paid services are provided as described on our website or during consultation.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Communication Consent</h2>
                <p>
                  By submitting your phone number and/or email address on our website, booking calendar, or forms, you consent to receive communications from Ace Web Designers, including:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Appointment confirmations and reminders</li>
                  <li>Follow-up messages related to your inquiry</li>
                  <li>Service updates or relevant business communications</li>
                </ul>
                <p className="mt-2">
                  Message frequency varies. Message and data rates may apply.
                </p>
                <p className="mt-2">
                  You can opt out at any time by replying STOP to any text message. For help, reply HELP or contact us directly.
                </p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm">
                    <strong>SMS Opt-Out:</strong> You may receive SMS messages from Ace Web Designers at +1 (774) 315-1951. Reply STOP to opt out. Message & data rates may apply.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">No Guarantee of Results</h2>
                <p>
                  We do not guarantee specific business results, rankings, revenue, or performance unless explicitly stated in writing.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Intellectual Property</h2>
                <p>
                  All website designs, content, graphics, and materials created by us remain our property until paid in full, unless otherwise agreed.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Limitation of Liability</h2>
                <p>
                  We are not liable for indirect, incidental, or consequential damages arising from the use of our services or website.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Governing Law</h2>
                <p>
                  These terms are governed by the laws of the Commonwealth of Massachusetts, United States.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Contact</h2>
                <p>
                  Ace Web Designers<br />
                  Massachusetts, USA<br />
                  Phone: +1 (774) 315-1951<br />
                  Email: hello@acewebdesigners.com
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingContractors
