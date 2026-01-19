import React, { useEffect } from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { Gift, Users, DollarSign, CheckCircle2, Star, ArrowRight, MousePointer2 } from 'lucide-react';



function Refer() {
  const [state, handleSubmit] = useForm("xvgbobpv");

  useEffect(() => {
    document.title = 'Refer a Client & Earn $200 | Ace Web Designers';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Refer a client to Ace Web Designers and earn $200 when they complete their website project. Help grow businesses while earning rewards!');
    }
  }, []);



  const benefits = [
    "$200 cash reward when your referral completes their website",
    "No limit on how many referrals you can make",
    "Help businesses grow their online presence",
    "Simple process - just share our contact info",
    "Fast payout once the project is completed",
    "Ongoing rewards for successful referrals"
  ];

  if (state.succeeded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Thank You for Your Referral!</h1>
            <p className="text-lg text-gray-600 mb-6">
              We've received your referral information and will be reaching out to {state.result?.data?.referralName || 'them'} soon.
            </p>
            <p className="text-gray-600">
              You'll receive your $200 reward once they complete their website project with us.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full mb-4">
              <Gift className="w-4 h-4 text-green-600" />
              <span className="text-green-800 font-medium">Referral Program</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
              Refer a Client, Earn $200
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Know someone who needs a professional website? Refer them to Ace Web Designers and earn $200 when they complete their project!
            </p>
            <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-bold text-green-600">$200</span>
              </div>
              <p className="text-gray-600">Cash reward per successful referral</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">Three simple steps to earn $200</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Refer a Client</h3>
              <p className="text-gray-600">Share our contact information with someone who needs a website</p>
            </div>
            <div className="text-center group">
              <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. They Get a Website</h3>
              <p className="text-gray-600">Your referral completes their website project with us</p>
            </div>
            <div className="text-center group">
              <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. You Get Paid</h3>
              <p className="text-gray-600">Receive $200 cash once the project is completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Refer to Us?</h2>
            <p className="text-gray-600 text-lg">Benefits for both you and your referral</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-green-600">You Get:</h3>
              <div className="space-y-4">
                {benefits.slice(0, 3).map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 text-blue-600">Your Referral Gets:</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">FREE homepage design mockup</p>
                </div>
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">Professional website starting at $200</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews Widget */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full mb-4">
              <Star className="w-4 h-4 text-green-600" />
              <span className="text-green-800 font-medium">Google Reviews</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">See Our Google Reviews</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Check out what our clients are saying about us on Google
            </p>
          </div>
          <div className="flex justify-center">
            <div locationId="10311921268967440718" className="review-widget-carousel"></div>
          </div>
        </div>
      </section>

      {/* Referral Form */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Submit Your Referral</h2>
            <p className="text-gray-600 text-lg">Fill out the form below to submit a referral and start earning!</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Your Information */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Your Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Your full name"
                    />
                    <ValidationError prefix="Name" field="name" errors={state.errors} />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="your.email@example.com"
                    />
                    <ValidationError prefix="Email" field="email" errors={state.errors} />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="(555) 123-4567"
                  />
                  <ValidationError prefix="Phone" field="phone" errors={state.errors} />
                </div>
              </div>

              {/* Referral Information */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Referral Information</h3>
                <div className="mb-4">
                  <label htmlFor="referralBusiness" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    id="referralBusiness"
                    type="text"
                    name="referralBusiness"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="ABC Construction, Joe's Restaurant, etc."
                  />
                  <ValidationError prefix="Referral Business" field="referralBusiness" errors={state.errors} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="referralName" className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person's Name *
                    </label>
                    <input
                      id="referralName"
                      type="text"
                      name="referralName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="John Smith, Sarah Johnson, etc."
                    />
                    <ValidationError prefix="Referral Name" field="referralName" errors={state.errors} />
                  </div>
                  <div>
                    <label htmlFor="referralEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Contact's Email *
                    </label>
                    <input
                      id="referralEmail"
                      type="email"
                      name="referralEmail"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="contact@business.com"
                    />
                    <ValidationError prefix="Referral Email" field="referralEmail" errors={state.errors} />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="referralPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact's Phone Number
                  </label>
                  <input
                    id="referralPhone"
                    type="tel"
                    name="referralPhone"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="(555) 123-4567"
                  />
                  <ValidationError prefix="Referral Phone" field="referralPhone" errors={state.errors} />
                </div>
                <div className="mt-4">
                  <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Any additional details about the referral or their website needs..."
                  />
                  <ValidationError prefix="Additional Info" field="additionalInfo" errors={state.errors} />
                </div>
              </div>

              <button
                type="submit"
                disabled={state.submitting}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-full font-medium transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.submitting ? 'Submitting...' : 'Submit Referral'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Start Earning Today!</h2>
          <p className="text-green-100 text-lg mb-8">
            The more referrals you make, the more you earn. Help businesses grow while building your income!
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto">
            <div className="text-3xl font-bold text-white mb-2">$200 per referral</div>
            <div className="text-green-100">No limit on earnings</div>
          </div>
        </div>
      </section>

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
                <span className="text-sm text-gray-400" style={{ marginTop: '-4px' }}>Web Designers</span>
              </div>
              <p className="text-gray-400 text-sm">
                Based in Leominster, MA, serving small businesses nationwide. Professional web design and development services helping small business owners across America build their online presence.
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
                    href="tel:+17744467375"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    (774) 446-7375
                  </a>
                </li>
                <li className="text-gray-400">
                  Based in Leominster, MA • Serving Nationwide
                </li>
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
                    window.location.href = '/privacy';
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
  );
}

export default Refer;
