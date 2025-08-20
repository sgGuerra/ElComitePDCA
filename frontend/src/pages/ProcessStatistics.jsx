// src/pages/ProcessStatistics.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaChartPie, FaChartLine, 
  FaRegClock, FaDownload, FaFilter 
} from 'react-icons/fa';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import processService from '../services/processService';
import statisticsService from '../services/statisticsService';
import LoadingOverlay from '../components/LoadingOverlay';
import { useToast } from '../contexts/ToastContext';

const ProcessStatistics = () => {
  const { processId } = useParams();
  const [process, setProcess] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [actionsByStatus, setActionsByStatus] = useState([]);
  const [actionsByPriority, setActionsByPriority] = useState([]);
  const [actionsTrend, setActionsTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'quarter', 'year'
  
  const navigate = useNavigate();
  const { error: showError } = useToast();

  useEffect(() => {
    fetchData();
  }, [processId, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch process and statistics data in parallel
      const [processData, statsData, statusData, priorityData, trendData] = await Promise.all([
        processService.getProcessById(processId),
        processService.getProcessStatistics(processId),
        statisticsService.getActionsByStatus({ processId, dateRange }),
        statisticsService.getActionsByType({ processId, dateRange }),
        statisticsService.getActionsOverTime({ processId, dateRange })
      ]);
      
      setProcess(processData);
      setStatistics(statsData);
      
      // Process data for charts
      if (statusData && statusData.length > 0) {
        const processedStatusData = statusData.map(item => ({
          name: getStatusLabel(item.status),
          value: item.count,
          color: getStatusColor(item.status)
        }));
        setActionsByStatus(processedStatusData);
      }
      
      if (priorityData && priorityData.length > 0) {
        const processPriorityData = priorityData.map(item => ({
          name: getPriorityLabel(item.type || 'medium'),
          value: item.count,
          color: getPriorityColor(item.type || 'medium')
        }));
        setActionsByPriority(processPriorityData);
      }
      
      if (trendData && trendData.length > 0) {
        setActionsTrend(trendData);
      }
    } catch (err) {
      console.error('Error fetching process statistics:', err);
      setError('Error al cargar las estadísticas del proceso');
      showError('Error al cargar las estadísticas del proceso');
    } finally {
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
      case 'pending': return '#EAB308'; // yellow-500
      case 'in_progress': return '#3B82F6'; // blue-500
      case 'completed': return '#22C55E'; // green-500
      case 'canceled': return '#EF4444'; // red-500
      case 'overdue': return '#F97316'; // orange-500
      default: return '#6B7280'; // gray-500
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444'; // red-500
      case 'medium': return '#3B82F6'; // blue-500
      case 'low': return '#22C55E'; // green-500
      default: return '#6B7280'; // gray-500
    }
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to generate a custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-medium text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color || entry.fill }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (!statistics || !statistics.totalActions) return 0;
    const completed = statistics.completedActions || 0;
    return Math.round((completed / statistics.totalActions) * 100);
  };

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <LoadingOverlay loading={loading} />
      
      <div className="mb-4">
        <button
          className="flex items-center text-primary hover:underline"
          onClick={() => navigate('/procesos')}
        >
          <FaArrowLeft className="mr-2" />
          Volver a la lista de procesos
        </button>
      </div>
      
      {error ? (
        <div className="bg-red-100 p-6 rounded-lg text-red-700">
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            onClick={() => navigate('/procesos')}
          >
            Volver a la lista
          </button>
        </div>
      ) : process ? (
        <>
          {/* Header */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-primary">{process.name}</h1>
                <p className="text-gray-600">{process.description}</p>
              </div>
              
              <div className="flex items-center">
                <div className="mr-4">
                  <FaFilter className="text-gray-400 mr-2 inline" />
                  <span className="text-sm text-gray-600">Filtro:</span>
                  <div className="mt-1">
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
                
                <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center hover:bg-gray-50">
                  <FaDownload className="mr-2" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>
            
            {/* KPI Cards */}
            {statistics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Total Acciones</p>
                      <p className="text-2xl font-bold">{statistics.totalActions || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FaChartPie className="text-blue-500 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Completadas</p>
                      <p className="text-2xl font-bold">{statistics.completedActions || 0}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <FaChartLine className="text-green-500 text-xl" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>Tasa de completado</span>
                      <span className="font-medium">{getCompletionPercentage()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${getCompletionPercentage()}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Tiempo Promedio</p>
                      <p className="text-2xl font-bold">{statistics.avgCompletionDays || 0} días</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <FaRegClock className="text-yellow-500 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Última Actividad</p>
                      <p className="text-sm font-medium">{formatDate(statistics.lastActivityDate)}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FaCalendarAlt className="text-purple-500 text-xl" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Chart */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">Acciones por Estado</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={actionsByStatus}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="value" name="Cantidad">
                    {actionsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Priority Chart */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">Acciones por Prioridad</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={actionsByPriority}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {actionsByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Trend Chart */}
            <div className="bg-white rounded-xl shadow p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-primary mb-4">Tendencia en el Tiempo</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={actionsTrend}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    name="Completadas" 
                    stroke="#22C55E" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    name="Pendientes" 
                    stroke="#EAB308" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="overdue" 
                    name="Vencidas" 
                    stroke="#EF4444" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Summary and performance indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">Resumen de Rendimiento</h2>
              <p className="text-gray-700 mb-4">
                El proceso "{process.name}" muestra un rendimiento global 
                {getCompletionPercentage() >= 70 ? ' satisfactorio' : getCompletionPercentage() >= 50 ? ' aceptable' : ' bajo'} con 
                una tasa de completado del {getCompletionPercentage()}%.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Tiempo promedio de resolución</p>
                  <p className="font-semibold">{statistics?.avgCompletionDays || 0} días</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Acciones vencidas</p>
                  <p className="font-semibold">{statistics?.overdueActions || 0}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Prioridad predominante</p>
                  <p className="font-semibold">{statistics?.mainPriority ? getPriorityLabel(statistics.mainPriority) : 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Efectividad</p>
                  <p className="font-semibold">{statistics?.effectivenessRate || 0}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">Recomendaciones</h2>
              
              <ul className="space-y-3">
                {getCompletionPercentage() < 50 && (
                  <li className="flex items-start">
                    <div className="bg-red-100 p-1 rounded-full mt-0.5 mr-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-700">
                      La tasa de completado es baja. Revisar las acciones pendientes y asignar recursos adicionales.
                    </p>
                  </li>
                )}
                
                {statistics?.overdueActions > 0 && (
                  <li className="flex items-start">
                    <div className="bg-yellow-100 p-1 rounded-full mt-0.5 mr-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-700">
                      Hay {statistics.overdueActions} {statistics.overdueActions === 1 ? 'acción vencida' : 'acciones vencidas'}.
                      Priorizar su resolución para evitar retrasos adicionales.
                    </p>
                  </li>
                )}
                
                {(statistics?.avgCompletionDays || 0) > 10 && (
                  <li className="flex items-start">
                    <div className="bg-blue-100 p-1 rounded-full mt-0.5 mr-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-700">
                      El tiempo promedio de resolución es alto. Analizar posibles cuellos de botella en el proceso.
                    </p>
                  </li>
                )}
                
                <li className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mt-0.5 mr-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <p className="text-gray-700">
                    Establecer reuniones periódicas de seguimiento para validar el avance de las acciones pendientes.
                  </p>
                </li>
                
                <li className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mt-0.5 mr-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <p className="text-gray-700">
                    Documentar las lecciones aprendidas de las acciones completadas para mejorar procesos futuros.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ProcessStatistics;
