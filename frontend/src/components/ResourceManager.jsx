import React, { useState, useEffect, useRef } from 'react';
import { FaFile, FaUpload, FaDownload, FaTrash, FaFileAlt, FaFileImage, FaFilePdf, FaFileExcel, FaFileWord } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import resourceService from '../services/resourceService';
import LoadingOverlay from './LoadingOverlay';

const ResourceManager = ({ actionId }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (actionId) {
      fetchResources();
    }
  }, [actionId]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getActionResources(actionId);
      setResources(data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      showError('Error al cargar los recursos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      showError('Por favor, selecciona un archivo');
      return;
    }
    
    const file = fileInput.files[0];
    setUploading(true);
    
    try {
      await resourceService.uploadResource(actionId, file, description);
      success('Archivo subido exitosamente');
      setDescription('');
      fileInput.value = '';
      fetchResources();
    } catch (err) {
      console.error('Error uploading file:', err);
      showError('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resourceId) => {
    try {
      setLoading(true);
      await resourceService.downloadResource(resourceId);
    } catch (err) {
      console.error('Error downloading file:', err);
      showError('Error al descargar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('¿Estás seguro de eliminar este recurso?')) {
      return;
    }
    
    try {
      setLoading(true);
      await resourceService.deleteResource(resourceId);
      success('Recurso eliminado exitosamente');
      fetchResources();
    } catch (err) {
      console.error('Error deleting resource:', err);
      showError('Error al eliminar el recurso');
    } finally {
      setLoading(false);
    }
  };

  const canManageResources = () => {
    if (!user) return false;
    
    // Admin can always manage resources
    if (user.role === 'admin') return true;
    
    // Process leaders can manage resources for their assigned actions
    return user.role === 'process_leader';
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FaFile />;
    
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel className="text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FaFileImage className="text-purple-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <LoadingOverlay loading={loading || uploading} />
      
      <h3 className="text-lg font-semibold text-primary flex items-center">
        <FaFile className="mr-2" />
        Recursos de Soporte
      </h3>
      
      {canManageResources() && (
        <form onSubmit={handleUpload} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-700">Subir Nuevo Recurso</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Archivo
            </label>
            <input
              type="file"
              ref={fileInputRef}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Descripción breve del archivo..."
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              disabled={uploading}
            >
              <FaUpload className="mr-2" />
              {uploading ? 'Subiendo...' : 'Subir Archivo'}
            </button>
          </div>
        </form>
      )}
      
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Archivos Disponibles</h4>
        
        {resources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaFile className="mx-auto text-4xl text-gray-300 mb-2" />
            <p>No hay recursos disponibles para esta acción.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">
                    {getFileIcon(resource.filename)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{resource.filename}</p>
                    <p className="text-xs text-gray-500">
                      {resource.description}
                    </p>
                    <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(resource.file_size)}</span>
                      <span>Subido: {formatDate(resource.created_at)}</span>
                      <span>Por: {resource.uploaded_by_name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(resource.id)}
                    className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                    title="Descargar"
                  >
                    <FaDownload />
                  </button>
                  
                  {canManageResources() && (
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceManager;
