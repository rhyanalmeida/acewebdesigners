import React from 'react';

interface GoogleReviewsProps {
  className?: string;
}

const GoogleReviews: React.FC<GoogleReviewsProps> = ({ className = '' }) => {
  return (
    <div className={`google-reviews-widget ${className}`}>
      {/* Elfsight Google Reviews Widget */}
      <iframe
        src="https://015496b1b26f4c789ef3a6549c7123fd.elf.site"
        style={{
          width: '100%',
          height: '600px',
          border: 'none',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
        title="Google Reviews"
        loading="lazy"
      />
    </div>
  );
};

export default GoogleReviews;
