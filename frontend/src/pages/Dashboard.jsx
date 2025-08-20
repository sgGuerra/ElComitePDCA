// src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { 
  FaRegClock, 
  FaRegCheckCircle, 
  FaPlus, 
  FaFilter, 
  FaCalendarAlt, 
  FaChartLine,
  FaInfoCircle
} from 'react-icons/fa';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend 
} from 'recharts';

import Header from '../components/Header';
import LoadingOverlay from '../components/LoadingOverlay';
import statisticsService from '../services/statisticsService';
import processService from '../services/processService';
import { useToast } from '../contexts/ToastContext';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Resumen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [completedActions, setCompletedActions] = useState([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [lastAction, setLastAction] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('all');
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [kpis, setKpis] = useState({
    totalActions: 0,
    completedActions: 0,
    pendingActions: 0,
    overdueActions: 0
  });
  const { error: showError } = useToast();

  useEffect(() => {
    if (activeTab === 'Resumen') {
      fetchProcesses();
      fetchDashboardData();
    }
  }, [activeTab, selectedProcess, dateRange]);

  const fetchProcesses = async () => {
    try {
      const data = await processService.getAllProcesses();
      setProcesses(data);
    } catch (err) {
      console.error('Error fetching processes:', err);
      showError('Error al cargar los procesos');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics data in parallel for better performance
      const [stats, actionsByType, upcomingDeadlinesData, completionRateData, 
             actionsByStatus, actionsOverTime] = await Promise.all([
        statisticsService.getDashboardStatistics(),
        statisticsService.getActionsByType(),
        statisticsService.getUpcomingDeadlines({ 
          limit: 4, 
          processId: selectedProcess !== 'all' ? selectedProcess : undefined,
          dateRange
        }),
        statisticsService.getCompletionRate({
          processId: selectedProcess !== 'all' ? selectedProcess : undefined,
          dateRange
        }),
        statisticsService.getActionsByStatus({
          processId: selectedProcess !== 'all' ? selectedProcess : undefined,
          dateRange
        }),
        statisticsService.getActionsOverTime({
          processId: selectedProcess !== 'all' ? selectedProcess : undefined,
          dateRange
        })
      ]);

      // Process data for pie chart based on action types
      if (actionsByType && actionsByType.length > 0) {
        const chartColors = ['#143261', '#6b7280', '#a0aec0', '#cbd5e0', '#e2e8f0'];
        const processedPieData = actionsByType.map((item, index) => ({
          name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
          value: item.count,
          fill: chartColors[index % chartColors.length]
        }));
        setPieChartData(processedPieData);
      }

      // Process data for line chart over time
      if (actionsOverTime && actionsOverTime.length > 0) {
        setLineChartData(actionsOverTime);
      }

      // Set upcoming deadlines actions
      if (upcomingDeadlinesData && upcomingDeadlinesData.length > 0) {
        setUpcomingDeadlines(upcomingDeadlinesData);
      } else {
        setUpcomingDeadlines([]);
      }

      // Set completion rate
      if (completionRateData && completionRateData.rate !== undefined) {
        setCompletionRate(completionRateData.rate);
      }

      // Calculate KPIs from actions by status
      if (actionsByStatus && actionsByStatus.length > 0) {
        const completed = actionsByStatus.find(item => item.status === 'completed');
        const pending = actionsByStatus.find(item => item.status === 'pending');
        const inProgress = actionsByStatus.find(item => item.status === 'in_progress');
        const overdue = actionsByStatus.find(item => item.status === 'overdue');
        
        const totalCount = actionsByStatus.reduce((sum, item) => sum + item.count, 0);
        const completedCount = completed ? completed.count : 0;
        const pendingCount = pending ? pending.count : 0;
        const inProgressCount = inProgress ? inProgress.count : 0;
        const overdueCount = overdue ? overdue.count : 0;
        
        setKpis({
          totalActions: totalCount,
          completedActions: completedCount,
          pendingActions: pendingCount + inProgressCount,
          overdueActions: overdueCount
        });
        
        // Bar chart data for action status
        setBarChartData(actionsByStatus.map(item => ({
          name: getStatusLabel(item.status),
          value: item.count,
          fill: getStatusColor(item.status).replace('text-', '').replace('bg-', '')
        })));

        // Get completed actions for display
        if (completed && completed.actions) {
          setCompletedActions(completed.actions.slice(0, 4));
        } else {
          setCompletedActions([]);
        }
      }

      // Fetch last action
      if (stats && stats.lastAction) {
        setLastAction(stats.lastAction);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
      showError('Error al cargar los datos del dashboard');
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En progreso';
      case 'completed': return 'Completada';
      case 'canceled': return 'Cancelada';
      case 'overdue': return 'Vencida';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-200 text-yellow-800';
      case 'in_progress': return 'bg-blue-200 text-blue-800';
      case 'completed': return 'bg-green-200 text-green-800';
      case 'canceled': return 'bg-red-200 text-red-800';
      case 'overdue': return 'bg-orange-200 text-orange-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusColorForChart = (status) => {
    switch (status) {
      case 'Pendiente': return '#eab308';
      case 'En progreso': return '#3b82f6';
      case 'Completada': return '#22c55e';
      case 'Cancelada': return '#ef4444';
      case 'Vencida': return '#f97316';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'hoy';
    if (diffInDays === 1) return 'ayer';
    if (diffInDays < 7) return `hace ${diffInDays} días`;
    if (diffInDays < 30) return `hace ${Math.floor(diffInDays / 7)} semanas`;
    return `hace ${Math.floor(diffInDays / 30)} meses`;
  };

  const handleProcessChange = (e) => {
    setSelectedProcess(e.target.value);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={['Resumen', 'Procesos']}
      />
      {activeTab === 'Resumen' && (
        <>
          <LoadingOverlay loading={loading} />
          
          {error ? (
            <div className="bg-red-100 p-4 rounded-lg text-red-700 mb-4">
              {error}
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                  <h2 className="text-xl font-semibold text-primary">Panel de Control</h2>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                      <FaFilter className="text-gray-400" />
                      <select 
                        value={selectedProcess} 
                        onChange={handleProcessChange}
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                      >
                        <option value="all">Todos los procesos</option>
                        {processes.map(process => (
                          <option key={process.id} value={process.id}>
                            {process.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400" />
                      <div className="flex border border-gray-300 rounded-md overflow-hidden">
                        <button 
                          onClick={() => handleDateRangeChange('week')} 
                          className={`px-2 py-1 text-xs ${dateRange === 'week' 
                            ? 'bg-primary text-white' 
                            : 'bg-white text-gray-600'}`}
                        >
                          Semana
                        </button>
                        <button 
                          onClick={() => handleDateRangeChange('month')} 
                          className={`px-2 py-1 text-xs ${dateRange === 'month' 
                            ? 'bg-primary text-white' 
                            : 'bg-white text-gray-600'}`}
                        >
                          Mes
                        </button>
                        <button 
                          onClick={() => handleDateRangeChange('quarter')} 
                          className={`px-2 py-1 text-xs ${dateRange === 'quarter' 
                            ? 'bg-primary text-white' 
                            : 'bg-white text-gray-600'}`}
                        >
                          Trimestre
                        </button>
                        <button 
                          onClick={() => handleDateRangeChange('year')} 
                          className={`px-2 py-1 text-xs ${dateRange === 'year' 
                            ? 'bg-primary text-white' 
                            : 'bg-white text-gray-600'}`}
                        >
                          Año
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Total Acciones</p>
                        <p className="text-2xl font-bold">{kpis.totalActions}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <FaChartLine className="text-blue-500 text-xl" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Completadas</p>
                        <p className="text-2xl font-bold">{kpis.completedActions}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <FaRegCheckCircle className="text-green-500 text-xl" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>Tasa de completado</span>
                        <span className="font-medium">{completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Pendientes</p>
                        <p className="text-2xl font-bold">{kpis.pendingActions}</p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <FaRegClock className="text-yellow-500 text-xl" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Vencidas</p>
                        <p className="text-2xl font-bold">{kpis.overdueActions}</p>
                      </div>
                      <div className="p-3 bg-red-100 rounded-full">
                        <FaInfoCircle className="text-red-500 text-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Action Tracking Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow space-y-5">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-primary">Seguimiento de Acciones</h2>
                    <button className="flex items-center space-x-2 text-sm text-primary hover:underline">
                      <FaPlus className="text-xs" />
                      <span>Nueva Acción</span>
                    </button>
                  </div>
                  
                  {lastAction ? (
                    <>
                      <div className="border-b pb-4">
                        <p className="text-sm font-medium">Última acción registrada:</p>
                        <p className="text-base font-semibold mt-1">{lastAction.name}</p>
                        <p className="text-xs text-gray-500">por {lastAction.leader_name || 'Usuario'} {getTimeAgo(lastAction.created_at)}</p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{lastAction.what || 'Sin descripción disponible.'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Estado de avance</h3>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${completionRate}%` }}></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No hay registros recientes</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm pt-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Próximas a vencer</h3>
                      <div className="space-y-2">
                        {upcomingDeadlines.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No hay acciones por vencer</p>
                        ) : (
                          upcomingDeadlines.map((action) => (
                            <div key={`vencer-${action.id}`} className="bg-lightgray rounded-md px-3 py-2.5 flex items-center justify-between hover:shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-700">{action.name}</span>
                                <span className="text-xs text-gray-500">{formatDate(action.target_date)}</span>
                              </div>
                              <FaRegClock className="text-lg text-orange-500" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Completadas recientemente</h3>
                      <div className="space-y-2">
                        {completedActions.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No hay acciones completadas</p>
                        ) : (
                          completedActions.map((action) => (
                            <div key={`completado-${action.id}`} className="bg-lightgray rounded-md px-3 py-2.5 flex items-center justify-between hover:shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-700">{action.name}</span>
                                <span className="text-xs text-gray-500">{getTimeAgo(action.updated_at)}</span>
                              </div>
                              <FaRegCheckCircle className="text-lg text-green-500" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="lg:col-span-2 grid grid-rows-2 gap-6">
                  {/* Actions by Type and Status */}
                  <div className="bg-white p-6 rounded-xl shadow space-y-4">
                    <h2 className="text-lg font-semibold text-primary mb-2">Distribución de Acciones</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2 text-center">Por Tipo</h3>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie 
                              data={pieChartData} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={70} 
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} acciones`, 'Cantidad']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2 text-center">Por Estado</h3>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={barChartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip formatter={(value) => [`${value} acciones`, 'Cantidad']} />
                            <Bar dataKey="value" background={{ fill: '#f5f5f5' }}>
                              {barChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getStatusColorForChart(entry.name)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Trend Over Time */}
                  <div className="bg-white p-6 rounded-xl shadow space-y-3">
                    <h2 className="text-lg font-semibold text-primary">Tendencia en el tiempo</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="completed" stroke="#22c55e" name="Completadas" />
                        <Line type="monotone" dataKey="pending" stroke="#eab308" name="Pendientes" />
                        <Line type="monotone" dataKey="overdue" stroke="#f97316" name="Vencidas" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Summary Section */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow space-y-4">
                    <h2 className="text-lg font-semibold text-primary">Indicadores Clave</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-r pr-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Eficiencia</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          <li>Tasa de cumplimiento: <span className="font-medium">{completionRate}%</span></li>
                          <li>Tiempo promedio de resolución: <span className="font-medium">5.2 días</span></li>
                          <li>Acciones por proceso: <span className="font-medium">{(kpis.totalActions / (processes.length || 1)).toFixed(1)}</span></li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Calidad</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          <li>Efectividad de acciones: <span className="font-medium">87%</span></li>
                          <li>Recurrencia de hallazgos: <span className="font-medium">12%</span></li>
                          <li>Satisfacción: <span className="font-medium">4.2/5</span></li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Actualizado el {new Date().toLocaleDateString('es-ES')}</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow space-y-4">
                    <h2 className="text-lg font-semibold text-primary">Resumen de actividad</h2>
                    <div>
                      <p className="text-sm text-gray-600">
                        En el periodo actual, se han registrado <span className="font-medium">{kpis.totalActions} acciones</span> en total, 
                        de las cuales <span className="font-medium">{kpis.completedActions}</span> han sido completadas 
                        satisfactoriamente, lo que representa una tasa de cumplimiento del <span className="font-medium">{completionRate}%</span>.
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Actualmente hay <span className="font-medium">{kpis.pendingActions} acciones</span> en proceso o pendientes, 
                        y <span className="font-medium">{kpis.overdueActions} acciones</span> con plazos vencidos que requieren atención inmediata.
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedProcess !== 'all' ? 
                          `Estos datos corresponden al proceso "${processes.find(p => p.id.toString() === selectedProcess.toString())?.name}"` : 
                          'Estos datos corresponden a todos los procesos.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
