// src/pages/ProcessList.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import Header from '../components/Header';
import LoadingOverlay from '../components/LoadingOverlay';
import ProcessManagement from '../components/ProcessManagement';
import processService from '../services/processService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const ProcessList = () => {
  const [activeTab, setActiveTab] = useState('Procesos');
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showManagement, setShowManagement] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!showManagement) {
      fetchProcesses();
    }
  }, [showManagement]);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const data = await processService.getAllProcesses();
      setProcesses(data);
    } catch (err) {
      console.error('Error al cargar los procesos:', err);
      setError('Error al cargar los procesos.');
      showError('Error al cargar los procesos');
    } finally {
      setLoading(false);
    }
  };

  const filteredProcesses = processes.filter((p) => {
    // Apply status filter
    if (filterStatus !== 'all' && p.status !== filterStatus) {
      return false;
    }
    
    // Apply search filter
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.owner && p.owner.toLowerCase().includes(search.toLowerCase()))
    );
  });

  // Sort processes
  const sortedProcesses = [...filteredProcesses].sort((a, b) => {
    let compareA = a[sortField] || '';
    let compareB = b[sortField] || '';
    
    if (typeof compareA === 'string') compareA = compareA.toLowerCase();
    if (typeof compareB === 'string') compareB = compareB.toLowerCase();
    
    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        tabs={['Resumen', 'Procesos']}
      />
      
      <LoadingOverlay loading={loading} />
      
      {showManagement ? (
        <div className="space-y-4">
          <button
            onClick={() => setShowManagement(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2"
          >
            <span>← Volver a la lista de procesos</span>
          </button>
          <ProcessManagement />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-primary">Procesos</h1>
              
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowManagement(true)}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
                >
                  <FaPlus className="text-sm" />
                  <span>Gestionar Procesos</span>
                </button>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="w-full md:w-64 relative">
                <input
                  type="text"
                  placeholder="Buscar proceso..."
                  className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-9 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                    <option value="pending">Pendientes</option>
                    <option value="completed">Completados</option>
                  </select>
                  <FaFilter className="absolute left-3 top-2.5 text-gray-400" />
                </div>
              </div>
            </div>
            
            {error ? (
              <div className="bg-red-100 p-4 rounded-lg text-red-700">
                {error}
              </div>
            ) : filteredProcesses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron procesos. {search && 'Intente con otra búsqueda.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr className="bg-gray-100">
                      <th 
                        onClick={() => toggleSort('name')}
                        className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                      >
                        <div className="flex items-center">
                          <span>Nombre</span>
                          {sortField === 'name' && (
                            sortDirection === 'asc' ? 
                              <FaSortAmountUp className="ml-1 text-gray-500" /> : 
                              <FaSortAmountDown className="ml-1 text-gray-500" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left">Descripción</th>
                      <th 
                        onClick={() => toggleSort('owner')}
                        className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                      >
                        <div className="flex items-center">
                          <span>Responsable</span>
                          {sortField === 'owner' && (
                            sortDirection === 'asc' ? 
                              <FaSortAmountUp className="ml-1 text-gray-500" /> : 
                              <FaSortAmountDown className="ml-1 text-gray-500" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => toggleSort('status')}
                        className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                      >
                        <div className="flex items-center">
                          <span>Estado</span>
                          {sortField === 'status' && (
                            sortDirection === 'asc' ? 
                              <FaSortAmountUp className="ml-1 text-gray-500" /> : 
                              <FaSortAmountDown className="ml-1 text-gray-500" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => toggleSort('priority')}
                        className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                      >
                        <div className="flex items-center">
                          <span>Prioridad</span>
                          {sortField === 'priority' && (
                            sortDirection === 'asc' ? 
                              <FaSortAmountUp className="ml-1 text-gray-500" /> : 
                              <FaSortAmountDown className="ml-1 text-gray-500" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProcesses.map((process) => (
                      <tr key={process.id} className="hover:bg-gray-50 border-t border-gray-200">
                        <td className="py-3 px-4 font-medium">{process.name}</td>
                        <td className="py-3 px-4">
                          <div className="max-w-xs line-clamp-2 text-sm text-gray-700">
                            {process.description || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">{process.owner || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(process.status)}`}>
                            {getStatusLabel(process.status || 'active')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {process.priority && (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(process.priority)}`}>
                              {getPriorityLabel(process.priority)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90"
                              onClick={() => navigate(`/procesos/${process.id}/acciones`)}
                            >
                              Ver Acciones
                            </button>
                            <button
                              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                              onClick={() => navigate(`/procesos/${process.id}/estadisticas`)}
                            >
                              Estadísticas
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-primary mb-4">Resumen de Procesos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total de Procesos</p>
                <p className="text-2xl font-bold">{processes.length}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-100 to-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Procesos Activos</p>
                <p className="text-2xl font-bold">
                  {processes.filter(p => p.status === 'active').length}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-100 to-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Procesos Pendientes</p>
                <p className="text-2xl font-bold">
                  {processes.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-gray-600">
                Se recomienda revisar regularmente los procesos pendientes y asegurarse de que todos los procesos tengan acciones asociadas para un seguimiento efectivo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessList;
