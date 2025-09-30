import React, { useEffect } from 'react';
import { CALENDLY_URL } from './config';
import { Mail, Phone, Calendar, MapPin } from 'lucide-react';

interface ContactProps {
  initialData?: {
    budget?: string;
    message?: string;
  };
}

// Define global fbq for TypeScript
declare global {
  interface Window {
    fbq: any;
    Calendly: any;
  }
}

function Contact({ initialData }: ContactProps) {
  useEffect(() => {
    document.title = 'Schedule a Consultation | Web Design Services Nationwide';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Schedule a free consultation with our web design team. Book a time to discuss your project needs and learn how we can help grow your online presence.');
    }

    // Track with Facebook Pixel
    if (window.fbq) {
      window.fbq('trackCustom', 'CalendlyContactView', {
        page: 'contact',
        budget: initialData?.budget || 'unknown'
      });
    }
  }, [initialData]);

  useEffect(() => {
    // Properly load the Calendly script
    const head = document.querySelector('head');
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => {
      if (window.fbq) {
        window.fbq('trackCustom', 'CalendlyWidgetLoaded', {
          page: 'contact',
          location: 'contact_page'
        });
      }
    };
    
    head?.appendChild(script);

    return () => {
      // Clean up script if component unmounts
      if (head?.contains(script)) {
        head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="pt-24 pb-16 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-4">
        <div className="space-y-12">
          {/* Contact Form - Replaced with Calendly */}
          <div className="bg-white rounded-2xl shadow-lg p-8 animate-pulse-glow">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Schedule Your Free Consultation</h1>
              <p className="text-gray-600">Book a time to discuss your project and get your <span className="font-bold text-blue-600">FREE</span> design mockup!</p>
              
              {initialData?.budget && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-800">
                  <p>You selected the <span className="font-bold">
                    {initialData.budget === 'basic' ? 'Website in a Day ($200)' : 
                     initialData.budget === 'standard' ? 'Standard Website ($1,000)' : 
                     initialData.budget === 'ecommerce' ? 'E-commerce Website ($1,500)' : 
                     'Custom Project'}</span> package.
                  </p>
                  {initialData.message && <p className="mt-2">"<i>{initialData.message}</i>"</p>}
                </div>
              )}
            </div>
            
            {/* Calendly inline widget */}
            <div 
              className="calendly-inline-widget" 
              data-url={CALENDLY_URL} 
              style={{minWidth:"320px", height:"700px"}}
            />
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg p-8 relative overflow-hidden transform hover:scale-105 transition-all duration-500">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2072&q=80')] opacity-10"></div>
            <div className="relative">
              <h2 className="text-2xl font-semibold mb-8 text-white">Ready to Connect?</h2>
              <div className="grid md:grid-cols-1 gap-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 hover:bg-white/20 transition-colors group transform hover:-translate-x-1 hover:translate-y-1 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Email</p>
                      <a href="mailto:rhyan@acewebdesigners.com" className="text-white hover:text-blue-200 transition-colors">
                        rhyan@acewebdesigners.com
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 hover:bg-white/20 transition-colors group transform hover:-translate-x-1 hover:translate-y-1 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Phone</p>
                      <a href="tel:+17743151951" className="text-white hover:text-blue-200 transition-colors">
                        (774) 315-1951
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 hover:bg-white/20 transition-colors group transform hover:-translate-x-1 hover:translate-y-1 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Hours</p>
                      <span className="text-white">Mon - Fri, 9 AM - 5 PM EST</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 hover:bg-white/20 transition-colors group transform hover:-translate-x-1 hover:translate-y-1 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Service Area</p>
                      <span className="text-white">Nationwide Service</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;