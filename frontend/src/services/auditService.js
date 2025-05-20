import apiClient from './apiClient';

const auditService = {
  getAuditorReports: async (status = null) => {
    try {
      let url = '/api/audits/reports';
      if (status) {
        url += `?status=${status}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAuditReportById: async (reportId) => {
    try {
      const response = await apiClient.get(`/api/audits/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createAuditReport: async (reportData) => {
    try {
      const response = await apiClient.post('/api/audits/reports', reportData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateAuditReport: async (reportId, reportData) => {
    try {
      const response = await apiClient.put(`/api/audits/reports/${reportId}`, reportData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addReportComment: async (reportId, content) => {
    try {
      const response = await apiClient.post(`/api/audits/reports/${reportId}/comments`, { content });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  generateReportPdf: async (reportId) => {
    try {
      const response = await apiClient.post(`/api/audits/reports/${reportId}/generate-pdf`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin functions
  requestAudit: async (processId, title, description) => {
    try {
      const response = await apiClient.post('/api/audits/request', {
        process_id: processId,
        title,
        description
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAuditRequestsForAdmin: async () => {
    try {
      const response = await apiClient.get('/api/audits/admin/requests');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAuditReportsForProcess: async (processId) => {
    try {
      const response = await apiClient.get(`/api/audits/process/${processId}/reports`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get audit logs with optional filtering
   * @param {Object} filters - Filter parameters
   * @returns {Promise} Promise with audit logs data
   */
  getAuditLogs: async (filters = {}) => {
    try {
      const response = await apiClient.get('/api/audit', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  /**
   * Get audit log details by ID
   * @param {number} id - Audit log ID
   * @returns {Promise} Promise with audit log details
   */
  getAuditLogById: async (id) => {
    try {
      const response = await apiClient.get(`/api/audit/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching audit log ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get audit logs for a specific entity
   * @param {string} entityType - Type of entity (process, action, user)
   * @param {number} entityId - Entity ID
   * @returns {Promise} Promise with entity audit logs
   */
  getEntityAuditLogs: async (entityType, entityId) => {
    try {
      const response = await apiClient.get(`/api/audit/${entityType}/${entityId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching audit logs for ${entityType} ${entityId}:`, error);
      throw error;
    }
  },
  
  /**
   * Export audit logs to PDF, CSV, or Excel
   * @param {Object} options - Export options (filters + format)
   * @returns {Promise} Promise with download URL or blob
   */
  exportAuditLogs: async (options = {}) => {
    try {
      const { format = 'pdf', ...filters } = options;
      
      const response = await apiClient.get(`/api/audit/export/${format}`, {
        params: filters,
        responseType: 'blob'
      });
      
      // Create and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename with current date
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `audit_logs_${date}.${format === 'excel' ? 'xlsx' : format}`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  },
};

export default auditService;
