// Static mode utilities
export const isStaticMode = () => {
  return import.meta.env.VITE_STATIC_MODE === 'true' || 
         import.meta.env.MODE === 'static' ||
         (typeof window !== 'undefined' && window.location.hostname.includes('github.io'));
};

// Get the appropriate API client
export const getApiClient = async () => {
  if (isStaticMode()) {
    const { mockAxios } = await import('../mock/mockApi.js');
    return mockAxios;
  }
  const axios = await import('axios');
  return axios.default;
};

