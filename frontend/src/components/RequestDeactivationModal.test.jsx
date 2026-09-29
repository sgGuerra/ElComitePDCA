import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RequestDeactivationModal from './RequestDeactivationModal';
import { ToastProvider } from '../contexts/ToastContext';
import userService from '../services/userService';

// Mock userService
vi.mock('../services/userService', () => ({
  default: {
    requestDeactivation: vi.fn(),
  }
}));

const renderModal = (isOpen = true, onClose = vi.fn()) => {
  return render(
    <ToastProvider>
      <RequestDeactivationModal isOpen={isOpen} onClose={onClose} />
    </ToastProvider>
  );
};

describe('RequestDeactivationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = renderModal(false);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render when isOpen is true', () => {
    renderModal();
    expect(screen.getByText('Solicitar Desactivación de Cuenta')).toBeInTheDocument();
  });

  it('should show error when reason is empty on submit', async () => {
    renderModal();
    const submitButton = screen.getByText('Enviar Solicitud');
    
    fireEvent.click(submitButton);
    
    // Toast should show up (from ToastProvider) but we don't mock it completely, 
    // we can just check if requestDeactivation wasn't called.
    expect(userService.requestDeactivation).not.toHaveBeenCalled();
  });

  it('should call requestDeactivation and onClose on success', async () => {
    const onClose = vi.fn();
    userService.requestDeactivation.mockResolvedValueOnce({ success: true });
    
    renderModal(true, onClose);
    
    const textarea = screen.getByPlaceholderText(/explica por qué/i);
    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    
    const submitButton = screen.getByText('Enviar Solicitud');
    fireEvent.click(submitButton);
    
    expect(submitButton).toHaveTextContent('Enviando...');
    
    await waitFor(() => {
      expect(userService.requestDeactivation).toHaveBeenCalledWith('Test reason');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should handle error from requestDeactivation', async () => {
    const onClose = vi.fn();
    userService.requestDeactivation.mockRejectedValueOnce(new Error('API Error'));
    
    renderModal(true, onClose);
    
    const textarea = screen.getByPlaceholderText(/explica por qué/i);
    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    
    const submitButton = screen.getByText('Enviar Solicitud');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(userService.requestDeactivation).toHaveBeenCalledWith('Test reason');
      expect(onClose).not.toHaveBeenCalled(); // Shouldn't close on error
    });
  });

  it('should call onClose when Cancelar is clicked', () => {
    const onClose = vi.fn();
    renderModal(true, onClose);
    
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });
});
