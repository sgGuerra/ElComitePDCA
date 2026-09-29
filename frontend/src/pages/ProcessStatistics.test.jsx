import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProcessStatistics from './ProcessStatistics';
import processService from '../services/processService';
import statisticsService from '../services/statisticsService';
import { ToastProvider } from '../contexts/ToastContext';

vi.mock('recharts', () => {
  const OriginalRechartsModule = vi.importActual('recharts');
  return {
    ...OriginalRechartsModule,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: '100%', height: 300 }} data-testid="responsive-container">
        {children}
      </div>
    ),
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ data }) => <div data-testid="pie-series" data-series={JSON.stringify(data)} />,
    Cell: () => <div />,
    BarChart: ({ data }) => <div data-testid="bar-chart" data-series={JSON.stringify(data)} />,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    Tooltip: () => <div />,
    LineChart: ({ data }) => <div data-testid="line-chart" data-series={JSON.stringify(data)} />,
    Line: () => <div />,
    CartesianGrid: () => <div />,
    Legend: () => <div />
  };
});

vi.mock('../services/processService', () => ({
  default: {
    getProcessById: vi.fn(),
    getProcessStatistics: vi.fn(),
  },
}));

vi.mock('../services/statisticsService', () => ({
  default: {
    getActionsByStatus: vi.fn(),
    getActionsByType: vi.fn(),
    getActionsOverTime: vi.fn(),
  },
}));

const mockProcess = {
  id: 1,
  name: 'Process 1',
  description: 'Description 1'
};

const mockStatistics = {
  totalActions: 100,
  completedActions: 75,
  avgCompletionDays: 5,
  lastActivityDate: '2023-01-01',
  overdueActions: 10,
  mainPriority: 'high',
  effectivenessRate: 80
};

const mockActionsByStatus = [
  { status: 'completed', count: 75 },
  { status: 'pending', count: 25 }
];

const mockActionsByType = [
  { type: 'high', count: 50 },
  { type: 'low', count: 50 }
];

const mockActionsOverTime = [
  { date: '2023-01', completed: 10, pending: 5, overdue: 2 }
];

const renderComponent = () => {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/procesos/1/estadisticas']}>
        <Routes>
          <Route path="/procesos/:processId/estadisticas" element={<ProcessStatistics />} />
          <Route path="/procesos" element={<div>Lista de procesos</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('ProcessStatistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    processService.getProcessById.mockResolvedValue(mockProcess);
    processService.getProcessStatistics.mockResolvedValue(mockStatistics);
    statisticsService.getActionsByStatus.mockResolvedValue(mockActionsByStatus);
    statisticsService.getActionsByType.mockResolvedValue(mockActionsByType);
    statisticsService.getActionsOverTime.mockResolvedValue(mockActionsOverTime);
  });

  it('should fetch and display process statistics data', async () => {
    renderComponent();
    
    expect(processService.getProcessById).toHaveBeenCalledWith('1');
    expect(processService.getProcessStatistics).toHaveBeenCalledWith('1');
    expect(statisticsService.getActionsByStatus).toHaveBeenCalledWith({ processId: '1', dateRange: 'month' });
    
    await waitFor(() => {
      // Header
      expect(screen.getByText('Process 1')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      
      // KPIs
      expect(screen.getByText('100')).toBeInTheDocument(); // Total
      expect(screen.getByText('75')).toBeInTheDocument(); // Completed
      expect(screen.getByText('75%')).toBeInTheDocument(); // Percentage
      
      // Recommendations & Performance Summary
      expect(screen.getByText(/El proceso "Process 1" muestra un rendimiento global/)).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument(); // Effectiveness
      expect(screen.getByText('10')).toBeInTheDocument(); // Overdue
      
      // Charts
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('should update date range when filter buttons are clicked', async () => {
    // Arrange: load the page, then isolate calls made by the filter action.
    renderComponent();
    await screen.findByText('Process 1');
    vi.clearAllMocks();

    // Act: select a different date range.
    const yearButton = screen.getByRole('button', { name: 'Año' });
    fireEvent.click(yearButton);

    // Assert: the request uses the selected range.
    await waitFor(() => {
      expect(statisticsService.getActionsByStatus).toHaveBeenCalledWith({ processId: '1', dateRange: 'year' });
    });
  });

  it('should display error if fetch fails', async () => {
    processService.getProcessById.mockRejectedValue(new Error('Fetch error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getAllByText('Error al cargar las estadísticas del proceso').length).toBeGreaterThan(0);
    });
  });

  it('handles zero totals, missing dates, and low-performance recommendations', async () => {
    processService.getProcessStatistics.mockResolvedValue({
      totalActions: 0,
      completedActions: 0,
      avgCompletionDays: 11,
      lastActivityDate: null,
      overdueActions: 1,
      mainPriority: 'custom_priority',
      effectivenessRate: 0,
    });
    statisticsService.getActionsByStatus.mockResolvedValue([]);
    statisticsService.getActionsByType.mockResolvedValue([]);
    statisticsService.getActionsOverTime.mockResolvedValue([]);

    renderComponent();

    await screen.findByText('Process 1');

    expect(screen.getAllByText('0%')).toHaveLength(2);
    expect(screen.getAllByText('11 días')).toHaveLength(2);
    expect(screen.getByText('El proceso "Process 1" muestra un rendimiento global bajo con una tasa de completado del 0%.')).toBeInTheDocument();
    expect(screen.getByText('Hay 1 acción vencida. Priorizar su resolución para evitar retrasos adicionales.')).toBeInTheDocument();
    expect(screen.getByText('La tasa de completado es baja. Revisar las acciones pendientes y asignar recursos adicionales.')).toBeInTheDocument();
    expect(screen.getByText('El tiempo promedio de resolución es alto. Analizar posibles cuellos de botella en el proceso.')).toBeInTheDocument();
    expect(screen.getByText('custom_priority')).toBeInTheDocument();
  });

  it('handles known and unknown chart categories and defaults a missing priority to medium', async () => {
    statisticsService.getActionsByStatus.mockResolvedValue([
      { status: 'pending', count: 1 },
      { status: 'in_progress', count: 2 },
      { status: 'completed', count: 3 },
      { status: 'canceled', count: 4 },
      { status: 'overdue', count: 5 },
      { status: 'custom_status', count: 6 },
    ]);
    statisticsService.getActionsByType.mockResolvedValue([
      { type: 'high', count: 1 },
      { type: 'medium', count: 2 },
      { type: 'low', count: 3 },
      { type: 'custom_priority', count: 4 },
      { count: 5 },
    ]);

    renderComponent();

    await screen.findByText('Process 1');
    const statusSeries = JSON.parse(screen.getByTestId('bar-chart').dataset.series);
    expect(statusSeries.map(({ name, color }) => [name, color])).toEqual([
      ['Pendiente', '#EAB308'],
      ['En progreso', '#3B82F6'],
      ['Completada', '#22C55E'],
      ['Cancelada', '#EF4444'],
      ['Vencida', '#F97316'],
      ['custom_status', '#6B7280'],
    ]);

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    const prioritySeries = JSON.parse(screen.getByTestId('pie-series').dataset.series);
    expect(prioritySeries.map(({ name, color }) => [name, color])).toEqual([
      ['Alta', '#EF4444'],
      ['Media', '#3B82F6'],
      ['Baja', '#22C55E'],
      ['custom_priority', '#6B7280'],
      ['Media', '#3B82F6'],
    ]);
  });

  it('returns to the process list from the error state', async () => {
    processService.getProcessById.mockRejectedValue(new Error('Fetch error'));

    renderComponent();

    const backButton = await screen.findByRole('button', { name: 'Volver a la lista' });
    fireEvent.click(backButton);

    expect(await screen.findByText('Lista de procesos')).toBeInTheDocument();
  });
});
