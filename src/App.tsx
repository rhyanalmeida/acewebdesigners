import React, { useEffect } from 'react'
import {
  MousePointer2,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Users,
  Zap,
  Trophy,
  Star,
  Clock,
  Shield,
  Calculator,
  MessageCircle,
  Plus,
  Minus,
  TrendingUp,
  Globe,
  Smartphone,
  Lock,
  ExternalLink,
} from 'lucide-react'
import Contact from './Contact'
import AboutUs from './AboutUs'
import Work from './Work'
import Services from './Services'
import Landing from './Landing'
import LandingContractors from './LandingContractors'
import Refer from './Refer'
import PrivacyPolicy from './PrivacyPolicy'
import PrivacyPolicyPage from './PrivacyPolicyPage'
import TermsOfService from './TermsOfService'

// Optimized Lazy Image Component
const LazyImage: React.FC<{
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
}> = ({ src, alt, className = '', width, height }) => {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const [imageSrc, setImageSrc] = React.useState('')
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (isInView) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
      }
      img.src = src
    }
  }, [isInView, src])

  return (
    <img
      ref={imgRef}
      src={
        isLoaded
          ? imageSrc
          : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+'
      }
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      width={width}
      height={height}
      loading="lazy"
    />
  )
}

function App() {
  const [currentPage, setCurrentPage] = React.useState('home')
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [pendingScroll, setPendingScroll] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<{ budget?: string; message?: string }>({})
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)
  const [calculatorData, setCalculatorData] = React.useState({
    pages: 1,
    features: [],
    timeline: 'standard',
  })

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement

          // Add animation classes based on data attributes
          if (element.dataset.animate) {
            element.classList.add(element.dataset.animate)
          }

          // Stagger child animations
          if (element.dataset.stagger) {
            const children = element.querySelectorAll('[data-stagger-child]')
            children.forEach((child, index) => {
              setTimeout(() => {
                ;(child as HTMLElement).classList.add('animate-section-reveal')
              }, index * 100)
            })
          }
        }
      })
    }, observerOptions)

    // Observe all elements with data-animate attribute
    const animatedElements = document.querySelectorAll('[data-animate]')
    animatedElements.forEach(el => observer.observe(el))

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.01s')
    }

    return () => observer.disconnect()
  }, [currentPage])

  React.useEffect(() => {
    // Check if the URL path is /landing, /contractorlanding, /refer, /privacypolicy, or /termsofservice and set the page accordingly
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '') // Remove trailing slash and normalize
    if (path === '/contractorlanding' || path.includes('/contractorlanding')) {
      setCurrentPage('contractorlanding')
    } else if (path === '/landing' || path.includes('/landing')) {
      setCurrentPage('landing')
    } else if (path === '/refer' || path.includes('/refer')) {
      setCurrentPage('refer')
    } else if (path === '/privacypolicy' || path.includes('/privacypolicy')) {
      setCurrentPage('privacypolicy')
    } else if (path === '/termsofservice' || path.includes('/termsofservice')) {
      setCurrentPage('termsofservice')
    }

    const handleNavigation = (event: CustomEvent) => {
      const { page, data } = event.detail
      setCurrentPage(page)
      if (data) {
        setFormData(data)
      }
      window.scrollTo(0, 0)
    }

    window.addEventListener('navigate', handleNavigation as EventListener)
    return () => window.removeEventListener('navigate', handleNavigation as EventListener)
  }, [])

  React.useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  React.useEffect(() => {
    if (currentPage === 'home' && pendingScroll) {
      const element = document.getElementById(pendingScroll)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
          setPendingScroll(null)
        }, 100)
      }
    }
  }, [currentPage, pendingScroll])

  const handleNavigation = (page: string, scrollTo?: string) => {
    setIsMenuOpen(false)
    if (page === 'home' && scrollTo) {
      if (currentPage === 'home') {
        document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' })
      } else {
        setPendingScroll(scrollTo)
        setCurrentPage('home')
      }
    } else {
      setCurrentPage(page)
      if (page !== 'contact') {
        setFormData({})
      }
      window.scrollTo(0, 0)
    }
  }

  const testimonials = [
    {
      name: 'Mike Chen',
      business: 'Hot Pot One (Small Restaurant)',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      content:
        "Ace Web Designers created an amazing website for our small restaurant. The ordering system works flawlessly and we've seen a 40% increase in online orders since launch.",
      rating: 5,
      result: '40% increase in online orders',
    },
    {
      name: 'Maria Rodriguez',
      business: 'Conuco Takeout (Small Family Restaurant)',
      image:
        'https://images.unsplash.com/photo-1494790108755-2616b612b647?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      content:
        'The team understood exactly what we needed for our small Dominican cuisine restaurant. Our website beautifully showcases our food and customers love ordering online.',
      rating: 5,
      result: '35% increase in takeout orders',
    },
    {
      name: 'John Dunn',
      business: 'Dunn Construction (Small Contractor)',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      content:
        "Within days, we had a professional website that perfectly represented our small construction business. We're already getting 3x more leads than before!",
      rating: 5,
      result: '3x more qualified leads',
    },
    {
      name: 'Sarah Thompson',
      business: 'Thompson Fitness (Small Personal Training)',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      content:
        'Professional, fast, and exactly what we needed for our small fitness business. Our new website has helped us book 50% more personal training sessions. Highly recommend!',
      rating: 5,
      result: '50% more bookings',
    },
  ]

  const processSteps = [
    {
      step: '01',
      title: 'Discovery Call',
      description:
        'We discuss your business goals, target audience, and website requirements in a 15-minute consultation.',
      icon: <MessageCircle className="w-8 h-8 text-blue-600" />,
      duration: '15 minutes',
    },
    {
      step: '02',
      title: 'Free Design Mockup',
      description:
        'We create a free homepage design mockup so you can see exactly what your website will look like before paying anything.',
      icon: <Star className="w-8 h-8 text-blue-600" />,
      duration: '24-48 hours',
    },
    {
      step: '03',
      title: 'Development & Build',
      description:
        'Once approved, we build your complete website with all pages, features, and functionality you need.',
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      duration: '1-3 weeks',
    },
    {
      step: '04',
      title: 'Launch & Support',
      description:
        'We launch your website and provide ongoing support to ensure everything runs smoothly and continues to drive results.',
      icon: <Trophy className="w-8 h-8 text-blue-600" />,
      duration: 'Ongoing',
    },
  ]

  const faqs = [
    {
      question: 'How much does a website cost?',
      answer:
        'Our websites start at $200 for a basic one-page site, $1,000 for a standard multi-page website, and $1,500 for e-commerce. All packages include hosting, mobile responsiveness, and basic SEO. We provide a free design mockup before you pay anything.',
    },
    {
      question: 'How long does it take to build a website?',
      answer:
        "Most websites are completed within 1-3 weeks. Our 'Website in a Day' option delivers a professional site in just 24 hours. Timeline depends on complexity and how quickly you provide content and feedback.",
    },
    {
      question: 'Do you provide hosting and maintenance?',
      answer:
        "Yes! All our packages include professional hosting. We also offer ongoing maintenance, updates, and support for a small monthly fee. You'll never have to worry about technical issues.",
    },
    {
      question: 'Will my website work on mobile devices?',
      answer:
        'Absolutely! Every website we build is fully responsive and optimized for mobile, tablet, and desktop. With 60%+ of web traffic coming from mobile, this is essential for your success.',
    },
    {
      question: 'Can you help with SEO and getting found on Google?',
      answer:
        "Yes! We include basic SEO setup with every small business website and offer advanced SEO services to help you rank higher on Google. We'll optimize your site for your target keywords and help small business owners get found nationwide.",
    },
    {
      question: "What if I don't like the design?",
      answer:
        "That's why we create a free mockup first! You can see exactly what your website will look like before paying. If you don't love it, there's no obligation to proceed. We want you to be 100% happy.",
    },
    {
      question: 'Do you work with small businesses outside your local area?',
      answer:
        "Yes! We specialize in helping small businesses nationwide. Most of our communication is done remotely through video calls, email, and phone. Location doesn't limit our ability to create an amazing website for your small business.",
    },
    {
      question: 'Can you add e-commerce/online ordering to my website?',
      answer:
        "Definitely! We specialize in e-commerce websites and online ordering systems. Whether you're selling products or services, we can set up secure payment processing and inventory management.",
    },
  ]

  const trustSignals = [
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      stat: '100+',
      label: 'Small Business Websites',
    },
    {
      icon: <Star className="w-6 h-6 text-blue-600" />,
      stat: '5.0',
      label: 'Client Rating',
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      stat: '1-3',
      label: 'Weeks Delivery',
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      stat: '100%',
      label: 'Small Business Focus',
    },
  ]

  const industries = [
    {
      name: 'Small Restaurants & Food Service',
      icon: '🍽️',
      description:
        'Online ordering systems, menu displays, and reservation booking for small restaurants and food businesses',
      projects: '15+ small business projects',
    },
    {
      name: 'Small Construction Companies',
      icon: '🏗️',
      description:
        'Project portfolio galleries, service listings, and lead generation for independent contractors',
      projects: '20+ small business projects',
    },
    {
      name: 'Small Healthcare Practices',
      icon: '⚕️',
      description:
        'Appointment scheduling, service information, and patient portals for small medical practices',
      projects: '12+ small business projects',
    },
    {
      name: 'Small Professional Services',
      icon: '💼',
      description:
        'Service showcases, client testimonials, and consultation booking for small service providers',
      projects: '25+ small business projects',
    },
    {
      name: 'Small Retail & E-commerce',
      icon: '🛍️',
      description:
        'Online stores, inventory management, and secure payment processing for small retailers',
      projects: '18+ small business projects',
    },
    {
      name: 'Small Fitness Studios',
      icon: '💪',
      description:
        'Class scheduling, membership management, and training program booking for small gyms and studios',
      projects: '10+ small business projects',
    },
  ]

  const performanceMetrics = [
    {
      metric: '2.3s',
      label: 'Average Load Time',
      description: 'Google recommends under 3 seconds',
      icon: <Zap className="w-6 h-6 text-green-600" />,
    },
    {
      metric: '99.9%',
      label: 'Uptime Guarantee',
      description: 'Reliable hosting with minimal downtime',
      icon: <Shield className="w-6 h-6 text-green-600" />,
    },
    {
      metric: '95+',
      label: 'Mobile Score',
      description: 'Google PageSpeed mobile optimization',
      icon: <Smartphone className="w-6 h-6 text-green-600" />,
    },
    {
      metric: 'SSL',
      label: 'Security Included',
      description: 'Free SSL certificates for all sites',
      icon: <Lock className="w-6 h-6 text-green-600" />,
    },
  ]

  const guarantees = [
    {
      title: 'See Before You Pay',
      description:
        "No payment until you approve your design. See exactly what you're getting first.",
      icon: <Shield className="w-8 h-8 text-green-600" />,
    },
    {
      title: 'Love It Guarantee',
      description:
        "Only pay if you're thrilled with your design. Your satisfaction is our priority.",
      icon: <Star className="w-8 h-8 text-green-600" />,
    },
    {
      title: 'Quality Promise',
      description: 'Professional design, every time. We deliver excellence you can count on.',
      icon: <Trophy className="w-8 h-8 text-green-600" />,
    },
  ]

  const calculateEstimate = () => {
    let basePrice = 200
    if (calculatorData.pages > 5) basePrice = 1500
    else if (calculatorData.pages > 1) basePrice = 1000

    const featureAddons = calculatorData.features.length * 200
    const rushFee = calculatorData.timeline === 'rush' ? basePrice * 0.5 : 0

    return basePrice + featureAddons + rushFee
  }

  const renderContent = () => {
    if (currentPage === 'contact') {
      return <Contact initialData={formData} />
    }
    if (currentPage === 'about') {
      return <AboutUs />
    }
    if (currentPage === 'work') {
      return <Work />
    }
    if (currentPage === 'services') {
      return <Services />
    }
    if (currentPage === 'landing') {
      return (
        <div className="w-full h-full">
          <Landing />
        </div>
      )
    }
    if (currentPage === 'contractorlanding') {
      return (
        <div className="w-full h-full">
          <LandingContractors />
        </div>
      )
    }
    if (currentPage === 'refer') {
      return <Refer />
    }
    if (currentPage === 'privacy') {
      return <PrivacyPolicy />
    }
    if (currentPage === 'privacypolicy') {
      return <PrivacyPolicyPage />
    }
    if (currentPage === 'termsofservice') {
      return <TermsOfService />
    }

    return (
      <main>
        {/* Hero Section */}
        <section
          className="min-h-[85vh] relative overflow-hidden flex items-center pb-0 pt-20"
          aria-label="Hero"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-white -z-10"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2072&q=80')] opacity-5 -z-20"></div>
          <div className="absolute top-20 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute top-40 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-4000"></div>
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative z-20">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full mb-6 animate-fade-in-down border border-blue-100">
                  <span className="animate-pulse relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                  </span>
                  <span className="text-blue-800 font-semibold">
                    Professional Web Design Services
                  </span>
                </div>
                <h1 className="heading-lg mb-6 text-gradient-blue animate-fade-in-up text-shadow-soft">
                  Small Business Web Design That Converts Visitors Into Customers
                </h1>
                <p className="body-lg text-gray-700 mb-8 animate-fade-in-up delay-200">
                  Get a professional small business website that actually grows your business
                  nationwide. Based in Leominster, MA, we specialize in creating stunning,
                  high-converting websites for small business owners across all 50 states that turn
                  clicks into customers and browsers into buyers. Join 100+ small businesses that
                  trust our web design expertise.
                </p>
                <div className="flex flex-wrap gap-4 relative z-30 animate-fade-in-up delay-300">
                  <button
                    onClick={() => handleNavigation('contact')}
                    className="group bg-gradient-blue-purple text-white px-10 py-5 rounded-full font-bold transition-smooth hover:scale-110 flex items-center shadow-2xl hover-glow animate-gradient-shift text-xl"
                  >
                    <span className="mr-2 animate-slide-right-left">
                      👉 GET MY FREE DESIGN NOW!
                    </span>
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleNavigation('services')}
                    className="px-8 py-4 rounded-full font-semibold border-2 border-gray-300 hover:border-blue-600 transition-smooth flex items-center group text-gray-700 hover:text-blue-600 bg-white hover:bg-blue-50 hover-lift"
                  >
                    View Services
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
              <div className="relative animate-fade-in-right">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl transform rotate-3 animate-levitate"></div>
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2015&q=80"
                  alt="Web Design Illustration"
                  className="rounded-2xl relative shadow-2xl transform hover:-rotate-2 transition-smooth duration-500 w-full object-cover aspect-[4/3] hover-lift"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals Bar */}
        <section className="py-12 bg-gradient-to-r from-white via-blue-50 to-white border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustSignals.map((signal, index) => (
                <div
                  key={index}
                  className={`text-center group hover:bg-white p-6 rounded-2xl transition-smooth hover-lift hover-glow animate-scale-in delay-${index * 100}`}
                >
                  <div className="flex justify-center mb-3 group-hover:scale-125 transition-smooth">
                    {signal.icon}
                  </div>
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                    {signal.stat}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{signal.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries We Serve */}
        <section className="py-24 bg-gradient-to-b from-gray-50 via-purple-50 to-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3')] opacity-3"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-2 rounded-full mb-6 border border-blue-100">
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-semibold">Industries We Serve</span>
              </div>
              <h2 className="heading-xl text-gradient-blue mb-6">
                We Build Professional Websites for Small Businesses in Every Industry Nationwide
              </h2>
              <p className="body-lg text-gray-600 max-w-3xl mx-auto">
                From local restaurants to construction companies, we specialize in helping small
                business owners across America establish their online presence and grow their
                customer base. Our small business web design services are trusted by entrepreneurs
                in all 50 states who need professional websites that drive results and increase
                revenue.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {industries.map((industry, index) => (
                <div
                  key={index}
                  className={`bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-smooth hover-lift group border border-gray-100 animate-fade-in-up delay-${index * 100}`}
                >
                  <div className="text-5xl mb-5 group-hover:scale-125 transition-smooth animate-levitate">
                    {industry.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{industry.name}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{industry.description}</p>
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full text-sm text-blue-700 font-semibold border border-blue-100">
                    {industry.projects}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance & Security */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-blue-50 px-5 py-2 rounded-full mb-6 border border-green-100">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-semibold">Performance & Security</span>
              </div>
              <h2 className="heading-xl text-gradient-blue mb-6">
                Small Business Websites Built for Speed, Security & Success
              </h2>
              <p className="body-lg text-gray-600 max-w-3xl mx-auto">
                Every small business website we build is optimized for maximum performance,
                security, and search engine rankings. Our professional web design ensures your small
                business stands out online and attracts more customers nationwide.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {performanceMetrics.map((metric, index) => (
                <div
                  key={index}
                  className={`text-center bg-gradient-to-br from-gray-50 to-green-50 p-8 rounded-3xl hover:bg-white hover:shadow-2xl transition-smooth group border border-gray-100 hover-lift animate-scale-in delay-${index * 100}`}
                >
                  <div className="bg-gradient-to-br from-green-50 to-green-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-125 transition-smooth shadow-lg">
                    {metric.icon}
                  </div>
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-3">
                    {metric.metric}
                  </div>
                  <div className="font-bold text-gray-900 mb-2 text-lg">{metric.label}</div>
                  <div className="text-sm text-gray-600 leading-relaxed">{metric.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Guarantees */}
        <section className="py-24 bg-gradient-to-b from-green-50 via-blue-50 to-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-blue-50 px-5 py-2 rounded-full mb-6 border border-green-100">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-semibold">Our Guarantees</span>
              </div>
              <h2 className="heading-xl text-gradient-blue mb-6">Zero Risk, All Reward</h2>
              <p className="body-lg text-gray-600 max-w-3xl mx-auto">
                Experience our quality risk-free. We're so confident you'll love your design, we
                guarantee it.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {guarantees.map((guarantee, index) => (
                <div
                  key={index}
                  className={`bg-white p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-smooth hover-lift text-center group border border-green-100 animate-fade-in-up delay-${index * 200}`}
                >
                  <div className="bg-gradient-to-br from-green-50 to-green-100 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-125 transition-smooth shadow-lg animate-levitate">
                    {guarantee.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">{guarantee.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{guarantee.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-gradient-to-b from-gray-50 via-blue-50 to-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-2 rounded-full mb-6 border border-blue-100">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-semibold">Our Process</span>
              </div>
              <h2 className="heading-xl text-gradient-blue mb-6">How It Works</h2>
              <p className="body-lg text-gray-600 max-w-3xl mx-auto">
                Our proven 4-step process ensures you get exactly what you want, when you want it
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <div key={index} className="relative group">
                  <div
                    className={`bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-smooth hover-lift text-center border border-blue-100 animate-fade-in-up delay-${index * 100}`}
                  >
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 group-hover:scale-125 transition-smooth shadow-lg">
                      {step.icon}
                    </div>
                    <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3 tracking-wider">
                      STEP {step.step}
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900">{step.title}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full text-sm text-blue-700 font-semibold border border-blue-100">
                      <Clock className="w-4 h-4" />
                      {step.duration}
                    </div>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-300 transform -translate-y-1/2 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-12 animate-fade-in-up delay-400">
              <button
                onClick={() => handleNavigation('contact')}
                className="bg-gradient-blue-purple text-white px-10 py-5 rounded-full font-bold hover:scale-110 transition-smooth hover:shadow-2xl inline-flex items-center group text-xl animate-glow-pulse"
              >
                <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
                <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
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
                  <label className="block text-lg font-semibold mb-3">
                    How many pages do you need?
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 3, 5, 10].map(pages => (
                      <button
                        key={pages}
                        onClick={() => setCalculatorData({ ...calculatorData, pages })}
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
                    {[
                      'E-commerce',
                      'Blog',
                      'Booking System',
                      'Live Chat',
                      'Custom Forms',
                      'Advanced SEO',
                    ].map(feature => (
                      <button
                        key={feature}
                        onClick={() => {
                          const features = calculatorData.features.includes(feature)
                            ? calculatorData.features.filter(f => f !== feature)
                            : [...calculatorData.features, feature]
                          setCalculatorData({ ...calculatorData, features })
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
                      { value: 'rush', label: 'Rush (1 week)', price: '+50%' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setCalculatorData({ ...calculatorData, timeline: option.value })
                        }
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
                    <span className="text-3xl font-bold text-blue-600">
                      ${calculateEstimate().toLocaleString()}
                    </span>
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
        <section className="py-24 bg-gradient-to-b from-gray-50 via-purple-50 to-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.05),transparent_50%)]"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-blue-50 px-5 py-2 rounded-full mb-6 border border-yellow-100">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-800 font-semibold">Client Success</span>
              </div>
              <h2 className="heading-xl text-gradient-blue mb-6">What Our Clients Say</h2>
              <p className="body-lg text-gray-700 max-w-3xl mx-auto">
                Real results from real businesses who trusted us with their web presence
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-smooth hover-lift group border border-gray-100 animate-fade-in-up delay-${index * 100}`}
                >
                  <div className="flex items-center gap-1 mb-5 group-hover:scale-110 transition-smooth">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed text-base">
                    "{testimonial.content}"
                  </p>
                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex items-center gap-3 mb-4">
                      <LazyImage
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover group-hover:scale-110 transition-smooth shadow-md"
                        width={56}
                        height={56}
                      />
                      <div>
                        <div className="font-bold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.business}</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-3 rounded-2xl border border-green-100">
                      <div className="text-sm font-semibold text-green-700">
                        📈 Result: {testimonial.result}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 animate-gradient-shift"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3')] opacity-10 bg-cover bg-center"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="heading-xl text-white mb-4 text-shadow-bold">WHY CHOOSE US?</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Quick Turnaround */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/15 transition-smooth hover-lift border border-white/20 animate-fade-in-left">
                <LazyImage
                  src="https://i.ibb.co/B55R3m9L/green-clock-quick-web-design.png"
                  alt="Quick Turnaround"
                  className="w-32 h-32 object-contain"
                  width={128}
                  height={128}
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-3">Quick Turnaround</h3>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    Have your full site completed within 1-3 weeks. Need it faster? We offer rush
                    delivery!
                  </p>
                </div>
              </div>

              {/* Amazingly Responsive */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/15 transition-smooth hover-lift border border-white/20 animate-fade-in-right delay-100">
                <LazyImage
                  src="https://i.ibb.co/yBhM31z8/iphone-mobile-desktop-responsive-web-design-in-leominster-ma.png"
                  alt="Responsive Design"
                  className="w-32 h-32 object-contain"
                  width={128}
                  height={128}
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-3">Amazingly Responsive</h3>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    Your site will work perfectly on mobile, tablet, and desktop. Nobody misses out.
                  </p>
                </div>
              </div>

              {/* SEO Optimized */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/15 transition-smooth hover-lift border border-white/20 animate-fade-in-left delay-200">
                <LazyImage
                  src="https://i.ibb.co/mpQkN0s/google-g-icon.png"
                  alt="SEO Optimization"
                  className="w-32 h-32 object-contain"
                  width={128}
                  height={128}
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-3">SEO Optimized</h3>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    We'll optimize your site so you're more likely to show up higher on Google for
                    relevant searches in your industry.
                  </p>
                </div>
              </div>

              {/* Affordable */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/15 transition-smooth hover-lift border border-white/20 animate-fade-in-right delay-300">
                <LazyImage
                  src="https://i.ibb.co/ZRFpJwVh/gold-coin-icon-referencing-affordable-web-design.png"
                  alt="Affordable"
                  className="w-32 h-32 object-contain"
                  width={128}
                  height={128}
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-3">Affordable</h3>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    Other designers overcharge for mediocre work. We provide exceptional quality at
                    fair prices that deliver real ROI.
                  </p>
                </div>
              </div>

              {/* E-Commerce Functions */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/15 transition-smooth hover-lift border border-white/20 animate-fade-in-left delay-400">
                <LazyImage
                  src="https://i.ibb.co/rGPJ8CbN/green-e-commerce-shopping-cart-icon-in-leominster-ma.png"
                  alt="E-Commerce"
                  className="w-32 h-32 object-contain"
                  width={128}
                  height={128}
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-3">E-Commerce Functions</h3>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    Selling products or services online? We can set up secure payment processing and
                    showcase your offerings beautifully.
                  </p>
                </div>
              </div>

              {/* Modern, Beautiful Sites */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/15 transition-smooth hover-lift border border-white/20 animate-fade-in-right delay-500">
                <LazyImage
                  src="https://i.ibb.co/Z6HDV3Sx/coffee-cup-with-hearts.png"
                  alt="Beautiful Design"
                  className="w-32 h-32 object-contain"
                  width={128}
                  height={128}
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-3">Modern, Beautiful Sites</h3>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    Your website will look fantastic and impress potential customers. First
                    impressions matter!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white relative">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-2 rounded-full mb-6 border border-blue-100">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-semibold">FAQ</span>
              </div>
              <h2 className="heading-xl text-gradient-blue mb-6">Frequently Asked Questions</h2>
              <p className="body-lg text-gray-700">
                Get answers to the most common questions about our services
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-blue-300 transition-smooth hover:shadow-lg bg-white animate-fade-in-up delay-${index * 50}`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full text-left p-6 flex justify-between items-center hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-smooth"
                  >
                    <span className="font-bold text-lg text-gray-900">{faq.question}</span>
                    {openFaq === index ? (
                      <Minus className="w-6 h-6 text-blue-600 flex-shrink-0 transition-transform duration-300" />
                    ) : (
                      <Plus className="w-6 h-6 text-gray-400 flex-shrink-0 transition-transform duration-300" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 animate-slide-in-bottom">
                      <p className="text-gray-700 leading-relaxed text-lg">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Work Section */}
        <section
          id="work"
          className="py-20 md:py-24 scroll-mt-16 bg-gradient-to-b from-gray-50 to-white"
          aria-label="Featured Work"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-blue-50 px-5 py-2 rounded-full mb-6 border border-yellow-100">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-semibold">Featured Projects</span>
              </div>
              <h2 className="heading-xl text-gradient-blue mb-6">Our Latest Work</h2>
              <p className="body-lg text-gray-700 max-w-3xl mx-auto mb-8">
                See how we've helped businesses like yours succeed online
              </p>
              <button
                onClick={() => handleNavigation('work')}
                className="px-8 py-4 rounded-full font-semibold border-2 border-gray-300 hover:border-blue-600 transition-smooth flex items-center group text-gray-700 hover:text-blue-600 mx-auto bg-white hover:bg-blue-50 hover-lift shadow-lg"
              >
                View All Projects
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <a
                href="https://hotpotone.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-3xl aspect-[4/3] transform transition-smooth hover-lift hover:shadow-2xl border-4 border-transparent hover:border-blue-400 animate-fade-in-up"
              >
                <img
                  src="https://i.ibb.co/r2g1Q1Qp/hotpotonegif.gif"
                  alt="Hot Pot One Project Screenshot"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-smooth flex items-end">
                  <div className="p-8 transform translate-y-6 group-hover:translate-y-0 transition-smooth">
                    <h3 className="text-3xl font-bold text-white mb-2">Hot Pot One</h3>
                    <p className="text-blue-200 text-lg font-semibold">Restaurant Website</p>
                  </div>
                </div>
              </a>
              <article className="group relative overflow-hidden rounded-3xl aspect-[4/3] transform transition-smooth hover-lift hover:shadow-2xl border-4 border-transparent hover:border-purple-400 animate-fade-in-up delay-100">
                <img
                  src="https://i.ibb.co/Myx4nrSr/concuo-gif.gif"
                  alt="Conuco Takeout Project Screenshot"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-smooth flex items-end">
                  <div className="p-8 transform translate-y-6 group-hover:translate-y-0 transition-smooth">
                    <h3 className="text-3xl font-bold text-white mb-2">Conuco Takeout</h3>
                    <p className="text-purple-200 text-lg font-semibold">Restaurant Website</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3')] opacity-10 animate-gradient-shift"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="heading-xl text-white mb-8 text-shadow-bold animate-fade-in-up">
                Ready to Transform Your Business Online?
              </h2>
              <div className="bg-white/15 backdrop-blur-md rounded-3xl p-10 mb-10 hover:bg-white/20 transition-smooth transform hover-lift shadow-2xl border border-white/20 animate-scale-in">
                <div className="grid md:grid-cols-3 gap-8 text-left mb-10">
                  <div className="flex items-start gap-4 group hover:scale-105 transition-smooth">
                    <LazyImage
                      src="https://i.ibb.co/B55R3m9L/green-clock-quick-web-design.png"
                      alt="Quick Chat"
                      className="w-16 h-16"
                      width={64}
                      height={64}
                    />
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">15-Min Chat</h3>
                      <p className="text-blue-100">Quick discovery call</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group hover:scale-105 transition-smooth">
                    <LazyImage
                      src="https://i.ibb.co/ZRFpJwVh/gold-coin-icon-referencing-affordable-web-design.png"
                      alt="Free Quote"
                      className="w-16 h-16"
                      width={64}
                      height={64}
                    />
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">Free Design</h3>
                      <p className="text-blue-100">See before you buy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group hover:scale-105 transition-smooth">
                    <div className="bg-gradient-to-br from-white/30 to-white/20 p-3 rounded-2xl shadow-lg">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">Quick Launch</h3>
                      <p className="text-blue-100">Live in 1-3 weeks</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleNavigation('contact')}
                  className="bg-white text-blue-600 px-10 py-5 rounded-full font-bold hover:bg-blue-50 transition-smooth hover:scale-110 inline-flex items-center group text-xl shadow-2xl animate-glow-pulse"
                >
                  <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
                  <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <p className="text-blue-100 text-xl leading-relaxed animate-fade-in-up delay-200">
                Join hundreds of businesses nationwide that trust us with their digital success.
                Let's create something amazing together.
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {currentPage !== 'landing' &&
        currentPage !== 'contractorlanding' &&
        currentPage !== 'refer' &&
        currentPage !== 'privacypolicy' &&
        currentPage !== 'termsofservice' && (
          <>
            {/* Navigation */}
            <header>
              <nav
                className="fixed w-full bg-white/90 backdrop-blur-lg z-50 border-b shadow-sm transition-all duration-300"
                aria-label="Main navigation"
              >
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
                      <span className="text-sm font-medium" style={{ marginTop: '-4px' }}>
                        Web Designers
                      </span>
                    </button>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex space-x-8 items-center">
                      <button
                        onClick={() => handleNavigation('home')}
                        className="text-gray-700 hover:text-black transition-colors"
                      >
                        Home
                      </button>
                      <button
                        onClick={() => handleNavigation('about')}
                        className="text-gray-700 hover:text-black transition-colors"
                      >
                        About Us
                      </button>
                      <button
                        onClick={() => handleNavigation('services')}
                        className="text-gray-700 hover:text-black transition-colors"
                      >
                        Services
                      </button>
                      <button
                        onClick={() => handleNavigation('work')}
                        className="text-gray-700 hover:text-black transition-colors"
                      >
                        Our Work
                      </button>
                      <button
                        onClick={() => handleNavigation('contact')}
                        className="text-gray-700 hover:text-black transition-colors"
                      >
                        Contact
                      </button>
                      <button
                        onClick={() => handleNavigation('refer')}
                        className="text-gray-700 hover:text-black transition-colors"
                      >
                        Refer & Earn
                      </button>
                      <button
                        onClick={() => handleNavigation('contact')}
                        className="ml-4 bg-gradient-blue-purple text-white px-6 py-2 rounded-full font-semibold hover:scale-105 transition-smooth shadow-lg animate-glow-pulse"
                      >
                        Free Design
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
                    backgroundColor: 'white',
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
                        <span className="text-sm font-medium" style={{ marginTop: '-4px' }}>
                          Web Designers
                        </span>
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
                        className="text-xl py-2 text-gray-700 hover:text-black text-left transition-colors"
                      >
                        Home
                      </button>
                      <button
                        onClick={() => handleNavigation('about')}
                        className="text-xl py-2 text-gray-700 hover:text-black text-left transition-colors"
                      >
                        About Us
                      </button>
                      <button
                        onClick={() => handleNavigation('services')}
                        className="text-xl py-2 text-gray-700 hover:text-black text-left transition-colors"
                      >
                        Services
                      </button>
                      <button
                        onClick={() => handleNavigation('work')}
                        className="text-xl py-2 text-gray-700 hover:text-black text-left transition-colors"
                      >
                        Our Work
                      </button>
                      <button
                        onClick={() => handleNavigation('contact')}
                        className="text-xl py-2 text-gray-700 hover:text-black text-left transition-colors"
                      >
                        Contact
                      </button>
                      <button
                        onClick={() => handleNavigation('refer')}
                        className="text-xl py-2 text-gray-700 hover:text-black text-left transition-colors"
                      >
                        Refer & Earn
                      </button>
                      <button
                        onClick={() => handleNavigation('contact')}
                        className="mt-4 bg-gradient-blue-purple text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-smooth shadow-lg animate-glow-pulse text-center"
                      >
                        👉 GET MY FREE DESIGN NOW!
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

      {currentPage !== 'landing' &&
        currentPage !== 'contractorlanding' &&
        currentPage !== 'refer' &&
        currentPage !== 'privacypolicy' &&
        currentPage !== 'termsofservice' && (
          <>
            {/* Footer CTA Section */}
            <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden animate-gradient-shift">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3')] opacity-10"></div>
              <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <div className="animate-fade-in-up">
                  <h2 className="heading-lg text-white mb-6 text-shadow-bold">
                    Ready to See Your Website Design?
                  </h2>
                  <p className="text-blue-100 text-xl mb-8 leading-relaxed max-w-2xl mx-auto">
                    Get a free mockup. Love it? Let's build it. Simple as that.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                    <a
                      href="https://www.google.com/search?q=ace+web+designers+reviews"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors"
                    >
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-current" />
                        ))}
                      </div>
                      <span className="font-semibold">5.0 Google Reviews</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <div className="flex items-center gap-2 text-blue-100">
                      <Shield className="w-5 h-5" />
                      <span>SSL Secured & No Credit Card Required</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNavigation('contact')}
                    className="bg-white text-blue-600 px-10 py-5 rounded-full font-bold hover:bg-blue-50 transition-smooth hover:scale-110 inline-flex items-center group text-xl shadow-2xl animate-glow-pulse"
                  >
                    <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
                    <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
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
                      <span className="text-sm text-gray-400" style={{ marginTop: '-4px' }}>
                        Web Designers
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Based in Leominster, MA, serving small businesses nationwide. Professional web
                      design and development services helping small business owners across America
                      build their online presence.
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
                        onClick={() => handleNavigation('privacy')}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Privacy Policy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </>
        )}

      {/* Mobile Sticky CTA Bar - Hidden on landing pages that have their own booking widgets */}
      {currentPage !== 'landing' &&
        currentPage !== 'contractorlanding' &&
        currentPage !== 'refer' &&
        currentPage !== 'privacypolicy' &&
        currentPage !== 'termsofservice' && (
        <>
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-blue-purple p-4 shadow-2xl z-40 border-t-4 border-white/20 animate-gradient-shift">
            <button
              onClick={() => handleNavigation('contact')}
              className="w-full bg-white text-blue-600 py-4 px-6 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-smooth flex items-center justify-center gap-2 animate-pulse-glow-enhanced"
            >
              <span>👉 GET MY FREE DESIGN NOW!</span>
            </button>
          </div>

          {/* Mobile padding to prevent content overlap */}
          <div className="md:hidden h-20"></div>
        </>
      )}
    </div>
  )
}

export default App
