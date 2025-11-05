// Setup mock API for static mode
import { mockAxios } from './mockApi.js';

// Check if we're in static mode
export const isStaticMode = () => {
  return import.meta.env.VITE_STATIC_MODE === 'true' || 
         import.meta.env.MODE === 'static' ||
         (typeof window !== 'undefined' && window.location.hostname.includes('github.io'));
};

// Get the appropriate API instance
export const getApiInstance = () => {
  if (isStaticMode()) {
    return mockAxios;
  }
  
  // Return null to use real API
  return null;
};

// Mock fetch globally in static mode
if (typeof window !== 'undefined' && isStaticMode()) {
  const originalFetch = window.fetch;
  const { mockFetch } = require('./mockApi.js');
  
  window.fetch = async (url, options) => {
    // Only intercept if it's an API call
    if (typeof url === 'string' && (url.includes('/api/') || url.startsWith('/api'))) {
      return mockFetch(url, options);
    }
    // Otherwise use original fetch
    return originalFetch(url, options);
  };
}

