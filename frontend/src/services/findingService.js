import apiClient from './apiClient';

// Get auth token from local storage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// API service for Finding-related operations
const findingService = {
  /**
   * Get all findings for a process
   * @param {number} processId - Process ID
   * @returns {Promise} Promise with findings data
   */
  getFindingsByProcess: async (processId) => {w
    try {
      const response = await apiClient.get(`/api/processes/${processId}/findings`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching findings for process ${processId}:`, error);
      throw error;
    }
  },

  /**
   * Get finding by ID
   * @param {number} id - Finding ID
   * @returns {Promise} Promise with finding data
   */
  getFindingById: async (id) => {
    try {
      const response = await apiClient.get(`/api/findings/${id}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching finding ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new finding
   * @param {Object} findingData - Finding data to create
   * @returns {Promise} Promise with created finding data
   */
  createFinding: async (findingData) => {
    try {
      const response = await apiClient.post('/api/findings', findingData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating finding:', error);
      throw error;
    }
  },

  /**
   * Update a finding
   * @param {number} id - Finding ID
   * @param {Object} findingData - Finding data to update
   * @returns {Promise} Promise with updated finding data
   */
  updateFinding: async (id, findingData) => {
    try {
      const response = await apiClient.put(`/api/findings/${id}`, findingData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating finding ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a finding
   * @param {number} id - Finding ID
   * @returns {Promise} Promise with deletion result
   */
  deleteFinding: async (id) => {
    try {
      const response = await apiClient.delete(`/api/findings/${id}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting finding ${id}:`, error);
      throw error;
    }
  }
};

export default findingService;