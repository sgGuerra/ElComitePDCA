import apiClient from './apiClient';

// Get auth token from local storage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// API service for Opportunity-related operations
const opportunityService = {
  /**
   * Get all opportunities for a process
   * @param {number} processId - Process ID
   * @returns {Promise} Promise with opportunities data
   */
  getOpportunitiesByProcess: async (processId) => {
    try {
      const response = await apiClient.get(`/api/processes/${processId}/opportunities`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching opportunities for process ${processId}:`, error);
      throw error;
    }
  },

  /**
   * Get opportunity by ID
   * @param {number} id - Opportunity ID
   * @returns {Promise} Promise with opportunity data
   */
  getOpportunityById: async (id) => {
    try {
      const response = await apiClient.get(`/api/opportunities/${id}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching opportunity ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new opportunity
   * @param {Object} opportunityData - Opportunity data to create
   * @returns {Promise} Promise with created opportunity data
   */
  createOpportunity: async (opportunityData) => {
    try {
      const response = await apiClient.post('/api/opportunities', opportunityData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  },

  /**
   * Update an opportunity
   * @param {number} id - Opportunity ID
   * @param {Object} opportunityData - Opportunity data to update
   * @returns {Promise} Promise with updated opportunity data
   */
  updateOpportunity: async (id, opportunityData) => {
    try {
      const response = await apiClient.put(`/api/opportunities/${id}`, opportunityData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating opportunity ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an opportunity
   * @param {number} id - Opportunity ID
   * @returns {Promise} Promise with deletion result
   */
  deleteOpportunity: async (id) => {
    try {
      const response = await apiClient.delete(`/api/opportunities/${id}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting opportunity ${id}:`, error);
      throw error;
    }
  }
};

export default opportunityService;