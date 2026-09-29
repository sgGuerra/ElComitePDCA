import { describe, it, expect, vi, beforeEach } from 'vitest';
import assignmentService from './assignmentService';
import apiClient from './apiClient';

// Mock apiClient
vi.mock('./apiClient', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  };
});

describe('assignmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- assignLeaderToProcess ---
  describe('assignLeaderToProcess', () => {
    it('should assign a leader to a process', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await assignmentService.assignLeaderToProcess(1, 5);
      expect(apiClient.post).toHaveBeenCalledWith('/api/assignments', {
        process_id: 1,
        leader_id: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(assignmentService.assignLeaderToProcess(1, 5)).rejects.toThrow('Err');
    });
  });

  // --- removeLeaderFromProcess ---
  describe('removeLeaderFromProcess', () => {
    it('should remove a leader from a process', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await assignmentService.removeLeaderFromProcess(1, 5);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/assignments/1/5');
      expect(result.deleted).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(assignmentService.removeLeaderFromProcess(1, 5)).rejects.toThrow('Err');
    });
  });

  // --- getProcessLeaders ---
  describe('getProcessLeaders', () => {
    it('should return process leaders', async () => {
      const leaders = [{ id: 1, name: 'Leader' }];
      apiClient.get.mockResolvedValueOnce({ data: leaders });

      const result = await assignmentService.getProcessLeaders(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/assignments/process/1/leaders');
      expect(result).toEqual(leaders);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(assignmentService.getProcessLeaders(1)).rejects.toThrow('Err');
    });
  });

  // --- getLeaderProcesses ---
  describe('getLeaderProcesses', () => {
    it('should return leader processes', async () => {
      const processes = [{ id: 1, name: 'Process 1' }];
      apiClient.get.mockResolvedValueOnce({ data: processes });

      const result = await assignmentService.getLeaderProcesses(5);
      expect(apiClient.get).toHaveBeenCalledWith('/api/assignments/leader/5/processes');
      expect(result).toEqual(processes);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(assignmentService.getLeaderProcesses(5)).rejects.toThrow('Err');
    });
  });

  // --- transferProcessLeadership ---
  describe('transferProcessLeadership', () => {
    it('should transfer leadership', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await assignmentService.transferProcessLeadership(1, 5, 10);
      expect(apiClient.post).toHaveBeenCalledWith('/api/assignments/transfer', {
        process_id: 1,
        old_leader_id: 5,
        new_leader_id: 10,
      });
      expect(result.success).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(assignmentService.transferProcessLeadership(1, 5, 10)).rejects.toThrow('Err');
    });
  });

  // --- getAvailableLeaders ---
  describe('getAvailableLeaders', () => {
    it('should return available leaders', async () => {
      const leaders = [{ id: 1 }];
      apiClient.get.mockResolvedValueOnce({ data: leaders });

      const result = await assignmentService.getAvailableLeaders();
      expect(apiClient.get).toHaveBeenCalledWith('/api/assignments/available-leaders');
      expect(result).toEqual(leaders);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(assignmentService.getAvailableLeaders()).rejects.toThrow('Err');
    });
  });
});
