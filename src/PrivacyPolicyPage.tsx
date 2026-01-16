import React from 'react'
import { MousePointer2 } from 'lucide-react'

function PrivacyPolicyPage() {
  React.useEffect(() => {
    document.title = 'Privacy Policy | Ace Web Designers'
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
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Privacy Policy</h1>
        <p className="text-gray-600 mb-12">Last updated: January 14, 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <p className="text-lg">
            Ace Web Designers ("we," "us," or "our") values your privacy. This Privacy Policy
            explains how we collect, use, and protect your information.
          </p>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Information We Collect</h2>
            <p className="mb-4">We may collect:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Business information</li>
              <li>Any information you submit through forms or calendars</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Contact you regarding your inquiry or services</li>
              <li>Schedule and confirm appointments</li>
              <li>Provide customer support</li>
              <li>Send service-related messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">SMS & A2P Compliance</h2>
            <p className="mb-4">
              If you provide your phone number and opt in via the SMS consent checkbox, you agree to receive SMS messages from Ace Web Designers related to your inquiry, appointment confirmations, reminders, and rescheduling.
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Message frequency varies</li>
              <li>Message & data rates may apply</li>
              <li>You may opt out at any time by replying STOP</li>
              <li>Reply HELP for assistance</li>
            </ul>
            <p className="mb-4">
              We do not sell or share your phone number with third parties for marketing purposes. Consent is not a condition of purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Data Sharing</h2>
            <p className="mb-4">
              We may share information only with trusted service providers (such as scheduling, CRM,
              or messaging platforms) strictly to operate our business.
            </p>
            <p>
              We use GoHighLevel and messaging providers to send appointment-related communications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Data Security</h2>
            <p>
              We take reasonable steps to protect your personal information from unauthorized access
              or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Your Rights</h2>
            <p>
              You may request access, correction, or deletion of your personal data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Contact Information</h2>
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

export default PrivacyPolicyPage
