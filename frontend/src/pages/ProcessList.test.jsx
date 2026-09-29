import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ProcessList from './ProcessList';
import processService from '../services/processService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});
vi.mock('../components/Header', () => ({ default: () => <header /> }));
vi.mock('../components/LoadingOverlay', () => ({ default: () => null }));
vi.mock('../components/ProcessManagement', () => ({ default: () => null }));
vi.mock('../services/processService', () => ({ default: { getAllProcesses: vi.fn() } }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../contexts/ToastContext', () => ({ useToast: vi.fn() }));

const processes = [
  { id: 1, name: 'Calidad', description: 'Revisión del sistema de calidad', owner: 'Ana Ruiz', status: 'active', priority: 'high' },
  { id: 2, name: 'Seguridad', description: 'Control de riesgos', owner: 'Luis Mora', status: 'pending', priority: 'medium' },
];

describe('ProcessList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    processService.getAllProcesses.mockResolvedValue(processes);
    useAuth.mockReturnValue({ user: { role: 'admin' } });
    useToast.mockReturnValue({ error: vi.fn() });
  });

  it('lists processes, searches by owner, shows status, and navigates to details', async () => {
    render(<ProcessList />);

    expect(await screen.findByText('Calidad')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Buscar proceso...');
    for (const query of ['Ana Ruiz', 'sistema de calidad', 'calidad']) {
      fireEvent.change(searchInput, { target: { value: query } });
      expect(screen.getByText('Calidad')).toBeInTheDocument();
      expect(screen.queryByText('Seguridad')).not.toBeInTheDocument();
    }

    fireEvent.change(searchInput, { target: { value: '' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pending' } });
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
    expect(screen.queryByText('Calidad')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'all' } });

    fireEvent.click(screen.getAllByRole('button', { name: 'Ver Acciones' })[0]);
    expect(navigateMock).toHaveBeenCalledWith('/procesos/1/acciones');

    fireEvent.click(screen.getAllByRole('button', { name: 'Estadísticas' })[0]);
    expect(navigateMock).toHaveBeenCalledWith('/procesos/1/estadisticas');
  });

  it('shows an empty result when no process matches', async () => {
    render(<ProcessList />);
    await screen.findByText('Calidad');

    fireEvent.change(screen.getByPlaceholderText('Buscar proceso...'), {
      target: { value: 'Proceso inexistente' },
    });

    await waitFor(() => {
      expect(screen.getByText(/No se encontraron procesos/)).toBeInTheDocument();
    });
  });
});