// RF-11 · Recordatorios Automáticos para Acciones de Mejora Próximas a Vencer
// E16: desactivar el recordatorio de vencimiento debe pedir confirmación

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ConfigurationManagement from './ConfigurationManagement';

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

describe('ConfigurationManagement - recordatorios', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('E16: pide confirmación al desactivar el recordatorio, y no lo desactiva si se cancela', () => {
    // Valor por defecto del escenario roto: el recordatorio está activo (true)
    // y el usuario cancela el diálogo de confirmación al intentar apagarlo
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ConfigurationManagement />);

    fireEvent.click(screen.getByText('Notificaciones'));

    const checkbox = document.getElementById('notifyOnDueDateApproaching');
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);

    expect(confirmSpy).toHaveBeenCalled();
    expect(checkbox.checked).toBe(true); // sigue activo: la cancelación no lo apagó
  });

  it('E16: desactiva el recordatorio si el usuario confirma la advertencia', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ConfigurationManagement />);

    fireEvent.click(screen.getByText('Notificaciones'));
    const checkbox = document.getElementById('notifyOnDueDateApproaching');

    fireEvent.click(checkbox);

    expect(checkbox.checked).toBe(false);
  });
});
