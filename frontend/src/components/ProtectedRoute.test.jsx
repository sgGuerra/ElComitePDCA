import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import * as AuthContext from '../contexts/AuthContext';

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const renderWithRouter = (ui, { initialEntries = ['/'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route element={ui}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  it('should show loading overlay when loading is true', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ loading: true, user: null });
    renderWithRouter(<ProtectedRoute />);
    
    expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();
  });

  it('should redirect to /login when user is not authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ loading: false, user: null });
    renderWithRouter(<ProtectedRoute />);
    
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render child routes when user is authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ loading: false, user: { id: 1, role: 'admin' } });
    renderWithRouter(<ProtectedRoute />);
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to /dashboard when user role does not match required role', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ loading: false, user: { id: 1, role: 'process_leader' } });
    renderWithRouter(<ProtectedRoute roleRequired="admin" />);
    
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('should render child routes when user role matches required role', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ loading: false, user: { id: 1, role: 'admin' } });
    renderWithRouter(<ProtectedRoute roleRequired="admin" />);
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
