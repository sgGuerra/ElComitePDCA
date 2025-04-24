import apiClient from './apiClient';

const userService = {
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  getUser: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await apiClient.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProcessLeaders: async () => {
    try {
      const response = await apiClient.get('/users/process-leaders');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
};

export default userService;
