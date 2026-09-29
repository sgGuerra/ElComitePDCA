import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import UserProfile from './UserProfile';
import actionService from '../services/actionService';
import { ToastProvider } from '../contexts/ToastContext';
import * as AuthContext from '../contexts/AuthContext';

// Mock Header
vi.mock('../components/Header', () => ({
  default: () => <div data-testid="mock-header">Header</div>,
}));

// Mock RequestDeactivationModal
vi.mock('../components/RequestDeactivationModal', () => ({
  default: ({ isOpen, onClose }) => isOpen ? (
    <div data-testid="mock-deactivation-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}));

// Mock actionService
vi.mock('../services/actionService', () => ({
  default: {
    getActionsByLeader: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@test.com',
  phone: '123456789',
  position: 'Manager',
  department: 'IT',
  bio: 'Hello world',
  role: 'admin',
  roles: ['admin']
};

const mockLogout = vi.fn();
const mockUpdateUserProfile = vi.fn();

const renderUserProfile = () => {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      updateUserProfile: mockUpdateUserProfile
    });
    
    actionService.getActionsByLeader.mockResolvedValue([
      { id: 1, name: 'Assigned Action', process_name: 'Process 1', target_date: '2023-12-01', status: 'pending' }
    ]);
  });

  it('should load user data into profile form on mount', async () => {
    renderUserProfile();
    
    // Check if initial user data is loaded into the form
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Manager')).toBeInTheDocument();
    });
    
    // Check if user info is displayed in the sidebar
    const sidebarHeaders = screen.getAllByText('John Doe');
    expect(sidebarHeaders.length).toBeGreaterThan(0);
  });

  it('should handle tab navigation', async () => {
    renderUserProfile();
    
    // Default tab is profile
    expect(screen.getByText('Información Personal', { selector: 'h2 span' })).toBeInTheDocument();
    
    // Navigate to password tab
    fireEvent.click(screen.getByRole('button', { name: /Cambiar Contraseña/i }));
    expect(screen.getByText('Cambiar Contraseña', { selector: 'h2 span' })).toBeInTheDocument();
    
    // Navigate to notifications tab
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i, selector: 'nav button' }));
    expect(screen.getByText('Preferencias de Notificación', { selector: 'h2 span' })).toBeInTheDocument();
    
    // Navigate to activity tab
    fireEvent.click(screen.getByRole('button', { name: /Actividad Reciente/i }));
    await waitFor(() => {
      expect(screen.getByText('Actividad Reciente', { selector: 'h2 span' })).toBeInTheDocument();
      expect(screen.getByText('Assigned Action')).toBeInTheDocument();
    });
  });

  it('should validate and submit profile form', async () => {
    renderUserProfile();
    
    // Empty name to trigger validation
    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: '' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
    
    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    
    // Fix name and submit
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
    
    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane Doe' }));
    });
  });

  it('should validate and submit password form', async () => {
    renderUserProfile();
    
    // Navigate to password tab
    fireEvent.click(screen.getByRole('button', { name: /Cambiar Contraseña/i }));
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));
    
    expect(await screen.findByText('La contraseña actual es obligatoria')).toBeInTheDocument();
    
    // Fill form with non-matching passwords

    // Since inputs are type="password", we can select them by label
    fireEvent.change(screen.getByLabelText('Contraseña Actual'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText('Nueva Contraseña'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nueva Contraseña'), { target: { value: 'different' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));
    
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
  });

  it('should submit notification settings', async () => {
    renderUserProfile();
    
    // Navigate to notifications tab
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i, selector: 'nav button' }));
    
    const emailCheckbox = screen.getByLabelText('Correo Electrónico');
    expect(emailCheckbox).toBeChecked(); // Default state
    
    fireEvent.click(emailCheckbox); // Uncheck
    expect(emailCheckbox).not.toBeChecked();
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Preferencias' }));
    
    // Wait for the simulated timeout
    await waitFor(() => {
      expect(screen.getByText('Preferencias de notificación actualizadas')).toBeInTheDocument();
    });
  });

  it('should handle logout', () => {
    renderUserProfile();
    
    const logoutBtns = screen.getAllByText('Cerrar Sesión');
    fireEvent.click(logoutBtns[0]);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  it('should open deactivation modal', () => {
    // Need a non-admin user to see the deactivation tab
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { ...mockUser, role: 'auditor', roles: ['auditor'] },
      logout: mockLogout,
      updateUserProfile: mockUpdateUserProfile
    });
    
    renderUserProfile();
    const sidebarTab = screen.getByRole('button', { name: /Solicitar Desactivación/i });
    fireEvent.click(sidebarTab); // Click tab in sidebar
    
    const deactivationBtns = screen.getAllByRole('button', { name: /Solicitar Desactivación/i });
    fireEvent.click(deactivationBtns[1]); // Click button in content area

    expect(screen.getByTestId('mock-deactivation-modal')).toBeInTheDocument();
    
    // Close modal
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('mock-deactivation-modal')).not.toBeInTheDocument();
  });
});
