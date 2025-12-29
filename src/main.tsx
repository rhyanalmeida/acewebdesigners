import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

// Initialize monitoring (only in production)
if (process.env.NODE_ENV === 'production') {
  import('./utils/monitoring').then(() => {
    console.log('Monitoring initialized');
  }).catch(error => {
    console.warn('Failed to initialize monitoring:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);