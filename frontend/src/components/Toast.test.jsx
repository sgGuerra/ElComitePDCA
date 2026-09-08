import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ToastContainer from './Toast';

// --- Helpers ---
const createToast = (overrides = {}) => ({
  id: '1',
  message: 'Test message',
  type: 'info',
  duration: 5000,
  ...overrides,
});

const renderToasts = (toasts, removeToast = () => {}) =>
  render(<ToastContainer toasts={toasts} removeToast={removeToast} />);

describe('ToastContainer', () => {
  it('should render nothing when toasts array is empty', () => {
    const { container } = renderToasts([]);
    expect(container.innerHTML).toBe('');
  });

  it.each([
    { type: 'success', message: 'Operación exitosa' },
    { type: 'error',   message: 'Algo salió mal' },
    { type: 'warning', message: 'Cuidado' },
    { type: 'info',    message: 'Información' },
  ])('should render a $type toast', ({ type, message }) => {
    renderToasts([createToast({ id: type, type, message })]);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('should render multiple toasts', () => {
    const toasts = [
      createToast({ id: '1', message: 'Toast 1', type: 'success' }),
      createToast({ id: '2', message: 'Toast 2', type: 'error' }),
    ];
    renderToasts(toasts);
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('should call removeToast when close button is clicked', () => {
    const removeToast = vi.fn();
    renderToasts([createToast({ id: 'test-id', message: 'Cerrar este' })], removeToast);

    fireEvent.click(screen.getByLabelText('Close'));
    expect(removeToast).toHaveBeenCalledWith('test-id');
  });

  it('should auto-remove toast after duration', () => {
    vi.useFakeTimers();
    const removeToast = vi.fn();
    renderToasts([createToast({ id: 'auto-id', message: 'Auto remove', duration: 3000 })], removeToast);

    act(() => vi.advanceTimersByTime(3000));

    expect(removeToast).toHaveBeenCalledWith('auto-id');
    vi.useRealTimers();
  });

  it('should not auto-remove toast when duration is 0', () => {
    vi.useFakeTimers();
    const removeToast = vi.fn();
    renderToasts([createToast({ id: 'no-auto', message: 'Stay forever', duration: 0 })], removeToast);

    act(() => vi.advanceTimersByTime(10000));

    expect(removeToast).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should have role="alert" for accessibility', () => {
    renderToasts([createToast({ id: 'a11y', message: 'Accesible' })]);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

