import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoleSwitcher from './RoleSwitcher';
import * as AuthContext from '../contexts/AuthContext';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('RoleSwitcher', () => {
  let mockSwitchRole;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSwitchRole = vi.fn();
    
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });
  });

  it('should not render if user has no roles or only 1 role', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, role: 'admin', roles: ['admin'] },
      switchRole: mockSwitchRole,
      loading: false
    });
    
    const { container } = render(<RoleSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render if auth is loading', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, role: 'admin', roles: ['admin', 'auditor'] },
      switchRole: mockSwitchRole,
      loading: true
    });
    
    const { container } = render(<RoleSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render select dropdown if user has multiple roles', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, role: 'admin', roles: ['admin', 'process_leader'] },
      switchRole: mockSwitchRole,
      loading: false
    });
    
    render(<RoleSwitcher />);
    
    expect(screen.getByLabelText('Rol Activo:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Process leader' })).toBeInTheDocument();
  });

  it('should switch role and redirect', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, role: 'admin', roles: ['admin', 'process_leader'] },
      switchRole: mockSwitchRole,
      loading: false
    });
    
    render(<RoleSwitcher />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'process_leader' } });
    
    expect(screen.getByText('Cambiando...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockSwitchRole).toHaveBeenCalledWith('process_leader');
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('should display error message if switchRole fails', async () => {
    mockSwitchRole.mockRejectedValueOnce(new Error('API failed'));
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, role: 'admin', roles: ['admin', 'process_leader'] },
      switchRole: mockSwitchRole,
      loading: false
    });
    
    render(<RoleSwitcher />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'process_leader' } });
    
    await waitFor(() => {
      expect(screen.getByText('API failed')).toBeInTheDocument();
      expect(screen.queryByText('Cambiando...')).not.toBeInTheDocument();
    });
  });

  it('should not switch role if same role is selected', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, role: 'admin', roles: ['admin', 'process_leader'] },
      switchRole: mockSwitchRole,
      loading: false
    });
    
    render(<RoleSwitcher />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'admin' } });
    
    expect(mockSwitchRole).not.toHaveBeenCalled();
  });
});
