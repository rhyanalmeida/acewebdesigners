import React from 'react'
import { MousePointer2 } from 'lucide-react'

function TermsOfService() {
  React.useEffect(() => {
    document.title = 'Terms of Service | Ace Web Designers'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex flex-col items-start"
          >
            <div className="flex items-center">
              <span className="text-2xl font-bold tracking-tight">ACE</span>
              <MousePointer2 className="w-5 h-5 ml-0.5" style={{ marginTop: '-2px' }} />
            </div>
            <span className="text-sm font-medium" style={{ marginTop: '-4px' }}>
              Web Designers
            </span>
          </button>
        </nav>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Terms of Service</h1>
        <p className="text-gray-600 mb-12">Last updated: January 14, 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <p className="text-lg">
            Welcome to Ace Web Designers ("Company," "we," "us," or "our"). By accessing our
            website or submitting your information, you agree to these Terms of Service.
          </p>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Services</h2>
            <p>
              We provide web design, landing pages, marketing automation, and related digital
              services for businesses. Any free or paid services are provided as described on our
              website or during consultation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Communication Consent</h2>
            <p className="mb-4">
              By submitting your phone number and/or email address on our website, booking calendar,
              or forms, you consent to receive communications from Ace Web Designers, including:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Appointment confirmations and reminders</li>
              <li>Follow-up messages related to your inquiry</li>
              <li>Service updates or relevant business communications</li>
            </ul>
            <p className="mb-4">
              Message frequency varies. Message and data rates may apply.
            </p>
            <p className="mb-4">
              You can opt out at any time by replying STOP to any text message. For help, reply HELP
              or contact us directly.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
              <p className="font-semibold text-gray-900">SMS Opt-Out Notice:</p>
              <p className="mt-2">
                You may receive SMS messages from Ace Web Designers at{' '}
                <a href="tel:+17743151951" className="text-blue-600 hover:underline font-semibold">
                  +1 (774) 315-1951
                </a>
                . Reply <strong>STOP</strong> to opt out. Message & data rates may apply.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">No Guarantee of Results</h2>
            <p>
              We do not guarantee specific business results, rankings, revenue, or performance unless
              explicitly stated in writing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Intellectual Property</h2>
            <p>
              All website designs, content, graphics, and materials created by us remain our property
              until paid in full, unless otherwise agreed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Limitation of Liability</h2>
            <p>
              We are not liable for indirect, incidental, or consequential damages arising from the
              use of our services or website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Governing Law</h2>
            <p>
              These terms are governed by the laws of the Commonwealth of Massachusetts, United
              States.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Contact</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">Ace Web Designers</p>
              <p>Massachusetts, USA</p>
              <p>
                Phone:{' '}
                <a href="tel:+17743151951" className="text-blue-600 hover:underline">
                  +1 (774) 315-1951
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
                onClick={() => (window.location.href = '/privacypolicy')}
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
