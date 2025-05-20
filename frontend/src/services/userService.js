import apiClient from './apiClient';

const userService = {
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/api/users');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  getUser: async (id) => {
    try {
      const response = await apiClient.get(`/api/users/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/api/users', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await apiClient.put(`/api/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProcessLeaders: async () => {
    try {
      const response = await apiClient.get('/api/users/process-leaders');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },
  
  requestDeactivation: async (reason) => {
    try {
      const response = await apiClient.post('/api/deactivation/request-deactivation', { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getPendingDeactivationRequests: async () => {
    try {
      const response = await apiClient.get('/api/deactivation/deactivation-requests?status=pending');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getAllDeactivationRequests: async (status = null) => {
    try {
      const url = status 
        ? `/api/deactivation/deactivation-requests?status=${status}`
        : '/api/deactivation/deactivation-requests';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getDeactivationRequestDetails: async (requestId) => {
    try {
      const response = await apiClient.get(`/api/deactivation/deactivation-requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  processDeactivationRequest: async (requestId, approve, newLeaderId = null) => {
    try {
      const response = await apiClient.post(`/api/deactivation/deactivation-requests/${requestId}/process`, {
        approve,
        new_leader_id: newLeaderId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default userService;
