import apiClient from './apiClient';

const auditService = {
  getAuditorReports: async (status = null) => {
    try {
      const url = '/api/audit/reports';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAuditReportById: async (reportId) => {
    try {
      const response = await apiClient.get(`/api/audit/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createAuditReport: async (reportData) => {
    try {
      const response = await apiClient.post('/api/audit/reports', reportData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateAuditReport: async (reportId, reportData) => {
    try {
      const response = await apiClient.put(`/api/audit/reports/${reportId}`, reportData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addReportComment: async (reportId, content) => {
    throw new Error('El backend no tiene un endpoint para comentarios de informes de auditoria');
  },

  generateReportPdf: async (reportId) => {
    try {
      const response = await apiClient.get(`/api/audit/reports/${reportId}/download`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin functions
  requestAudit: async (processId, title, description) => {
    try {
      const response = await apiClient.post(`/api/audit/processes/${processId}/request-audit`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAuditRequestsForAdmin: async () => {
    throw new Error('El backend no tiene un endpoint para solicitudes de auditoria del administrador');
  },

  getAuditReportsForProcess: async (processId) => {
    try {
      const response = await apiClient.get('/api/audit/reports', {
        params: { process_id: processId },
      });
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
    throw new Error('El backend no tiene endpoints de exportacion PDF o Excel');
  },
};

export default auditService;
