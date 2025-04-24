import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with authentication
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized - Token expired or invalid
      if (error.response.status === 401) {
        authService.logout();
        window.location.href = '/login';
        return Promise.reject(new Error('Sesión expirada. Por favor inicie sesión nuevamente.'));
      }
      
      // Return the error message from the API if available
      if (error.response.data && error.response.data.message) {
        return Promise.reject(new Error(error.response.data.message));
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
