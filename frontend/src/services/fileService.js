import apiClient from './apiClient';

const fileService = {
  /**
   * Upload a file to an action
   * @param {number} actionId - The action ID
   * @param {File} file - The file to upload
   * @returns {Promise} API response
   */
  uploadFile: async (actionId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post(`/actions/${actionId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get files for an action
   * @param {number} actionId - The action ID
   * @returns {Promise} API response with files data
   */
  getActionFiles: async (actionId) => {
    try {
      const response = await apiClient.get(`/actions/${actionId}/files`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Delete a file from an action
   * @param {number} actionId - The action ID
   * @param {number} fileId - The file ID to delete
   * @returns {Promise} API response
   */
  deleteFile: async (actionId, fileId) => {
    try {
      const response = await apiClient.delete(`/actions/${actionId}/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get file download URL
   * @param {number} actionId - The action ID
   * @param {number} fileId - The file ID
   * @returns {string} File download URL
   */
  getFileUrl: (actionId, fileId) => {
    return `${apiClient.defaults.baseURL}/actions/${actionId}/files/${fileId}/download`;
  },
  
  /**
   * Get file preview URL (for images, PDFs, etc.)
   * @param {number} actionId - The action ID
   * @param {number} fileId - The file ID
   * @returns {string} File preview URL
   */
  getFilePreviewUrl: (actionId, fileId) => {
    return `${apiClient.defaults.baseURL}/actions/${actionId}/files/${fileId}/preview`;
  }
};

export default fileService;