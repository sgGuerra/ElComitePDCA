import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProcessManagement from './ProcessManagement';
import processService from '../services/processService';
import userService from '../services/userService';
import { ToastProvider } from '../contexts/ToastContext';
import * as AuthContext from '../contexts/AuthContext';

vi.mock('../services/processService', () => ({
  default: {
    getAllProcesses: vi.fn(),
    createProcess: vi.fn(),
    updateProcess: vi.fn(),
    deleteProcess: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  default: {
    getProcessLeaders: vi.fn(),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockProcesses = [
  { id: 1, name: 'Process A', description: 'Desc A', owner: 'Leader A', status: 'active', priority: 'high', leader_id: 1 },
  { id: 2, name: 'Process B', description: 'Desc B', owner: 'Leader B', status: 'pending', priority: 'medium', leader_id: 2 }
];

const mockLeaders = [
  { id: 1, name: 'Leader A' },
  { id: 2, name: 'Leader B' }
];

const renderComponent = () => {
  return render(
    <ToastProvider>
      <ProcessManagement />
    </ToastProvider>
  );
};

describe('ProcessManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    processService.getAllProcesses.mockResolvedValue(mockProcesses);
    userService.getProcessLeaders.mockResolvedValue(mockLeaders);
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'Admin', role: 'admin' },
    });
    
    // Setup for scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('should render processes and leaders on mount', async () => {
    renderComponent();
    
    expect(processService.getAllProcesses).toHaveBeenCalled();
    expect(userService.getProcessLeaders).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(screen.getByText('Process A')).toBeInTheDocument();
      expect(screen.getByText('Process B')).toBeInTheDocument();
    });
  });

  it('should show permission error message on 403', async () => {
    processService.getAllProcesses.mockRejectedValue({ response: { status: 403 } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Problema de permisos')).toBeInTheDocument();
      expect(screen.getByText(/No tienes los permisos necesarios/)).toBeInTheDocument();
    });
  });

  it('should filter processes by search term', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Process A')).toBeInTheDocument());
    
    const searchInput = screen.getByPlaceholderText('Buscar proceso...');
    fireEvent.change(searchInput, { target: { value: 'Process A' } });
    
    expect(screen.getByText('Process A')).toBeInTheDocument();
    expect(screen.queryByText('Process B')).not.toBeInTheDocument();
  });

  it('should open new process modal and show validation errors', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Process A')).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole('button', { name: /Nuevo Proceso/i }));
    
    expect(await screen.findByText('Nuevo Proceso', { selector: 'h3' })).toBeInTheDocument();
    
    // Clear the name to trigger validation (since it might be pre-filled)
    const nameInput = await screen.findByPlaceholderText('Nombre del proceso');
    fireEvent.change(nameInput, { target: { value: '' } });
    
    // Assuming the user might not be selected in the leader dropdown, let's trigger submission
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
    
    expect(await screen.findByText('El nombre del proceso es obligatorio')).toBeInTheDocument();
    expect(processService.createProcess).not.toHaveBeenCalled();
  });

  it('should create new process successfully', async () => {
    processService.createProcess.mockResolvedValue({ id: 3, name: 'New Process', description: 'New Desc', status: 'active', priority: 'low' });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Process A')).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole('button', { name: /Nuevo Proceso/i }));
    
    const nameInput = await screen.findByPlaceholderText('Nombre del proceso');
    fireEvent.change(nameInput, { target: { value: 'New Process' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
    
    await waitFor(() => {
      expect(processService.createProcess).toHaveBeenCalled();
      // It calls fetchProcesses again on success
      expect(processService.getAllProcesses).toHaveBeenCalledTimes(2); 
    });
  });

  it('should edit process successfully', async () => {
    processService.updateProcess.mockResolvedValue({ success: true });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Process A')).toBeInTheDocument());
    
    // Find the edit button for Process A
    const table = screen.getByRole('table');
    // We assume the first edit button is for Process A
    const buttons = screen.getAllByRole('button');
    // Using index or finding by row is better, let's find the edit button by traversing
    // Since the icons don't have aria-labels, we'll get the rows and find the button inside
    const rows = screen.getAllByRole('row');
    const processARow = rows[1]; // First row after header
    const editButton = processARow.querySelector('.text-indigo-600');
    
    fireEvent.click(editButton);
    
    expect(await screen.findByText('Editar Proceso')).toBeInTheDocument();
    
    const nameInput = screen.getByPlaceholderText('Nombre del proceso');
    fireEvent.change(nameInput, { target: { value: 'Updated Process A' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    
    await waitFor(() => {
      expect(processService.updateProcess).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Updated Process A' }));
      expect(screen.getByText('Updated Process A')).toBeInTheDocument();
    });
  });

  it('should delete process with confirmation', async () => {
    processService.deleteProcess.mockResolvedValue({ success: true });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Process A')).toBeInTheDocument());
    
    const rows = screen.getAllByRole('row');
    const processARow = rows[1];
    const deleteButton = processARow.querySelector('.text-red-600');
    
    fireEvent.click(deleteButton);
    
    expect(await screen.findByText('Confirmar Eliminación')).toBeInTheDocument();
    expect(screen.getByText(/¿Está seguro que desea eliminar el proceso "Process A"\?/)).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    
    await waitFor(() => {
      expect(processService.deleteProcess).toHaveBeenCalledWith(1);
      expect(screen.queryByText('Process A')).not.toBeInTheDocument();
    });
  });
});
