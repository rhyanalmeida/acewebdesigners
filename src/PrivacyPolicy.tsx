import React from 'react'
import { Shield, Mail, Phone, MapPin } from 'lucide-react'

function PrivacyPolicy() {
  React.useEffect(() => {
    document.title = 'Privacy Policy | Ace Web Designers'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Privacy Policy for Ace Web Designers. Learn how we collect, use, and protect your personal information when you use our web design services.'
      )
    }
  }, [])

  return (
    <div className="pt-24 pb-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">Privacy Policy</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-gray-600 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 mb-8">
              Ace Web Designers respects your privacy and is committed to protecting your personal
              information.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We may collect personal information that you voluntarily provide through our website
                or scheduling tools, including your name, email address, phone number, and business
                information when you submit a form or book a consultation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the information you provide to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Respond to inquiries</li>
                <li>Schedule and confirm consultations</li>
                <li>Provide website design services</li>
                <li>Communicate updates related to your request</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">SMS Messaging Consent</h2>
              <p className="text-gray-700 mb-4">
                By submitting your information through our website or booking a consultation, you
                may be asked to consent to receive SMS messages related to your inquiry.
              </p>
              <p className="text-gray-700 mb-4">
                If you provide consent, we may send you text messages including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Appointment confirmations and reminders</li>
                <li>Follow-up messages related to your consultation</li>
                <li>Website design updates or responses to your inquiries</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Message frequency may vary. Message and data rates may apply.
              </p>
              <p className="text-gray-700 mb-4">
                You may opt out of receiving SMS messages at any time by replying STOP. For
                assistance, reply HELP or contact us directly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                Telephone Consumer Protection Act (TCPA) Compliance
              </h2>
              <p className="text-gray-700 mb-4">
                By providing your telephone number to us, you expressly consent to receive
                telemarketing and informational calls and text messages from us or our service
                providers, including through the use of automated technology or prerecorded voice
                messages.
              </p>
              <p className="text-gray-700 mb-4">
                This consent is not required as a condition of purchasing any goods or services. You
                may opt out of receiving telemarketing calls or text messages at any time by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Calling us at (774) 446-7375</li>
                <li>Emailing us at hello@acewebdesigners.com</li>
                <li>Replying "STOP" to any text message you receive from us</li>
                <li>Using the unsubscribe options provided in our marketing communications</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Standard message and data rates may apply for text messages. We will honor your
                opt-out request within 30 days, as required by law. We maintain records of your
                communication preferences for five years from the date of your opt-out request.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Sharing of Information</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, rent, or share your personal information with third parties for
                marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Data Security</h2>
              <p className="text-gray-700 mb-4">
                We take reasonable measures to protect your information from unauthorized access,
                disclosure, or misuse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Updates to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. Any changes will be posted on
                this page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Contact Information</h2>
              <p className="text-gray-700 mb-6">
                If you have any questions about this Privacy Policy or how your information is
                handled, you may contact us at:
              </p>

              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Ace Web Designers</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">
                      Email:{' '}
                      <a
                        href="mailto:hello@acewebdesigners.com"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        hello@acewebdesigners.com
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">
                      Phone:{' '}
                      <a href="tel:+17744467375" className="text-blue-600 hover:text-blue-800">
                        (774) 446-7375
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Location: Leominster, MA</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
