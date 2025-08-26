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
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800 font-medium">Our Services</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Perfect Package</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Professional web solutions tailored to your business needs and goals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 group relative flex flex-col">
              {pkg.popular && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium animate-pulse-glow">
                  Popular
                </div>
              )}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl w-fit group-hover:scale-110 transition-transform">
                {pkg.icon}
              </div>
              <h2 className="text-2xl font-bold mb-2">{pkg.name}</h2>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-blue-600">${pkg.price}</span>
                <span className="text-gray-600">upfront</span>
                <span className="text-sm text-gray-500 ml-2">+ ${pkg.monthly}/month</span>
              </div>
              <p className="text-gray-600 mb-6">{pkg.description}</p>
              <ul className="space-y-4 mb-8 flex-grow">
                {pkg.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3 text-gray-600 group/item hover:bg-blue-50 p-1 rounded transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleGetStarted(pkg.name)}
                className="w-full py-3 px-6 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors hover:scale-105 flex items-center justify-center group animate-pulse-glow"
              >
                <span className="animate-slide-right-left">Get Started</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Services;