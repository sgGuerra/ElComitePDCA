import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuditorPanel from './AuditorPanel';
import auditService from '../services/auditService';
import processService from '../services/processService';
import { ToastProvider } from '../contexts/ToastContext';

vi.mock('../services/auditService', () => ({
  default: {
    getAuditorReports: vi.fn(),
    createAuditReport: vi.fn(),
    addReportComment: vi.fn(),
    generateReportPdf: vi.fn(),
  },
}));

vi.mock('../services/processService', () => ({
  default: {
    getAllProcesses: vi.fn(),
  },
}));

// Mock AuditLogTracker
vi.mock('../components/AuditLogTracker', () => ({
  default: () => <div data-testid="audit-log-tracker">AuditLogTracker</div>,
}));

const mockProcesses = [
  { id: 1, name: 'Process 1' },
];

const mockReports = [
  { 
    id: 1, 
    title: 'Report 1', 
    status: 'pending', 
    process_name: 'Process 1', 
    created_at: '2023-01-01T00:00:00.000Z',
    auditor_name: 'Auditor A',
    content: 'Report content here',
    comments: [
      { author_name: 'Admin', created_at: '2023-01-02T00:00:00.000Z', content: 'Good report' }
    ]
  },
];

const renderComponent = () => {
  return render(
    <ToastProvider>
      <AuditorPanel />
    </ToastProvider>
  );
};

describe('AuditorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    processService.getAllProcesses.mockResolvedValue(mockProcesses);
    auditService.getAuditorReports.mockResolvedValue(mockReports);
    
    // Mock window.open
    window.open = vi.fn();
  });

  it('should load initial data and render reports list', async () => {
    renderComponent();
    
    expect(processService.getAllProcesses).toHaveBeenCalled();
    expect(auditService.getAuditorReports).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(screen.getByText('Report 1')).toBeInTheDocument();
      expect(screen.getByText('Selecciona un informe para ver detalles')).toBeInTheDocument();
    });
  });

  it('should switch between tabs', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Report 1')).toBeInTheDocument());
    
    // Switch to logs
    fireEvent.click(screen.getByRole('button', { name: /Registro de Actividad/i }));
    
    expect(screen.getByTestId('audit-log-tracker')).toBeInTheDocument();
    expect(screen.queryByText('Report 1')).not.toBeInTheDocument();
  });

  it('should open new report modal and submit', async () => {
    auditService.createAuditReport.mockResolvedValue({ success: true });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Report 1')).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole('button', { name: /Nuevo Informe/i }));
    
    expect(screen.getByText('Crear Nuevo Informe de Auditoría')).toBeInTheDocument();
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Título del Informe'), { target: { value: 'New Report' } });
    
    const processSelect = screen.getByLabelText('Proceso');
    fireEvent.change(processSelect, { target: { value: '1' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Informe' }));
    
    await waitFor(() => {
      expect(auditService.createAuditReport).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Report', process_id: '1' }));
      expect(screen.queryByText('Crear Nuevo Informe de Auditoría')).not.toBeInTheDocument(); // modal closes
    });
  });

  it('should view report details and add a comment', async () => {
    auditService.addReportComment.mockResolvedValue({ success: true });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Report 1')).toBeInTheDocument());
    
    // Click on the report item in the list
    // The div containing the report title is clickable
    fireEvent.click(screen.getByText('Report 1').closest('div').parentElement);
    
    await waitFor(() => {
      expect(screen.getByText('Report content here')).toBeInTheDocument();
      expect(screen.getByText('Good report')).toBeInTheDocument();
    });
    
    // Add comment
    const commentTextarea = screen.getByPlaceholderText('Añade un comentario...');
    fireEvent.change(commentTextarea, { target: { value: 'New comment test' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Añadir Comentario/i }));
    
    await waitFor(() => {
      expect(auditService.addReportComment).toHaveBeenCalledWith(1, 'New comment test');
    });
  });

  it('should generate PDF', async () => {
    auditService.generateReportPdf.mockResolvedValue({ pdfUrl: 'http://test.url' });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Report 1')).toBeInTheDocument());
    
    // Open report
    fireEvent.click(screen.getByText('Report 1').closest('div').parentElement);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generar PDF/i })).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Generar PDF/i }));
    
    await waitFor(() => {
      expect(auditService.generateReportPdf).toHaveBeenCalledWith(1);
      expect(window.open).toHaveBeenCalledWith('http://test.url', '_blank');
    });
  });
});
