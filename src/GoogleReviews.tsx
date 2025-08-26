import React from 'react';

interface GoogleReviewsProps {
  className?: string;
}

const GoogleReviews: React.FC<GoogleReviewsProps> = ({ className = '' }) => {
  return (
    <div className={`google-reviews-widget ${className}`}>
      {/* Google Reviews Widget Carousel */}
      <div locationId="10311921268967440718" className="review-widget-carousel"></div>
    </div>
  );
};

export default GoogleReviews;
