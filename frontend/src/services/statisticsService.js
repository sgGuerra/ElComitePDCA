// src/services/statisticsService.js

import apiClient from './apiClient';

/**
 * Statistics service for retrieving dashboard and analytical data
 */
const statisticsService = {
  /**
   * Get overall dashboard statistics
   * @returns {Promise} Promise with dashboard statistics
   */
  getDashboardStatistics: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/statistics/dashboard', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      throw error;
    }
  },
  
  /**
   * Get statistics for a specific process
   * @param {number} processId - Process ID
   * @returns {Promise} Promise with process statistics
   */
  getProcessStatistics: async (processId, params = {}) => {
    try {
      const response = await apiClient.get(`/api/processes/${processId}/statistics`, { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching statistics for process ${processId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get actions grouped by status
   * @param {Object} params - Optional query parameters
   * @returns {Promise} Promise with actions by status
   */
  getActionsByStatus: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/statistics/actions-by-status', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching actions by status:', error);
      throw error;
    }
  },
  
  /**
   * Get actions grouped by type
   * @param {Object} params - Optional query parameters
   * @returns {Promise} Promise with actions by type
   */
  getActionsByType: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/statistics/actions-by-type', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching actions by type:', error);
      throw error;
    }
  },
  
  /**
   * Get the completion rate of actions
   * @param {Object} params - Optional query parameters
   * @returns {Promise} Promise with completion rate data
   */
  getCompletionRate: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/statistics/completion-rate', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching completion rate:', error);
      throw error;
    }
  },
  
  /**
   * Get actions with upcoming deadlines
   * @param {Object} params - Optional query parameters (limit, processId, dateRange)
   * @returns {Promise} Promise with upcoming deadlines data
   */
  getUpcomingDeadlines: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/statistics/upcoming-deadlines', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      throw error;
    }
  },
  
  /**
   * Get actions over time data for trend analysis
   * @param {Object} params - Optional query parameters (processId, dateRange, groupBy)
   * @returns {Promise} Promise with trend data
   */
  getActionsOverTime: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/statistics/actions-over-time', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching trends data:', error);
      throw error;
    }
  },
  
  /**
   * Get performance indicators for the dashboard
   * @param {Object} params - Optional query parameters
   * @returns {Promise} Promise with KPI data
   */
  getPerformanceIndicators: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/actions/performance-indicators', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching performance indicators:', error);
      throw error;
    }
  }
};

/**
 * Generate dummy trend data for development purposes
 * @param {string} dateRange - 'week', 'month', 'quarter', or 'year'
 * @returns {Array} Array of trend data points
 */
const generateDummyTrendData = (dateRange) => {
  const now = new Date();
  const data = [];
  let points = 0;
  
  switch (dateRange) {
    case 'week':
      points = 7;
      break;
    case 'month':
      points = 30;
      break;
    case 'quarter':
      points = 12; // Weekly data points for a quarter
      break;
    case 'year':
      points = 12; // Monthly data points for a year
      break;
    default:
      points = 30;
  }
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    let dateStr = '';
    
    if (dateRange === 'year') {
      date.setMonth(date.getMonth() - i);
      dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } else if (dateRange === 'quarter') {
      date.setDate(date.getDate() - (i * 7));
      dateStr = `Semana ${Math.floor((date.getDate() - 1) / 7) + 1} ${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } else {
      date.setDate(date.getDate() - i);
      dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    
    const completedBase = Math.floor(Math.random() * 5) + 3;
    const pendingBase = Math.floor(Math.random() * 7) + 5;
    const overdueBase = Math.floor(Math.random() * 3);
    
    data.push({
      date: dateStr,
      completed: completedBase + Math.floor(Math.random() * 3),
      pending: pendingBase + Math.floor(Math.random() * 4),
      overdue: overdueBase + Math.floor(Math.random() * 2)
    });
  }
  
  return data;
};

export default statisticsService;
