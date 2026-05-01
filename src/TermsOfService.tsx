import React from 'react'
import { MousePointer2 } from 'lucide-react'
import { SeoMeta } from './seo'

function TermsOfService() {
  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900">
      <SeoMeta path="/termsofservice" />
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-md border-b border-surface-200">
        <nav className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex flex-col items-start ring-focus-brand rounded-lg"
            aria-label="Go to homepage"
          >
            <div className="flex items-center">
              <span className="text-2xl font-bold tracking-tight font-display">ACE</span>
              <MousePointer2 className="w-5 h-5 ml-0.5 -mt-[2px]" aria-hidden />
            </div>
            <span className="text-sm font-medium text-surface-600 -mt-1">
              Web Designers
            </span>
          </button>
        </nav>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-surface-900">Terms of Service</h1>
        <p className="mt-3 text-surface-500">Last updated: January 16, 2026</p>

        <div className="mt-12 space-y-8 text-surface-700 leading-relaxed">
          <p className="text-lg">
            Welcome to Ace Web Designers ("Company," "we," "us," or "our"). By accessing our
            website or submitting your information, you agree to these Terms of Service.
          </p>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-surface-900 font-display">Services</h2>
            <p>
              We provide web design, landing pages, marketing automation, and related digital
              services for businesses. Any free or paid services are provided as described on our
              website or during consultation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-surface-900 font-display">Communication Consent</h2>
            <p className="mb-4">
              By submitting your information and <strong>opting in via the SMS consent checkbox</strong> on our website, booking calendar, or forms, you consent to receive communications from <strong>Ace Web Designers</strong>, including:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Appointment confirmations and reminders</li>
              <li>Follow-up messages related to your inquiry and scheduled appointment</li>
              <li>Rescheduling and appointment support messages</li>
            </ul>
            <p className="mb-4">
              Message frequency varies. Message & data rates may apply. <strong>Consent is not a condition of purchase.</strong>
            </p>
            <p className="mb-4">
              You can opt out at any time by replying <strong>STOP</strong> to any text message. For help, reply <strong>HELP</strong> or contact us directly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-surface-900 font-display">SMS Opt-Out Notice</h2>
            <p className="mb-4">
              You may receive SMS messages from <strong>Ace Web Designers</strong> at{' '}
              <a href="tel:+17743151951" className="text-blue-600 hover:underline font-semibold">
                <strong>+1 (774) 315-1951</strong>
              </a>
              . Reply <strong>STOP</strong> to opt out. Reply <strong>HELP</strong> for help. Message & data rates may apply.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-surface-900 font-display">No Guarantee of Results</h2>
            <p>
              We do not guarantee specific business results, rankings, revenue, or performance unless
              explicitly stated in writing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-surface-900 font-display">Intellectual Property</h2>
            <p>
              All website designs, content, graphics, and materials created by us remain our property
              until paid in full, unless otherwise agreed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-surface-900 font-display">Limitation of Liability</h2>
            <p>
              We are not liable for indirect, incidental, or consequential damages arising from the
              use of our services or website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-surface-900 font-display">Governing Law</h2>
            <p>
              These terms are governed by the laws of the Commonwealth of Massachusetts, United
              States.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-surface-900 font-display">Contact</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="font-semibold text-surface-900 font-display mb-2">Ace Web Designers</p>
              <p>Massachusetts, USA</p>
              <p>
                Phone:{' '}
                <a href="tel:+17744467375" className="text-blue-600 hover:underline">
                  +1 (774) 446-7375
                </a>
              </p>
              <p>
                Email:{' '}
                <a href="mailto:hello@acewebdesigners.com" className="text-blue-600 hover:underline">
                  hello@acewebdesigners.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <button
            onClick={() => (window.location.href = '/')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Ace Web Designers. All rights reserved.</p>
            <div className="mt-4 space-x-4">
              <button
                onClick={() => (window.location.href = '/privacy')}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => (window.location.href = '/termsofservice')}
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TermsOfService
