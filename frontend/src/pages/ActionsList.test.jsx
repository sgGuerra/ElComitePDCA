import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ActionsList from './ActionsList';
import actionService from '../services/actionService';
import processService from '../services/processService';
import userService from '../services/userService';
import { ToastProvider } from '../contexts/ToastContext';
import * as AuthContext from '../contexts/AuthContext';

// Mock services
vi.mock('../services/actionService', () => ({
  default: {
    getActionsByProcess: vi.fn(),
    createAction: vi.fn(),
    updateAction: vi.fn(),
    deleteAction: vi.fn(),
  },
}));

vi.mock('../services/processService', () => ({
  default: {
    getProcessById: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  default: {
    getProcessLeaders: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockProcess = { id: 1, name: 'Test Process', description: 'Test Description' };
const mockActions = [
  { id: 1, name: 'Action 1', leader_name: 'Leader A', leader_id: 1, status: 'pending', priority: 'high', target_date: '2023-12-01T00:00:00.000Z', what: 'Do something' },
  { id: 2, name: 'Action 2', leader_name: 'Leader B', leader_id: 2, status: 'completed', priority: 'low', target_date: '2023-10-01T00:00:00.000Z', what: 'Did something' },
];
const mockUsers = [{ id: 1, name: 'Leader A' }, { id: 2, name: 'Leader B' }];

const renderActionsList = () => {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/procesos/1/acciones']}>
        <Routes>
          <Route path="/procesos/:processId/acciones" element={<ActionsList />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('ActionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    processService.getProcessById.mockResolvedValue(mockProcess);
    actionService.getActionsByProcess.mockResolvedValue(mockActions);
    userService.getProcessLeaders.mockResolvedValue(mockUsers);

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'Admin', role: 'admin' },
    });

    // Mock URL for CSV export
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should render loading overlay initially and then fetch data', async () => {
    renderActionsList();

    expect(processService.getProcessById).toHaveBeenCalledWith('1');
    expect(actionService.getActionsByProcess).toHaveBeenCalledWith('1');
    expect(userService.getProcessLeaders).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Test Process')).toBeInTheDocument();
      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
    });
  });

  it('should filter actions by search text', async () => {
    renderActionsList();

    await waitFor(() => expect(screen.getByText('Action 1')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Buscar acción...');
    fireEvent.change(searchInput, { target: { value: 'Action 1' } });

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.queryByText('Action 2')).not.toBeInTheDocument();
  });

  it('should filter actions by status', async () => {
    renderActionsList();
    await waitFor(() => expect(screen.getByText('Action 1')).toBeInTheDocument());

    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[0]; // Assuming it's the first one in the filters

    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    expect(screen.queryByText('Action 1')).not.toBeInTheDocument(); // pending
    expect(screen.getByText('Action 2')).toBeInTheDocument(); // completed
  });

  it('should filter actions by priority', async () => {
    renderActionsList();
    await waitFor(() => expect(screen.getByText('Action 1')).toBeInTheDocument());

    const selects = screen.getAllByRole('combobox');
    const prioritySelect = selects[1]; // Second filter

    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    expect(screen.getByText('Action 1')).toBeInTheDocument(); // high
    expect(screen.queryByText('Action 2')).not.toBeInTheDocument(); // low
  });

  it('should open new action modal and show validation errors', async () => {
    renderActionsList();
    await waitFor(() => expect(screen.getByText('Action 1')).toBeInTheDocument());

    // Open modal
    fireEvent.click(screen.getByText('Nueva Acción'));
    expect(screen.getByText('Crear Acción')).toBeInTheDocument();

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: 'Crear Acción' }));

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(await screen.findByText('El campo "¿Qué?" es obligatorio')).toBeInTheDocument();

    expect(actionService.createAction).not.toHaveBeenCalled();
  });

  it('should create new action successfully', async () => {
    actionService.createAction.mockResolvedValue({ success: true, data: { id: 3, name: 'New Action', status: 'pending', priority: 'medium' } });

    renderActionsList();
    await waitFor(() => expect(screen.getByText('Action 1')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Nueva Acción'));

    const nameInput = screen.getAllByPlaceholderText('Nombre de la acción')[0];
    const whatInput = screen.getByPlaceholderText('Descripción de la acción');

    fireEvent.change(nameInput, { target: { value: 'New Action' } });
    fireEvent.change(whatInput, { target: { value: 'New What' } });

    fireEvent.click(screen.getByRole('button', { name: 'Crear Acción' }));

    await waitFor(() => {
      expect(actionService.createAction).toHaveBeenCalled();
      expect(screen.getByText('New Action')).toBeInTheDocument();
    });
  });

  it('should open edit action modal and update successfully', async () => {
    actionService.updateAction.mockResolvedValue({ success: true });

    renderActionsList();
    await waitFor(() => expect(screen.getByText('Action 1')).toBeInTheDocument());

    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]); // Edit Action 1

    expect(await screen.findByText('Actualizar Acción')).toBeInTheDocument();

    const nameInput = screen.getAllByPlaceholderText('Nombre de la acción')[0];
    fireEvent.change(nameInput, { target: { value: 'Updated Action' } });

    fireEvent.click(screen.getAllByRole('button', { name: 'Actualizar Acción' })[0]);

    await waitFor(() => {
      expect(actionService.updateAction).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Updated Action' }));
      expect(screen.getByText('Updated Action')).toBeInTheDocument();
    });
  });

  it('should delete action after confirmation', async () => {
    actionService.deleteAction.mockResolvedValue({ success: true });

    renderActionsList();
    await waitFor(() => expect(screen.getByText('Action 1')).toBeInTheDocument());

    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]); // Delete Action 1

    expect(await screen.findByText('Confirmar Eliminación')).toBeInTheDocument();

    const confirmDeleteBtns = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmDeleteBtns[confirmDeleteBtns.length - 1]);

    await waitFor(() => {
      expect(actionService.deleteAction).toHaveBeenCalledWith(1);
      expect(screen.queryByText('Action 1')).not.toBeInTheDocument();
    });
  });

  it('should trigger CSV export', async () => {
    renderActionsList();
    await waitFor(() => expect(screen.getByText('Action 1')).toBeInTheDocument());

    const exportBtn = screen.getByText('Exportar CSV');
    fireEvent.click(exportBtn);

    // handleExportCSV ahora revalida la sesión contra el servidor antes de
    // exportar (await actionService.getActionsByProcess), así que ya no es
    // síncrono como cuando se escribió esta prueba originalmente.
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────
// RF-08 · Generación y Exportación de Informes Personalizados
// (traído de la rama anterior origin/David, donde se implementaron estos fixes)
//   - E06: exportar con la lista vacía (por filtros) no genera un CSV vacío, avisa al usuario
//   - E08: reintentar exportar cuando la sesión ya expiró no exporta datos obsoletos
// ──────────────────────────────────────────────────────────────────────────

describe('ActionsList - handleExportCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    processService.getProcessById.mockResolvedValue(mockProcess);
    userService.getProcessLeaders.mockResolvedValue(mockUsers);
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'Admin', role: 'admin' },
    });
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('E06: no genera el CSV y avisa al usuario cuando la lista (por defecto) está vacía', async () => {
    // Valor por defecto del escenario roto: lista de acciones vacía
    actionService.getActionsByProcess.mockResolvedValue([]);

    renderActionsList();

    const exportButton = await screen.findByText('Exportar CSV');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('No hay datos para exportar con los filtros actuales')).toBeInTheDocument();
    });
  });

  it('E08: avisa y no exporta datos obsoletos cuando la sesión ya expiró al reintentar', async () => {
    // Valor por defecto del escenario roto: la carga inicial funciona (hay datos),
    // pero la sesión ya expiró para cuando el usuario reintenta exportar
    actionService.getActionsByProcess
      .mockResolvedValueOnce([
        { id: 1, name: 'Acción 1', status: 'pending', priority: 'medium', leader_name: 'Líder 1' },
      ])
      .mockRejectedValueOnce({ response: { status: 401 } });

    renderActionsList();
    await waitFor(() => expect(screen.getByText('Acción 1')).toBeInTheDocument());

    const exportButton = await screen.findByText('Exportar CSV');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('No se pudo exportar: tu sesión pudo haber expirado. Inicia sesión de nuevo.')).toBeInTheDocument();
    });

    // Se intentó revalidar contra el servidor (carga inicial + reintento de exportación)
    expect(actionService.getActionsByProcess).toHaveBeenCalledTimes(2);
  });
});
