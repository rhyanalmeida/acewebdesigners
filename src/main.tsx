import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize custom URL-based conversion tracking
// This helps Facebook track specific pages without relying solely on events
const setupCustomConversionTracking = () => {
  // Set up a MutationObserver to track when thank-you elements are added to the DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check if any added nodes have conversion-related IDs
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element.id === 'thank-you' || 
                element.id === 'lead-conversion-success' || 
                element.id === 'landing-conversion-tracker') {
              // Fire custom conversion event
              if (window.fbq) {
                window.fbq('track', 'CompleteRegistration');
                window.fbq('trackCustom', 'ConversionPageView', {
                  page_path: window.location.pathname,
                  page_search: window.location.search,
                  page_hash: window.location.hash,
                  conversion_element: element.id
                });
              }
            }
          }
        });
      }
    }
  });

  // Start observing the document body for DOM changes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Check URL parameters on page load
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('conversion') && urlParams.get('conversion') === 'success') {
    if (window.fbq) {
      window.fbq('track', 'CompleteRegistration');
      window.fbq('trackCustom', 'URLConversion', {
        conversion_type: urlParams.get('conversion'),
        page_path: window.location.pathname
      });
    }
  }
};

// Call the setup function after the app is mounted
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Setup conversion tracking after the app is loaded
document.addEventListener('DOMContentLoaded', setupCustomConversionTracking);