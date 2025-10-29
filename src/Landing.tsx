import React, { useState, useRef, useEffect } from 'react';
import { CALENDLY_URL } from './config';
import { CheckCircle2, Star, ArrowRight, MousePointer2, Calendar, Clock } from 'lucide-react';

function Landing() {
  const bookingFormRef = useRef(null);
  
  useEffect(() => {
    document.title = 'Free Website Design for Your Business | Limited Time Offer';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get a free website design for your business. No obligation, no hidden fees. Limited time offer - only 10 spots available!');
    }
    
    // Set a URL parameter that can be tracked
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('source')) {
      urlParams.append('source', 'landing');
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    // Load the Calendly script
    const head = document.querySelector('head');
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    
    head?.appendChild(script);

    return () => {
      // Clean up script if component unmounts
      if (head?.contains(script)) {
        head.removeChild(script);
      }
    };
  }, []);

  const handleGetStarted = () => {
    bookingFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const industries = [
    "Landscaping", 
    "Construction", 
    "Plumbing", 
    "Electricians", 
    "Restaurants",
    "Retail Stores",
    "Professional Services",
    "Healthcare Providers",
    "Fitness Centers",
    "+ many more"
  ];
  
  const benefits = [
    "A free homepage mockup/design before paying a penny",
    "Professional hosting packages available",
    "Websites delivered within 1-3 weeks",
    "Basic SEO implemented in every website",
    "Ongoing SEO and local rankings available",
    "Ongoing support and website updates available"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                GET A <span className="text-blue-600 underline relative animate-pulse-glow inline-block px-2">FREE</span> WEBSITE DESIGN FOR YOUR BUSINESS
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-700">
                We'll design your website for FREE. If you like it, you can buy it. If not, no harm done!
              </p>
              <p className="text-xl font-semibold mb-4 text-red-600">Free design mockup — no payment until you love it</p>
              <button 
                onClick={handleGetStarted}
                className="group bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xl font-bold py-4 px-8 rounded-full hover:shadow-lg transition-all transform hover:scale-105 flex items-center mx-auto md:mx-0 relative overflow-hidden animate-pulse-glow"
              >
                <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
                <div className="absolute right-4 w-8 h-8 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              <div className="flex justify-center md:justify-start mt-4">
                {[1, 2, 3, 4, 5].map((_, index) => (
                  <Star key={index} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mt-2">Rated 5.0 / 5 on Google!</p>
            </div>
            <div className="video-container relative rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-500">
              <div style={{padding:'56.25% 0 0 0', position:'relative'}}>
                <iframe 
                  src="https://player.vimeo.com/video/1088261551?h=a19a5e95f4&badge=0&autopause=0&player_id=0&app_id=58479" 
                  frameBorder="0" 
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" 
                  style={{position:'absolute', top:0, left:0, width:'100%', height:'100%'}} 
                  title="Free Preview Rhyan 1 - 526"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">SEE EXAMPLES...</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Example 1 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-2 duration-300">
              <img 
                src="https://i.ibb.co/r2g1Q1Qp/hotpotonegif.gif" 
                alt="Hot Pot One Website Example" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Star key={index} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-center text-sm italic mb-4">
                  "Ace Web Designers created an amazing website for our restaurant. The ordering system works flawlessly and we've seen a significant increase in online orders."
                </p>
                <p className="text-center font-semibold">Hot Pot One - Restaurant</p>
              </div>
            </div>

            {/* Example 2 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-2 duration-300">
              <img 
                src="https://i.ibb.co/Myx4nrSr/concuo-gif.gif" 
                alt="Conuco Takeout Website Example" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Star key={index} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-center text-sm italic mb-4">
                  "The team at Ace Web Designers understood exactly what we needed. Our Dominican cuisine is now beautifully showcased online, and customers love ordering through our website."
                </p>
                <p className="text-center font-semibold">Conuco Takeout - Restaurant</p>
              </div>
            </div>

            {/* Example 3 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-2 duration-300">
              <img 
                src="https://i.ibb.co/S1Yv7K9/dunn-consturction-gif.gif" 
                alt="Dunn Construction Website Example" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Star key={index} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-center text-sm italic mb-4">
                  "We were recommended to Rhyan and Valerie by a friend. Within days, we had a professional website that perfectly represented our construction business. We're already getting more leads!"
                </p>
                <p className="text-center font-semibold">Dunn Construction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-12 items-center">
            <div className="md:col-span-2">
              <img 
                src="https://i.ibb.co/DP2X8fXT/handsome.jpg" 
                alt="Web Designers" 
                className="rounded-lg shadow-lg object-cover w-full aspect-[3/4] hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              />
            </div>
            <div className="md:col-span-3">
              <h2 className="text-3xl font-bold mb-4">👋 Hey We're Rhyan & Valerie... Web designers at Ace Web Designers!</h2>
              <p className="text-xl mb-4 bg-blue-100 p-3 rounded text-blue-900">
                Our goal is to help make sure you don't overpay on a new website.
              </p>
              <p className="text-lg mb-4 bg-blue-100 p-3 rounded text-blue-900">
                Of course a nice looking website is hugely important when it comes to growing your business, getting more leads, and having somewhere to showcase all of your work.
              </p>
              <p className="text-lg mb-6 bg-blue-100 p-3 rounded text-blue-900">
                But that doesn't mean that you need to spend thousands and thousands of dollars with an expensive agency.
              </p>
              <p className="text-lg mb-4">
                Here at Ace Web Designers, we specialize in fast and affordable websites for businesses of all types.
              </p>
              <p className="text-lg mb-6">
                We build websites that turn clicks into customers, but also we don't charge an arm and a leg for it.
              </p>
              <p className="text-lg mb-6">
                So if you are looking for an affordable website for your business, book in a call below and we will do you a free design.
              </p>
              <div className="font-bold text-xl mb-4">We build websites for...</div>
              <div className="grid grid-cols-2 gap-2 mb-8">
                {industries.map((industry, index) => (
                  <div key={index} className="flex items-center gap-2 group hover:bg-blue-50 p-1 rounded transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                    <span>{industry}</span>
                  </div>
                ))}
              </div>
              <p className="text-lg mb-8">
                Simply book in a quick phone call below, let us know what you want and we'll have your design ready within 48 hours.
              </p>
              <div className="text-center">
                <p className="text-xl font-semibold mb-4 text-red-600">Free design mockup — no payment until you love it</p>
                <button 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xl font-bold py-4 px-8 rounded-full hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center mx-auto relative overflow-hidden animate-pulse-glow"
                >
                  <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
                  <div className="absolute right-4 w-8 h-8 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <div className="flex justify-center mt-4">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Star key={index} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mt-2">Rated 5.0 / 5 on Google!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews Widget */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full mb-4">
              <Star className="w-4 h-4 text-green-600" />
              <span className="text-green-800 font-medium">Google Reviews</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Clients Say on Google</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Real, verified reviews pulled in live from our Google Business Profile.
            </p>
          </div>
          <div className="flex justify-center">
            <div locationId="10311921268967440718" className="review-widget-carousel"></div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">WHAT YOU GET WITH OUR WEBSITES...</h2>
          <div className="max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 bg-white shadow-md rounded-lg p-4 mb-4 transform transition-all duration-300 hover:shadow-lg hover:-translate-x-1 hover:translate-y-1 hover:bg-blue-50">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <p className="text-lg">{benefit}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-xl font-semibold mb-4 text-red-600">Free design mockup — no payment until you love it</p>
            <button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xl font-bold py-4 px-8 rounded-full hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center mx-auto relative overflow-hidden animate-pulse-glow"
            >
              <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
              <div className="absolute right-4 w-8 h-8 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section ref={bookingFormRef} className="py-16 bg-blue-50 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-6">BOOK YOUR FREE DESIGN CONSULTATION</h2>
          <p className="text-lg text-center mb-8">Schedule a time to discuss your website needs and get your free design!</p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse-glow" id="landing-form-container">
            {/* Calendly inline widget */}
            <div 
              className="calendly-inline-widget" 
              data-url={CALENDLY_URL} 
              style={{minWidth:"320px", height:"700px"}}
            />
          </div>
          
          {/* Respectful meeting reminder */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <strong>Please show up!</strong> We're real people who block time for you. Thanks!
            </p>
          </div>
        </div>
      </section>

      {/* Hidden element for URL-based custom conversion tracking */}
      <div id="landing-conversion-tracker" style={{ display: 'none' }} data-conversion-type="free_design_landing"></div>
    </div>
  );
}

export default Landing;