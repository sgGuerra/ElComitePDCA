import apiClient from './apiClient';

const actionService = {
  getActionsByProcess: async (processId) => {
    try {
      const response = await apiClient.get(`/processes/${processId}/actions`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  getActionsByLeader: async (leaderId) => {
    try {
      const response = await apiClient.get(`/actions/leader/${leaderId}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  getAction: async (id) => {
    try {
      const response = await apiClient.get(`/actions/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  createAction: async (processId, actionData) => {
    try {
      const response = await apiClient.post(`/processes/${processId}/actions`, actionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateAction: async (id, actionData) => {
    try {
      const response = await apiClient.put(`/actions/${id}`, actionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteAction: async (id) => {
    try {
      const response = await apiClient.delete(`/actions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addObservation: async (id, observation) => {
    try {
      const response = await apiClient.post(`/actions/${id}/observations`, { observation });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addComment: async (id, comment) => {
    try {
      const response = await apiClient.post(`/actions/${id}/comments`, { comment });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  uploadFile: async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post(`/actions/${id}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getActionStatistics: async () => {
    try {
      const response = await apiClient.get('/actions/statistics');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
};

export default actionService;
