import React, { useRef, useEffect } from 'react'
import { CheckCircle2, Star, MousePointer2 } from 'lucide-react'
import { trackMainLandingBooking, testOfflineConversion } from './utils/facebookConversions'

function Landing() {
  const bookingFormRef = useRef(null)

  useEffect(() => {
    document.title = 'Free Website Design for Your Business | Limited Time Offer'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Get a free website design for your business. No obligation, no hidden fees. Limited time offer - only 10 spots available!'
      )
    }

    // Set a URL parameter that can be tracked
    const urlParams = new URLSearchParams(window.location.search)
    if (!urlParams.has('source')) {
      urlParams.append('source', 'landing')
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`
      window.history.replaceState({}, '', newUrl)
    }

    // Track main landing page view with main pixel (1703925480259996)
    // This pixel is already loaded from index.html
    if (window.fbq) {
      // Track ViewContent event (standard event for landing pages)
      window.fbq('track', 'ViewContent', {
        content_name: 'Main Landing Page',
        content_category: 'Landing Page',
        content_type: 'general_services',
      })

      // Track custom event for main landing tracking
      window.fbq('trackCustom', 'MainLandingView', {
        page: 'main_landing',
        source: urlParams.get('source') || 'direct',
      })

      console.log('✅ Main Facebook Pixel (1703925480259996): Landing page view tracked')
    }

    console.log('✅ LeadConnector booking widget loaded on Main Landing page')

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
        console.log('✅ Main Landing booking detected!')

        // Track with browser pixel
        window.fbq('track', 'CompleteRegistration', {
          content_name: 'Main Landing Booking',
          content_category: 'Website Consultation',
          currency: 'USD',
          value: 0,
        })

        window.fbq('track', 'Lead', {
          content_name: 'Website Consultation Booking',
          content_category: 'Free Design Consultation',
        })

        window.fbq('trackCustom', 'MainLandingBookingComplete', {
          content_name: 'Main Landing Booking',
          content_category: 'Website Consultation',
          currency: 'USD',
          value: 0,
        })

        console.log('✅ Main landing booking events sent to Facebook Pixel (1703925480259996)')

        // ALSO send via Conversions API (Offline Conversion) for better reliability
        trackMainLandingBooking({
          content_name: 'Main Landing Booking',
          content_category: 'Website Consultation',
        }).then(() => {
          console.log('✅ Offline conversion sent via Conversions API')
        })
      }
    }

    window.addEventListener('message', handleBookingComplete)

    // Add to window for testing
    if (typeof window !== 'undefined') {
      ;(window as any).testMainPixel = () => {
        console.log('🧪 Manual pixel test triggered')
        if (window.fbq) {
          window.fbq('track', 'CompleteRegistration', {
            content_name: 'TEST Main Landing Booking',
            content_category: 'Website Consultation',
            currency: 'USD',
            value: 0,
          })
          console.log('✅ Test event sent to Facebook Pixel (1703925480259996)')
          alert('Test event sent! Check Meta Events Manager.')
        } else {
          console.error('❌ Facebook Pixel not loaded')
          alert('Facebook Pixel not loaded!')
        }
      }

      // Add offline conversion test
      ;(window as any).testMainOfflineConversion = () => {
        testOfflineConversion('1703925480259996')
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
              content_name: 'Main Landing Booking',
              content_category: 'Website Consultation',
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
    const iframe = document.getElementById('MseWjwAf3rDlJRoj1p75_1768499231909')
    if (iframe) {
      iframe.addEventListener('load', () => {
        console.log('✅ LeadConnector iframe loaded successfully')
      })
    }

    // Testing instructions
    console.log('🧪 Testing commands available:')
    console.log('  - testMainPixel() - Manually test Facebook Pixel (browser)')
    console.log('  - testMainOfflineConversion() - Test Conversions API (server-side)')
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

  const industries = [
    'Landscaping',
    'Construction',
    'Plumbing',
    'Electricians',
    'Restaurants',
    'Retail Stores',
    'Professional Services',
    'Healthcare Providers',
    'Fitness Centers',
    '+ many more',
  ]

  const benefits = [
    'A free homepage mockup/design before paying a penny',
    'Professional hosting packages available',
    'Websites delivered within 1-3 weeks',
    'Basic SEO implemented in every website',
    'Ongoing SEO and local rankings available',
    'Ongoing support and website updates available',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-300 rounded-full blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-300 rounded-full blur-3xl opacity-30 animate-float animation-delay-2000"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h1 className="heading-lg mb-8 leading-tight animate-fade-in-up">
                GET A{' '}
                <span className="text-gradient-blue relative animate-glow-pulse inline-block px-2 font-extrabold">
                  FREE
                </span>{' '}
                WEBSITE DESIGN FOR YOUR BUSINESS
              </h1>
              <p className="text-2xl md:text-3xl mb-8 text-gray-800 font-semibold leading-relaxed animate-fade-in-up delay-100">
                We'll design your website for FREE. If you like it, you can buy it. If not, no harm
                done!
              </p>
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
                ⭐ Rated 5.0 / 5 on Google!
              </p>
            </div>
            <div className="video-container relative rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-smooth duration-500 border-4 border-blue-200 hover:border-purple-300 animate-fade-in-right">
              <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                <iframe
                  src="https://player.vimeo.com/video/1088261551?h=a19a5e95f4&badge=0&autopause=0&player_id=0&app_id=58479"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  title="Free Preview Rhyan 1 - 526"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(147,51,234,0.05),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="heading-xl text-gradient-blue text-center mb-16 animate-fade-in-up">
            SEE EXAMPLES...
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Example 1 */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-smooth hover-lift duration-300 border-2 border-gray-100 animate-fade-in-up">
              <img
                src="https://i.ibb.co/r2g1Q1Qp/hotpotonegif.gif"
                alt="Hot Pot One Website Example"
                className="w-full h-56 object-cover hover:scale-110 transition-smooth duration-500"
              />
              <div className="p-8">
                <div className="flex justify-center mb-4 gap-1">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Star key={index} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-center text-base italic mb-6 text-gray-700 leading-relaxed">
                  "Ace Web Designers created an amazing website for our restaurant. The ordering
                  system works flawlessly and we've seen a significant increase in online orders."
                </p>
                <p className="text-center font-bold text-lg text-gray-900">
                  Hot Pot One - Restaurant
                </p>
              </div>
            </div>

            {/* Example 2 */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-smooth hover-lift duration-300 border-2 border-gray-100 animate-fade-in-up delay-100">
              <img
                src="https://i.ibb.co/Myx4nrSr/concuo-gif.gif"
                alt="Conuco Takeout Website Example"
                className="w-full h-56 object-cover hover:scale-110 transition-smooth duration-500"
              />
              <div className="p-8">
                <div className="flex justify-center mb-4 gap-1">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Star key={index} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-center text-base italic mb-6 text-gray-700 leading-relaxed">
                  "The team at Ace Web Designers understood exactly what we needed. Our Dominican
                  cuisine is now beautifully showcased online, and customers love ordering through
                  our website."
                </p>
                <p className="text-center font-bold text-lg text-gray-900">
                  Conuco Takeout - Restaurant
                </p>
              </div>
            </div>

            {/* Example 3 */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-smooth hover-lift duration-300 border-2 border-gray-100 animate-fade-in-up delay-200">
              <img
                src="https://i.ibb.co/S1Yv7K9/dunn-consturction-gif.gif"
                alt="Dunn Construction Website Example"
                className="w-full h-56 object-cover hover:scale-110 transition-smooth duration-500"
              />
              <div className="p-8">
                <div className="flex justify-center mb-4 gap-1">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Star key={index} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-center text-base italic mb-6 text-gray-700 leading-relaxed">
                  "We were recommended to Rhyan and Valerie by a friend. Within days, we had a
                  professional website that perfectly represented our construction business. We're
                  already getting more leads!"
                </p>
                <p className="text-center font-bold text-lg text-gray-900">Dunn Construction</p>
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
                👋 Hey We're Rhyan & Valerie... Web designers at Ace Web Designers!
              </h2>
              <p className="text-xl mb-5 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-2xl text-blue-900 font-semibold border border-blue-200 shadow-sm">
                Our goal is to help make sure you don't overpay on a new website.
              </p>
              <p className="text-lg mb-5 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-2xl text-blue-900 leading-relaxed border border-blue-200 shadow-sm">
                Of course a nice looking website is hugely important when it comes to growing your
                business, getting more leads, and having somewhere to showcase all of your work.
              </p>
              <p className="text-lg mb-8 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-2xl text-blue-900 leading-relaxed border border-blue-200 shadow-sm">
                But that doesn't mean that you need to spend thousands and thousands of dollars with
                an expensive agency.
              </p>
              <p className="text-lg mb-5 text-gray-700 leading-relaxed">
                Here at Ace Web Designers, we specialize in fast and affordable websites for
                businesses of all types.
              </p>
              <p className="text-lg mb-8 text-gray-700 leading-relaxed font-semibold">
                We build websites that turn clicks into customers, but also we don't charge an arm
                and a leg for it.
              </p>
              <p className="text-lg mb-8 text-gray-700 leading-relaxed">
                So if you are looking for an affordable website for your business, book in a call
                below and we will do you a free design.
              </p>
              <div className="font-bold text-2xl mb-6 text-gradient-blue">
                We build websites for...
              </div>
              <div className="grid grid-cols-2 gap-3 mb-10">
                {industries.map((industry, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-3 rounded-xl transition-smooth hover-lift border border-transparent hover:border-blue-200 animate-fade-in-up delay-${index * 50}`}
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-600 group-hover:scale-125 transition-smooth" />
                    <span className="font-semibold text-gray-800">{industry}</span>
                  </div>
                ))}
              </div>
              <p className="text-xl mb-10 text-gray-700 leading-relaxed font-semibold">
                Simply book in a quick phone call below, let us know what you want and we'll have
                your design ready within 48 hours.
              </p>
              <div className="text-center bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-3xl border-2 border-blue-200 shadow-xl">
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
            WHAT YOU GET WITH OUR WEBSITES...
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
            Schedule a time to discuss your website needs and get your free design!
          </p>

          <div
            className="bg-white rounded-3xl shadow-2xl p-4 md:p-10 animate-glow-pulse border-2 border-blue-200 animate-scale-in"
            id="landing-form-container"
          >
            {/* LeadConnector booking widget */}
            <iframe
              src="https://api.leadconnectorhq.com/widget/booking/MseWjwAf3rDlJRoj1p75"
              style={{ width: '100%', border: 'none', overflow: 'hidden', minHeight: '800px', height: '100%' }}
              scrolling="no"
              id="MseWjwAf3rDlJRoj1p75_1768499231909"
              title="Book Consultation"
              allow="payment"
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
        id="landing-conversion-tracker"
        style={{ display: 'none' }}
        data-conversion-type="free_design_landing"
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
                Based in Leominster, MA, serving small businesses nationwide. Professional web
                design and development services helping small business owners across America build
                their online presence.
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
                  onClick={() => {
                    // Navigate to main site privacy policy
                    window.location.href = '/privacy'
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
