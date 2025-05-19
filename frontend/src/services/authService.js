import apiClient from './apiClient';

// Intercept responses to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  login: async (email, password) => {
    try {
      // Create a FormData object to match OAuth2PasswordRequestForm expected by FastAPI
      const formData = new URLSearchParams();
      formData.append('username', email);  // FastAPI OAuth2 expects 'username', not 'email'
      formData.append('password', password);
      
      const response = await apiClient.post('/auth/login', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        // Create user object from token data
        const user = {
          id: response.data.user_id,
          role: response.data.user_role,
          // Additional properties can be fetched via /auth/me if needed
        };
        localStorage.setItem('user', JSON.stringify(user));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data?.detail || 'Error durante el inicio de sesión';
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  updateCurrentUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  }
};

export default authService;
