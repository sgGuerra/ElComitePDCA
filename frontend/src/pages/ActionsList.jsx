// src/pages/ActionsList.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaPlus, FaSearch, FaFilter, FaSortAmountDown, 
  FaSortAmountUp, FaDownload, FaExclamationTriangle 
} from 'react-icons/fa';
import actionService from '../services/actionService';
import processService from '../services/processService';
import userService from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';

const ActionsList = () => {
  const { processId } = useParams();
  const [actions, setActions] = useState([]);
  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionForm, setActionForm] = useState({
    name: '',
    leader_id: '',
    status: 'pending',
    target_date: '',
    what: '',
    why: '',
    how: '',
    priority: 'medium'
  });
  const [formErrors, setFormErrors] = useState({});
  const [userOptions, setUserOptions] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
    fetchUserOptions();
  }, [processId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch process and actions data in parallel
      const [processData, actionsData] = await Promise.all([
        processService.getProcessById(processId),
        actionService.getActionsByProcess(processId)
      ]);
      
      setProcess(processData);
      setActions(actionsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar las acciones o el proceso.');
      showError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOptions = async () => {
    try {
      const users = await userService.getProcessLeaders();
      setUserOptions(users);
    } catch (err) {
      console.error('Error fetching user options:', err);
    }
  };

  // Filter and sort actions
  const filteredActions = actions.filter((a) => {
    // Apply status filter
    if (filterStatus !== 'all' && a.status !== filterStatus) {
      return false;
    }
    
    // Apply priority filter
    if (filterPriority !== 'all' && a.priority !== filterPriority) {
      return false;
    }
    
    // Apply search filter
    return (
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.what && a.what.toLowerCase().includes(search.toLowerCase())) ||
      (a.leader_name && a.leader_name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  // Sort actions
  const sortedActions = [...filteredActions].sort((a, b) => {
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

  const openModal = (action = null) => {
    if (action) {
      // Edit mode
      setActionForm({
        name: action.name || '',
        leader_id: action.leader_id || '',
        status: action.status || 'pending',
        target_date: action.target_date ? action.target_date.substring(0, 10) : '',
        what: action.what || '',
        why: action.why || '',
        how: action.how || '',
        priority: action.priority || 'medium'
      });
    } else {
      // Create mode
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setActionForm({
        name: '',
        leader_id: user.role === 'process_leader' ? user.id : '',
        status: 'pending',
        target_date: tomorrow.toISOString().substring(0, 10),
        what: '',
        why: '',
        how: '',
        priority: 'medium'
      });
    }
    
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActionForm({
      name: '',
      leader_id: '',
      status: 'pending',
      target_date: '',
      what: '',
      why: '',
      how: '',
      priority: 'medium'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setActionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!actionForm.name) errors.name = 'El nombre es obligatorio';
    if (!actionForm.what) errors.what = 'El campo "¿Qué?" es obligatorio';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const formData = {
        ...actionForm,
        process_id: processId
      };
      
      let response;
      
      if (actionForm.id) {
        // Update existing action
        response = await actionService.updateAction(actionForm.id, formData);
        
        if (response.success || response.data) {
          setActions(actions.map(a => 
            a.id === actionForm.id ? { ...a, ...formData } : a
          ));
          success('Acción actualizada exitosamente');
        }
      } else {
        // Create new action
        response = await actionService.createAction(formData);
        
        if (response.success || response.data) {
          const newAction = response.data || response;
          setActions([...actions, newAction]);
          success('Acción creada exitosamente');
        }
      }
      
      closeModal();
    } catch (err) {
      console.error('Error saving action:', err);
      showError(err.message || 'Error al guardar la acción');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteAction = (action) => {
    setConfirmDelete(action);
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    setLoading(true);
    try {
      const response = await actionService.deleteAction(confirmDelete.id);
      
      if (response.success) {
        setActions(actions.filter(a => a.id !== confirmDelete.id));
        success('Acción eliminada exitosamente');
        setConfirmDelete(null);
      }
    } catch (err) {
      console.error('Error deleting action:', err);
      showError(err.message || 'Error al eliminar la acción');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Nombre', 'Responsable', 'Estado', 'Prioridad', 'Fecha Objetivo', '¿Qué?', '¿Por qué?', '¿Cómo?'];
    const csvRows = [headers.join(',')];
    
    sortedActions.forEach(action => {
      const row = [
        `"${action.name || ''}"`,
        `"${action.leader_name || ''}"`,
        `"${getStatusLabel(action.status) || ''}"`,
        `"${getPriorityLabel(action.priority) || ''}"`,
        `"${action.target_date ? formatDate(action.target_date) : ''}"`,
        `"${action.what ? action.what.replace(/"/g, '""') : ''}"`,
        `"${action.why ? action.why.replace(/"/g, '""') : ''}"`,
        `"${action.how ? action.how.replace(/"/g, '""') : ''}"`,
      ];
      csvRows.push(row.join(','));
    });
    
    // Create and download the CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `acciones_${process?.name || 'proceso'}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const isOverdue = (action) => {
    if (!action.target_date || action.status === 'completed' || action.status === 'canceled') {
      return false;
    }
    
    const today = new Date();
    const targetDate = new Date(action.target_date);
    return targetDate < today;
  };

  const canCreateEdit = () => {
    return user && (user.role === 'admin' || user.role === 'process_leader');
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
      
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-1">Acciones del Proceso</h1>
            {process && (
              <p className="text-gray-600">{process.name}</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {canCreateEdit() && (
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                <FaPlus />
                <span>Nueva Acción</span>
              </button>
            )}
            
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <FaDownload />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
        
        {error ? (
          <div className="bg-red-100 p-4 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="w-full md:w-64 relative">
                <input
                  type="text"
                  placeholder="Buscar acción..."
                  className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
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
                    <option value="pending">Pendientes</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completadas</option>
                    <option value="canceled">Canceladas</option>
                    <option value="overdue">Vencidas</option>
                  </select>
                  <FaFilter className="absolute left-3 top-2.5 text-gray-400" />
                </div>
                
                <div className="relative">
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="pl-9 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                  >
                    <option value="all">Todas las prioridades</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                  <FaFilter className="absolute left-3 top-2.5 text-gray-400" />
                </div>
              </div>
            </div>
            
            {sortedActions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay acciones. {search && 'Intente con otra búsqueda.'}
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
                      <th 
                        onClick={() => toggleSort('leader_name')}
                        className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                      >
                        <div className="flex items-center">
                          <span>Responsable</span>
                          {sortField === 'leader_name' && (
                            sortDirection === 'asc' ? 
                              <FaSortAmountUp className="ml-1 text-gray-500" /> : 
                              <FaSortAmountDown className="ml-1 text-gray-500" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => toggleSort('target_date')}
                        className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                      >
                        <div className="flex items-center">
                          <span>Fecha objetivo</span>
                          {sortField === 'target_date' && (
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
                    {sortedActions.map((action) => (
                      <tr 
                        key={action.id} 
                        className={`hover:bg-gray-50 border-t border-gray-200 ${
                          isOverdue(action) ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-medium">{action.name}</td>
                        <td className="py-3 px-4">{action.leader_name || 'No asignado'}</td>
                        <td className="py-3 px-4">{action.target_date ? formatDate(action.target_date) : '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(isOverdue(action) ? 'overdue' : action.status)}`}>
                            {isOverdue(action) ? 'Vencida' : getStatusLabel(action.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(action.priority)}`}>
                            {getPriorityLabel(action.priority)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90"
                              onClick={() => navigate(`/procesos/${processId}/acciones/${action.id}`)}
                            >
                              Ver Detalle
                            </button>
                            
                            {canCreateEdit() && (
                              <>
                                <button
                                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                                  onClick={() => openModal(action)}
                                >
                                  Editar
                                </button>
                                
                                <button
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                  onClick={() => confirmDeleteAction(action)}
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Process summary */}
      {process && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Resumen del Proceso</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total de Acciones</p>
              <p className="text-2xl font-bold">{actions.length}</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-100 to-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-2xl font-bold">
                {actions.filter(a => a.status === 'completed').length}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold">
                {actions.filter(a => a.status === 'pending' || a.status === 'in_progress').length}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-red-100 to-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold">
                {actions.filter(a => isOverdue(a)).length}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            {process.description || 'No hay descripción disponible para este proceso.'}
          </p>
          
          <div className="mt-4">
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
              onClick={() => navigate(`/procesos/${processId}/estadisticas`)}
            >
              Ver Estadísticas Detalladas
            </button>
          </div>
        </div>
      )}
      
      {/* Create/Edit Action Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {actionForm.id ? 'Editar Acción' : 'Nueva Acción'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    name="name"
                    value={actionForm.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary focus:ring-primary ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nombre de la acción"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Responsable</label>
                    <select
                      name="leader_id"
                      value={actionForm.leader_id}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="">Seleccionar responsable</option>
                      {userOptions.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      name="status"
                      value={actionForm.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En progreso</option>
                      <option value="completed">Completada</option>
                      <option value="canceled">Cancelada</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                    <select
                      name="priority"
                      value={actionForm.priority}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha objetivo</label>
                  <input
                    type="date"
                    name="target_date"
                    value={actionForm.target_date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Qué? *</label>
                  <textarea
                    name="what"
                    value={actionForm.what}
                    onChange={handleInputChange}
                    rows="3"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary focus:ring-primary ${
                      formErrors.what ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Descripción de la acción"
                  />
                  {formErrors.what && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.what}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Por qué?</label>
                  <textarea
                    name="why"
                    value={actionForm.why}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    placeholder="Justificación de la acción"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Cómo?</label>
                  <textarea
                    name="how"
                    value={actionForm.how}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    placeholder="Método de implementación"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    {actionForm.id ? 'Actualizar Acción' : 'Crear Acción'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <FaExclamationTriangle className="text-4xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 text-center mb-6">
              ¿Está seguro que desea eliminar la acción "{confirmDelete.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsList;
