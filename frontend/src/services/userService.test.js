import { describe, it, expect, vi, beforeEach } from 'vitest';
import userService from './userService';
import apiClient from './apiClient';

// Mock apiClient
vi.mock('./apiClient', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  };
});

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- getAllUsers ---
  describe('getAllUsers', () => {
    it('should return array when response.data is an array', async () => {
      const users = [{ id: 1, name: 'User 1' }];
      apiClient.get.mockResolvedValueOnce({ data: users });

      const result = await userService.getAllUsers();
      expect(apiClient.get).toHaveBeenCalledWith('/api/users');
      expect(result).toEqual(users);
    });

    it('should return data.data when response.data.data is an array', async () => {
      const users = [{ id: 2 }];
      apiClient.get.mockResolvedValueOnce({ data: { data: users } });

      const result = await userService.getAllUsers();
      expect(result).toEqual(users);
    });

    it('should return empty array for unexpected format', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { count: 5 } });

      const result = await userService.getAllUsers();
      expect(result).toEqual([]);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(userService.getAllUsers()).rejects.toThrow('Network error');
    });
  });

  // --- getUser ---
  describe('getUser', () => {
    it('should return user data', async () => {
      const user = { id: 1, name: 'Test' };
      apiClient.get.mockResolvedValueOnce({ data: { data: user } });

      const result = await userService.getUser(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/users/1');
      expect(result).toEqual(user);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Not found'));
      await expect(userService.getUser(999)).rejects.toThrow('Not found');
    });
  });

  // --- createUser ---
  describe('createUser', () => {
    it('should create user and return response data', async () => {
      const userData = { name: 'New User', email: 'new@test.com' };
      apiClient.post.mockResolvedValueOnce({ data: { id: 10, ...userData } });

      const result = await userService.createUser(userData);
      expect(apiClient.post).toHaveBeenCalledWith('/api/users', userData);
      expect(result.name).toBe('New User');
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(userService.createUser({})).rejects.toThrow('Err');
    });
  });

  // --- updateUser ---
  describe('updateUser', () => {
    it('should update user', async () => {
      apiClient.put.mockResolvedValueOnce({ data: { id: 1, name: 'Updated' } });

      const result = await userService.updateUser(1, { name: 'Updated' });
      expect(apiClient.put).toHaveBeenCalledWith('/api/users/1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw on failure', async () => {
      apiClient.put.mockRejectedValueOnce(new Error('Err'));
      await expect(userService.updateUser(1, {})).rejects.toThrow('Err');
    });
  });

  // --- deleteUser ---
  describe('deleteUser', () => {
    it('should delete user', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await userService.deleteUser(1);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/users/1');
      expect(result.deleted).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(userService.deleteUser(1)).rejects.toThrow('Err');
    });
  });

  // --- getProcessLeaders ---
  describe('getProcessLeaders', () => {
    it('should return array directly when response.data is array', async () => {
      const leaders = [{ id: 1, name: 'Leader' }];
      apiClient.get.mockResolvedValueOnce({ data: leaders });

      const result = await userService.getProcessLeaders();
      expect(apiClient.get).toHaveBeenCalledWith('/api/users/process-leaders');
      expect(result).toEqual(leaders);
    });

    it('should return data.data when response has nested data', async () => {
      const leaders = [{ id: 2 }];
      apiClient.get.mockResolvedValueOnce({ data: { data: leaders } });

      const result = await userService.getProcessLeaders();
      expect(result).toEqual(leaders);
    });

    it('should return empty array for unexpected format', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { count: 3 } });

      const result = await userService.getProcessLeaders();
      expect(result).toEqual([]);
    });

    it('should throw on non-422 error', async () => {
      const error = new Error('Server error');
      error.response = { status: 500 };
      apiClient.get.mockRejectedValueOnce(error);

      await expect(userService.getProcessLeaders()).rejects.toThrow('Server error');
    });
  });

  // --- requestDeactivation ---
  describe('requestDeactivation', () => {
    it('should request deactivation', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await userService.requestDeactivation('Personal reasons');
      expect(apiClient.post).toHaveBeenCalledWith('/api/deactivation/request-deactivation', { reason: 'Personal reasons' });
      expect(result.success).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(userService.requestDeactivation('test')).rejects.toThrow('Err');
    });
  });

  // --- getPendingDeactivationRequests ---
  describe('getPendingDeactivationRequests', () => {
    it('should get pending requests', async () => {
      const requests = [{ id: 1, status: 'pending' }];
      apiClient.get.mockResolvedValueOnce({ data: requests });

      const result = await userService.getPendingDeactivationRequests();
      expect(apiClient.get).toHaveBeenCalledWith('/api/deactivation/deactivation-requests?status=pending');
      expect(result).toEqual(requests);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(userService.getPendingDeactivationRequests()).rejects.toThrow('Err');
    });
  });

  // --- getAllDeactivationRequests ---
  describe('getAllDeactivationRequests', () => {
    it('should get all requests without status filter', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      await userService.getAllDeactivationRequests();
      expect(apiClient.get).toHaveBeenCalledWith('/api/deactivation/deactivation-requests');
    });

    it('should get requests with status filter', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      await userService.getAllDeactivationRequests('approved');
      expect(apiClient.get).toHaveBeenCalledWith('/api/deactivation/deactivation-requests?status=approved');
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(userService.getAllDeactivationRequests()).rejects.toThrow('Err');
    });
  });

  // --- getDeactivationRequestDetails ---
  describe('getDeactivationRequestDetails', () => {
    it('should get request details', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { id: 1 } });

      const result = await userService.getDeactivationRequestDetails(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/deactivation/deactivation-requests/1');
      expect(result.id).toBe(1);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(userService.getDeactivationRequestDetails(1)).rejects.toThrow('Err');
    });
  });

  // --- processDeactivationRequest ---
  describe('processDeactivationRequest', () => {
    it('should approve a request', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await userService.processDeactivationRequest(1, true, 5);
      expect(apiClient.post).toHaveBeenCalledWith('/api/deactivation/deactivation-requests/1/process', {
        approve: true,
        new_leader_id: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should reject a request', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await userService.processDeactivationRequest(1, false);
      expect(apiClient.post).toHaveBeenCalledWith('/api/deactivation/deactivation-requests/1/process', {
        approve: false,
        new_leader_id: null,
      });
      expect(result.success).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(userService.processDeactivationRequest(1, true)).rejects.toThrow('Err');
    });
  });
});
