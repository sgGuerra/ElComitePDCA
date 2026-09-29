import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import authService from '../services/authService';

// Mock authService
vi.mock('../services/authService', () => ({
  default: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    updateCurrentUser: vi.fn(),
    switchRole: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// A test component to consume the context
const TestComponent = () => {
  const { user, loading, login, logout, updateUserProfile, switchRole, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user-name">{user ? user.name : 'No User'}</div>
      
      <button onClick={async () => { try { await login('test@test.com', 'pass') } catch(e) {} }} data-testid="login-btn">Login</button>
      <button onClick={() => logout()} data-testid="logout-btn">Logout</button>
      <button onClick={() => updateUserProfile({ name: 'Updated Name' })} data-testid="update-btn">Update</button>
      <button onClick={async () => { try { await switchRole('admin') } catch(e) {} }} data-testid="switch-btn">Switch Role</button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with user from authService', () => {
    authService.getCurrentUser.mockReturnValue({ id: 1, name: 'Test User' });
    
    renderWithProvider();
    
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
  });

  it('should initialize with no user if authService returns null', () => {
    authService.getCurrentUser.mockReturnValue(null);
    
    renderWithProvider();
    
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
  });

  it('should handle login success', async () => {
    authService.getCurrentUser.mockReturnValueOnce(null).mockReturnValueOnce({ id: 1, name: 'Logged In' });
    authService.login.mockResolvedValue({});
    
    renderWithProvider();
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    
    act(() => {
      screen.getByTestId('login-btn').click();
    });
    
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@test.com', 'pass');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Logged In');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });
  });

  it('should handle login error', async () => {
    authService.getCurrentUser.mockReturnValue(null);
    authService.login.mockRejectedValue(new Error('Login failed'));
    
    renderWithProvider();
    
    // We expect the click to throw an error, so we catch it
    let caughtError;
    try {
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });
    } catch (e) {
      caughtError = e;
    }
    
    expect(authService.login).toHaveBeenCalled();
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
  });

  it('should handle logout', () => {
    authService.getCurrentUser.mockReturnValue({ id: 1, name: 'Test User' });
    
    renderWithProvider();
    
    act(() => {
      screen.getByTestId('logout-btn').click();
    });
    
    expect(authService.logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
  });

  it('should handle updateUserProfile', () => {
    authService.getCurrentUser.mockReturnValue({ id: 1, name: 'Test User' });
    
    renderWithProvider();
    
    act(() => {
      screen.getByTestId('update-btn').click();
    });
    
    expect(authService.updateCurrentUser).toHaveBeenCalledWith({ id: 1, name: 'Updated Name' });
    expect(screen.getByTestId('user-name')).toHaveTextContent('Updated Name');
  });

  it('should handle switchRole success', async () => {
    authService.getCurrentUser.mockReturnValue({ id: 1, name: 'Test User', role: 'user' });
    authService.switchRole.mockResolvedValue({ id: 1, name: 'Test User', role: 'admin' });
    
    renderWithProvider();
    
    act(() => {
      screen.getByTestId('switch-btn').click();
    });
    
    await waitFor(() => {
      expect(authService.switchRole).toHaveBeenCalledWith('admin');
      // The role isn't displayed in our test component, but we can verify it succeeded
    });
  });

  it('should handle switchRole error', async () => {
    authService.getCurrentUser.mockReturnValue({ id: 1, name: 'Test User' });
    authService.switchRole.mockRejectedValue(new Error('Switch failed'));
    
    renderWithProvider();
    
    try {
      await act(async () => {
        screen.getByTestId('switch-btn').click();
      });
    } catch (e) {
      // Catch expected error
    }
    
    expect(authService.switchRole).toHaveBeenCalled();
  });
});
