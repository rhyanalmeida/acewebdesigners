import React, { useEffect, useRef, useState } from 'react';

interface GoogleReviewsProps {
  className?: string;
}

const GoogleReviews: React.FC<GoogleReviewsProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    console.log('GoogleReviews component mounted');

    // Check if script is already loaded
    const checkScriptLoaded = () => {
      const script = document.querySelector('script[src*="review-widget-carousel-v1.js"]');
      if (script) {
        console.log('Script found in DOM');
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
        console.log('Script loaded successfully');
        setScriptLoaded(true);
        setLoading(false);
      });
    }

    // Set a timeout to stop loading if script doesn't load
    const timeout = setTimeout(() => {
      if (!scriptLoaded) {
        console.log('Script loading timeout');
        setLoading(false);
        setError('Google Reviews widget took too long to load');
      }
    }, 10000);

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
          const hasContent = widget.children.length > 0 || widget.textContent?.trim();
          console.log('Widget content check:', { hasContent, children: widget.children.length, textContent: widget.textContent });

          if (!hasContent) {
            setTimeout(() => {
              const stillHasContent = widget.children.length > 0 || widget.textContent?.trim();
              if (!stillHasContent) {
                console.log('Widget appears to be empty after loading');
                setError('No reviews available for this location');
              }
            }, 3000);
          }
        }
      };

      setTimeout(checkWidgetContent, 2000);
    }
  }, [scriptLoaded]);

  if (error) {
    return (
      <div className={`google-reviews-widget ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-800 mb-2">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Google Reviews Widget</h3>
          <p className="text-yellow-700 text-sm">{error}</p>
          <p className="text-yellow-600 text-xs mt-2">Location ID: 10311921268967440718</p>
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
        </div>
      )}

      {/* Google Reviews Widget Carousel */}
      <div
        locationId="10311921268967440718"
        className="review-widget-carousel"
        style={{
          minHeight: loading ? '0' : '400px',
          opacity: loading ? '0' : '1',
          transition: 'opacity 0.3s ease-in-out'
        }}
      />

      {!loading && (
        <div className="text-center mt-4 text-sm text-gray-500">
          Google Reviews Widget - Location ID: 10311921268967440718
        </div>
      )}
    </div>
  );
};

export default GoogleReviews;
