import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ToastContext, { ToastProvider, useToast, TOAST_TYPES } from './ToastContext';

// A simple component to consume the toast context
const TestComponent = () => {
  const { addToast, removeToast, success, error, info, warning } = useToast();

  return (
    <div>
      <button onClick={() => addToast('Basic Toast', TOAST_TYPES.INFO, 5000)}>Basic</button>
      <button onClick={() => success('Success Toast')}>Success</button>
      <button onClick={() => error('Error Toast')}>Error</button>
      <button onClick={() => info('Info Toast')}>Info</button>
      <button onClick={() => warning('Warning Toast')}>Warning</button>
      <button onClick={() => addToast('No Auto Close', TOAST_TYPES.INFO, 0)}>No Auto Close</button>
    </div>
  );
};

describe('ToastContext', () => {
  it('should render children without crashing', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Hello</div>
      </ToastProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should show a success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Success').click();
    });

    expect(await screen.findByText('Success Toast')).toBeInTheDocument();
  });

  it('should show an error toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Error').click();
    });

    expect(await screen.findByText('Error Toast')).toBeInTheDocument();
  });

  it('should show an info toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Info').click();
    });

    expect(await screen.findByText('Info Toast')).toBeInTheDocument();
  });

  it('should show a warning toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Warning').click();
    });

    expect(await screen.findByText('Warning Toast')).toBeInTheDocument();
  });

  it('should throw an error when useToast is used outside of ToastProvider', () => {
    // Suppress console.error for this specific test
    const consoleError = console.error;
    console.error = vi.fn();

    const TestWithoutProvider = () => {
      useToast();
      return <div>Test</div>;
    };

    expect(() => render(<TestWithoutProvider />)).toThrow('useToast must be used within a ToastProvider');
    
    console.error = consoleError;
  });

  it('should allow manually closing a toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('No Auto Close').click();
    });

    // We use getAllByText because both the button and the toast contain the text
    const elements = await screen.findAllByText('No Auto Close');
    expect(elements.length).toBe(2);
    
    // Find close button - in Toast.jsx it uses aria-label="Close"
    const closeButton = screen.getByLabelText('Close');
    act(() => {
      fireEvent.click(closeButton);
    });

    // Wait for element to disappear
    expect(screen.getAllByText('No Auto Close').length).toBe(1); // Only the button should remain
  });
});
