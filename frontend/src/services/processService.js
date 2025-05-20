// src/services/processService.js

import apiClient from './apiClient';

// API service for Process-related operations
const processService = {
  /**
   * Get all processes
   * @returns {Promise} Promise with processes data
   */
  getAllProcesses: async () => {
    try {
      const response = await apiClient.get('/api/processes');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching processes:', error);
      throw error;
    }
  },

  /**
   * Get process by ID
   * @param {number} id - Process ID
   * @returns {Promise} Promise with process data
   */
  getProcessById: async (id) => {
    try {
      const response = await apiClient.get(`/api/processes/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching process ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new process
   * @param {Object} processData - Process data to create
   * @returns {Promise} Promise with created process data
   */
  createProcess: async (processData) => {
    try {
      const response = await apiClient.post('/api/processes', processData);
      return response.data;
    } catch (error) {
      console.error('Error creating process:', error);
      throw error;
    }
  },

  /**
   * Update a process
   * @param {number} id - Process ID
   * @param {Object} processData - Process data to update
   * @returns {Promise} Promise with updated process data
   */
  updateProcess: async (id, processData) => {
    try {
      const response = await apiClient.put(`/api/processes/${id}`, processData);
      return response.data;
    } catch (error) {
      console.error(`Error updating process ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a process
   * @param {number} id - Process ID
   * @returns {Promise} Promise with deletion result
   */
  deleteProcess: async (id) => {
    try {
      const response = await apiClient.delete(`/api/processes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting process ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get process statistics
   * @param {number} id - Process ID
   * @returns {Promise} Promise with process statistics
   */
  getProcessStatistics: async (id) => {
    try {
      const response = await apiClient.get(`/api/processes/${id}/statistics`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching process statistics for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get process comments
   * @param {number} id - Process ID
   * @returns {Promise} Promise with process comments
   */
  getProcessComments: async (id) => {
    try {
      const response = await apiClient.get(`/api/processes/${id}/comments`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching comments for process ${id}:`, error);
      throw error;
    }
  },

  /**
   * Add comment to process
   * @param {number} id - Process ID
   * @param {string} comment - Comment text
   * @returns {Promise} Promise with comment result
   */
  addProcessComment: async (id, comment) => {
    try {
      const response = await apiClient.post(
        `/api/processes/${id}/comments`, 
        { comment }
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to process ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete comment from process
   * @param {number} id - Process ID
   * @param {number} commentId - Comment ID to delete
   * @returns {Promise} Promise with deletion result
   */
  deleteProcessComment: async (id, commentId) => {
    try {
      const response = await apiClient.delete(
        `/api/processes/${id}/comments/${commentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting comment ${commentId} from process ${id}:`, error);
      throw error;
    }
  }
};

export default processService;
