// Dynamic version - original implementation
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const requestAccessToken = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send cookies
});

// Request interceptor (optional, for logging)
requestAccessToken.interceptors.request.use((config) => {
  // You can log request here
  return config;
});

// Response interceptor: automatically refresh on 401
requestAccessToken.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If accessToken expired
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        await axios.post(`${API_URL}/refresh`, {}, { withCredentials: true });

        // Retry original request
        return requestAccessToken(originalRequest);
      } catch (refreshError) {
        // Optionally: redirect to login page
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default requestAccessToken;

