import React from 'react';
import { Rocket, Palette, Code2, CheckCircle2, Zap } from 'lucide-react';

function Services() {
  React.useEffect(() => {
    document.title = 'Our Services | Web Design & Development in Leominster';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Explore our professional web design and development services in Leominster, MA. From quick launch websites to full e-commerce solutions, we have the perfect package for your business.');
    }
  }, []);

  const packages = [
    {
      icon: <Rocket className="w-8 h-8 text-blue-600" aria-hidden="true" />,
      name: "Website in a Day",
      price: "200",
      monthly: "15",
      description: "Perfect for businesses needing a professional web presence quickly.",
      features: [
        "One-Day Turnaround",
        "Mobile Responsive Design",
        "Basic SEO Setup",
        "Contact Form Integration"
      ]
    },
    {
      icon: <Palette className="w-8 h-8 text-blue-600\" aria-hidden="true" />,
      name: "Standard Website",
      price: "1,000",
      monthly: "30",
      description: "Professional multi-page website solution for established businesses.",
      popular: true,
      features: [
        "Custom Multi-page Design",
        "Advanced SEO Optimization",
        "Content Management System",
        "3 Rounds of Revisions",
        "Social Media Integration",
        "Analytics Dashboard"
      ]
    },
    {
      icon: <Code2 className="w-8 h-8 text-blue-600\" aria-hidden="true" />,
      name: "E-commerce Website",
      price: "1,500",
      monthly: "50",
      description: "Complete e-commerce solution for businesses ready to sell online.",
      features: [
        "Full E-commerce Setup",
        "Product Management System",
        "Secure Payment Integration",
        "Inventory Management",
        "Order Processing System",
        "Customer Account Portal"
      ]
    }
  ];

  const handleGetStarted = (packageName: string) => {
    let budget = 'standard';
    switch (packageName) {
      case 'Website in a Day':
        budget = 'basic';
        break;
      case 'Standard Website':
        budget = 'standard';
        break;
      case 'E-commerce Website':
        budget = 'ecommerce';
        break;
    }

    const event = new CustomEvent('navigate', {
      detail: {
        page: 'contact',
        data: {
          budget,
          message: `I'm interested in the ${packageName} package.`
        }
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="pt-24 pb-16 bg-gradient-to-b from-blue-50 via-purple-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-5 py-2 rounded-full mb-6 border border-blue-100">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-semibold">Our Services</span>
          </div>
          <h1 className="heading-xl text-gradient-blue mb-6">Choose Your Package After Seeing Your Free Design</h1>
          <p className="body-lg text-gray-700 max-w-3xl mx-auto mb-4">
            Professional web solutions tailored to your business needs and goals
          </p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-blue-50 px-6 py-3 rounded-full border border-green-100">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-semibold">All packages include your free design mockup to start</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {packages.map((pkg, index) => (
            <div key={index} className={`bg-white p-10 rounded-3xl shadow-2xl hover:shadow-2xl transition-smooth hover-lift group relative flex flex-col border-2 ${pkg.popular ? 'border-blue-400' : 'border-gray-200'} animate-scale-in delay-${index * 100}`}>
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-blue-purple text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-gradient-shift">
                  ⭐ Most Popular
                </div>
              )}
              <div className="mb-8 p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl w-fit group-hover:scale-125 transition-smooth shadow-lg animate-levitate">
                {pkg.icon}
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">{pkg.name}</h2>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">${pkg.price}</span>
                <span className="text-gray-600 font-semibold">upfront</span>
                <span className="text-sm text-gray-500 ml-2 font-semibold">+ ${pkg.monthly}/month</span>
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">{pkg.description}</p>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-full mb-6 border border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-semibold text-sm">Includes Free Mockup</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {pkg.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className={`flex items-center gap-4 text-gray-700 group/item hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-3 rounded-xl transition-smooth hover-lift border border-transparent hover:border-blue-200 animate-fade-in-up delay-${(index * 3 + featureIndex) * 50}`}>
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 group-hover/item:scale-125 transition-smooth" />
                    <span className="font-semibold">{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleGetStarted(pkg.name)}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-blue-purple text-white font-bold hover:shadow-2xl transition-smooth hover:scale-105 flex items-center justify-center group animate-gradient-shift text-lg"
              >
                <span className="animate-slide-right-left">👉 GET MY FREE DESIGN NOW!</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Services;