import { describe, it, expect, vi, beforeEach } from 'vitest';
import fileService from './fileService';
import apiClient from './apiClient';

// Mock apiClient
vi.mock('./apiClient', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      defaults: { baseURL: 'http://localhost:5000' },
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  };
});

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- uploadFile ---
  describe('uploadFile', () => {
    it('should upload a file', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      apiClient.post.mockResolvedValueOnce({ data: { id: 1, filename: 'test.pdf' } });

      const result = await fileService.uploadFile(5, file);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/actions/5/files',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result.filename).toBe('test.pdf');
    });

    it('should throw on failure', async () => {
      const file = new File([''], 'test.pdf');
      apiClient.post.mockRejectedValueOnce(new Error('Upload failed'));
      await expect(fileService.uploadFile(5, file)).rejects.toThrow('Upload failed');
    });
  });

  // --- getActionFiles ---
  describe('getActionFiles', () => {
    it('should return files for an action', async () => {
      const files = [{ id: 1, filename: 'test.pdf' }];
      apiClient.get.mockResolvedValueOnce({ data: { data: files } });

      const result = await fileService.getActionFiles(5);
      expect(apiClient.get).toHaveBeenCalledWith('/api/actions/5/files');
      expect(result).toEqual(files);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(fileService.getActionFiles(5)).rejects.toThrow('Err');
    });
  });

  // --- deleteFile ---
  describe('deleteFile', () => {
    it('should delete a file', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await fileService.deleteFile(5, 10);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/actions/5/files/10');
      expect(result.deleted).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(fileService.deleteFile(5, 10)).rejects.toThrow('Err');
    });
  });

  // --- getFileUrl ---
  describe('getFileUrl', () => {
    it('should return the correct download URL', () => {
      const url = fileService.getFileUrl(5, 10);
      expect(url).toBe('http://localhost:5000/api/actions/5/files/10/download');
    });
  });

  // --- getFilePreviewUrl ---
  describe('getFilePreviewUrl', () => {
    it('should return the correct preview URL', () => {
      const url = fileService.getFilePreviewUrl(5, 10);
      expect(url).toBe('http://localhost:5000/api/actions/5/files/10/preview');
    });
  });
});
