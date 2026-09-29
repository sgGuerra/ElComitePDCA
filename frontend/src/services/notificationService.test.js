import { describe, it, expect, vi, beforeEach } from 'vitest';
import notificationService from './notificationService';
import apiClient from './apiClient';

// Mock apiClient
vi.mock('./apiClient', () => {
  return {
    default: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  };
});

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- getUserNotifications ---
  describe('getUserNotifications', () => {
    it('should get notifications without params', async () => {
      const notifications = [{ id: 1, message: 'Test' }];
      apiClient.get.mockResolvedValueOnce({ data: notifications });

      const result = await notificationService.getUserNotifications();
      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications', { params: {} });
      expect(result).toEqual(notifications);
    });

    it('should get notifications with params', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      await notificationService.getUserNotifications({ page: 1, limit: 10 });
      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications', { params: { page: 1, limit: 10 } });
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(notificationService.getUserNotifications()).rejects.toThrow('Err');
    });
  });

  // --- markAsRead ---
  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      apiClient.put.mockResolvedValueOnce({ data: { success: true } });

      const result = await notificationService.markAsRead(1);
      expect(apiClient.put).toHaveBeenCalledWith('/api/notifications/1/read');
      expect(result.success).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.put.mockRejectedValueOnce(new Error('Err'));
      await expect(notificationService.markAsRead(1)).rejects.toThrow('Err');
    });
  });

  // --- markAllAsRead ---
  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      apiClient.put.mockResolvedValueOnce({ data: { success: true } });

      const result = await notificationService.markAllAsRead();
      expect(apiClient.put).toHaveBeenCalledWith('/api/notifications/read-all');
      expect(result.success).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.put.mockRejectedValueOnce(new Error('Err'));
      await expect(notificationService.markAllAsRead()).rejects.toThrow('Err');
    });
  });

  // --- deleteNotification ---
  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await notificationService.deleteNotification(1);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/notifications/1');
      expect(result.deleted).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(notificationService.deleteNotification(1)).rejects.toThrow('Err');
    });
  });

  // --- getUnreadCount ---
  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { count: 5 } });

      const result = await notificationService.getUnreadCount();
      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications/count');
      expect(result).toBe(5);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(notificationService.getUnreadCount()).rejects.toThrow('Err');
    });
  });
});
