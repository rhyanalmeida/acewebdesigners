import React, { useEffect } from 'react';
import { Star, Quote, Users, TrendingUp, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import GoogleReviews from './GoogleReviews';


function Reviews() {
  useEffect(() => {
    document.title = 'Client Reviews & Testimonials | Ace Web Designers';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Read real client reviews and testimonials from businesses who trusted Ace Web Designers with their website projects. See the results we deliver!');
    }

    // Track with Facebook Pixel
    if (window.fbq) {
      window.fbq('trackCustom', 'ReviewsPageView');
    }
  }, []);



  const reviewStats = [
    {
      icon: <Star className="w-8 h-8 text-yellow-500" />,
      number: "5.0",
      label: "Average Rating",
      description: "From 100+ verified reviews"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      number: "100+",
      label: "Happy Clients",
      description: "Businesses nationwide"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      number: "95%",
      label: "Success Rate",
      description: "Clients see increased results"
    },
    {
      icon: <Award className="w-8 h-8 text-purple-500" />,
      number: "100%",
      label: "Satisfaction",
      description: "Money-back guarantee"
    }
  ];

  const industryResults = [
    {
      industry: "Restaurants & Food",
      icon: "🍽️",
      avgIncrease: "38%",
      metric: "Online Orders",
      description: "Restaurants see significant increases in online ordering and takeout sales"
    },
    {
      industry: "Construction & Contractors",
      icon: "🏗️",
      avgIncrease: "3.2x",
      metric: "More Leads",
      description: "Contractors generate more qualified leads through professional websites"
    },
    {
      industry: "Healthcare & Wellness",
      icon: "⚕️",
      avgIncrease: "52%",
      metric: "Appointment Bookings",
      description: "Healthcare practices see more online appointment bookings"
    },
    {
      industry: "Professional Services",
      icon: "💼",
      avgIncrease: "2.8x",
      metric: "Client Inquiries",
      description: "Service businesses receive more qualified client inquiries"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">Client Reviews</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              What Our Clients Say
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Real reviews from real businesses who trusted us with their digital success. See the results we deliver and why clients choose Ace Web Designers.
            </p>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              ))}
              <span className="ml-2 text-2xl font-bold text-gray-900">5.0</span>
              <span className="ml-1 text-lg text-gray-600">(100+ reviews)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Review Statistics */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {reviewStats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gray-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="font-semibold mb-2">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Results */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Results by Industry</h2>
            <p className="text-gray-600 text-lg">See how different types of businesses benefit from our web design services</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {industryResults.map((result, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 group">
                <div className="flex items-start gap-4">
                  <div className="text-4xl group-hover:scale-110 transition-transform">{result.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{result.industry}</h3>
                    <div className="text-3xl font-bold text-green-600 mb-1">{result.avgIncrease}</div>
                    <div className="text-gray-600 mb-2">{result.metric}</div>
                    <p className="text-gray-600 text-sm">{result.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Google Reviews Widget */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full mb-4">
              <Star className="w-4 h-4 text-green-600" />
              <span className="text-green-800 font-medium">Google Reviews</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Live Google Reviews</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              See real-time reviews from our satisfied clients on Google. These are authentic reviews from real customers.
            </p>
          </div>
          <div className="flex justify-center">
            <GoogleReviews className="w-full max-w-5xl" />
          </div>
        </div>
      </section>

      {/* Why Clients Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Clients Keep Coming Back</h2>
            <p className="text-gray-600 text-lg">The reasons behind our 5-star rating and client satisfaction</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Proven Results</h3>
              <p className="text-gray-600">We don't just build websites - we build websites that drive real business results and measurable ROI.</p>
            </div>
            <div className="text-center group">
              <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Client-First Approach</h3>
              <p className="text-gray-600">Your success is our priority. We work closely with you to ensure every detail meets your vision.</p>
            </div>
            <div className="text-center group">
              <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Quality Guarantee</h3>
              <p className="text-gray-600">We're so confident in our work that we offer a money-back guarantee if you're not 100% satisfied.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Join Our Happy Clients?</h2>
          <p className="text-blue-100 text-lg mb-8">
            See why businesses choose Ace Web Designers for their digital success. Get your free design mockup today!
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <div className="text-white font-semibold">Join 100+ satisfied clients</div>
          </div>
          <button 
            onClick={() => {
              // Navigate to contact page
              window.location.href = '/#contact';
            }}
            className="bg-white text-blue-600 px-8 py-4 rounded-full font-medium hover:bg-blue-50 transition-all hover:scale-105 inline-flex items-center group text-lg"
          >
            Get My Free Design Now
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default Reviews;
