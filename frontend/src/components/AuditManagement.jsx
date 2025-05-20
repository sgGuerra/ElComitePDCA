import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaPlus, FaHistory, FaDownload, FaFilePdf } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import auditService from '../services/auditService';
import processService from '../services/processService';
import userService from '../services/userService';
import LoadingOverlay from './LoadingOverlay';

const AuditManagement = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [processes, setProcesses] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [selectedAuditor, setSelectedAuditor] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [processesData, auditorsData, reportsData] = await Promise.all([
        processService.getAllProcesses(),
        userService.getUsersByRole('auditor'),
        auditService.getAuditRequestsForAdmin()
      ]);
      
      setProcesses(processesData || []);
      setAuditors(auditorsData || []);
      setReports(reportsData || []);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProcess || !selectedAuditor || !title.trim() || !description.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }
    
    setLoading(true);
    try {
      await auditService.requestAudit(
        parseInt(selectedProcess),
        title,
        description,
        parseInt(selectedAuditor)
      );
      
      success('Solicitud de auditoría enviada correctamente');
      setSuccessMessage('Solicitud de auditoría enviada correctamente');
      
      // Reset form
      setSelectedProcess('');
      setSelectedAuditor('');
      setTitle('');
      setDescription('');
      setError('');
      
      // Refresh reports
      const reportsData = await auditService.getAuditRequestsForAdmin();
      setReports(reportsData || []);
      
      // Go to reports tab
      setActiveTab('reports');
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error requesting audit:', err);
      setError('Error al solicitar la auditoría');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = (pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      showError('No hay PDF disponible para este informe');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status label and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendiente', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' };
      case 'in_progress':
        return { label: 'En progreso', bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
      case 'completed':
        return { label: 'Completado', bgColor: 'bg-green-100', textColor: 'text-green-700' };
      case 'rejected':
        return { label: 'Rechazado', bgColor: 'bg-red-100', textColor: 'text-red-700' };
      default:
        return { label: status, bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <LoadingOverlay loading={loading} />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Gestión de Auditorías</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              activeTab === 'reports' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaHistory className="inline mr-1" />
            Informes
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              activeTab === 'request' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaPlus className="inline mr-1" />
            Nueva Solicitud
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}
      
      {/* Request Form */}
      {activeTab === 'request' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proceso</label>
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">-- Seleccionar proceso --</option>
                {processes.map(process => (
                  <option key={process.id} value={process.id}>
                    {process.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auditor</label>
              <select
                value={selectedAuditor}
                onChange={(e) => setSelectedAuditor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">-- Seleccionar auditor --</option>
                {auditors.map(auditor => (
                  <option key={auditor.id} value={auditor.id}>
                    {auditor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Ej: Auditoría trimestral de procesos de calidad"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Describe el propósito y alcance de la auditoría..."
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              disabled={loading}
            >
              <FaFileAlt className="inline mr-2" />
              Solicitar Auditoría
            </button>
          </div>
        </form>
      )}
      
      {/* Reports List */}
      {activeTab === 'reports' && (
        <div>
          {reports.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FaFileAlt className="mx-auto text-5xl text-gray-300 mb-3" />
              <p>No hay informes de auditoría disponibles.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proceso</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => {
                    const statusInfo = getStatusInfo(report.status);
                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{report.process_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{report.auditor_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(report.created_at)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewPdf(report.pdf_url)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={!report.pdf_url}
                              title={report.pdf_url ? "Ver PDF" : "PDF no disponible"}
                            >
                              <FaFilePdf />
                            </button>
                            {report.file_path && (
                              <button
                                onClick={() => window.open(report.file_path, '_blank')}
                                className="text-green-600 hover:text-green-900"
                                title="Descargar archivo adjunto"
                              >
                                <FaDownload />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditManagement;
