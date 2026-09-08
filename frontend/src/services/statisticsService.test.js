import { describe, it, expect, vi, beforeEach } from 'vitest';
import statisticsService, { generateDummyTrendData } from './statisticsService';
import apiClient from './apiClient';

// Mock apiClient
vi.mock('./apiClient', () => {
  return {
    default: {
      get: vi.fn(),
    }
  };
});

describe('statisticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardStatistics', () => {
    it('should call the API and return data', async () => {
      const mockData = { total: 10 };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await statisticsService.getDashboardStatistics({ processId: 1 });
      
      expect(apiClient.get).toHaveBeenCalledWith('/api/statistics/dashboard', { params: { processId: 1 } });
      expect(result).toEqual(mockData);
    });

    it('should throw an error if API call fails', async () => {
      const error = new Error('API Error');
      apiClient.get.mockRejectedValueOnce(error);

      await expect(statisticsService.getDashboardStatistics()).rejects.toThrow('API Error');
    });
  });

  describe('getProcessStatistics', () => {
    it('should call the API and return data', async () => {
      const mockData = { count: 5 };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await statisticsService.getProcessStatistics(1, { range: 'month' });
      
      expect(apiClient.get).toHaveBeenCalledWith('/api/processes/1/statistics', { params: { range: 'month' } });
      expect(result).toEqual(mockData);
    });

    it('should throw an error if API call fails', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('API Error'));
      await expect(statisticsService.getProcessStatistics(1)).rejects.toThrow('API Error');
    });
  });

  describe('getActionsByStatus', () => {
    it('should call the API and return data', async () => {
      const mockData = [{ status: 'pending', count: 3 }];
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await statisticsService.getActionsByStatus();
      
      expect(apiClient.get).toHaveBeenCalledWith('/api/statistics/actions-by-status', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('should throw an error if API call fails', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Error'));
      await expect(statisticsService.getActionsByStatus()).rejects.toThrow('Error');
    });
  });

  describe('getActionsByType', () => {
    it('should call the API and return data', async () => {
      const mockData = [{ type: 'A', count: 2 }];
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await statisticsService.getActionsByType();
      expect(apiClient.get).toHaveBeenCalledWith('/api/statistics/actions-by-type', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('should throw error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(statisticsService.getActionsByType()).rejects.toThrow('Err');
    });
  });

  describe('getCompletionRate', () => {
    it('should return completion rate data', async () => {
      const mockData = { rate: 80 };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await statisticsService.getCompletionRate();
      expect(apiClient.get).toHaveBeenCalledWith('/api/statistics/completion-rate', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('should throw error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(statisticsService.getCompletionRate()).rejects.toThrow('Err');
    });
  });

  describe('getUpcomingDeadlines', () => {
    it('should return data', async () => {
      const mockData = [{ id: 1 }];
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await statisticsService.getUpcomingDeadlines();
      expect(apiClient.get).toHaveBeenCalledWith('/api/statistics/upcoming-deadlines', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('should throw error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(statisticsService.getUpcomingDeadlines()).rejects.toThrow('Err');
    });
  });

  describe('getActionsOverTime', () => {
    it('should return data', async () => {
      const mockData = [{ date: '2023-01-01' }];
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await statisticsService.getActionsOverTime();
      expect(apiClient.get).toHaveBeenCalledWith('/api/statistics/actions-over-time', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('should throw error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(statisticsService.getActionsOverTime()).rejects.toThrow('Err');
    });
  });

  describe('getPerformanceIndicators', () => {
    it('should return data', async () => {
      const mockData = { kpi: 100 };
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await statisticsService.getPerformanceIndicators();
      expect(apiClient.get).toHaveBeenCalledWith('/api/actions/performance-indicators', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('should throw error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(statisticsService.getPerformanceIndicators()).rejects.toThrow('Err');
    });
  });

  describe('generateDummyTrendData', () => {
    it('should generate data for week', () => {
      const data = generateDummyTrendData('week');
      expect(data).toHaveLength(7);
      expect(data[0]).toHaveProperty('date');
      expect(data[0]).toHaveProperty('completed');
      expect(data[0]).toHaveProperty('pending');
      expect(data[0]).toHaveProperty('overdue');
    });

    it('should generate data for month', () => {
      const data = generateDummyTrendData('month');
      expect(data).toHaveLength(30);
    });

    it('should generate data for quarter', () => {
      const data = generateDummyTrendData('quarter');
      expect(data).toHaveLength(12);
    });

    it('should generate data for year', () => {
      const data = generateDummyTrendData('year');
      expect(data).toHaveLength(12);
    });

    it('should generate default data', () => {
      const data = generateDummyTrendData('unknown');
      expect(data).toHaveLength(30);
    });
  });
});
