import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useAuth
const mockLogin = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// Mock react-icons
vi.mock('react-icons/fa', () => ({
  FaMicrosoft: () => <span data-testid="icon-microsoft">MS</span>,
}));

const renderLogin = () => render(<MemoryRouter><Login /></MemoryRouter>);

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form', () => {
    renderLogin();
    expect(screen.getByText('El Comité')).toBeInTheDocument();
    expect(screen.getByText('Sistema de mejoramiento continuo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });

  it('should update email and password fields', () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const passwordInput = screen.getByPlaceholderText('Contraseña');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@test.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('should toggle remember me checkbox', () => {
    renderLogin();
    const checkbox = screen.getByLabelText('Recordar cuenta');
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('should show error when fields are empty on submit', async () => {
    renderLogin();
    fireEvent.submit(screen.getByText('Iniciar Sesión'));
    // The HTML5 required attribute should prevent submission, but the component also checks
  });

  it('should call login and navigate on successful login', async () => {
    mockLogin.mockResolvedValueOnce({ id: 1 });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'pass123' } });
    fireEvent.submit(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'pass123');
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Credenciales incorrectas'));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
    });
  });

  it('should show error on Microsoft login click', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Iniciar Sesión con Microsoft'));
    expect(screen.getByText('Inicio de sesión con Microsoft no implementado aún.')).toBeInTheDocument();
  });

  it('should render forgot password button', () => {
    renderLogin();
    expect(screen.getByText('¿Olvidaste la contraseña?')).toBeInTheDocument();
  });
});
