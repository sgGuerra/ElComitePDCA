import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
import * as AuthContext from '../contexts/AuthContext';
import notificationService from '../services/notificationService';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock notificationService
vi.mock('../services/notificationService', () => ({
  default: {
    getUnreadCount: vi.fn(),
    getUserNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

// Mock RoleSelector
vi.mock('./RoleSelector', () => ({
  default: () => <div data-testid="role-selector">RoleSelector</div>,
}));

const mockLogout = vi.fn();

const renderHeader = (props = {}) => {
  const defaultProps = {
    activeTab: 'Resumen',
    setActiveTab: vi.fn(),
    tabs: ['Resumen', 'Procesos'],
    ...props
  };

  return render(
    <MemoryRouter>
      <Header {...defaultProps} />
    </MemoryRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock user
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'Admin User', role: 'admin', email: 'admin@test.com' },
      logout: mockLogout,
    });
    
    notificationService.getUnreadCount.mockResolvedValue(0);
    notificationService.getUserNotifications.mockResolvedValue([]);
  });

  it('should render tabs and active tab correctly', () => {
    renderHeader();
    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(screen.getByText('Procesos')).toBeInTheDocument();
  });

  it('should call setActiveTab and navigate when clicking a tab', () => {
    const setActiveTab = vi.fn();
    renderHeader({ setActiveTab });
    
    fireEvent.click(screen.getByText('Procesos'));
    expect(setActiveTab).toHaveBeenCalledWith('Procesos');
    expect(mockNavigate).toHaveBeenCalledWith('/procesos');
    
    fireEvent.click(screen.getByText('Resumen'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should show Admin Panel button only for admin users', () => {
    const { unmount } = renderHeader();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    
    // Change role to non-admin
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 2, name: 'User', role: 'process_leader' },
      logout: mockLogout,
    });
    
    // Unmount previous and re-render
    unmount();
    renderHeader();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('should show Auditor Panel button only for auditor users', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 2, name: 'User', role: 'auditor' },
      logout: mockLogout,
    });
    
    renderHeader();
    expect(screen.getByText('Panel de Auditor')).toBeInTheDocument();
  });

  it('should fetch and show unread notifications count on mount', async () => {
    notificationService.getUnreadCount.mockResolvedValue(5);
    renderHeader();
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should open notifications dropdown and fetch notifications when bell is clicked', async () => {
    notificationService.getUserNotifications.mockResolvedValue([
      { id: 1, title: 'Test Notif', message: 'Message', created_at: '2023-01-01', read: false }
    ]);
    
    renderHeader();
    
    // Find bell icon button
    const buttons = screen.getAllByRole('button');
    // Bell is typically before cog and user avatar
    fireEvent.click(buttons[buttons.length - 3]);
    
    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      expect(screen.getByText('Test Notif')).toBeInTheDocument();
    });
  });

  it('should open user menu when avatar is clicked', () => {
    renderHeader();
    
    const buttons = screen.getAllByRole('button');
    const avatarButton = buttons[buttons.length - 1]; // Last button is avatar
    
    fireEvent.click(avatarButton);
    
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('should call logout when Cerrar sesión is clicked', () => {
    renderHeader();
    
    // Open menu
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    
    // Click logout
    fireEvent.click(screen.getByText('Cerrar sesión'));
    
    expect(mockLogout).toHaveBeenCalled();
  });

  it('should render RoleSelector when user has multiple roles', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'Admin', role: 'admin', roles: ['admin', 'auditor'] },
      logout: mockLogout,
    });
    
    renderHeader();
    expect(screen.getByTestId('role-selector')).toBeInTheDocument();
  });
});
