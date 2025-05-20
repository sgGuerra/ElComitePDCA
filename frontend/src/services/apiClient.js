// src/services/apiClient.js

import axios from 'axios';

// Get API URL from environment variable or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create an Axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include auth token in all requests
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add a response interceptor to handle auth errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      console.error('Authentication error (401):', error.response.data);
      // Clear auth data from local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden errors (no permission for resource)
    if (error.response && error.response.status === 403) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.error('Permission denied (403):', {
        url: error.config.url,
        method: error.config.method,
        currentUserRole: user.role || 'unknown',
        availableRoles: user.roles || [],
        detail: error.response.data
      });
      // No redirect - let the component handle the error
    }
    
    return Promise.reject(error);
  }
);

// Export API_URL for use in other files
export { API_URL };
export default apiClient;
