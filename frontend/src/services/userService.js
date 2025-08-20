import apiClient from './apiClient';

const userService = {
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/api/users');
      // Check the response structure and return an array
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.warn('Unexpected response format from /api/users:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  },

  getUser: async (id) => {
    try {
      const response = await apiClient.get(`/api/users/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/api/users', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await apiClient.put(`/api/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProcessLeaders: async () => {
    try {
      console.log('Fetching process leaders...');
      const response = await apiClient.get('/api/users/process-leaders');
      console.log('Process leaders response:', response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.warn('Unexpected response format from /api/users/process-leaders:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error in getProcessLeaders:', error);
      // Si el servidor responde con un error 422, podemos intentar obtener usuarios por rol manualmente
      if (error.response && error.response.status === 422) {
        console.log('Intentando fallback para obtener líderes de procesos...');
        try {
          // Intentamos obtener los usuarios con roles de líder o admin directamente
          const leadersResponse = await apiClient.get('/api/users/by-role/process_leader');
          const adminsResponse = await apiClient.get('/api/users/by-role/admin');
          
          // Combinar las respuestas y eliminar duplicados
          const leaders = leadersResponse.data || [];
          const admins = adminsResponse.data || [];
          const allUsers = [...leaders];
          
          // Agregar admins que no estén ya en la lista
          const leaderIds = new Set(leaders.map(l => l.id));
          admins.forEach(admin => {
            if (!leaderIds.has(admin.id)) {
              allUsers.push(admin);
            }
          });
          
          console.log('Leaders obtenidos mediante fallback:', allUsers.length);
          return allUsers;
        } catch (fallbackError) {
          console.error('Error en el fallback para obtener líderes:', fallbackError);
        }
      }
      throw error;
    }
  },
  
  requestDeactivation: async (reason) => {
    try {
      const response = await apiClient.post('/api/deactivation/request-deactivation', { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getPendingDeactivationRequests: async () => {
    try {
      const response = await apiClient.get('/api/deactivation/deactivation-requests?status=pending');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getAllDeactivationRequests: async (status = null) => {
    try {
      const url = status 
        ? `/api/deactivation/deactivation-requests?status=${status}`
        : '/api/deactivation/deactivation-requests';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getDeactivationRequestDetails: async (requestId) => {
    try {
      const response = await apiClient.get(`/api/deactivation/deactivation-requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  processDeactivationRequest: async (requestId, approve, newLeaderId = null) => {
    try {
      const response = await apiClient.post(`/api/deactivation/deactivation-requests/${requestId}/process`, {
        approve,
        new_leader_id: newLeaderId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default userService;
