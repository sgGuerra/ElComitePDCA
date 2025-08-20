import apiClient from './apiClient';

const resourceService = {
  uploadResource: async (actionId, file, description) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description || '');

      const response = await apiClient.post(`/api/actions/${actionId}/resources`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getActionResources: async (actionId) => {
    try {
      const response = await apiClient.get(`/api/actions/${actionId}/resources`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteResource: async (resourceId) => {
    try {
      const response = await apiClient.delete(`/api/resources/${resourceId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  downloadResource: async (resourceId) => {
    try {
      const response = await apiClient.get(`/api/resources/${resourceId}/download`, {
        responseType: 'blob',
      });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const disposition = response.headers['content-disposition'];
      let filename = 'download';
      
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true, filename };
    } catch (error) {
      throw error;
    }
  }
};

export default resourceService;
