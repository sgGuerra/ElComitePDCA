import { describe, it, expect, vi, beforeEach } from 'vitest';
import actionService from './actionService';
import apiClient from './apiClient';

// Mock apiClient
vi.mock('./apiClient', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  };
});

describe('actionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- getActionsByProcess ---
  describe('getActionsByProcess', () => {
    it('should return actions data from response.data.data', async () => {
      const mockActions = [{ id: 1, title: 'Action 1' }];
      apiClient.get.mockResolvedValueOnce({ data: { data: mockActions } });

      const result = await actionService.getActionsByProcess(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/actions/process/1');
      expect(result).toEqual(mockActions);
    });

    it('should return response.data when .data property is absent', async () => {
      const mockData = [{ id: 2 }];
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await actionService.getActionsByProcess(2);
      expect(result).toEqual(mockData);
    });

    it('should throw error on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(actionService.getActionsByProcess(1)).rejects.toThrow('Network error');
    });
  });

  // --- getActionById ---
  describe('getActionById', () => {
    it('should return action data', async () => {
      const action = { id: 5, title: 'Test' };
      apiClient.get.mockResolvedValueOnce({ data: { data: action } });

      const result = await actionService.getActionById(5);
      expect(apiClient.get).toHaveBeenCalledWith('/api/actions/5');
      expect(result).toEqual(action);
    });

    it('should throw error on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Not found'));
      await expect(actionService.getActionById(999)).rejects.toThrow('Not found');
    });
  });

  // --- createAction ---
  describe('createAction', () => {
    it('should create an action and return response data', async () => {
      const actionData = { title: 'New Action', process_id: 1 };
      const created = { id: 10, ...actionData };
      apiClient.post.mockResolvedValueOnce({ data: created });

      const result = await actionService.createAction(actionData);
      expect(apiClient.post).toHaveBeenCalledWith('/api/actions', actionData);
      expect(result).toEqual(created);
    });

    it('should throw when process_id is missing', async () => {
      await expect(actionService.createAction({ title: 'No process' })).rejects.toThrow(
        'Process ID is required to create an action'
      );
    });

    it('should throw on API error', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Server error'));
      await expect(actionService.createAction({ title: 'Fail', process_id: 1 })).rejects.toThrow('Server error');
    });
  });

  // --- updateAction ---
  describe('updateAction', () => {
    it('should update and return response data', async () => {
      const updated = { id: 5, title: 'Updated' };
      apiClient.put.mockResolvedValueOnce({ data: updated });

      const result = await actionService.updateAction(5, { title: 'Updated' });
      expect(apiClient.put).toHaveBeenCalledWith('/api/actions/5', { title: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('should throw on failure', async () => {
      apiClient.put.mockRejectedValueOnce(new Error('Err'));
      await expect(actionService.updateAction(5, {})).rejects.toThrow('Err');
    });
  });

  // --- updateActionStatus ---
  describe('updateActionStatus', () => {
    it('should patch status and return response data', async () => {
      apiClient.patch.mockResolvedValueOnce({ data: { success: true } });

      const result = await actionService.updateActionStatus(5, 'completed', 'Done');
      expect(apiClient.patch).toHaveBeenCalledWith('/api/actions/5/status', { status: 'completed', comment: 'Done' });
      expect(result).toEqual({ success: true });
    });

    it('should throw on failure', async () => {
      apiClient.patch.mockRejectedValueOnce(new Error('Err'));
      await expect(actionService.updateActionStatus(5, 'done', '')).rejects.toThrow('Err');
    });
  });

  // --- deleteAction ---
  describe('deleteAction', () => {
    it('should delete and return response data', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await actionService.deleteAction(5);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/actions/5');
      expect(result).toEqual({ deleted: true });
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(actionService.deleteAction(5)).rejects.toThrow('Err');
    });
  });

  // --- getActionHistory ---
  describe('getActionHistory', () => {
    it('should return action history', async () => {
      const history = [{ event: 'created' }];
      apiClient.get.mockResolvedValueOnce({ data: { data: history } });

      const result = await actionService.getActionHistory(5);
      expect(apiClient.get).toHaveBeenCalledWith('/api/actions/5/history');
      expect(result).toEqual(history);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(actionService.getActionHistory(5)).rejects.toThrow('Err');
    });
  });

  // --- getActionComments ---
  describe('getActionComments', () => {
    it('should return comments', async () => {
      const comments = [{ id: 1, comment: 'test' }];
      apiClient.get.mockResolvedValueOnce({ data: { data: comments } });

      const result = await actionService.getActionComments(5);
      expect(apiClient.get).toHaveBeenCalledWith('/api/actions/5/comments');
      expect(result).toEqual(comments);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(actionService.getActionComments(5)).rejects.toThrow('Err');
    });
  });

  // --- addActionComment ---
  describe('addActionComment', () => {
    it('should post a comment and return response data', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { id: 1, comment: 'New comment' } });

      const result = await actionService.addActionComment(5, 'New comment');
      expect(apiClient.post).toHaveBeenCalledWith('/api/actions/5/comments', { comment: 'New comment' });
      expect(result).toEqual({ id: 1, comment: 'New comment' });
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(actionService.addActionComment(5, 'test')).rejects.toThrow('Err');
    });
  });

  // --- deleteActionComment ---
  describe('deleteActionComment', () => {
    it('should delete a comment', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await actionService.deleteActionComment(5, 10);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/actions/5/comments/10');
      expect(result).toEqual({ deleted: true });
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(actionService.deleteActionComment(5, 10)).rejects.toThrow('Err');
    });
  });
});
