import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ToastContainer from './Toast';

describe('ToastContainer', () => {
  it('should render nothing when toasts array is empty', () => {
    const { container } = render(
      <ToastContainer toasts={[]} removeToast={() => {}} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render a success toast', () => {
    const toasts = [
      { id: '1', message: 'Operación exitosa', type: 'success', duration: 5000 }
    ];
    render(<ToastContainer toasts={toasts} removeToast={() => {}} />);
    expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
  });

  it('should render an error toast', () => {
    const toasts = [
      { id: '2', message: 'Algo salió mal', type: 'error', duration: 5000 }
    ];
    render(<ToastContainer toasts={toasts} removeToast={() => {}} />);
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('should render a warning toast', () => {
    const toasts = [
      { id: '3', message: 'Cuidado', type: 'warning', duration: 5000 }
    ];
    render(<ToastContainer toasts={toasts} removeToast={() => {}} />);
    expect(screen.getByText('Cuidado')).toBeInTheDocument();
  });

  it('should render an info toast (default type)', () => {
    const toasts = [
      { id: '4', message: 'Información', type: 'info', duration: 5000 }
    ];
    render(<ToastContainer toasts={toasts} removeToast={() => {}} />);
    expect(screen.getByText('Información')).toBeInTheDocument();
  });

  it('should render multiple toasts', () => {
    const toasts = [
      { id: '1', message: 'Toast 1', type: 'success', duration: 5000 },
      { id: '2', message: 'Toast 2', type: 'error', duration: 5000 }
    ];
    render(<ToastContainer toasts={toasts} removeToast={() => {}} />);
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('should call removeToast when close button is clicked', () => {
    const removeToast = vi.fn();
    const toasts = [
      { id: 'test-id', message: 'Cerrar este', type: 'success', duration: 5000 }
    ];
    render(<ToastContainer toasts={toasts} removeToast={removeToast} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(removeToast).toHaveBeenCalledWith('test-id');
  });

  it('should auto-remove toast after duration', () => {
    vi.useFakeTimers();
    const removeToast = vi.fn();
    const toasts = [
      { id: 'auto-id', message: 'Auto remove', type: 'info', duration: 3000 }
    ];
    render(<ToastContainer toasts={toasts} removeToast={removeToast} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(removeToast).toHaveBeenCalledWith('auto-id');
    vi.useRealTimers();
  });

  it('should not auto-remove toast when duration is 0', () => {
    vi.useFakeTimers();
    const removeToast = vi.fn();
    const toasts = [
      { id: 'no-auto', message: 'Stay forever', type: 'warning', duration: 0 }
    ];
    render(<ToastContainer toasts={toasts} removeToast={removeToast} />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(removeToast).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should have role="alert" for accessibility', () => {
    const toasts = [
      { id: 'a11y', message: 'Accesible', type: 'success', duration: 5000 }
    ];
    render(<ToastContainer toasts={toasts} removeToast={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
