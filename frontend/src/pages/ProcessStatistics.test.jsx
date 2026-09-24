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
    PieChart: () => <div data-testid="pie-chart" />,
    Pie: () => <div />,
    Cell: () => <div />,
    BarChart: () => <div data-testid="bar-chart" />,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    Tooltip: () => <div />,
    LineChart: () => <div data-testid="line-chart" />,
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
    renderComponent();
    
    await waitFor(() => expect(screen.getByText('Process 1')).toBeInTheDocument());
    
    vi.clearAllMocks();
    
    // Default mock setup for re-fetch
    processService.getProcessById.mockResolvedValue(mockProcess);
    processService.getProcessStatistics.mockResolvedValue(mockStatistics);
    statisticsService.getActionsByStatus.mockResolvedValue([]);
    statisticsService.getActionsByType.mockResolvedValue([]);
    statisticsService.getActionsOverTime.mockResolvedValue([]);
    
    const yearButton = screen.getByRole('button', { name: 'Año' });
    fireEvent.click(yearButton);
    
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
});
