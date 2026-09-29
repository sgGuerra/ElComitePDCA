import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';
import statisticsService from '../services/statisticsService';
import processService from '../services/processService';
import { ToastProvider } from '../contexts/ToastContext';

// Mock recharts to avoid rendering issues in JSDOM
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

vi.mock('../services/statisticsService', () => ({
  default: {
    getDashboardStatistics: vi.fn(),
    getActionsByType: vi.fn(),
    getUpcomingDeadlines: vi.fn(),
    getCompletionRate: vi.fn(),
    getActionsByStatus: vi.fn(),
    getActionsOverTime: vi.fn(),
  },
}));

vi.mock('../services/processService', () => ({
  default: {
    getAllProcesses: vi.fn(),
  },
}));

// Mock Header to avoid testing it here
vi.mock('../components/Header', () => ({
  default: ({ activeTab, setActiveTab }) => (
    <div data-testid="header-mock">
      <button onClick={() => setActiveTab('Resumen')}>Resumen</button>
      <button onClick={() => setActiveTab('Procesos')}>Procesos</button>
    </div>
  ),
}));

const mockProcesses = [
  { id: 1, name: 'Process 1' },
  { id: 2, name: 'Process 2' },
];

const mockStats = {
  lastAction: {
    id: 1, name: 'Last Action', created_at: '2023-01-01T00:00:00.000Z', leader_name: 'Admin', what: 'Do this'
  }
};

const mockActionsByType = [
  { type: 'preventive', count: 10 },
  { type: 'corrective', count: 20 },
];

const mockUpcomingDeadlines = [
  { id: 1, name: 'Task 1', target_date: '2023-12-01' },
];

const mockCompletionRate = { rate: 75 };

const mockActionsByStatus = [
  { status: 'completed', count: 15, actions: [{ id: 1, name: 'Completed 1', updated_at: '2023-01-01' }] },
  { status: 'pending', count: 5 },
  { status: 'in_progress', count: 0 },
  { status: 'overdue', count: 2 },
];

const mockActionsOverTime = [
  { date: '2023-01', completed: 10, pending: 5, overdue: 2 }
];

const renderComponent = () => {
  return render(
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    processService.getAllProcesses.mockResolvedValue(mockProcesses);
    statisticsService.getDashboardStatistics.mockResolvedValue(mockStats);
    statisticsService.getActionsByType.mockResolvedValue(mockActionsByType);
    statisticsService.getUpcomingDeadlines.mockResolvedValue(mockUpcomingDeadlines);
    statisticsService.getCompletionRate.mockResolvedValue(mockCompletionRate);
    statisticsService.getActionsByStatus.mockResolvedValue(mockActionsByStatus);
    statisticsService.getActionsOverTime.mockResolvedValue(mockActionsOverTime);
  });

  it('should fetch and display dashboard data', async () => {
    renderComponent();
    
    expect(processService.getAllProcesses).toHaveBeenCalled();
    expect(statisticsService.getDashboardStatistics).toHaveBeenCalled();
    
    await waitFor(() => {
      // Check KPIs
      expect(screen.getAllByText('22').length).toBeGreaterThan(0); // total = 15+5+0+2
      expect(screen.getAllByText('15').length).toBeGreaterThan(0); // completed
      expect(screen.getAllByText('5').length).toBeGreaterThan(0); // pending + in progress
      expect(screen.getAllByText('2').length).toBeGreaterThan(0); // overdue
      
      // Check last action
      expect(screen.getByText('Last Action')).toBeInTheDocument();
      
      // Check upcoming deadline
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      
      // Check completed action
      expect(screen.getByText('Completed 1')).toBeInTheDocument();
      
      // Check charts render wrappers
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('should handle filter by process', async () => {
    renderComponent();
    
    await waitFor(() => expect(screen.getByText('22')).toBeInTheDocument());
    
    // Clear mocks to check if they are called with specific processId
    vi.clearAllMocks();
    
    // Changing filters shouldn't trigger getAllProcesses again
    // But it should trigger statistics APIs with processId
    statisticsService.getDashboardStatistics.mockResolvedValue(mockStats);
    statisticsService.getActionsByType.mockResolvedValue([]);
    statisticsService.getUpcomingDeadlines.mockResolvedValue([]);
    statisticsService.getCompletionRate.mockResolvedValue({ rate: 0 });
    statisticsService.getActionsByStatus.mockResolvedValue([]);
    statisticsService.getActionsOverTime.mockResolvedValue([]);
    
    const processSelect = screen.getByRole('combobox');
    fireEvent.change(processSelect, { target: { value: '1' } });
    
    await waitFor(() => {
      expect(statisticsService.getUpcomingDeadlines).toHaveBeenCalledWith(expect.objectContaining({ processId: '1' }));
    });
  });

  it('should handle date range filters', async () => {
    renderComponent();
    
    await waitFor(() => expect(screen.getByText('22')).toBeInTheDocument());
    
    vi.clearAllMocks();
    
    statisticsService.getDashboardStatistics.mockResolvedValue(mockStats);
    statisticsService.getActionsByType.mockResolvedValue([]);
    statisticsService.getUpcomingDeadlines.mockResolvedValue([]);
    statisticsService.getCompletionRate.mockResolvedValue({ rate: 0 });
    statisticsService.getActionsByStatus.mockResolvedValue([]);
    statisticsService.getActionsOverTime.mockResolvedValue([]);
    
    const yearButton = screen.getByRole('button', { name: 'Año' });
    fireEvent.click(yearButton);
    
    await waitFor(() => {
      expect(statisticsService.getUpcomingDeadlines).toHaveBeenCalledWith(expect.objectContaining({ dateRange: 'year' }));
    });
  });

  it('should handle errors gracefully', async () => {
    statisticsService.getDashboardStatistics.mockRejectedValue(new Error('API Error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getAllByText('Error al cargar los datos del dashboard').length).toBeGreaterThan(0);
    });
  });
});
