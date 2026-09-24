import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfigurationManagement from './ConfigurationManagement';
import { ToastProvider } from '../contexts/ToastContext';

const renderComponent = () => {
  return render(
    <ToastProvider>
      <ConfigurationManagement />
    </ToastProvider>
  );
};

describe('ConfigurationManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all tabs and default to General tab', () => {
    renderComponent();
    
    // Check tabs are rendered
    expect(screen.getByRole('button', { name: /General/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Notificaciones/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Correo Electrónico/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Usuarios/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Seguridad/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sistema/i })).toBeInTheDocument();
    
    // Check General form fields are visible
    expect(screen.getByLabelText('Nombre del Sitio')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción del Sitio')).toBeInTheDocument();
  });

  it('should enable save button when changes are made and simulate saving', async () => {
    renderComponent();
    
    const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
    expect(saveButton).toBeDisabled();
    
    const siteNameInput = screen.getByLabelText('Nombre del Sitio');
    fireEvent.change(siteNameInput, { target: { value: 'Nuevo Nombre' } });
    
    expect(saveButton).not.toBeDisabled();
    
    fireEvent.click(saveButton);
    
    // Test the simulated save (delay + toast)
    await waitFor(() => {
      expect(screen.getByText('Configuración guardada exitosamente')).toBeInTheDocument();
      expect(saveButton).toBeDisabled(); // Should disable after save
    });
  });

  it('should render Notifications form when tab is clicked', () => {
    renderComponent();
    
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    
    expect(screen.getByLabelText('Activar notificaciones por correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Activar notificaciones en el navegador')).toBeInTheDocument();
    
    const checkbox = screen.getByLabelText('Activar notificaciones por correo electrónico');
    fireEvent.click(checkbox);
    
    expect(screen.getByRole('button', { name: /Guardar Cambios/i })).not.toBeDisabled();
  });

  it('should render Email form when tab is clicked', () => {
    renderComponent();
    
    fireEvent.click(screen.getByRole('button', { name: /Correo Electrónico/i }));
    
    expect(screen.getByLabelText('Servidor SMTP')).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario SMTP')).toBeInTheDocument();
    
    const smtpInput = screen.getByLabelText('Servidor SMTP');
    fireEvent.change(smtpInput, { target: { value: 'smtp.test.com' } });
    
    expect(screen.getByRole('button', { name: /Guardar Cambios/i })).not.toBeDisabled();
  });

  it('should render Users form when tab is clicked', () => {
    renderComponent();
    
    fireEvent.click(screen.getByRole('button', { name: /Usuarios/i }));
    
    expect(screen.getByLabelText('Permitir registro de usuarios')).toBeInTheDocument();
    expect(screen.getByLabelText('Longitud mínima de contraseña')).toBeInTheDocument();
    
    const lengthInput = screen.getByLabelText('Longitud mínima de contraseña');
    fireEvent.change(lengthInput, { target: { value: '10' } });
    
    expect(screen.getByRole('button', { name: /Guardar Cambios/i })).not.toBeDisabled();
  });

  it('should render Security form when tab is clicked', () => {
    renderComponent();
    
    fireEvent.click(screen.getByRole('button', { name: /Seguridad/i }));
    
    expect(screen.getByLabelText('Habilitar autenticación de dos factores')).toBeInTheDocument();
    expect(screen.getByLabelText('Direcciones IP permitidas')).toBeInTheDocument();
    
    const ipInput = screen.getByLabelText('Direcciones IP permitidas');
    fireEvent.change(ipInput, { target: { value: '192.168.1.1' } });
    
    expect(screen.getByRole('button', { name: /Guardar Cambios/i })).not.toBeDisabled();
  });

  it('should render System form when tab is clicked', () => {
    renderComponent();
    
    fireEvent.click(screen.getByRole('button', { name: /Sistema/i }));
    
    expect(screen.getByLabelText('Habilitar registros (logs)')).toBeInTheDocument();
    expect(screen.getByLabelText('Nivel de registro')).toBeInTheDocument();
    
    const logLevelSelect = screen.getByLabelText('Nivel de registro');
    fireEvent.change(logLevelSelect, { target: { value: 'debug' } });
    
    expect(screen.getByRole('button', { name: /Guardar Cambios/i })).not.toBeDisabled();
  });
});
