import { describe, it, expect, vi, beforeEach } from 'vitest';
import opportunityService from './opportunityService';
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

describe('opportunityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- getOpportunitiesByProcess ---
  describe('getOpportunitiesByProcess', () => {
    it('should return opportunities for a process', async () => {
      const opportunities = [{ id: 1, title: 'Opportunity 1' }];
      apiClient.get.mockResolvedValueOnce({ data: opportunities });

      const result = await opportunityService.getOpportunitiesByProcess(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/processes/1/opportunities', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
      }));
      expect(result).toEqual(opportunities);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(opportunityService.getOpportunitiesByProcess(1)).rejects.toThrow('Err');
    });
  });

  // --- getOpportunityById ---
  describe('getOpportunityById', () => {
    it('should return opportunity data', async () => {
      const opp = { id: 1, title: 'Test' };
      apiClient.get.mockResolvedValueOnce({ data: opp });

      const result = await opportunityService.getOpportunityById(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/opportunities/1', expect.any(Object));
      expect(result).toEqual(opp);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(opportunityService.getOpportunityById(1)).rejects.toThrow('Err');
    });
  });

  // --- createOpportunity ---
  describe('createOpportunity', () => {
    it('should create an opportunity', async () => {
      const oppData = { title: 'New Opportunity', process_id: 1 };
      apiClient.post.mockResolvedValueOnce({ data: { id: 1, ...oppData } });

      const result = await opportunityService.createOpportunity(oppData);
      expect(apiClient.post).toHaveBeenCalledWith('/api/opportunities', oppData, expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }));
      expect(result.title).toBe('New Opportunity');
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(opportunityService.createOpportunity({})).rejects.toThrow('Err');
    });
  });

  // --- updateOpportunity ---
  describe('updateOpportunity', () => {
    it('should update an opportunity', async () => {
      apiClient.put.mockResolvedValueOnce({ data: { id: 1, title: 'Updated' } });

      const result = await opportunityService.updateOpportunity(1, { title: 'Updated' });
      expect(apiClient.put).toHaveBeenCalledWith('/api/opportunities/1', { title: 'Updated' }, expect.any(Object));
      expect(result.title).toBe('Updated');
    });

    it('should throw on failure', async () => {
      apiClient.put.mockRejectedValueOnce(new Error('Err'));
      await expect(opportunityService.updateOpportunity(1, {})).rejects.toThrow('Err');
    });
  });

  // --- deleteOpportunity ---
  describe('deleteOpportunity', () => {
    it('should delete an opportunity', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await opportunityService.deleteOpportunity(1);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/opportunities/1', expect.any(Object));
      expect(result.deleted).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(opportunityService.deleteOpportunity(1)).rejects.toThrow('Err');
    });
  });
});
