import { describe, it, expect, vi, beforeEach } from 'vitest';
import resourceService from './resourceService';
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

describe('resourceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- uploadResource ---
  describe('uploadResource', () => {
    it('should upload a resource with description', async () => {
      const file = new File(['content'], 'resource.pdf', { type: 'application/pdf' });
      apiClient.post.mockResolvedValueOnce({ data: { id: 1, filename: 'resource.pdf' } });

      const result = await resourceService.uploadResource(5, file, 'My resource');
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/actions/5/resources',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result.filename).toBe('resource.pdf');
    });

    it('should upload a resource without description', async () => {
      const file = new File(['content'], 'resource.pdf');
      apiClient.post.mockResolvedValueOnce({ data: { id: 1 } });

      await resourceService.uploadResource(5, file);
      expect(apiClient.post).toHaveBeenCalled();
    });

    it('should throw on failure', async () => {
      const file = new File([''], 'test.pdf');
      apiClient.post.mockRejectedValueOnce(new Error('Upload failed'));
      await expect(resourceService.uploadResource(5, file, 'desc')).rejects.toThrow('Upload failed');
    });
  });

  // --- getActionResources ---
  describe('getActionResources', () => {
    it('should return resources for an action', async () => {
      const resources = [{ id: 1, filename: 'test.pdf' }];
      apiClient.get.mockResolvedValueOnce({ data: resources });

      const result = await resourceService.getActionResources(5);
      expect(apiClient.get).toHaveBeenCalledWith('/api/actions/5/resources');
      expect(result).toEqual(resources);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(resourceService.getActionResources(5)).rejects.toThrow('Err');
    });
  });

  // --- deleteResource ---
  describe('deleteResource', () => {
    it('should delete a resource', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { deleted: true } });

      const result = await resourceService.deleteResource(10);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/resources/10');
      expect(result.deleted).toBe(true);
    });

    it('should throw on failure', async () => {
      apiClient.delete.mockRejectedValueOnce(new Error('Err'));
      await expect(resourceService.deleteResource(10)).rejects.toThrow('Err');
    });
  });

  // --- downloadResource ---
  describe('downloadResource', () => {
    it('should download a resource with filename from content-disposition', async () => {
      const mockLink = { href: '', setAttribute: vi.fn(), click: vi.fn(), remove: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');

      apiClient.get.mockResolvedValueOnce({
        data: new Blob(['file content']),
        headers: { 'content-disposition': 'attachment; filename="report.pdf"' },
      });

      const result = await resourceService.downloadResource(10);
      expect(apiClient.get).toHaveBeenCalledWith('/api/resources/10/download', { responseType: 'blob' });
      expect(result).toEqual({ success: true, filename: 'report.pdf' });
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should use default filename when no content-disposition', async () => {
      const mockLink = { href: '', setAttribute: vi.fn(), click: vi.fn(), remove: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');

      apiClient.get.mockResolvedValueOnce({
        data: new Blob(['file content']),
        headers: {},
      });

      const result = await resourceService.downloadResource(10);
      expect(result).toEqual({ success: true, filename: 'download' });
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Download failed'));
      await expect(resourceService.downloadResource(10)).rejects.toThrow('Download failed');
    });
  });
});
