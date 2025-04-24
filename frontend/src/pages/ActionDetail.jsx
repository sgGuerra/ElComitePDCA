import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import actionService from '../services/actionService';
import { useAuth } from '../contexts/AuthContext';

const ActionDetail = () => {
  const { actionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [observaciones, setObservaciones] = useState([]);
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchActionDetails();
  }, [actionId]);

  const fetchActionDetails = async () => {
    try {
      setLoading(true);
      const data = await actionService.getAction(actionId);
      setAction(data);
      setObservaciones(data.observations || []);
      setArchivos(data.files || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching action details:', error);
      setError('Error al cargar los detalles de la acción. Por favor, inténtelo de nuevo.');
      setLoading(false);
    }
  };

  const handleAddObservacion = async () => {
    if (!nuevaObservacion.trim()) {
      return;
    }

    try {
      const updatedObservaciones = [...observaciones, { text: nuevaObservacion }];
      setObservaciones(updatedObservaciones);
      setNuevaObservacion('');

      await actionService.updateAction(actionId, {
        observations: updatedObservaciones,
        files: archivos
      });
    } catch (error) {
      console.error('Error adding observation:', error);
      setError('Error al agregar la observación. Por favor, inténtelo de nuevo.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setUploading(true);
      const response = await actionService.uploadFile(actionId, selectedFile);
      
      // Add the new file to the list
      const updatedArchivos = [...archivos, response.data.name];
      setArchivos(updatedArchivos);
      
      // Update the action with the new file list
      await actionService.updateAction(actionId, {
        observations: observaciones,
        files: updatedArchivos
      });
      
      setSelectedFile(null);
      setUploading(false);
      
      // Reset file input
      document.getElementById('file-upload').value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error al subir el archivo. Por favor, inténtelo de nuevo.');
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'delayed':
        return 'bg-orange-100 text-orange-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getTranslatedStatus = (status) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in_progress':
        return 'En proceso';
      case 'delayed':
        return 'Retrasado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lightgray flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8">
        <Header 
          activeTab="Procesos" 
          setActiveTab={() => {}} 
          tabs={['Resumen', 'Procesos']} 
        />
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8">
        <Header 
          activeTab="Procesos" 
          setActiveTab={() => {}} 
          tabs={['Resumen', 'Procesos']} 
        />
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-lg">No se encontró la acción solicitada</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <Header
        activeTab="Procesos"
        setActiveTab={() => {}}
        tabs={['Resumen', 'Procesos']}
      />
      <div className="bg-white p-6 rounded-xl shadow space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-primary">{action.name}</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(action.status)}`}
          >
            {getTranslatedStatus(action.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Líder</h2>
              <p className="text-gray-800">{action.leader_name}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Origen</h2>
              <p className="text-gray-800">{action.origin}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Fecha de Inicio</h2>
              <p className="text-gray-800">{formatDate(action.start_date)}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Fecha de Vencimiento</h2>
              <p className="text-gray-800">{formatDate(action.due_date)}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Tipo de Acción</h2>
              <p className="text-gray-800 capitalize">{action.type}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Meta</h2>
              <p className="text-gray-800">{action.goal}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">¿Qué?</h2>
              <p className="text-gray-800">{action.what}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">¿Por qué?</h2>
              <p className="text-gray-800">{action.why}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">¿Cómo?</h2>
              <p className="text-gray-800">{action.how}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">¿Dónde?</h2>
              <p className="text-gray-800">{action.where || action.location}</p>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-primary mb-4">Observaciones</h2>
          {observaciones.length === 0 ? (
            <p className="text-gray-500 italic">No hay observaciones registradas</p>
          ) : (
            <ul className="space-y-3">
              {observaciones.map((obs, index) => (
                <li key={index} className="p-3 bg-gray-50 rounded-md">
                  <p className="text-gray-800">{obs.text}</p>
                  {obs.timestamp && (
                    <p className="text-xs text-gray-500 mt-1">{new Date(obs.timestamp).toLocaleString()}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          
          <div className="mt-4">
            <textarea
              value={nuevaObservacion}
              onChange={(e) => setNuevaObservacion(e.target.value)}
              placeholder="Añadir una nueva observación"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              rows={3}
            />
            <button
              onClick={handleAddObservacion}
              className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70"
              disabled={!nuevaObservacion.trim()}
            >
              Añadir Observación
            </button>
          </div>
        </div>

        {/* Archivos Adjuntos */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-primary mb-4">Archivos Adjuntos</h2>
          {archivos.length === 0 ? (
            <p className="text-gray-500 italic">No hay archivos adjuntos</p>
          ) : (
            <ul className="space-y-2">
              {archivos.map((file, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-800">{file}</span>
                </li>
              ))}
            </ul>
          )}
          
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                disabled={uploading}
              />
              <button
                onClick={handleFileUpload}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70"
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subiendo...
                  </span>
                ) : 'Subir Archivo'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionDetail;
