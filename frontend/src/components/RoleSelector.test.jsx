import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoleSelector from './RoleSelector';
import * as AuthContext from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const renderRoleSelector = () => {
  return render(
    <ToastProvider>
      <RoleSelector />
    </ToastProvider>
  );
};

describe('RoleSelector', () => {
  let mockSwitchRole;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSwitchRole = vi.fn();
    
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: vi.fn() }
    });
  });

  it('should not render if user has no roles', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'User' },
      switchRole: mockSwitchRole,
    });
    
    const { container } = renderRoleSelector();
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render if user has only 1 role', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'User', role: 'admin', roles: ['admin'] },
      switchRole: mockSwitchRole,
    });
    
    const { container } = renderRoleSelector();
    expect(container).toBeEmptyDOMElement();
  });

  it('should render if user has multiple roles', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'User', role: 'admin', roles: ['admin', 'auditor'] },
      switchRole: mockSwitchRole,
    });
    
    renderRoleSelector();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('should open dropdown when clicked', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'User', role: 'admin', roles: ['admin', 'auditor'] },
      switchRole: mockSwitchRole,
    });
    
    renderRoleSelector();
    
    // Button should be visible
    const button = screen.getByRole('button');
    
    // Initially dropdown content not visible (we look for the header text)
    expect(screen.queryByText('Cambiar de rol')).not.toBeInTheDocument();
    
    // Click button
    fireEvent.click(button);
    
    // Dropdown should appear
    expect(screen.getByText('Cambiar de rol')).toBeInTheDocument();
    // Admin is in both the button and the dropdown list, so there will be 2
    expect(screen.getAllByText('Administrador').length).toBe(2);
    expect(screen.getByText('Auditor')).toBeInTheDocument();
  });

  it('should switch role when a new role is selected', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'User', role: 'admin', roles: ['admin', 'auditor'] },
      switchRole: mockSwitchRole,
    });
    
    renderRoleSelector();
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    
    // Click 'Auditor'
    fireEvent.click(screen.getByText('Auditor'));
    
    await waitFor(() => {
      expect(mockSwitchRole).toHaveBeenCalledWith('auditor');
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('should not switch role if the same role is selected', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'User', role: 'admin', roles: ['admin', 'auditor'] },
      switchRole: mockSwitchRole,
    });
    
    renderRoleSelector();
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    
    // The current role button has 'Activo' next to it, and it's disabled, but we can try to find and click it
    // Wait, the dropdown has multiple things with text 'Administrador', one in button, one in dropdown
    const adminTexts = screen.getAllByText('Administrador');
    // The second one is inside the dropdown button
    const adminButton = adminTexts[1].closest('button');
    
    fireEvent.click(adminButton);
    
    expect(mockSwitchRole).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
