// RF-08 · Generación y Exportación de Informes Personalizados
// Pruebas para handleExportCSV en ActionsList.jsx:
//   - E06: exportar con la lista vacía (por filtros) no genera un CSV vacío, avisa al usuario
//   - E08: reintentar exportar cuando la sesión ya expiró no exporta datos obsoletos

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActionsList from './ActionsList';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ processId: '1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'admin' } }),
}));

const showErrorMock = vi.fn();
vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: showErrorMock }),
}));

vi.mock('../services/processService', () => ({
  default: {
    getProcessById: vi.fn().mockResolvedValue({ id: 1, name: 'Proceso de Prueba' }),
  },
}));

vi.mock('../services/userService', () => ({
  default: {
    getProcessLeaders: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../services/actionService', () => ({
  default: {
    getActionsByProcess: vi.fn(),
  },
}));

import actionService from '../services/actionService';

describe('ActionsList - handleExportCSV', () => {
  beforeEach(() => {
    showErrorMock.mockClear();
    actionService.getActionsByProcess.mockReset();
  });

  it('E06: no genera el CSV y avisa al usuario cuando la lista (por defecto) está vacía', async () => {
    // Valor por defecto del escenario roto: lista de acciones vacía
    actionService.getActionsByProcess.mockResolvedValue([]);

    render(<ActionsList />);

    const exportButton = await screen.findByText('Exportar CSV');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith(
        'No hay datos para exportar con los filtros actuales'
      );
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

    render(<ActionsList />);

    const exportButton = await screen.findByText('Exportar CSV');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith(
        'No se pudo exportar: tu sesión pudo haber expirado. Inicia sesión de nuevo.'
      );
    });

    // Se intentó revalidar contra el servidor (carga inicial + reintento de exportación)
    expect(actionService.getActionsByProcess).toHaveBeenCalledTimes(2);
  });
});
