import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuditLogTracker from './AuditLogTracker';
import auditService from '../services/auditService';
import { ToastProvider } from '../contexts/ToastContext';

vi.mock('../services/auditService', () => ({
  default: {
    getAuditLogs: vi.fn(),
    exportAuditLogs: vi.fn(),
  },
}));

const mockLogs = {
  data: [
    { 
      id: 1, 
      created_at: '2023-01-01T10:00:00.000Z', 
      user_name: 'Admin User', 
      user_id: 1, 
      entity_type: 'process', 
      entity_id: 2, 
      details: 'Created process'
    },
    { 
      id: 2, 
      created_at: '2023-01-02T10:00:00.000Z', 
      user_name: 'Regular User', 
      user_id: 2, 
      entity_type: 'action', 
      entity_id: 3, 
      details: 'Updated action'
    }
  ],
  total: 25 // Set > 20 to trigger pagination
};

const renderComponent = () => {
  return render(
    <ToastProvider>
      <AuditLogTracker />
    </ToastProvider>
  );
};

describe('AuditLogTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditService.getAuditLogs.mockResolvedValue(mockLogs);
    
    // Mock window.alert
    window.alert = vi.fn();
  });

  it('should fetch and render audit logs', async () => {
    renderComponent();
    
    expect(auditService.getAuditLogs).toHaveBeenCalledWith({
      entity_type: '',
      entity_id: '',
      user_id: '',
      start_date: '',
      end_date: '',
      limit: 20,
      offset: 0
    });
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Created process')).toBeInTheDocument();
      expect(screen.getByText('Regular User')).toBeInTheDocument();
      expect(screen.getByText('Proceso')).toBeInTheDocument(); // entity_type translated
      expect(screen.getByText('Acción de Mejora')).toBeInTheDocument(); // entity_type translated
    });
  });

  it('should toggle filters and submit filter form', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());
    
    // Show filters
    fireEvent.click(screen.getByRole('button', { name: /Mostrar Filtros/i }));
    
    // Filter fields should now be visible
    expect(screen.getByLabelText('Tipo de Entidad')).toBeInTheDocument();
    
    // Set a filter
    fireEvent.change(screen.getByLabelText('Tipo de Entidad'), { target: { value: 'process' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Aplicar Filtros/i }));
    
    await waitFor(() => {
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({
        entity_type: 'process',
        offset: 0
      }));
    });
  });

  it('should clear filters', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());
    
    // Show filters
    fireEvent.click(screen.getByRole('button', { name: /Mostrar Filtros/i }));
    
    // Set a filter
    fireEvent.change(screen.getByLabelText('Tipo de Entidad'), { target: { value: 'process' } });
    
    // Clear filters
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar Filtros' }));
    
    await waitFor(() => {
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({
        entity_type: '',
        offset: 0
      }));
      expect(screen.getByLabelText('Tipo de Entidad').value).toBe('');
    });
  });

  it('should handle pagination', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());
    
    // Next page (Page 2)
    // There are 2 pages since total is 25 and limit is 20
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);
    
    await waitFor(() => {
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({
        offset: 20
      }));
    });
  });

  it('should export audit logs', async () => {
    auditService.exportAuditLogs.mockResolvedValue({ success: true });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());
    
    // Change export format to csv
    const formatSelect = screen.getByRole('combobox');
    fireEvent.change(formatSelect, { target: { value: 'csv' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
    
    await waitFor(() => {
      expect(auditService.exportAuditLogs).toHaveBeenCalledWith(expect.objectContaining({
        format: 'csv'
      }));
    });
  });

  it('should show alert with details when eye icon is clicked', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());
    
    const viewButtons = screen.getAllByRole('button', { name: /Ver detalles completos/i });
    fireEvent.click(viewButtons[0]);
    
    expect(window.alert).toHaveBeenCalledWith('Detalles completos: Created process');
  });
});
