import React, { useEffect } from 'react';
import { Star, Quote, Users, TrendingUp, Award, CheckCircle2, ArrowRight } from 'lucide-react';



function Reviews() {
  useEffect(() => {
    document.title = 'Client Reviews & Testimonials | Ace Web Designers';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Read real client reviews and testimonials from businesses who trusted Ace Web Designers with their website projects. See the results we deliver!');
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-white">
      {/* Hero Section */}
      <section className="pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-300 rounded-full blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-300 rounded-full blur-3xl opacity-20 animate-float animation-delay-2000"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-blue-50 px-5 py-2 rounded-full mb-6 border border-yellow-100 animate-fade-in-down">
              <Star className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-semibold">Client Reviews</span>
            </div>
            <h1 className="heading-lg text-gradient-blue mb-8 animate-fade-in-up">
              What Our Clients Say
            </h1>
            <p className="body-lg text-gray-700 mb-10 max-w-3xl mx-auto animate-fade-in-up delay-100">
              Real reviews from real businesses who trusted us with their digital success. See the results we deliver and why clients choose Ace Web Designers.
            </p>
            <div className="flex items-center justify-center gap-2 mb-2 animate-scale-in delay-200">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-10 h-10 text-yellow-400 fill-yellow-400 animate-scale-in delay-${(i + 2) * 100}`} />
              ))}
              <span className="ml-3 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-blue-600">5.0</span>
              <span className="ml-2 text-xl text-gray-700 font-semibold">(100+ reviews)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Review Statistics */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10">
            {reviewStats.map((stat, index) => (
              <div key={index} className={`text-center group hover-lift animate-fade-in-up delay-${index * 100}`}>
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-125 transition-smooth shadow-lg border border-blue-100">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">{stat.number}</div>
                <div className="font-bold text-lg mb-2 text-gray-900">{stat.label}</div>
                <div className="text-sm text-gray-600 leading-relaxed">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Results */}
      <section className="py-24 bg-gradient-to-b from-gray-50 via-green-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="heading-xl text-gradient-blue mb-6">Results by Industry</h2>
            <p className="body-lg text-gray-700">See how different types of businesses benefit from our web design services</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            {industryResults.map((result, index) => (
              <div key={index} className={`bg-white p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-smooth hover-lift group border-2 border-gray-100 animate-fade-in-up delay-${index * 100}`}>
                <div className="flex items-start gap-6">
                  <div className="text-5xl group-hover:scale-125 transition-smooth animate-levitate">{result.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4 text-gray-900">{result.industry}</h3>
                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-2">{result.avgIncrease}</div>
                    <div className="text-gray-700 mb-4 font-semibold text-lg">{result.metric}</div>
                    <p className="text-gray-600 leading-relaxed">{result.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>





      {/* Why Clients Choose Us */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="heading-xl text-gradient-blue mb-6">Why Clients Keep Coming Back</h2>
            <p className="body-lg text-gray-700">The reasons behind our 5-star rating and client satisfaction</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center group hover-lift animate-fade-in-up">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-125 transition-smooth shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Proven Results</h3>
              <p className="text-gray-600 leading-relaxed text-lg">We don't just build websites - we build websites that drive real business results and measurable ROI.</p>
            </div>
            <div className="text-center group hover-lift animate-fade-in-up delay-100">
              <div className="bg-gradient-to-br from-green-50 to-green-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-125 transition-smooth shadow-lg">
                <Users className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Client-First Approach</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Your success is our priority. We work closely with you to ensure every detail meets your vision.</p>
            </div>
            <div className="text-center group hover-lift animate-fade-in-up delay-200">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-125 transition-smooth shadow-lg">
                <Award className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Quality Guarantee</h3>
              <p className="text-gray-600 leading-relaxed text-lg">We're so confident in our work that we offer a money-back guarantee if you're not 100% satisfied.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3')] opacity-10 animate-gradient-shift"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="heading-xl text-white mb-8 text-shadow-bold animate-fade-in-up">Ready to Join Our Happy Clients?</h2>
          <p className="text-blue-100 text-2xl mb-10 leading-relaxed animate-fade-in-up delay-100">
            See why businesses choose Ace Web Designers for their digital success. Get your free design mockup today!
          </p>
          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 max-w-md mx-auto mb-10 border border-white/20 hover-lift animate-scale-in delay-200">
            <div className="flex items-center justify-center gap-2 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <div className="text-white font-bold text-xl">Join 100+ satisfied clients</div>
          </div>
          <button 
            onClick={() => {
              // Navigate to contact page
              window.location.href = '/#contact';
            }}
            className="bg-white text-blue-600 px-10 py-5 rounded-full font-bold hover:bg-blue-50 transition-smooth hover:scale-110 inline-flex items-center group text-2xl shadow-2xl animate-glow-pulse"
          >
            Get My Free Design Now
            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default Reviews;
