import apiClient from './apiClient';

const notificationService = {
  getUserNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get('/notifications', { params });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await apiClient.put(`/notifications/${id}/mark-read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await apiClient.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      return response.data.data.count;
    } catch (error) {
      throw error;
    }
  }
};

export default notificationService;
