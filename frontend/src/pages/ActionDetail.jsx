// src/pages/ActionDetail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaEdit, FaRegClock, FaRegUser, FaRegFileAlt, 
  FaCheck, FaTimes, FaUpload, FaDownload, FaTrashAlt, FaComment
} from 'react-icons/fa';
import actionService from '../services/actionService';
import fileService from '../services/fileService';
import userService from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';

const ActionDetail = () => {
  const { processId, actionId } = useParams();
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
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
  const [files, setFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [userOptions, setUserOptions] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchActionData();
    fetchUserOptions();
  }, [actionId]);

  const fetchActionData = async () => {
    setLoading(true);
    try {
      // Fetch action details, files, comments, and history in parallel
      const [actionData, filesData, commentsData, historyData] = await Promise.all([
        actionService.getActionById(actionId),
        fileService.getActionFiles(actionId),
        actionService.getActionComments(actionId),
        actionService.getActionHistory(actionId)
      ]);
      
      setAction(actionData);
      setFiles(filesData || []);
      setComments(commentsData || []);
      setHistory(historyData || []);
      
      // Initialize form with action data
      setActionForm({
        name: actionData.name || '',
        leader_id: actionData.leader_id || '',
        status: actionData.status || 'pending',
        target_date: actionData.target_date ? actionData.target_date.substring(0, 10) : '',
        what: actionData.what || '',
        why: actionData.why || '',
        how: actionData.how || '',
        priority: actionData.priority || 'medium'
      });
    } catch (err) {
      console.error('Error fetching action details:', err);
      setError('Error al cargar los detalles de la acción.');
      showError('Error al cargar los detalles de la acción');
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
    if (!actionForm.what) errors.what = 'El campo "Qué" es obligatorio';
    
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
      const response = await actionService.updateAction(actionId, actionForm);
      
      if (response.success || response.data) {
        setAction({
          ...action,
          ...actionForm,
          leader_name: userOptions.find(u => u.id === actionForm.leader_id)?.name || action.leader_name
        });
        success('Acción actualizada exitosamente');
        setEditing(false);
      }
    } catch (err) {
      console.error('Error updating action:', err);
      showError('Error al actualizar la acción');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      const comment = `Status changed to "${getStatusLabel(newStatus)}" by ${user.name}`;
      const response = await actionService.updateActionStatus(actionId, newStatus, comment);
      
      if (response.success || response.data) {
        setAction({
          ...action,
          status: newStatus
        });
        success(`Estado actualizado a ${getStatusLabel(newStatus)}`);
        
        // Refresh comments and history
        const [commentsData, historyData] = await Promise.all([
          actionService.getActionComments(actionId),
          actionService.getActionHistory(actionId)
        ]);
        
        setComments(commentsData || []);
        setHistory(historyData || []);
      }
    } catch (err) {
      console.error('Error updating action status:', err);
      showError('Error al actualizar el estado');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setUploadingFile(true);
    
    try {
      const response = await fileService.uploadFile(actionId, file);
      
      if (response.success || response.data) {
        const newFile = response.data || response;
        setFiles([...files, newFile]);
        success('Archivo subido exitosamente');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      showError('Error al subir el archivo');
    } finally {
      setUploadingFile(false);
      setSelectedFile(null);
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!window.confirm('¿Está seguro de eliminar este archivo?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fileService.deleteFile(actionId, fileId);
      
      if (response.success) {
        setFiles(files.filter(f => f.id !== fileId));
        success('Archivo eliminado exitosamente');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      showError('Error al eliminar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      const response = await actionService.addActionComment(actionId, newComment);
      
      if (response.success || response.data) {
        const commentData = response.data || response;
        setComments([...comments, commentData]);
        setNewComment('');
        success('Comentario agregado exitosamente');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      showError('Error al agregar el comentario');
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const canEdit = () => {
    if (!user || !action) return false;
    return user.role === 'admin' || user.id === action.leader_id;
  };

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <LoadingOverlay loading={loading} />
      
      <div className="mb-4">
        <button
          className="flex items-center text-primary hover:underline"
          onClick={() => navigate(`/procesos/${processId}/acciones`)}
        >
          <FaArrowLeft className="mr-2" />
          Volver a la lista de acciones
        </button>
      </div>
      
      {error ? (
        <div className="bg-red-100 p-6 rounded-lg text-red-700">
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            onClick={() => navigate(`/procesos/${processId}/acciones`)}
          >
            Volver a la lista
          </button>
        </div>
      ) : action ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Action details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action header */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                {!editing ? (
                  <h1 className="text-2xl font-bold text-primary">{action.name}</h1>
                ) : (
                  <input
                    type="text"
                    name="name"
                    value={actionForm.name}
                    onChange={handleInputChange}
                    className={`text-2xl font-bold bg-gray-50 border rounded-md px-3 py-2 w-full ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nombre de la acción"
                  />
                )}
                
                {canEdit() && !editing && (
                  <button 
                    onClick={() => setEditing(true)}
                    className="flex items-center text-primary hover:text-primary/80"
                  >
                    <FaEdit className="mr-1" />
                    Editar
                  </button>
                )}
              </div>
              
              {formErrors.name && (
                <p className="text-red-500 text-sm mb-2">{formErrors.name}</p>
              )}
              
              <div className="flex flex-wrap gap-3 mb-6">
                <span className={`px-3 py-1 inline-flex items-center text-sm font-semibold rounded-full ${getStatusColor(action.status)}`}>
                  {getStatusLabel(action.status)}
                </span>
                
                {action.priority && (
                  <span className={`px-3 py-1 inline-flex items-center text-sm font-semibold rounded-full ${getPriorityColor(action.priority)}`}>
                    Prioridad: {getPriorityLabel(action.priority)}
                  </span>
                )}
                
                {action.target_date && (
                  <span className="px-3 py-1 inline-flex items-center text-sm font-semibold rounded-full bg-gray-200 text-gray-700">
                    <FaRegClock className="mr-1" />
                    {formatDate(action.target_date)}
                  </span>
                )}
              </div>
              
              {!editing ? (
                <div className="flex items-center text-gray-600 mb-4">
                  <FaRegUser className="mr-2" />
                  <span>Responsable: {action.leader_name || 'No asignado'}</span>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                  <select
                    name="leader_id"
                    value={actionForm.leader_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                  >
                    <option value="">Seleccionar responsable</option>
                    {userOptions.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {editing && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha objetivo</label>
                  <input
                    type="date"
                    name="target_date"
                    value={actionForm.target_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                  />
                </div>
              )}
              
              {editing && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    name="status"
                    value={actionForm.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completada</option>
                    <option value="canceled">Cancelada</option>
                  </select>
                </div>
              )}
              
              {editing && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    name="priority"
                    value={actionForm.priority}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              )}
              
              {editing && (
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Guardar Cambios
                  </button>
                </div>
              )}
            </div>
            
            {/* Action details */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">Detalles de la Acción</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">¿Qué?</h3>
                  {!editing ? (
                    <p className="text-gray-700 whitespace-pre-line">{action.what || 'Sin información'}</p>
                  ) : (
                    <div>
                      <textarea
                        name="what"
                        value={actionForm.what}
                        onChange={handleInputChange}
                        rows="3"
                        className={`w-full border rounded-md px-3 py-2 bg-gray-50 ${
                          formErrors.what ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Descripción de la acción"
                      />
                      {formErrors.what && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.what}</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">¿Por qué?</h3>
                  {!editing ? (
                    <p className="text-gray-700 whitespace-pre-line">{action.why || 'Sin información'}</p>
                  ) : (
                    <textarea
                      name="why"
                      value={actionForm.why}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                      placeholder="Justificación de la acción"
                    />
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">¿Cómo?</h3>
                  {!editing ? (
                    <p className="text-gray-700 whitespace-pre-line">{action.how || 'Sin información'}</p>
                  ) : (
                    <textarea
                      name="how"
                      value={actionForm.how}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                      placeholder="Método de implementación"
                    />
                  )}
                </div>
              </div>
            </div>
            
            {/* Action files */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-primary">Archivos Adjuntos</h2>
                
                {canEdit() && (
                  <div className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 cursor-pointer"
                    >
                      <FaUpload className="mr-2" />
                      {uploadingFile ? 'Subiendo...' : 'Subir Archivo'}
                    </label>
                  </div>
                )}
              </div>
              
              {selectedFile && (
                <div className="mb-4 p-2 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Subiendo: {selectedFile.name} ({Math.round(selectedFile.size/1024)} KB)
                  </p>
                </div>
              )}
              
              {files.length === 0 ? (
                <p className="text-gray-500 italic">No hay archivos adjuntos.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {files.map(file => (
                    <li key={file.id} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <FaRegFileAlt className="text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{file.filename}</p>
                          <p className="text-xs text-gray-500">
                            {file.size ? `${Math.round(file.size/1024)} KB` : ''} • 
                            {file.uploaded_at ? ` Subido el ${formatDate(file.uploaded_at)}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={fileService.getFileUrl(actionId, file.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:text-blue-800"
                        >
                          <FaDownload />
                        </a>
                        
                        {canEdit() && (
                          <button
                            onClick={() => handleFileDelete(file.id)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <FaTrashAlt />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Comments section */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">Comentarios</h2>
              
              <div className="mb-6">
                <form onSubmit={handleAddComment} className="flex items-start space-x-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Agregar un comentario..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    rows="2"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className={`px-4 py-2 rounded-md ${
                      newComment.trim() 
                        ? 'bg-primary text-white hover:bg-primary/90' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaComment className="w-4 h-4" />
                  </button>
                </form>
              </div>
              
              {comments.length === 0 ? (
                <p className="text-gray-500 italic">No hay comentarios aún.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-primary/80 rounded-full flex items-center justify-center text-white font-medium">
                            {comment.user_name?.charAt(0) || 'U'}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{comment.user_name || 'Usuario'}</p>
                            <p className="text-xs text-gray-500">{formatDateTime(comment.created_at)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Action controls */}
            {!editing && canEdit() && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-primary mb-4">Cambiar Estado</h2>
                
                <div className="space-y-2">
                  {action.status !== 'pending' && (
                    <button
                      onClick={() => handleStatusChange('pending')}
                      className="w-full flex items-center justify-center px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-md hover:bg-yellow-200"
                    >
                      Marcar como Pendiente
                    </button>
                  )}
                  
                  {action.status !== 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-md hover:bg-blue-200"
                    >
                      Marcar en Progreso
                    </button>
                  )}
                  
                  {action.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md hover:bg-green-200"
                    >
                      <FaCheck className="mr-2" />
                      Marcar como Completada
                    </button>
                  )}
                  
                  {action.status !== 'canceled' && (
                    <button
                      onClick={() => handleStatusChange('canceled')}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-100 text-red-800 border border-red-200 rounded-md hover:bg-red-200"
                    >
                      <FaTimes className="mr-2" />
                      Cancelar Acción
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Action details summary */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-primary mb-4">Información de la Acción</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Fecha de creación</p>
                  <p className="font-medium">{formatDate(action.created_at)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Última actualización</p>
                  <p className="font-medium">{formatDate(action.updated_at)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Creado por</p>
                  <p className="font-medium">{action.created_by_name || 'Desconocido'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">ID de la acción</p>
                  <p className="font-medium">{action.id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Proceso</p>
                  <p className="font-medium">{action.process_name || 'Desconocido'}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-primary hover:underline text-sm flex items-center"
                >
                  {showHistory ? 'Ocultar historial' : 'Ver historial de cambios'}
                </button>
                
                {showHistory && history.length > 0 && (
                  <div className="mt-3 space-y-3 text-sm">
                    {history.map((entry, index) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-3">
                        <p className="text-gray-700">{entry.description}</p>
                        <p className="text-gray-500 text-xs">
                          {formatDateTime(entry.created_at)} - {entry.user_name || 'Sistema'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {showHistory && history.length === 0 && (
                  <p className="mt-3 text-gray-500 text-sm italic">No hay registros de cambios.</p>
                )}
              </div>
            </div>
            
            {/* Related actions */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-primary mb-4">Acciones Relacionadas</h2>
              
              <p className="text-gray-500 italic">No hay acciones relacionadas.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ActionDetail;
