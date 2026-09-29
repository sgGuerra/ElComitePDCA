import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationsHistory from './NotificationsHistory';
import notificationService from '../services/notificationService';
import { ToastProvider } from '../contexts/ToastContext';

vi.mock('../components/Header', () => ({ default: () => <header /> }));
vi.mock('../components/LoadingOverlay', () => ({ default: () => null }));
vi.mock('../services/notificationService', () => ({
  default: { getUserNotifications: vi.fn() },
}));

const renderPage = () => render(
  <ToastProvider>
    <MemoryRouter>
      <NotificationsHistory />
    </MemoryRouter>
  </ToastProvider>
);

describe('NotificationsHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows notifications returned for the authenticated user', async () => {
    notificationService.getUserNotifications.mockResolvedValue([
      {
        id: 7,
        title: 'Acción asignada',
        message: 'Tienes una acción nueva',
        created_at: '2026-09-28T12:00:00',
        read: false,
      },
    ]);

    renderPage();

    expect(await screen.findByText('Acción asignada')).toBeInTheDocument();
    expect(screen.getByText('Tienes una acción nueva')).toBeInTheDocument();
    expect(screen.getByText('Sin leer')).toBeInTheDocument();
    expect(notificationService.getUserNotifications).toHaveBeenCalledWith({ limit: 100 });
  });

  it('shows the empty state when the user has no notifications', async () => {
    notificationService.getUserNotifications.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('No tienes notificaciones');
    });
  });
});