import React, { useEffect } from 'react'
import { Mail, Phone, Calendar, MapPin } from 'lucide-react'

interface ContactProps {
  initialData?: {
    budget?: string
    message?: string
  }
}

function Contact({ initialData }: ContactProps) {
  useEffect(() => {
    document.title = 'Schedule a Consultation | Web Design Services Nationwide'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Schedule a free consultation with our web design team. Book a time to discuss your project needs and learn how we can help grow your online presence.'
      )
    }
  }, [initialData])

  return (
    <div className="pt-24 pb-16 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-2 rounded-full mb-6 border border-blue-100">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-semibold">Free Consultation</span>
          </div>
          <h1 className="heading-xl text-gradient-blue mb-6">Book Your Free Design Consultation</h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            15 minutes with our team → Free mockup in 24-48 hours
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">
                    ★
                  </span>
                ))}
              </div>
              <span className="font-semibold">5.0 Rating</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5 text-green-600" />
              <span>SSL Secured • No Credit Card Required</span>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {/* Calendly Widget - Primary Focus */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-100">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Schedule Your Free Consultation</h1>
              <p className="text-gray-600">
                Book a time to discuss your project and get your{' '}
                <span className="font-bold text-blue-600">FREE</span> design mockup!
              </p>

              {initialData?.budget && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-800">
                  <p>
                    You selected the{' '}
                    <span className="font-bold">
                      {initialData.budget === 'basic'
                        ? 'Website in a Day ($200)'
                        : initialData.budget === 'standard'
                          ? 'Standard Website ($1,000)'
                          : initialData.budget === 'ecommerce'
                            ? 'E-commerce Website ($1,500)'
                            : 'Custom Project'}
                    </span>{' '}
                    package.
                  </p>
                  {initialData.message && (
                    <p className="mt-2">
                      "<i>{initialData.message}</i>"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Calendly inline widget begin */}
            <div
              className="calendly-inline-widget"
              data-url="https://calendly.com/rhyanalmeida31/30min"
              style={{ minWidth: '320px', height: '700px' }}
            />
            {/* Calendly inline widget end */}

            {/* Respectful meeting reminder */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <strong>Please show up!</strong> We're real people who block time for you. Thanks!
              </p>
            </div>
          </div>

          {/* Alternative Contact Methods - Secondary */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Prefer Another Way to Connect?
              </h3>
              <p className="text-gray-600 text-sm">We're here to help however you prefer</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Email</p>
                    <a
                      href="mailto:support@acewebdesigners.com"
                      className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                    >
                      support@acewebdesigners.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Phone</p>
                    <a
                      href="tel:+17744467375"
                      className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                    >
                      (774) 446-7375
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span>Based in Leominster, MA • Serving Nationwide</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
