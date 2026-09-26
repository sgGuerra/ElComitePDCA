import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ActionDetail from './ActionDetail';
import actionService from '../services/actionService';
import fileService from '../services/fileService';
import userService from '../services/userService';
import { ToastProvider } from '../contexts/ToastContext';
import * as AuthContext from '../contexts/AuthContext';

// Mock services
vi.mock('../services/actionService', () => ({
  default: {
    getActionById: vi.fn(),
    updateAction: vi.fn(),
    updateActionStatus: vi.fn(),
    getActionComments: vi.fn(),
    getActionHistory: vi.fn(),
  },
}));

vi.mock('../services/fileService', () => ({
  default: {
    getActionFiles: vi.fn(),
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
    getFileUrl: vi.fn(() => 'http://test.url'),
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

vi.mock('../components/CommentSection', () => ({
  default: () => <div data-testid="comment-section">CommentSection</div>,
}));

const mockAction = {
  id: 1,
  name: 'Test Action',
  leader_id: 1,
  leader_name: 'Leader A',
  status: 'pending',
  priority: 'high',
  what: 'Do this',
  why: 'Because',
  how: 'Like this',
  target_date: '2023-12-01T00:00:00.000Z',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-02T00:00:00.000Z',
  process_name: 'Process A',
  created_by_name: 'Admin',
};

const mockFiles = [
  { id: 1, filename: 'doc.pdf', size: 10240, uploaded_at: '2023-01-01' }
];

const mockHistory = [
  { description: 'Created', created_at: '2023-01-01', user_name: 'Admin' }
];

const mockUsers = [
  { id: 1, name: 'Leader A' }
];

const renderComponent = () => {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/procesos/1/acciones/1']}>
        <Routes>
          <Route path="/procesos/:processId/acciones/:actionId" element={<ActionDetail />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('ActionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    actionService.getActionById.mockResolvedValue(mockAction);
    actionService.getActionComments.mockResolvedValue([]);
    actionService.getActionHistory.mockResolvedValue(mockHistory);
    fileService.getActionFiles.mockResolvedValue(mockFiles);
    userService.getProcessLeaders.mockResolvedValue(mockUsers);
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'Admin', role: 'admin' },
    });
    
    // Mock window.confirm
    window.confirm = vi.fn(() => true);
  });

  it('should load action data and related info on mount', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(actionService.getActionById).toHaveBeenCalledWith('1');
      expect(fileService.getActionFiles).toHaveBeenCalledWith('1');
      expect(actionService.getActionHistory).toHaveBeenCalledWith('1');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test Action')).toBeInTheDocument();
      expect(screen.getByText('Do this')).toBeInTheDocument();
      expect(screen.getByText('doc.pdf')).toBeInTheDocument();
      expect(screen.getByTestId('comment-section')).toBeInTheDocument();
    });
  });

  it('should handle error when action is not found', async () => {
    actionService.getActionById.mockRejectedValue(new Error('Not found'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getAllByText(/Not found/i).length).toBeGreaterThan(0);
    });
  });

  it('should toggle edit mode and save changes', async () => {
    actionService.updateAction.mockResolvedValue({ success: true });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Test Action')).toBeInTheDocument());
    
    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
    
    const nameInput = screen.getByDisplayValue('Test Action');
    fireEvent.change(nameInput, { target: { value: 'Updated Action' } });
    
    // Save changes
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
    
    await waitFor(() => {
      expect(actionService.updateAction).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'Updated Action' }));
      expect(screen.getByText('Updated Action', { selector: 'h1' })).toBeInTheDocument();
    });
  });

  it('should show validation errors when editing with empty fields', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Test Action')).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
    
    const nameInput = screen.getByDisplayValue('Test Action');
    fireEvent.change(nameInput, { target: { value: '' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
    
    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(actionService.updateAction).not.toHaveBeenCalled();
  });

  it('should change status', async () => {
    actionService.updateActionStatus.mockResolvedValue({ success: true });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Test Action')).toBeInTheDocument());
    
    // Click mark as in progress
    fireEvent.click(screen.getByRole('button', { name: /Marcar en Progreso/i }));
    
    await waitFor(() => {
      expect(actionService.updateActionStatus).toHaveBeenCalledWith('1', 'in_progress', expect.any(String));
      // Checks if actionService fetched new history/comments after status change
      expect(actionService.getActionHistory).toHaveBeenCalledTimes(2); 
    });
  });

  it('should upload a file', async () => {
    const newFile = { id: 2, filename: 'new.jpg', size: 1024, uploaded_at: '2023-01-02' };
    fileService.uploadFile.mockResolvedValue({ success: true, data: newFile });
    
    const { container } = renderComponent();
    await waitFor(() => expect(screen.getByText('Test Action')).toBeInTheDocument());
    
    // Simulate file input change
    const fileInput = container.querySelector('#file-upload');
    const file = new File(['test content'], 'new.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(fileService.uploadFile).toHaveBeenCalledWith('1', expect.any(Object));
      expect(screen.getByText('new.jpg')).toBeInTheDocument();
    });
  });

  it('should delete a file', async () => {
    fileService.deleteFile.mockResolvedValue({ success: true });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Test Action')).toBeInTheDocument());
    
    const deleteButtons = screen.getAllByRole('button');
    // Find the file delete button, assuming it has the Trash icon or is last button in the file list
    // A better approach is to mock window.confirm and click the delete button
    
    // First, verify file exists
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    
    // The button for deleting file is inside the li item
    const fileItem = screen.getByText('doc.pdf').closest('li');
    const deleteBtn = within(fileItem).getAllByRole('button')[0];
    
    fireEvent.click(deleteBtn);
    
    expect(window.confirm).toHaveBeenCalledWith('¿Está seguro de eliminar este archivo?');
    
    await waitFor(() => {
      expect(fileService.deleteFile).toHaveBeenCalledWith('1', 1);
      expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument();
    });
  });

  it('should toggle history view', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Test Action')).toBeInTheDocument());
    
    const historyBtn = screen.getByRole('button', { name: /Ver historial de cambios/i });
    fireEvent.click(historyBtn);
    
    expect(screen.getByText('Created')).toBeInTheDocument();
    
    const hideBtn = screen.getByRole('button', { name: /Ocultar historial/i });
    fireEvent.click(hideBtn);
    
    expect(screen.queryByText('Created')).not.toBeInTheDocument();
  });
});
