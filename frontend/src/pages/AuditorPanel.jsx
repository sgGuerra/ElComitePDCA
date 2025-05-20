import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaFilePdf, FaDownload, FaComment, FaEye, FaHistory, 
  FaPlusCircle, FaSearch, FaSync, FaFilter, FaClipboardCheck 
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import auditService from '../services/auditService';
import processService from '../services/processService';
import LoadingOverlay from '../components/LoadingOverlay';
import AuditLogTracker from '../components/AuditLogTracker';

const AuditorPanel = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processes, setProcesses] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReportForm, setNewReportForm] = useState({
    title: '',
    process_id: '',
    findings: '',
    recommendations: ''
  });
  
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch both reports and processes in parallel
      const [reportsData, processesData] = await Promise.all([
        auditService.getAuditorReports(),
        processService.getAllProcesses()
      ]);
      
      setReports(reportsData || []);
      setProcesses(processesData || []);
      setError('');
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewReportForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    
    if (!newReportForm.title || !newReportForm.process_id) {
      showError('El título y el proceso son campos obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      await auditService.createAuditReport(newReportForm);
      success('Informe de auditoría creado correctamente');
      setShowCreateForm(false);
      setNewReportForm({
        title: '',
        process_id: '',
        findings: '',
        recommendations: ''
      });
      fetchInitialData();
    } catch (err) {
      console.error('Error creating audit report:', err);
      showError('Error al crear el informe de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showError('El comentario no puede estar vacío');
      return;
    }

    try {
      setLoading(true);
      await auditService.addReportComment(selectedReport.id, comment);
      success('Comentario añadido correctamente');
      setComment('');
      // Refresh the reports to show the new comment
      await fetchInitialData();
      // Find and select the updated report
      const updatedReport = reports.find(r => r.id === selectedReport.id);
      if (updatedReport) {
        setSelectedReport(updatedReport);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      showError('Error al añadir el comentario');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async (reportId) => {
    try {
      setLoading(true);
      const response = await auditService.generateReportPdf(reportId);
      success('PDF generado correctamente');
      
      // Open PDF in a new window/tab
      if (response.pdfUrl) {
        window.open(response.pdfUrl, '_blank');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      showError('Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <LoadingOverlay loading={loading} />
      
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Panel de Auditor</h1>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              <FaPlusCircle className="mr-2" />
              Nuevo Informe
            </button>
            <button
              onClick={fetchInitialData}
              className="p-2 text-gray-600 hover:text-primary border border-gray-300 rounded-md hover:bg-gray-50"
              title="Actualizar datos"
            >
              <FaSync />
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={`mr-6 py-3 border-b-2 ${
              activeTab === 'reports'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaClipboardCheck className="inline mr-2" />
            Informes de Auditoría
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            className={`mr-6 py-3 border-b-2 ${
              activeTab === 'logs'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaHistory className="inline mr-2" />
            Registro de Actividad
          </button>
        </div>
        
        {activeTab === 'reports' && (
          <>
            {showCreateForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-semibold text-primary mb-4">Crear Nuevo Informe de Auditoría</h2>
                  
                  <form onSubmit={handleCreateReport}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título del Informe
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={newReportForm.title}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Proceso
                        </label>
                        <select
                          name="process_id"
                          value={newReportForm.process_id}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          required
                        >
                          <option value="">Seleccionar proceso</option>
                          {processes.map(process => (
                            <option key={process.id} value={process.id}>
                              {process.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hallazgos
                        </label>
                        <textarea
                          name="findings"
                          value={newReportForm.findings}
                          onChange={handleFormChange}
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recomendaciones
                        </label>
                        <textarea
                          name="recommendations"
                          value={newReportForm.recommendations}
                          onChange={handleFormChange}
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                      >
                        Guardar Informe
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Reports List */}
              <div className="lg:w-1/3">
                <h2 className="text-lg font-semibold mb-4">Informes para Revisión</h2>
                
                {reports.length === 0 ? (
                  <div className="bg-gray-50 p-6 text-center text-gray-500 rounded-lg">
                    No hay informes pendientes de revisión.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedReport?.id === report.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleViewReport(report)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{report.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            report.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {report.status === 'pending' ? 'Pendiente' :
                             report.status === 'reviewed' ? 'Revisado' : 'Borrador'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Proceso: {report.process_name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Fecha: {formatDate(report.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Report Details */}
              <div className="lg:w-2/3">
                {selectedReport ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-semibold">{selectedReport.title}</h2>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGeneratePdf(selectedReport.id)}
                          className="flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <FaFilePdf className="mr-2" />
                          Generar PDF
                        </button>
                        {selectedReport.file_path && (
                          <button
                            onClick={() => window.open(selectedReport.file_path, '_blank')}
                            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <FaDownload className="mr-2" />
                            Descargar
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Información del Informe</h3>
                      <p><strong>Proceso:</strong> {selectedReport.process_name || 'N/A'}</p>
                      <p><strong>Creado por:</strong> {selectedReport.auditor_name}</p>
                      <p><strong>Fecha:</strong> {formatDate(selectedReport.created_at)}</p>
                      <p><strong>Estado:</strong> {
                        selectedReport.status === 'pending' ? 'Pendiente' :
                        selectedReport.status === 'reviewed' ? 'Revisado' : 'Borrador'
                      }</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Contenido</h3>
                      <div className="border border-gray-200 rounded-lg p-4 whitespace-pre-wrap" style={{ minHeight: '200px' }}>
                        {selectedReport.content}
                      </div>
                    </div>
                    
                    {/* Comments section */}
                    <div>
                      <h3 className="font-medium mb-2">Comentarios</h3>
                      
                      {selectedReport.comments && selectedReport.comments.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {selectedReport.comments.map((comment, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between">
                                <span className="font-medium">{comment.author_name}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-1">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic mb-4">No hay comentarios aún.</p>
                      )}
                      
                      <form onSubmit={handleSubmitComment} className="space-y-3">
                        <textarea
                          value={comment}
                          onChange={handleCommentChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                          rows="3"
                          placeholder="Añade un comentario..."
                        ></textarea>
                        <button
                          type="submit"
                          className="flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                          disabled={!comment.trim()}
                        >
                          <FaComment className="mr-2" />
                          Añadir Comentario
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                    <FaEye className="text-5xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-500">Selecciona un informe para ver detalles</h3>
                    <p className="text-gray-400 mt-2">Haz clic en un informe de la lista para verlo</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'logs' && (
          <AuditLogTracker />
        )}
