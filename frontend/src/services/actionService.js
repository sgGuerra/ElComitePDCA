// src/services/actionService.js

import apiClient from './apiClient';

// API service for Action-related operations
const actionService = {
  /**
   * Get all actions for a process
   * @param {number} processId - Process ID
   * @returns {Promise} Promise with actions data
   */
  getActionsByProcess: async (processId) => {
    try {
      const response = await apiClient.get(`/api/actions/process/${processId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching actions for process ${processId}:`, error);
      throw error;
    }
  },

  /**
   * Get action by ID
   * @param {number} id - Action ID
   * @returns {Promise} Promise with action data
   */
  getActionById: async (id) => {
    try {
      const response = await apiClient.get(`/api/actions/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching action ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new action
   * @param {Object} actionData - Action data to create
   * @returns {Promise} Promise with created action data
   */
  createAction: async (actionData) => {
    try {
      // Ensure process_id is in the actionData
      if (!actionData.process_id) {
        throw new Error('Process ID is required to create an action');
      }
      
      const response = await apiClient.post('/api/actions', actionData);
      return response.data;
    } catch (error) {
      console.error('Error creating action:', error);
      throw error;
    }
  },

  /**
   * Update an action
   * @param {number} id - Action ID
   * @param {Object} actionData - Action data to update
   * @returns {Promise} Promise with updated action data
   */
  updateAction: async (id, actionData) => {
    try {
      const response = await apiClient.put(`/api/actions/${id}`, actionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating action ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update action status
   * @param {number} id - Action ID
   * @param {string} status - New status
   * @param {string} comment - Status change comment
   * @returns {Promise} Promise with result
   */
  updateActionStatus: async (id, status, comment) => {
    try {
      const response = await apiClient.patch(
        `/api/actions/${id}/status`, 
        { status, comment }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating action status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an action
   * @param {number} id - Action ID
   * @returns {Promise} Promise with deletion result
   */
  deleteAction: async (id) => {
    try {
      const response = await apiClient.delete(`/api/actions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting action ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get action history
   * @param {number} id - Action ID
   * @returns {Promise} Promise with action history
   */
  getActionHistory: async (id) => {
    try {
      const response = await apiClient.get(`/api/actions/${id}/history`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching history for action ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get action comments
   * @param {number} id - Action ID
   * @returns {Promise} Promise with action comments
   */
  getActionComments: async (id) => {
    try {
      const response = await apiClient.get(`/api/actions/${id}/comments`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching comments for action ${id}:`, error);
      throw error;
    }
  },

  /**
   * Add comment to action
   * @param {number} id - Action ID
   * @param {string} comment - Comment text
   * @returns {Promise} Promise with comment result
   */
  addActionComment: async (id, comment) => {
    try {
      const response = await apiClient.post(
        `/api/actions/${id}/comments`, 
        { comment }
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to action ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete comment from action
   * @param {number} id - Action ID
   * @param {number} commentId - Comment ID to delete
   * @returns {Promise} Promise with deletion result
   */
  deleteActionComment: async (id, commentId) => {
    try {
      const response = await apiClient.delete(
        `/api/actions/${id}/comments/${commentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting comment ${commentId} from action ${id}:`, error);
      throw error;
    }
  }
};

export default actionService;
