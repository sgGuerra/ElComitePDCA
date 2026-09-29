import { describe, it, expect, vi, beforeEach } from 'vitest';
import processService from './processService';
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

describe('processService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- getAllProcesses ---
  describe('getAllProcesses', () => {
    it('should return processes from response.data.data', async () => {
      const processes = [{ id: 1, name: 'Process 1' }];
      apiClient.get.mockResolvedValueOnce({ data: { data: processes } });

      const result = await processService.getAllProcesses();
      expect(apiClient.get).toHaveBeenCalledWith('/api/processes');
      expect(result).toEqual(processes);
    });

    it('should return response.data when .data property is absent', async () => {
      const data = [{ id: 2 }];
      apiClient.get.mockResolvedValueOnce({ data: data });

      const result = await processService.getAllProcesses();
      expect(result).toEqual(data);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(processService.getAllProcesses()).rejects.toThrow('Network error');
    });
  });

  // --- getProcessById ---
  describe('getProcessById', () => {
    it('should return process data', async () => {
      const process = { id: 1, name: 'Test' };
      apiClient.get.mockResolvedValueOnce({ data: { data: process } });

      const result = await processService.getProcessById(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/processes/1');
      expect(result).toEqual(process);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Not found'));
      await expect(processService.getProcessById(999)).rejects.toThrow('Not found');
    });
  });

  // --- createProcess ---
  describe('createProcess', () => {
    it('should create a process and return response data', async () => {
      const processData = { name: 'New Process' };
      const created = { id: 10, ...processData };
      apiClient.post.mockResolvedValueOnce({ data: created });

      const result = await processService.createProcess(processData);
      expect(apiClient.post).toHaveBeenCalledWith('/api/processes', processData);
      expect(result).toEqual(created);
    });

    it('should throw on API error with response details', async () => {
      const error = new Error('Server error');
      error.response = { status: 400, data: { detail: 'Bad request' }, headers: {} };
      apiClient.post.mockRejectedValueOnce(error);

      await expect(processService.createProcess({ name: 'Fail' })).rejects.toThrow('Server error');
    });

    it('should throw on API error without response', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Network error'));
      await expect(processService.createProcess({ name: 'Fail' })).rejects.toThrow('Network error');
    });
  });

  // --- updateProcess ---
  describe('updateProcess', () => {
    it('should update and return response data', async () => {
      const updated = { id: 1, name: 'Updated' };
      apiClient.put.mockResolvedValueOnce({ data: updated });

      const result = await processService.updateProcess(1, { name: 'Updated' });
      expect(apiClient.put).toHaveBeenCalledWith('/api/processes/1', { name: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('should throw on failure', async () => {
      apiClient.put.mockRejectedValueOnce(new Error('Err'));
      await expect(processService.updateProcess(1, {})).rejects.toThrow('Err');
    });
  });

  // --- deleteProcess ---
  describe('deleteProcess', () => {
    it('should delete and return response data', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await processService.deleteProcess(1);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/processes/1');
      expect(result).toEqual({ deleted: true });
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(processService.deleteProcess(1)).rejects.toThrow('Err');
    });
  });

  // --- getProcessStatistics ---
  describe('getProcessStatistics', () => {
    it('should return statistics data', async () => {
      const stats = { total: 10 };
      apiClient.get.mockResolvedValueOnce({ data: { data: stats } });

      const result = await processService.getProcessStatistics(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/processes/1/statistics');
      expect(result).toEqual(stats);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(processService.getProcessStatistics(1)).rejects.toThrow('Err');
    });
  });

  // --- getProcessComments ---
  describe('getProcessComments', () => {
    it('should return comments', async () => {
      const comments = [{ id: 1, comment: 'test' }];
      apiClient.get.mockResolvedValueOnce({ data: { data: comments } });

      const result = await processService.getProcessComments(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/processes/1/comments');
      expect(result).toEqual(comments);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(processService.getProcessComments(1)).rejects.toThrow('Err');
    });
  });

  // --- addProcessComment ---
  describe('addProcessComment', () => {
    it('should post a comment', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { id: 1, comment: 'New' } });

      const result = await processService.addProcessComment(1, 'New');
      expect(apiClient.post).toHaveBeenCalledWith('/api/processes/1/comments', { comment: 'New' });
      expect(result).toEqual({ id: 1, comment: 'New' });
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(processService.addProcessComment(1, 'test')).rejects.toThrow('Err');
    });
  });

  // --- deleteProcessComment ---
  describe('deleteProcessComment', () => {
    it('should delete a comment', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await processService.deleteProcessComment(1, 5);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/processes/1/comments/5');
      expect(result).toEqual({ deleted: true });
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(processService.deleteProcessComment(1, 5)).rejects.toThrow('Err');
    });
  });
});
