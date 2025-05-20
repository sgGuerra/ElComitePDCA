import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaDownload, FaEye, FaCalendarAlt, FaUserTag } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import auditService from '../services/auditService';
import LoadingOverlay from './LoadingOverlay';

const AuditLogTracker = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    entity_type: '',
    entity_id: '',
    user_id: '',
    start_date: '',
    end_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exportFormat, setExportFormat] = useState('pdf');
  
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  useEffect(() => {
    fetchAuditLogs();
  }, [page]);
  
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditService.getAuditLogs({
        ...filters,
        limit: 20,
        offset: (page - 1) * 20
      });
      
      setLogs(response.data || []);
      setTotalPages(Math.ceil((response.total || 0) / 20));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      showError('Error al obtener los registros de auditoría');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleApplyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };
  
  const handleClearFilters = () => {
    setFilters({
      entity_type: '',
      entity_id: '',
      user_id: '',
      start_date: '',
      end_date: '',
    });
    setPage(1);
    fetchAuditLogs();
  };
  
  const handleExport = async () => {
    try {
      setLoading(true);
      await auditService.exportAuditLogs({
        ...filters,
        format: exportFormat
      });
      success(`Registros exportados en formato ${exportFormat.toUpperCase()}`);
    } catch (err) {
      console.error('Error exporting audit logs:', err);
      showError('Error al exportar los registros de auditoría');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getEntityTypeLabel = (type) => {
    switch (type) {
      case 'process': return 'Proceso';
      case 'action': return 'Acción de Mejora';
      case 'user': return 'Usuario';
      case 'resource': return 'Recurso';
      case 'comment': return 'Comentario';
      default: return type;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <LoadingOverlay loading={loading} />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Registro de Auditoría</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <FaFilter className="mr-2" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          
          <div className="relative inline-block">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="appearance-none px-3 py-2 pr-8 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            <FaDownload className="mr-2" />
            Exportar
          </button>
        </div>
      </div>
      
      {/* Filters section */}
      {showFilters && (
        <form onSubmit={handleApplyFilters} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Entidad
              </label>
              <select
                name="entity_type"
                value={filters.entity_type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">Todos los tipos</option>
                <option value="process">Proceso</option>
                <option value="action">Acción de Mejora</option>
                <option value="user">Usuario</option>
                <option value="resource">Recurso</option>
                <option value="comment">Comentario</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID de Entidad
              </label>
              <input
                type="number"
                name="entity_id"
                value={filters.entity_id}
                onChange={handleFilterChange}
                placeholder="ID del proceso, acción, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID de Usuario
              </label>
              <input
                type="number"
                name="user_id"
                value={filters.user_id}
                onChange={handleFilterChange}
                placeholder="ID del usuario"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicial
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Final
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Limpiar Filtros
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              <FaSearch className="inline mr-2" />
              Aplicar Filtros
            </button>
          </div>
        </form>
      )}
      
      {/* Audit logs table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha y Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo de Entidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID de Entidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detalles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron registros de auditoría
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                        {log.user_name?.charAt(0) || 'U'}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                        <div className="text-xs text-gray-500">ID: {log.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getEntityTypeLabel(log.entity_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.entity_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => window.alert(`Detalles completos: ${log.details}`)}
                      className="text-primary hover:text-primary/80"
                      title="Ver detalles completos"
                    >
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                page === 1 
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Anterior</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border ${
                  page === i + 1
                    ? 'z-10 bg-primary text-white border-primary hover:bg-primary/90'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                page === totalPages 
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Siguiente</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default AuditLogTracker;
