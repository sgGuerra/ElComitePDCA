import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

describe('NotFound', () => {
  beforeEach(() => {
    // Mock window.history.back
    Object.defineProperty(window, 'history', {
      writable: true,
      value: { back: vi.fn() }
    });
  });

  it('should render 404 message', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
    expect(screen.getByText('Lo sentimos, la página que estás buscando no existe o ha sido movida.')).toBeInTheDocument();
  });

  it('should have a link to the dashboard', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    
    const homeLink = screen.getByRole('link', { name: /Ir al Inicio/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.getAttribute('href')).toBe('/dashboard');
  });

  it('should go back when clicking Volver atrás', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    
    const backBtn = screen.getByRole('button', { name: /Volver atrás/i });
    fireEvent.click(backBtn);
    
    expect(window.history.back).toHaveBeenCalled();
  });

  it('should render search input', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    
    expect(screen.getByPlaceholderText('Buscar en El Comité...')).toBeInTheDocument();
  });

  it('should render support email link', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    
    const supportLink = screen.getByRole('link', { name: /¿Necesitas ayuda\? Contacta a soporte\./i });
    expect(supportLink).toBeInTheDocument();
    expect(supportLink.getAttribute('href')).toBe('mailto:soporte@elcomite.com');
  });
});
