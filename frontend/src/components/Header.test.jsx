// RF-11/RF-12 · Recordatorios y Notificaciones en Tiempo Real
// Pruebas para Header.jsx:
//   - E17/E22: "Marcar todas como leídas" pide confirmación antes de aplicar
//   - E18: hacer clic en una notificación navega a la acción relacionada
//          antes de marcarla como leída (no se pierde sin revisar)

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Header from './Header';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: 'admin', roles: ['admin'] }, logout: vi.fn() }),
}));

vi.mock('../services/notificationService', () => ({
  default: {
    getUnreadCount: vi.fn().mockResolvedValue(1),
    getUserNotifications: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue({}),
    markAllAsRead: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../services/actionService', () => ({
  default: {
    getActionById: vi.fn(),
  },
}));

import notificationService from '../services/notificationService';
import actionService from '../services/actionService';

describe('Header - notificaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationService.getUnreadCount.mockResolvedValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('E17/E22: pide confirmación antes de marcar todas como leídas, y no marca nada si se cancela', async () => {
    // Arrange: hay 1 notificación sin leer, y el usuario va a cancelar el diálogo de confirmación
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    notificationService.getUserNotifications.mockResolvedValue([
      { id: 1, title: 'N1', message: 'M1', read: false, created_at: new Date().toISOString() },
    ]);
    render(<Header activeTab="Resumen" setActiveTab={() => {}} tabs={['Resumen']} />);

    // Act: abre el dropdown de notificaciones (clic en la campana) y le da a "Marcar todas como leídas"
    const bellIcon = document.querySelector('svg.text-xl').closest('button');
    fireEvent.click(bellIcon);
    const markAllButton = await screen.findByText('Marcar todas como leídas');
    fireEvent.click(markAllButton);

    // Assert: pidió confirmación, y como se canceló, no le pegó al backend
    expect(confirmSpy).toHaveBeenCalled();
    expect(notificationService.markAllAsRead).not.toHaveBeenCalled();
  });

  it('E18: al hacer clic en una notificación de acción, navega a la acción antes de marcarla como leída', async () => {
    // Arrange: una notificación sin leer, ligada a la acción 42 del proceso 7
    notificationService.getUserNotifications.mockResolvedValue([
      {
        id: 5,
        title: 'Acción vencida',
        message: 'La acción X venció',
        read: false,
        related_type: 'action',
        related_id: 42,
        created_at: new Date().toISOString(),
      },
    ]);
    actionService.getActionById.mockResolvedValue({ id: 42, process_id: 7 });
    render(<Header activeTab="Resumen" setActiveTab={() => {}} tabs={['Resumen']} />);

    // Act: abre el dropdown y hace clic sobre la notificación
    const bellIcon = document.querySelector('svg.text-xl').closest('button');
    fireEvent.click(bellIcon);
    const notificationTitle = await screen.findByText('Acción vencida');
    fireEvent.click(notificationTitle);

    // Assert: primero navega a la acción, y recién ahí la marca como leída
    await waitFor(() => {
      expect(actionService.getActionById).toHaveBeenCalledWith(42);
      expect(navigateMock).toHaveBeenCalledWith('/procesos/7/acciones/42');
      expect(notificationService.markAsRead).toHaveBeenCalledWith(5);
    });
  });
});
