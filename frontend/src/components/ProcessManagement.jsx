// src/components/ProcessManagement.jsx

import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import processService from '../services/processService';
import { useToast } from '../contexts/ToastContext';
import LoadingOverlay from './LoadingOverlay';

const ProcessManagement = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [processForm, setProcessForm] = useState({
    name: '',
    description: '',
    owner: '',
    status: 'active',
    departmentId: '',
    priority: 'medium'
  });
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const data = await processService.getAllProcesses();
      setProcesses(data);
    } catch (err) {
      console.error('Error fetching processes:', err);
      showError('Error al cargar los procesos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (process = null) => {
    if (process) {
      setSelectedProcess(process);
      setProcessForm({
        name: process.name || '',
        description: process.description || '',
        owner: process.owner || '',
        status: process.status || 'active',
        departmentId: process.departmentId || '',
        priority: process.priority || 'medium'
      });
    } else {
      setSelectedProcess(null);
      setProcessForm({
        name: '',
        description: '',
        owner: '',
        status: 'active',
        departmentId: '',
        priority: 'medium'
      });
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProcess(null);
    setProcessForm({
      name: '',
      description: '',
      owner: '',
      status: 'active',
      departmentId: '',
      priority: 'medium'
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!processForm.name.trim()) {
      errors.name = 'El nombre del proceso es obligatorio';
    }
    
    if (processForm.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProcessForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (selectedProcess) {
        // Update existing process
        const response = await processService.updateProcess(selectedProcess.id, processForm);
        
        if (response.success) {
          setProcesses(processes.map(p => 
            p.id === selectedProcess.id ? { ...p, ...processForm } : p
          ));
          success('Proceso actualizado exitosamente');
          closeModal();
        }
      } else {
        // Create new process
        const response = await processService.createProcess(processForm);
        
        if (response.success || response.data) {
          const newProcess = response.data || response;
          setProcesses([...processes, newProcess]);
          success('Proceso creado exitosamente');
          closeModal();
        }
      }
    } catch (err) {
      console.error('Error saving process:', err);
      showError(err.message || 'Error al guardar el proceso');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteProcess = (process) => {
    setConfirmDelete(process);
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      
      const response = await processService.deleteProcess(confirmDelete.id);
      
      if (response.success) {
        setProcesses(processes.filter(p => p.id !== confirmDelete.id));
        success('Proceso eliminado exitosamente');
        setConfirmDelete(null);
      }
    } catch (err) {
      console.error('Error deleting process:', err);
      showError(err.message || 'Error al eliminar el proceso');
    } finally {
      setLoading(false);
    }
  };

  const filteredProcesses = processes.filter(process => 
    process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (process.description && process.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (process.owner && process.owner.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <LoadingOverlay loading={loading} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-semibold text-primary">Gestión de Procesos</h2>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar proceso..."
              className="px-3 py-2 pl-10 border border-gray-300 rounded-md w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            <FaPlus />
            <span>Nuevo Proceso</span>
          </button>
        </div>
      </div>
      
      {processes.length === 0 && !loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay procesos registrados. Crea un nuevo proceso para comenzar.</p>
          <button 
            onClick={() => openModal()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Crear Primer Proceso
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsable
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProcesses.map(process => (
                <tr key={process.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{process.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {process.description || 'Sin descripción'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{process.owner || 'Sin asignar'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(process.status)}`}>
                      {getStatusLabel(process.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(process.priority)}`}>
                      {getPriorityLabel(process.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(process)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEdit className="text-lg" />
                      </button>
                      <button
                        onClick={() => confirmDeleteProcess(process)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Create/Edit Process Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedProcess ? 'Editar Proceso' : 'Nuevo Proceso'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    name="name"
                    value={processForm.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nombre del proceso"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    name="description"
                    value={processForm.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    placeholder="Descripción del proceso"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Responsable</label>
                    <input
                      type="text"
                      name="owner"
                      value={processForm.owner}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      placeholder="Nombre del responsable"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Departamento</label>
                    <input
                      type="text"
                      name="departmentId"
                      value={processForm.departmentId}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      placeholder="Departamento"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      name="status"
                      value={processForm.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="pending">Pendiente</option>
                      <option value="completed">Completado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                    <select
                      name="priority"
                      value={processForm.priority}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
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
                    {selectedProcess ? 'Actualizar Proceso' : 'Crear Proceso'}
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
              ¿Está seguro que desea eliminar el proceso "{confirmDelete.name}"? Esta acción no se puede deshacer.
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

export default ProcessManagement;
