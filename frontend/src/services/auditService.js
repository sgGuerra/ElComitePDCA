import apiClient from './apiClient';

const omitEmptyFilters = (filters) => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

const auditService = {
  getAuditorReports: async (status = null) => {
    const response = await apiClient.get('/api/audit/reports', {
      params: omitEmptyFilters({ status }),
    });
    return response.data;
  },

  getAuditReportById: async (reportId) => {
    const response = await apiClient.get(`/api/audit/reports/${reportId}`);
    return response.data;
  },

  createAuditReport: async (reportData) => {
    const response = await apiClient.post('/api/audit/reports', reportData);
    return response.data;
  },

  updateAuditReport: async (reportId, reportData) => {
    const response = await apiClient.put(`/api/audit/reports/${reportId}`, reportData);
    return response.data;
  },

  addReportComment: async () => {
    throw new Error('El backend no tiene un endpoint para comentarios de informes de auditoria');
  },

  generateReportPdf: async (reportId) => {
    const response = await apiClient.get(`/api/audit/reports/${reportId}/download`);
    return response.data;
  },

  // Admin functions
  requestAudit: async (processId) => {
    const response = await apiClient.post(`/api/audit/processes/${processId}/request-audit`);
    return response.data;
  },

  getAuditRequestsForAdmin: async () => {
    const response = await apiClient.get('/api/audit/requests');
    return response.data;
  },

  getAuditReportsForProcess: async (processId) => {
    const response = await apiClient.get('/api/audit/reports', {
      params: { process_id: processId },
    });
    return response.data;
  },

  /**
   * Get audit logs with optional filtering
   * @param {Object} filters - Filter parameters
   * @returns {Promise} Promise with audit logs data
   */
  getAuditLogs: async (filters = {}) => {
    try {
      const response = await apiClient.get('/api/audit', { params: omitEmptyFilters(filters) });
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
      const response = await apiClient.get(`/api/audit/logs/${id}`);
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
    const { format = 'pdf', ...filters } = options;
    try {
      const response = await apiClient.get(`/api/audit/export/${format}`, {
        params: omitEmptyFilters(filters),
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'excel' ? 'xlsx' : format;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `audit_logs_${date}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL?.(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  },
};

export default auditService;
