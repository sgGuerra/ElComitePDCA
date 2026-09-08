import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Import real components to generate coverage
import LoadingOverlay from './components/LoadingOverlay';
import NotFound from './pages/NotFound';
import { API_URL, API_TIMEOUT } from './config';

// ---- Config Tests ----
describe('Config', () => {
  it('should export API_URL with a default value', () => {
    expect(API_URL).toBeDefined();
    expect(typeof API_URL).toBe('string');
  });

  it('should export API_TIMEOUT as 30000ms', () => {
    expect(API_TIMEOUT).toBe(30000);
  });
});

// ---- LoadingOverlay Tests ----
describe('LoadingOverlay', () => {
  it('should render nothing when loading is false', () => {
    const { container } = render(<LoadingOverlay loading={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render overlay with default message when loading is true', () => {
    render(<LoadingOverlay loading={true} />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render overlay with custom message', () => {
    render(<LoadingOverlay loading={true} message="Procesando..." />);
    expect(screen.getByText('Procesando...')).toBeInTheDocument();
  });
});

// ---- NotFound Page Tests ----
describe('NotFound Page', () => {
  const renderNotFound = () => {
    return render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
  };

  it('should render the 404 title', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('should render the "Página no encontrada" subtitle', () => {
    renderNotFound();
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });

  it('should render a link to go to dashboard', () => {
    renderNotFound();
    expect(screen.getByText('Ir al Inicio')).toBeInTheDocument();
  });

  it('should render a "Volver atrás" button', () => {
    renderNotFound();
    expect(screen.getByText('Volver atrás')).toBeInTheDocument();
  });

  it('should render a search input', () => {
    renderNotFound();
    expect(screen.getByPlaceholderText('Buscar en El Comité...')).toBeInTheDocument();
  });

  it('should render support contact link', () => {
    renderNotFound();
    expect(screen.getByText(/Contacta a soporte/)).toBeInTheDocument();
  });
});
