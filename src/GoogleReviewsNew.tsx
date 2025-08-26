import React, { useEffect, useRef, useState } from 'react';
import { Star, CheckCircle2, Users, Award, Clock } from 'lucide-react';

interface GoogleReviewsProps {
  className?: string;
}

const GoogleReviewsNew: React.FC<GoogleReviewsProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    console.log('GoogleReviews component mounted - Location ID: 10311921268967440718');

    // Check if script is already loaded
    const checkScriptLoaded = () => {
      const script = document.querySelector('script[src*="review-widget-carousel-v1.js"]');
      if (script) {
        console.log('Google Reviews script found in DOM');
        setScriptLoaded(true);
        setLoading(false);
        return true;
      }
      return false;
    };

    // If script is already loaded, we're good
    if (checkScriptLoaded()) {
      return;
    }

    // Listen for script load errors
    const handleScriptError = (event: Event) => {
      console.error('Google Reviews script failed to load:', event);
      setError('Failed to load Google Reviews widget');
      setLoading(false);
    };

    // Check for existing script and add error handler
    const existingScript = document.querySelector('script[src*="review-widget-carousel-v1.js"]');
    if (existingScript) {
      existingScript.addEventListener('error', handleScriptError);
      existingScript.addEventListener('load', () => {
        console.log('Google Reviews script loaded successfully');
        setScriptLoaded(true);
        setLoading(false);
      });
    }

    // Set a timeout to stop loading if script doesn't load
    const timeout = setTimeout(() => {
      if (!scriptLoaded) {
        console.log('Google Reviews script loading timeout');
        setLoading(false);
        setError('Google Reviews widget took too long to load');
      }
    }, 15000);

    return () => {
      clearTimeout(timeout);
    };
  }, [scriptLoaded]);

  // Check if widget has content after script loads
  useEffect(() => {
    if (scriptLoaded && containerRef.current) {
      const checkWidgetContent = () => {
        const widget = containerRef.current?.querySelector('.review-widget-carousel');
        if (widget) {
          console.log('Checking widget content...');

          // Give the widget more time to load content
          setTimeout(() => {
            const hasContent = widget.children.length > 0 || widget.textContent?.trim();
            console.log('Widget content check:', {
              hasContent,
              children: widget.children.length,
              textContent: widget.textContent?.substring(0, 100) + '...'
            });

            if (!hasContent) {
              console.log('No reviews available - showing fallback content');
              setShowFallback(true);
            }
          }, 5000); // Increased timeout to 5 seconds
        }
      };

      setTimeout(checkWidgetContent, 3000);
    }
  }, [scriptLoaded]);

  // Show fallback content after 8 seconds if no reviews
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!showFallback && !error) {
        console.log('Showing fallback content after timeout');
        setShowFallback(true);
      }
    }, 8000);

    return () => clearTimeout(fallbackTimer);
  }, [showFallback, error]);

  if (error && !showFallback) {
    return (
      <div className={`google-reviews-widget ${className}`}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="text-blue-800 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Building Your Online Presence</h3>
          <p className="text-blue-700 mb-6">We're working on establishing your Google Reviews. In the meantime, here's what our clients say about our web design services:</p>

          {/* Fallback Testimonials */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm italic mb-2">"Professional team that delivered exactly what we needed for our business website."</p>
              <p className="text-gray-600 text-xs font-medium">- Recent Client</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm italic mb-2">"Fast turnaround and great communication throughout the entire process."</p>
              <p className="text-gray-600 text-xs font-medium">- Satisfied Customer</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`google-reviews-widget ${className}`} ref={containerRef}>
      {loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Reviews...</p>
          <p className="text-gray-500 text-sm mt-2">Location ID: 10311921268967440718</p>
        </div>
      )}

      {/* Google Reviews Widget Carousel */}
      <div
        locationId="10311921268967440718"
        className="review-widget-carousel"
        style={{
          minHeight: loading ? '0' : '400px',
          opacity: loading ? '0' : '1',
          transition: 'opacity 0.5s ease-in-out',
          display: showFallback ? 'none' : 'block'
        }}
      />

      {showFallback && !loading && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="text-blue-800 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-blue-800 mb-4">Thank You for Your Trust</h3>
          <p className="text-blue-700 mb-6">We're establishing your Google Reviews presence. Here's what makes Ace Web Designers stand out:</p>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-800 mb-2">Professional Quality</h4>
              <p className="text-blue-600 text-sm">Every website is crafted with attention to detail and modern design standards.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-800 mb-2">Fast Turnaround</h4>
              <p className="text-green-600 text-sm">Most websites completed within 1-3 weeks of design approval.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-purple-800 mb-2">Client-Focused</h4>
              <p className="text-purple-600 text-sm">Your success is our priority. We work closely with you throughout the process.</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 italic">
              "Ready to establish your online presence? Contact us today to get started on your professional website."
            </p>
          </div>
        </div>
      )}

      {!loading && !showFallback && (
        <div className="text-center mt-4 text-sm text-gray-500">
          Powered by Google Reviews - Location ID: 10311921268967440718
        </div>
      )}
    </div>
  );
};

export default GoogleReviewsNew;
