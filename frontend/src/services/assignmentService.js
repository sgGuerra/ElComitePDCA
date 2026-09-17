import apiClient from './apiClient';

const assignmentService = {
  assignLeaderToProcess: async (processId, leaderId) => {
    try {
      const response = await apiClient.post('/api/assignments', {
        process_id: processId,
        leader_id: leaderId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  removeLeaderFromProcess: async (processId, leaderId) => {
    try {
      const response = await apiClient.delete(`/api/assignments/${processId}/${leaderId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProcessLeaders: async (processId) => {
    try {
      const response = await apiClient.get(`/api/assignments/process/${processId}/leaders`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getLeaderProcesses: async (leaderId) => {
    try {
      const response = await apiClient.get(`/api/assignments/leader/${leaderId}/processes`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  transferProcessLeadership: async (processId, oldLeaderId, newLeaderId) => {
    try {
      const response = await apiClient.post('/api/assignments/transfer', {
        process_id: processId,
        old_leader_id: oldLeaderId,
        new_leader_id: newLeaderId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAvailableLeaders: async () => {
    try {
      const response = await apiClient.get('/api/assignments/available-leaders');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default assignmentService;
