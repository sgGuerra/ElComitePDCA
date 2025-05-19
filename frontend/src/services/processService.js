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
      const response = await apiClient.get('/processes');
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
      const response = await apiClient.get(`/processes/${id}`);
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
      const response = await apiClient.post('/processes', processData);
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
      const response = await apiClient.put(`/processes/${id}`, processData);
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
      const response = await apiClient.delete(`/processes/${id}`);
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
      const response = await apiClient.get(`/processes/${id}/statistics`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching process statistics for ${id}:`, error);
      throw error;
    }
  }
};

export default processService;
