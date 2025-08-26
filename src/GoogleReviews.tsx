import React, { useEffect } from 'react';

interface GoogleReviewsProps {
  className?: string;
}

const GoogleReviews: React.FC<GoogleReviewsProps> = ({ className = '' }) => {
  useEffect(() => {
    // Ensure the Elfsight script is loaded and widget is initialized
    const initWidget = () => {
      if (window.Elfsight) {
        // Widget should auto-initialize, but we can force it if needed
        const widgetElement = document.querySelector('.elfsight-app-015496b1-b26f-4c78-9ef3-a6549c7123fd');
        if (widgetElement && !widgetElement.hasAttribute('data-elfsight-app-initialized')) {
          widgetElement.setAttribute('data-elfsight-app-initialized', 'true');
        }
      }
    };

    // Check if Elfsight is already loaded
    if (window.Elfsight) {
      initWidget();
    } else {
      // Wait for Elfsight to load
      const checkElfsight = setInterval(() => {
        if (window.Elfsight) {
          clearInterval(checkElfsight);
          initWidget();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkElfsight), 10000);
    }
  }, []);

  return (
    <div className={`google-reviews-widget ${className}`}>
      <div 
        className="elfsight-app-015496b1-b26f-4c78-9ef3-a6549c7123fd" 
        data-elfsight-app-lazy
      ></div>
    </div>
  );
};

export default GoogleReviews;
