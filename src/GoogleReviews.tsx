import React from 'react';

interface GoogleReviewsProps {
  className?: string;
}

const GoogleReviews: React.FC<GoogleReviewsProps> = ({ className = '' }) => {
  return (
    <div className={`google-reviews-widget ${className}`}>
      {/* Elfsight Google Reviews Widget */}
      <div className="elfsight-app-015496b1-b26f-4c78-9ef3-a6549c7123fd" data-elfsight-app-lazy></div>
    </div>
  );
};

export default GoogleReviews;
