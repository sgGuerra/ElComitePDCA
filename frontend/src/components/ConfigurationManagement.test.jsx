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
    // Arrange: el recordatorio empieza activo, y el usuario va a cancelar el diálogo
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ConfigurationManagement />);
    fireEvent.click(screen.getByText('Notificaciones'));
    const checkbox = document.getElementById('notifyOnDueDateApproaching');
    expect(checkbox.checked).toBe(true); // confirmamos el punto de partida antes de actuar

    // Act: el usuario intenta apagar el checkbox
    fireEvent.click(checkbox);

    // Assert: se pidió confirmación, y como se canceló, el recordatorio sigue activo
    expect(confirmSpy).toHaveBeenCalled();
    expect(checkbox.checked).toBe(true);
  });
});
