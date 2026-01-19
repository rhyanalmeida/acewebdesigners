import React from 'react'
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  Code,
  Briefcase,
  Star,
  Users,
  Zap,
  Brain,
  Target,
  Rocket,
} from 'lucide-react'

function AboutUs() {
  React.useEffect(() => {
    document.title = 'About Our Web Design Team | Expert Developers Nationwide'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Meet our experienced web design and development team. We specialize in creating custom digital solutions that drive business growth and user engagement for companies nationwide.'
      )
    }
  }, [])

  const values = [
    {
      icon: <Target className="w-6 h-6 text-blue-600" />,
      title: 'Results-Driven',
      description: 'We focus on delivering measurable results that help your business grow.',
    },
    {
      icon: <Brain className="w-6 h-6 text-blue-600" />,
      title: 'Innovation',
      description: 'Staying ahead with the latest technologies and design trends.',
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: 'Client-Focused',
      description: 'Your success is our priority. We build lasting partnerships.',
    },
    {
      icon: <Rocket className="w-6 h-6 text-blue-600" />,
      title: 'Fast Delivery',
      description: 'Quick turnaround without compromising on quality.',
    },
  ]

  const expertise = [
    { icon: <Code />, label: 'Custom Development' },
    { icon: <Star />, label: 'UI/UX Design' },
    { icon: <Zap />, label: 'Performance Optimization' },
    { icon: <Briefcase />, label: 'Business Strategy' },
  ]

  return (
    <div className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3')] opacity-10 bg-cover bg-center"></div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="py-20 text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Meet Rhyan & Valerie
            </h1>
            <p className="text-2xl text-blue-100 max-w-2xl mx-auto font-light">
              Your partners in creating exceptional digital experiences
            </p>
          </div>
        </div>
      </section>

      {/* Why We Offer Free Designs Story */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-2 rounded-full mb-6 border border-blue-100">
            <Star className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-semibold">Our Story</span>
          </div>
          <h2 className="heading-xl text-gradient-blue mb-8">Why We Offer Free Designs</h2>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              We believe every business deserves to see their vision come to life before making any
              commitment. Too many business owners have been burned by designers who promise the
              world but deliver disappointment.
            </p>
            <p className="text-xl font-semibold text-blue-600">
              That's why we do things differently. We create your complete design mockup first,
              completely free.
            </p>
            <p>
              When you see exactly what your website will look like, how it will function, and how
              it represents your brand, you can make an informed decision. No surprises, no regrets,
              just confidence in your investment.
            </p>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100 mt-8">
              <p className="text-blue-800 font-semibold text-xl italic">
                "We only succeed when you're absolutely thrilled with your website. The free design
                ensures we're the perfect fit before you invest a single dollar."
              </p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/rhyan.jpg"
                    alt="Rhyan - Lead Developer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Rhyan</p>
                    <p className="text-sm text-gray-600">Lead Developer</p>
                  </div>
                </div>
                <div className="text-gray-400">•</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center border-2 border-purple-200">
                    <span className="text-white font-bold text-lg">V</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Valerie</p>
                    <p className="text-sm text-gray-600">Design Lead</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">About Us</span>
            </div>
            <div className="space-y-6">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Who We Are
              </h2>
              <div className="space-y-6">
                <p className="text-2xl text-gray-600 leading-relaxed">
                  As a duo of passionate web designers, we specialize in crafting stunning websites
                  that transform your business's online presence.
                </p>
                <p className="text-3xl font-semibold text-blue-600 leading-relaxed">
                  Let us turn your vision into a digital masterpiece that captivates your audience
                  and drives growth.
                </p>
              </div>
            </div>
          </div>
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl transform rotate-3"></div>
            <img
              src="/rhyan.jpg"
              alt="Lead Web Designers and Developers"
              className="rounded-2xl relative shadow-xl transform -rotate-2 transition-transform duration-300 hover:rotate-0 w-full h-[300px] object-cover object-center"
              loading="lazy"
            />
          </div>
        </div>

        {/* Values Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Expertise Section */}
        <section className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-12 mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Expertise</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {expertise.map((item, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg text-blue-600 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg">{item.label}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-white rounded-2xl shadow-xl p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Let's Connect</h2>
              <p className="text-xl text-gray-600 mb-8">
                Ready to start your next project? We're here to help turn your vision into reality.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-gray-700">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <a
                      href="mailto:support@acewebdesigners.com"
                      className="hover:text-blue-600 transition-colors block text-lg"
                    >
                      support@acewebdesigners.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-700">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <a
                    href="tel:+17744467375"
                    className="hover:text-blue-600 transition-colors text-lg"
                  >
                    (774) 446-7375
                  </a>
                </div>
                <div className="flex items-center gap-4 text-gray-700">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-lg">
                    Based in Leominster, MA • Serving Businesses Nationwide
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3"
                alt="Office Space"
                className="rounded-xl shadow-lg w-full object-cover aspect-[4/3]"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3')] opacity-10"></div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="heading-xl text-white mb-6 text-shadow-bold">
              Experience Our Work Risk-Free
            </h2>
            <p className="text-blue-100 text-xl mb-8 leading-relaxed">
              See why businesses choose us. Get your free design mockup and experience our quality
              firsthand.
            </p>
            <button
              onClick={() => {
                window.location.href = '/contact'
              }}
              className="bg-white text-blue-600 px-10 py-5 rounded-full font-bold hover:bg-blue-50 transition-smooth hover:scale-110 inline-flex items-center group text-xl shadow-2xl animate-glow-pulse"
            >
              <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
              <Calendar className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AboutUs
