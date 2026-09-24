import { describe, it, expect, vi, beforeEach } from 'vitest';
import auditService from './auditService';
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

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- getAuditorReports ---
  describe('getAuditorReports', () => {
    it('should get reports without status filter', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });
      await auditService.getAuditorReports();
      expect(apiClient.get).toHaveBeenCalledWith('/api/audits/reports');
    });

    it('should get reports with status filter', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });
      await auditService.getAuditorReports('pending');
      expect(apiClient.get).toHaveBeenCalledWith('/api/audits/reports?status=pending');
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.getAuditorReports()).rejects.toThrow('Err');
    });
  });

  // --- getAuditReportById ---
  describe('getAuditReportById', () => {
    it('should return report data', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { id: 1 } });
      const result = await auditService.getAuditReportById(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/audits/reports/1');
      expect(result.id).toBe(1);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.getAuditReportById(1)).rejects.toThrow('Err');
    });
  });

  // --- createAuditReport ---
  describe('createAuditReport', () => {
    it('should create a report', async () => {
      const reportData = { title: 'Audit Report' };
      apiClient.post.mockResolvedValueOnce({ data: { id: 1, ...reportData } });

      const result = await auditService.createAuditReport(reportData);
      expect(apiClient.post).toHaveBeenCalledWith('/api/audits/reports', reportData);
      expect(result.title).toBe('Audit Report');
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.createAuditReport({})).rejects.toThrow('Err');
    });
  });

  // --- updateAuditReport ---
  describe('updateAuditReport', () => {
    it('should update a report', async () => {
      apiClient.put.mockResolvedValueOnce({ data: { id: 1, title: 'Updated' } });

      const result = await auditService.updateAuditReport(1, { title: 'Updated' });
      expect(apiClient.put).toHaveBeenCalledWith('/api/audits/reports/1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should throw on failure', async () => {
      apiClient.put.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.updateAuditReport(1, {})).rejects.toThrow('Err');
    });
  });

  // --- addReportComment ---
  describe('addReportComment', () => {
    it('should add a comment to a report', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { id: 1, content: 'Comment' } });

      const result = await auditService.addReportComment(1, 'Comment');
      expect(apiClient.post).toHaveBeenCalledWith('/api/audits/reports/1/comments', { content: 'Comment' });
      expect(result.content).toBe('Comment');
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.addReportComment(1, 'test')).rejects.toThrow('Err');
    });
  });

  // --- generateReportPdf ---
  describe('generateReportPdf', () => {
    it('should generate PDF', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { url: '/download/1.pdf' } });

      const result = await auditService.generateReportPdf(1);
      expect(apiClient.post).toHaveBeenCalledWith('/api/audits/reports/1/generate-pdf');
      expect(result.url).toBe('/download/1.pdf');
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.generateReportPdf(1)).rejects.toThrow('Err');
    });
  });

  // --- requestAudit ---
  describe('requestAudit', () => {
    it('should request an audit', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { id: 1 } });

      const result = await auditService.requestAudit(1, 'Audit Title', 'Audit Description');
      expect(apiClient.post).toHaveBeenCalledWith('/api/audits/request', {
        process_id: 1,
        title: 'Audit Title',
        description: 'Audit Description',
      });
      expect(result.id).toBe(1);
    });

    it('should throw on failure', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.requestAudit(1, 'T', 'D')).rejects.toThrow('Err');
    });
  });

  // --- getAuditRequestsForAdmin ---
  describe('getAuditRequestsForAdmin', () => {
    it('should return admin audit requests', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [{ id: 1 }] });

      const result = await auditService.getAuditRequestsForAdmin();
      expect(apiClient.get).toHaveBeenCalledWith('/api/audits/admin/requests');
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.getAuditRequestsForAdmin()).rejects.toThrow('Err');
    });
  });

  // --- getAuditReportsForProcess ---
  describe('getAuditReportsForProcess', () => {
    it('should return reports for a process', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      await auditService.getAuditReportsForProcess(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/audits/process/1/reports');
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.getAuditReportsForProcess(1)).rejects.toThrow('Err');
    });
  });

  // --- getAuditLogs ---
  describe('getAuditLogs', () => {
    it('should return audit logs with filters', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      await auditService.getAuditLogs({ page: 1 });
      expect(apiClient.get).toHaveBeenCalledWith('/api/audit', { params: { page: 1 } });
    });

    it('should return audit logs without filters', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      await auditService.getAuditLogs();
      expect(apiClient.get).toHaveBeenCalledWith('/api/audit', { params: {} });
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.getAuditLogs()).rejects.toThrow('Err');
    });
  });

  // --- getAuditLogById ---
  describe('getAuditLogById', () => {
    it('should return audit log details', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { id: 1, action: 'CREATE' } });

      const result = await auditService.getAuditLogById(1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/audit/1');
      expect(result.action).toBe('CREATE');
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.getAuditLogById(1)).rejects.toThrow('Err');
    });
  });

  // --- getEntityAuditLogs ---
  describe('getEntityAuditLogs', () => {
    it('should return entity audit logs', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      await auditService.getEntityAuditLogs('process', 1);
      expect(apiClient.get).toHaveBeenCalledWith('/api/audit/process/1');
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.getEntityAuditLogs('action', 1)).rejects.toThrow('Err');
    });
  });

  // --- exportAuditLogs ---
  describe('exportAuditLogs', () => {
    it('should export audit logs as PDF by default', async () => {
      // Mock DOM elements
      const mockLink = { href: '', setAttribute: vi.fn(), click: vi.fn(), remove: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');

      apiClient.get.mockResolvedValueOnce({ data: new Blob(['pdf content']) });

      const result = await auditService.exportAuditLogs();
      expect(apiClient.get).toHaveBeenCalledWith('/api/audit/export/pdf', {
        params: {},
        responseType: 'blob',
      });
      expect(result).toEqual({ success: true });
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should export audit logs as excel', async () => {
      const mockLink = { href: '', setAttribute: vi.fn(), click: vi.fn(), remove: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');

      apiClient.get.mockResolvedValueOnce({ data: new Blob(['excel content']) });

      const result = await auditService.exportAuditLogs({ format: 'excel' });
      expect(apiClient.get).toHaveBeenCalledWith('/api/audit/export/excel', {
        params: {},
        responseType: 'blob',
      });
      expect(result).toEqual({ success: true });
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('.xlsx'));
    });

    it('should throw on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Err'));
      await expect(auditService.exportAuditLogs()).rejects.toThrow('Err');
    });
  });
});
