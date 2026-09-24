import { describe, it, expect, vi, beforeEach } from 'vitest';
import findingService from './findingService';
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

// Mock localStorage for getAuthToken
const localStorageMock = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('findingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- getFindingsByProcess ---
  describe('getFindingsByProcess', () => {
    it('should return findings for a process', async () => {
      const findings = [{ id: 1, title: 'Finding 1' }];
      apiClient.get.mockResolvedValueOnce({ data: findings });

      const result = await findingService.getFindingsByProcess(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/processes/1/findings', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
      }));
      expect(result).toEqual(findings);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(findingService.getFindingsByProcess(1)).rejects.toThrow('Err');
    });
  });

  // --- getFindingById ---
  describe('getFindingById', () => {
    it('should return finding data', async () => {
      const finding = { id: 1, title: 'Test' };
      apiClient.get.mockResolvedValueOnce({ data: finding });

      const result = await findingService.getFindingById(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/findings/1', expect.any(Object));
      expect(result).toEqual(finding);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(findingService.getFindingById(1)).rejects.toThrow('Err');
    });
  });

  // --- createFinding ---
  describe('createFinding', () => {
    it('should create a finding', async () => {
      const findingData = { title: 'New Finding', process_id: 1 };
      apiClient.post.mockResolvedValueOnce({ data: { id: 1, ...findingData } });

      const result = await findingService.createFinding(findingData);
      expect(apiClient.post).toHaveBeenCalledWith('/api/findings', findingData, expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }));
      expect(result.title).toBe('New Finding');
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(findingService.createFinding({})).rejects.toThrow('Err');
    });
  });

  // --- updateFinding ---
  describe('updateFinding', () => {
    it('should update a finding', async () => {
      apiClient.put.mockResolvedValueOnce({ data: { id: 1, title: 'Updated' } });

      const result = await findingService.updateFinding(1, { title: 'Updated' });
      expect(apiClient.put).toHaveBeenCalledWith('/api/findings/1', { title: 'Updated' }, expect.any(Object));
      expect(result.title).toBe('Updated');
    });

    it('should throw on failure', async () => {
      apiClient.put.mockRejectedValueOnce(new Error('Err'));
      await expect(findingService.updateFinding(1, {})).rejects.toThrow('Err');
    });
  });

  // --- deleteFinding ---
  describe('deleteFinding', () => {
    it('should delete a finding', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await findingService.deleteFinding(1);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/findings/1', expect.any(Object));
      expect(result.deleted).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(findingService.deleteFinding(1)).rejects.toThrow('Err');
    });
  });
});
