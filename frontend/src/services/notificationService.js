import apiClient from './apiClient';

const notificationService = {
  getUserNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/notifications', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await apiClient.put(`/api/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/api/notifications/read-all');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await apiClient.delete(`/api/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/api/notifications/count');
      return response.data.count;
    } catch (error) {
      throw error;
    }
  }
};

export default notificationService;
