import React from 'react';
import { MousePointer2, ChevronRight, Menu, X, ArrowRight, Users, Zap, Trophy, CheckCircle2, Star, Clock, Shield, Award, Calculator, MessageCircle, Plus, Minus, TrendingUp, Globe, Smartphone, Search, Lock, HeadphonesIcon } from 'lucide-react';
import Contact from './Contact';
import AboutUs from './AboutUs';
import Work from './Work';
import Services from './Services';
import Landing from './Landing';
import Refer from './Refer';

function App() {
  const [currentPage, setCurrentPage] = React.useState('home');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [pendingScroll, setPendingScroll] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<{budget?: string; message?: string}>({});
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [calculatorData, setCalculatorData] = React.useState({
    pages: 1,
    features: [],
    timeline: 'standard'
  });

  React.useEffect(() => {
    // Check if the URL path is /landing or /refer and set the page accordingly
    const path = window.location.pathname;
    if (path === '/landing') {
      setCurrentPage('landing');
    } else if (path === '/refer') {
      setCurrentPage('refer');
    }
    
    const handleNavigation = (event: CustomEvent) => {
      const { page, data } = event.detail;
      setCurrentPage(page);
      if (data) {
        setFormData(data);
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener('navigate', handleNavigation as EventListener);
    return () => window.removeEventListener('navigate', handleNavigation as EventListener);
  }, []);

  React.useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  React.useEffect(() => {
    if (currentPage === 'home' && pendingScroll) {
      const element = document.getElementById(pendingScroll);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
          setPendingScroll(null);
        }, 100);
      }
    }
  }, [currentPage, pendingScroll]);

  const handleNavigation = (page: string, scrollTo?: string) => {
    setIsMenuOpen(false);
    if (page === 'home' && scrollTo) {
      if (currentPage === 'home') {
        document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setPendingScroll(scrollTo);
        setCurrentPage('home');
      }
    } else {
      setCurrentPage(page);
      if (page !== 'contact') {
        setFormData({});
      }
      window.scrollTo(0, 0);
    }
  };

  const testimonials = [
    {
      name: "Mike Chen",
      business: "Hot Pot One",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      content: "Ace Web Designers created an amazing website for our restaurant. The ordering system works flawlessly and we've seen a 40% increase in online orders since launch.",
      rating: 5,
      result: "40% increase in online orders"
    },
    {
      name: "Maria Rodriguez",
      business: "Conuco Takeout",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b647?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      content: "The team understood exactly what we needed for our Dominican cuisine restaurant. Our website beautifully showcases our food and customers love ordering online.",
      rating: 5,
      result: "35% increase in takeout orders"
    },
    {
      name: "John Dunn",
      business: "Dunn Construction",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      content: "Within days, we had a professional website that perfectly represented our construction business. We're already getting 3x more leads than before!",
      rating: 5,
      result: "3x more qualified leads"
    },
    {
      name: "Sarah Thompson",
      business: "Thompson Fitness",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      content: "Professional, fast, and exactly what we needed. Our new website has helped us book 50% more personal training sessions. Highly recommend!",
      rating: 5,
      result: "50% more bookings"
    }
  ];

  const processSteps = [
    {
      step: "01",
      title: "Discovery Call",
      description: "We discuss your business goals, target audience, and website requirements in a 15-minute consultation.",
      icon: <MessageCircle className="w-8 h-8 text-blue-600" />,
      duration: "15 minutes"
    },
    {
      step: "02", 
      title: "Free Design Mockup",
      description: "We create a free homepage design mockup so you can see exactly what your website will look like before paying anything.",
      icon: <Star className="w-8 h-8 text-blue-600" />,
      duration: "24-48 hours"
    },
    {
      step: "03",
      title: "Development & Build",
      description: "Once approved, we build your complete website with all pages, features, and functionality you need.",
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      duration: "1-3 weeks"
    },
    {
      step: "04",
      title: "Launch & Support",
      description: "We launch your website and provide ongoing support to ensure everything runs smoothly and continues to drive results.",
      icon: <Trophy className="w-8 h-8 text-blue-600" />,
      duration: "Ongoing"
    }
  ];

  const faqs = [
    {
      question: "How much does a website cost?",
      answer: "Our websites start at $200 for a basic one-page site, $1,000 for a standard multi-page website, and $1,500 for e-commerce. All packages include hosting, mobile responsiveness, and basic SEO. We provide a free design mockup before you pay anything."
    },
    {
      question: "How long does it take to build a website?",
      answer: "Most websites are completed within 1-3 weeks. Our 'Website in a Day' option delivers a professional site in just 24 hours. Timeline depends on complexity and how quickly you provide content and feedback."
    },
    {
      question: "Do you provide hosting and maintenance?",
      answer: "Yes! All our packages include professional hosting. We also offer ongoing maintenance, updates, and support for a small monthly fee. You'll never have to worry about technical issues."
    },
    {
      question: "Will my website work on mobile devices?",
      answer: "Absolutely! Every website we build is fully responsive and optimized for mobile, tablet, and desktop. With 60%+ of web traffic coming from mobile, this is essential for your success."
    },
    {
      question: "Can you help with SEO and getting found on Google?",
      answer: "Yes! We include basic SEO setup with every website and offer advanced SEO services to help you rank higher on Google. We'll optimize your site for your target keywords and location."
    },
    {
      question: "What if I don't like the design?",
      answer: "That's why we create a free mockup first! You can see exactly what your website will look like before paying. If you don't love it, there's no obligation to proceed. We want you to be 100% happy."
    },
    {
      question: "Do you work with businesses outside your local area?",
      answer: "Yes! We work with businesses nationwide. Most of our communication is done remotely through video calls, email, and phone. Location doesn't limit our ability to create an amazing website for you."
    },
    {
      question: "Can you add e-commerce/online ordering to my website?",
      answer: "Definitely! We specialize in e-commerce websites and online ordering systems. Whether you're selling products or services, we can set up secure payment processing and inventory management."
    }
  ];

  const trustSignals = [
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      stat: "100+",
      label: "Websites Built"
    },
    {
      icon: <Star className="w-6 h-6 text-blue-600" />,
      stat: "5.0",
      label: "Average Rating"
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      stat: "1-3",
      label: "Weeks Delivery"
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      stat: "100%",
      label: "Satisfaction Rate"
    }
  ];

  const industries = [
    {
      name: "Restaurants & Food",
      icon: "🍽️",
      description: "Online ordering, menu management, and table reservations",
      projects: "15+ projects"
    },
    {
      name: "Construction & Contractors",
      icon: "🏗️",
      description: "Project galleries, service listings, and lead generation",
      projects: "20+ projects"
    },
    {
      name: "Healthcare & Wellness",
      icon: "⚕️",
      description: "Appointment booking, service information, and patient portals",
      projects: "12+ projects"
    },
    {
      name: "Professional Services",
      icon: "💼",
      description: "Service showcases, client portals, and consultation booking",
      projects: "25+ projects"
    },
    {
      name: "Retail & E-commerce",
      icon: "🛍️",
      description: "Online stores, inventory management, and payment processing",
      projects: "18+ projects"
    },
    {
      name: "Fitness & Sports",
      icon: "💪",
      description: "Class scheduling, membership management, and training programs",
      projects: "10+ projects"
    }
  ];

  const performanceMetrics = [
    {
      metric: "2.3s",
      label: "Average Load Time",
      description: "Google recommends under 3 seconds",
      icon: <Zap className="w-6 h-6 text-green-600" />
    },
    {
      metric: "99.9%",
      label: "Uptime Guarantee",
      description: "Reliable hosting with minimal downtime",
      icon: <Shield className="w-6 h-6 text-green-600" />
    },
    {
      metric: "95+",
      label: "Mobile Score",
      description: "Google PageSpeed mobile optimization",
      icon: <Smartphone className="w-6 h-6 text-green-600" />
    },
    {
      metric: "SSL",
      label: "Security Included",
      description: "Free SSL certificates for all sites",
      icon: <Lock className="w-6 h-6 text-green-600" />
    }
  ];

  const guarantees = [
    {
      title: "30-Day Money-Back Guarantee",
      description: "Not happy with your website? We'll refund your money within 30 days of launch.",
      icon: <Shield className="w-8 h-8 text-green-600" />
    },
    {
      title: "Free Revisions",
      description: "We'll make unlimited revisions during the design phase until you're 100% satisfied.",
      icon: <Star className="w-8 h-8 text-green-600" />
    },
    {
      title: "On-Time Delivery",
      description: "We guarantee your website will be delivered on time, or we'll reduce the price by 20%.",
      icon: <Clock className="w-8 h-8 text-green-600" />
    }
  ];

  const calculateEstimate = () => {
    let basePrice = 200;
    if (calculatorData.pages > 5) basePrice = 1500;
    else if (calculatorData.pages > 1) basePrice = 1000;
    
    const featureAddons = calculatorData.features.length * 200;
    const rushFee = calculatorData.timeline === 'rush' ? basePrice * 0.5 : 0;
    
    return basePrice + featureAddons + rushFee;
  };

  const renderContent = () => {
    if (currentPage === 'contact') {
      return <Contact initialData={formData} />;
    }
    if (currentPage === 'about') {
      return <AboutUs />;
    }
    if (currentPage === 'work') {
      return <Work />;
    }
    if (currentPage === 'services') {
      return <Services />;
    }
    if (currentPage === 'landing') {
      return <div className="w-full h-full"><Landing /></div>;
    }
    if (currentPage === 'refer') {
      return <Refer />;
    }

    return (
      <main>
        {/* Hero Section */}
        <section className="min-h-[80vh] relative overflow-hidden flex items-center pb-0 pt-20" aria-label="Hero">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white -z-10"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2072&q=80')] opacity-5 -z-20"></div>
          <div className="absolute top-20 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative z-20">
                <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
                  <span className="animate-pulse relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  <span className="text-blue-800 font-medium">Professional Web Design Services</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
                  Turn Visitors Into Customers
                </h1>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Get a professional website that actually grows your business. Based in Leominster, MA, we create stunning, high-converting websites for businesses nationwide that turn clicks into customers and browsers into buyers.
                </p>
                <div className="flex flex-wrap gap-4 relative z-30">
                  <button 
                    onClick={() => handleNavigation('contact')}
                    className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-full font-medium transition-all hover:scale-105 flex items-center shadow-lg shadow-blue-500/20 animate-pulse-glow"
                  >
                    <span className="mr-2 animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleNavigation('services')}
                    className="px-8 py-4 rounded-full font-medium border-2 border-gray-200 hover:border-blue-600 transition-colors flex items-center group text-gray-700 hover:text-blue-600"
                  >
                    View Services
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl transform rotate-3"></div>
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2015&q=80"
                  alt="Web Design Illustration"
                  className="rounded-2xl relative shadow-xl transform hover:-rotate-2 transition-transform duration-300 w-full object-cover aspect-[4/3]"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals Bar */}
        <section className="py-8 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustSignals.map((signal, index) => (
                <div key={index} className="text-center group hover:bg-blue-50 p-4 rounded-xl transition-colors">
                  <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                    {signal.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{signal.stat}</div>
                  <div className="text-sm text-gray-600">{signal.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries We Serve */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Industries We Serve</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">We Build Websites for Every Industry</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                From restaurants to construction companies, we understand the unique needs of different businesses
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {industries.map((industry, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 group">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{industry.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{industry.name}</h3>
                  <p className="text-gray-600 mb-3">{industry.description}</p>
                  <div className="text-sm text-blue-600 font-medium">{industry.projects}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance & Security */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Performance & Security</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Built for Speed, Security & Success</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Every website we build is optimized for maximum performance and security
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="text-center bg-gray-50 p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all group">
                  <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {metric.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{metric.metric}</div>
                  <div className="font-semibold mb-2">{metric.label}</div>
                  <div className="text-sm text-gray-600">{metric.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Guarantees */}
        <section className="py-20 bg-gradient-to-b from-green-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full mb-4">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">Our Guarantees</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Risk-Free Website Design</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                We're so confident in our work, we back it with these guarantees
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {guarantees.map((guarantee, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 text-center group">
                  <div className="bg-green-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    {guarantee.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{guarantee.title}</h3>
                  <p className="text-gray-600">{guarantee.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Our Process</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Our proven 4-step process ensures you get exactly what you want, when you want it
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <div key={index} className="relative group">
                  <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 text-center">
                    <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      {step.icon}
                    </div>
                    <div className="text-sm font-bold text-blue-600 mb-2">STEP {step.step}</div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    <div className="inline-flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-700">
                      <Clock className="w-3 h-3" />
                      {step.duration}
                    </div>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-blue-200 transform -translate-y-1/2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Website Cost Calculator */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Cost Calculator</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Estimate Your Website Cost</h2>
              <p className="text-gray-600 text-lg">Get an instant estimate for your project</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg">
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold mb-3">How many pages do you need?</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 3, 5, 10].map((pages) => (
                      <button
                        key={pages}
                        onClick={() => setCalculatorData({...calculatorData, pages})}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          calculatorData.pages === pages 
                            ? 'border-blue-600 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {pages === 10 ? '10+' : pages} Page{pages !== 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-lg font-semibold mb-3">Additional Features</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['E-commerce', 'Blog', 'Booking System', 'Live Chat', 'Custom Forms', 'Advanced SEO'].map((feature) => (
                      <button
                        key={feature}
                        onClick={() => {
                          const features = calculatorData.features.includes(feature)
                            ? calculatorData.features.filter(f => f !== feature)
                            : [...calculatorData.features, feature];
                          setCalculatorData({...calculatorData, features});
                        }}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          calculatorData.features.includes(feature)
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-3">Timeline</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'standard', label: 'Standard (1-3 weeks)', price: '+$0' },
                      { value: 'rush', label: 'Rush (1 week)', price: '+50%' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCalculatorData({...calculatorData, timeline: option.value})}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          calculatorData.timeline === option.value
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm opacity-75">{option.price}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-semibold">Estimated Cost:</span>
                    <span className="text-3xl font-bold text-blue-600">${calculateEstimate().toLocaleString()}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    This is an estimate. Final pricing may vary based on specific requirements.
                  </p>
                  <button 
                    onClick={() => handleNavigation('contact')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Accurate Quote
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
                <Star className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Client Success</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">What Our Clients Say</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Real results from real businesses who trusted us with their web presence
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 group">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.business}</div>
                      </div>
                    </div>
                    <div className="mt-3 bg-green-50 px-3 py-2 rounded-lg">
                      <div className="text-sm font-medium text-green-700">Result: {testimonial.result}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3')] opacity-10 bg-cover bg-center"></div>
          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">WHY CHOOSE US?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Quick Turnaround */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/5 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 duration-300">
                <img 
                  src="https://i.ibb.co/B55R3m9L/green-clock-quick-web-design.png"
                  alt="Quick Turnaround"
                  className="w-32 h-32 object-contain"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">Quick Turnaround</h3>
                  <p className="text-blue-100">Have your full site completed within 1-3 weeks. Need it faster? We offer rush delivery!</p>
                </div>
              </div>

              {/* Amazingly Responsive */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/5 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 duration-300">
                <img 
                  src="https://i.ibb.co/yBhM31z8/iphone-mobile-desktop-responsive-web-design-in-leominster-ma.png"
                  alt="Responsive Design"
                  className="w-32 h-32 object-contain"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">Amazingly Responsive</h3>
                  <p className="text-blue-100">Your site will work perfectly on mobile, tablet, and desktop. Nobody misses out.</p>
                </div>
              </div>

              {/* SEO Optimized */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/5 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 duration-300">
                <img 
                  src="https://i.ibb.co/mpQkN0s/google-g-icon.png"
                  alt="SEO Optimization"
                  className="w-32 h-32 object-contain"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">SEO Optimized</h3>
                  <p className="text-blue-100">We'll optimize your site so you're more likely to show up higher on Google for relevant searches in your industry.</p>
                </div>
              </div>

              {/* Affordable */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/5 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 duration-300">
                <img 
                  src="https://i.ibb.co/ZRFpJwVh/gold-coin-icon-referencing-affordable-web-design.png"
                  alt="Affordable"
                  className="w-32 h-32 object-contain"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">Affordable</h3>
                  <p className="text-blue-100">Other designers overcharge for mediocre work. We provide exceptional quality at fair prices that deliver real ROI.</p>
                </div>
              </div>

              {/* E-Commerce Functions */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/5 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 duration-300">
                <img 
                  src="https://i.ibb.co/rGPJ8CbN/green-e-commerce-shopping-cart-icon-in-leominster-ma.png"
                  alt="E-Commerce"
                  className="w-32 h-32 object-contain"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">E-Commerce Functions</h3>
                  <p className="text-blue-100">Selling products or services online? We can set up secure payment processing and showcase your offerings beautifully.</p>
                </div>
              </div>

              {/* Modern, Beautiful Sites */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/5 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 duration-300">
                <img 
                  src="https://i.ibb.co/Z6HDV3Sx/coffee-cup-with-hearts.png"
                  alt="Beautiful Design"
                  className="w-32 h-32 object-contain"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">Modern, Beautiful Sites</h3>
                  <p className="text-blue-100">Your website will look fantastic and impress potential customers. First impressions matter!</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">FAQ</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 text-lg">Get answers to the most common questions about our services</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-lg">{faq.question}</span>
                    {openFaq === index ? (
                      <Minus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Work Section */}
        <section id="work" className="py-12 md:py-16 scroll-mt-16 bg-gray-50" aria-label="Featured Work">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
                <Trophy className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Featured Projects</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Latest Work</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                See how we've helped businesses like yours succeed online
              </p>
              <button
                onClick={() => handleNavigation('work')}
                className="mt-6 px-6 py-3 rounded-full font-medium border-2 border-gray-200 hover:border-blue-600 transition-colors flex items-center group text-gray-700 hover:text-blue-600 mx-auto"
              >
                View All Projects
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <a 
                href="https://hotpotone.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl aspect-[4/3] transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
              >
                <img 
                  src="https://i.ibb.co/r2g1Q1Qp/hotpotonegif.gif"
                  alt="Hot Pot One Project Screenshot"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                  <div className="p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <h3 className="text-2xl font-bold text-white mb-2">Hot Pot One</h3>
                    <p className="text-gray-200">Restaurant Website</p>
                  </div>
                </div>
              </a>
              <article className="group relative overflow-hidden rounded-2xl aspect-[4/3] transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <img 
                  src="https://i.ibb.co/Myx4nrSr/concuo-gif.gif"
                  alt="Conuco Takeout Project Screenshot"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                  <div className="p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <h3 className="text-2xl font-bold text-white mb-2">Conuco Takeout</h3>
                    <p className="text-gray-200">Restaurant Website</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3')] opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Business Online?</h2>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
                <div className="grid md:grid-cols-3 gap-6 text-left mb-8">
                  <div className="flex items-start gap-3">
                    <img 
                      src="https://i.ibb.co/B55R3m9L/green-clock-quick-web-design.png"
                      alt="Quick Chat"
                      className="w-12 h-12"
                    />
                    <div>
                      <h3 className="text-white font-semibold">15-Min Chat</h3>
                      <p className="text-blue-100 text-sm">Quick discovery call</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <img 
                      src="https://i.ibb.co/ZRFpJwVh/gold-coin-icon-referencing-affordable-web-design.png"
                      alt="Free Quote"
                      className="w-12 h-12"
                    />
                    <div>
                      <h3 className="text-white font-semibold">Free Design</h3>
                      <p className="text-blue-100 text-sm">See before you buy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Quick Launch</h3>
                      <p className="text-blue-100 text-sm">Live in 1-3 weeks</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleNavigation('contact')}
                  className="bg-white text-blue-600 px-8 py-4 rounded-full font-medium hover:bg-blue-50 transition-all hover:scale-105 inline-flex items-center group text-lg animate-pulse-glow"
                >
                  <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <p className="text-blue-100 text-lg">
                Join hundreds of businesses nationwide that trust us with their digital success. 
                Let's create something amazing together.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {currentPage !== 'landing' && currentPage !== 'refer' && (
        <>
          {/* Navigation */}
          <header>
            <nav className="fixed w-full bg-white/80 backdrop-blur-lg z-50 border-b" aria-label="Main navigation">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                  <button 
                    onClick={() => handleNavigation('home')}
                    className="flex flex-col items-start"
                    aria-label="Go to homepage"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl font-bold tracking-tight">ACE</span>
                      <MousePointer2 
                        className="w-5 h-5 ml-0.5" 
                        style={{ marginTop: '-2px' }}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm font-medium" style={{ marginTop: '-4px' }}>Web Designers</span>
                  </button>

                  {/* Desktop Navigation */}
                  <div className="hidden md:flex space-x-8">
                    <button 
                      onClick={() => handleNavigation('home')}
                      className="text-gray-700 hover:text-black"
                    >
                      Home
                    </button>
                    <button 
                      onClick={() => handleNavigation('about')}
                      className="text-gray-700 hover:text-black"
                    >
                      About Us
                    </button>
                    <button 
                      onClick={() => handleNavigation('services')}
                      className="text-gray-700 hover:text-black"
                    >
                      Services
                    </button>
                    <button 
                      onClick={() => handleNavigation('work')}
                      className="text-gray-700 hover:text-black"
                    >
                      Our Work
                    </button>
                    <button
                      onClick={() => handleNavigation('contact')}
                      className="text-gray-700 hover:text-black"
                    >
                      Contact
                    </button>
                    <button
                      onClick={() => handleNavigation('refer')}
                      className="text-gray-700 hover:text-black"
                    >
                      Refer & Earn
                    </button>
                  </div>

                  {/* Mobile menu button */}
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 rounded-md text-gray-700 hover:text-black"
                    aria-expanded={isMenuOpen}
                    aria-label="Toggle menu"
                  >
                    {isMenuOpen ? (
                      <X className="h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Menu className="h-6 w-6" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile menu */}
              <div
                className={`md:hidden fixed inset-0 bg-white z-[100] transform transition-transform duration-300 ease-in-out ${
                  isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ 
                  height: '100dvh',
                  backgroundColor: 'white'
                }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center p-4 border-b">
                    <button 
                      onClick={() => handleNavigation('home')}
                      className="flex flex-col items-start"
                      aria-label="Go to homepage"
                    >
                      <div className="flex items-center">
                        <span className="text-2xl font-bold tracking-tight">ACE</span>
                        <MousePointer2 
                          className="w-5 h-5 ml-0.5" 
                          style={{ marginTop: '-2px' }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-sm font-medium" style={{ marginTop: '-4px' }}>Web Designers</span>
                    </button>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 rounded-md text-gray-700 hover:text-black"
                      aria-label="Close menu"
                    >
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex flex-col space-y-4 p-4">
                    <button 
                      onClick={() => handleNavigation('home')}
                      className="text-xl py-2 text-gray-700 hover:text-black text-left"
                    >
                      Home
                    </button>
                    <button 
                      onClick={() => handleNavigation('about')}
                      className="text-xl py-2 text-gray-700 hover:text-black text-left"
                    >
                      About Us
                    </button>
                    <button 
                      onClick={() => handleNavigation('services')}
                      className="text-xl py-2 text-gray-700 hover:text-black text-left"
                    >
                      Services
                    </button>
                    <button 
                      onClick={() => handleNavigation('work')}
                      className="text-xl py-2 text-gray-700 hover:text-black text-left"
                    >
                      Our Work
                    </button>
                    <button
                      onClick={() => handleNavigation('contact')}
                      className="text-xl py-2 text-gray-700 hover:text-black text-left"
                    >
                      Contact
                    </button>
                    <button
                      onClick={() => handleNavigation('refer')}
                      className="text-xl py-2 text-gray-700 hover:text-black text-left"
                    >
                      Refer & Earn
                    </button>
                  </div>
                </div>
              </div>
            </nav>
          </header>
        </>
      )}

      {/* Main Content */}
      {renderContent()}

      {currentPage !== 'landing' && currentPage !== 'refer' && (
        <>
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
                    Based in Leominster, MA, serving businesses nationwide. Professional web design and development services helping small business owners across America build their online presence.
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
                        const privacyElement = document.getElementById('privacy-policy');
                        if (privacyElement) {
                          privacyElement.classList.remove('hidden');
                        }
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

          {/* Privacy Policy Modal */}
          <div id="privacy-policy" className="fixed inset-0 bg-black/50 z-50 hidden">
            <div className="max-w-2xl mx-auto mt-20 p-8 bg-white rounded-xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Privacy Policy</h2>
              <div className="prose prose-sm">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                
                <h3>1. Information We Collect</h3>
                <p>We collect information you provide directly to us, including:</p>
                <ul>
                  <li>Name and contact information</li>
                  <li>Business information</li>
                  <li>Communication preferences</li>
                  <li>Project requirements</li>
                </ul>

                <h3>2. How We Use Your Information</h3>
                <p>We use the information we collect to:</p>
                <ul>
                  <li>Provide and improve our services</li>
                  <li>Communicate with you about our services</li>
                  <li>Send you marketing communications (with your consent)</li>
                  <li>Comply with legal obligations</li>
                </ul>

                <h3>3. Information Sharing</h3>
                <p>We do not sell or rent your personal information. We may share your information with:</p>
                <ul>
                  <li>Service providers who assist in our operations</li>
                  <li>Professional advisors</li>
                  <li>Law enforcement when required by law</li>
                </ul>

                <h3>4. Your Rights</h3>
                <p>You have the right to:</p>
                <ul>
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Opt-out of marketing communications</li>
                </ul>

                <h3>5. Contact Us</h3>
                <p>For privacy-related questions, please contact us at:</p>
                <p>Email: support@acewebdesigners.com</p>
                <p>Phone: (774) 315-1951</p>
              </div>
              <button 
                onClick={() => {
                  const privacyElement = document.getElementById('privacy-policy');
                  if (privacyElement) {
                    privacyElement.classList.add('hidden');
                  }
                }}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;