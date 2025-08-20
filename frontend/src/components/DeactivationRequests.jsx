import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheck, FaTimes, FaExchangeAlt } from 'react-icons/fa';
import userService from '../services/userService';
import assignmentService from '../services/assignmentService';
import { useToast } from '../contexts/ToastContext';
import LoadingOverlay from './LoadingOverlay';

const DeactivationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [availableLeaders, setAvailableLeaders] = useState([]);
  const [selectedLeader, setSelectedLeader] = useState('');
  const [leaderProcesses, setLeaderProcesses] = useState([]);
  const [transferModalStep, setTransferModalStep] = useState(1);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchDeactivationRequests();
  }, []);

  const fetchDeactivationRequests = async () => {
    try {
      setLoading(true);
      const data = await userService.getPendingDeactivationRequests();
      setRequests(data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching deactivation requests:', err);
      setError('Error al cargar las solicitudes de desactivación');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableLeaders = async () => {
    try {
      const leaders = await assignmentService.getAvailableLeaders();
      // Filter out the leader being deactivated
      const filteredLeaders = leaders.filter(
        leader => leader.id !== selectedRequest?.user_id
      );
      setAvailableLeaders(filteredLeaders);
    } catch (err) {
      console.error('Error fetching available leaders:', err);
      showError('Error al cargar líderes disponibles');
    }
  };

  const fetchLeaderProcesses = async (userId) => {
    try {
      const processes = await assignmentService.getLeaderProcesses(userId);
      setLeaderProcesses(processes || []);
    } catch (err) {
      console.error('Error fetching leader processes:', err);
      showError('Error al cargar los procesos del líder');
    }
  };

  const handleApproveRequest = async (request) => {
    if (!request) return;
    
    setSelectedRequest(request);
    
    // Fetch processes for this leader and available leaders
    await fetchLeaderProcesses(request.user_id);
    await fetchAvailableLeaders();
    
    // If the leader has processes, show transfer modal
    if (leaderProcesses.length > 0) {
      setTransferModalStep(1);
      setShowTransferModal(true);
    } else {
      // If no processes, proceed with deactivation directly
      processDeactivation(request.id, true);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('¿Estás seguro de rechazar esta solicitud de desactivación?')) {
      return;
    }
    
    processDeactivation(requestId, false);
  };

  const processDeactivation = async (requestId, approve, newLeaderId = null) => {
    try {
      setProcessing(true);
      const response = await userService.processDeactivationRequest(requestId, approve, newLeaderId);
      
      success(approve 
        ? 'Solicitud aprobada y cuenta desactivada' 
        : 'Solicitud rechazada'
      );
      
      // Refresh the list
      fetchDeactivationRequests();
      
      // Reset UI state
      setSelectedRequest(null);
      setShowTransferModal(false);
      setSelectedLeader('');
      setLeaderProcesses([]);
      setTransferModalStep(1);
    } catch (err) {
      console.error('Error processing request:', err);
      showError('Error al procesar la solicitud');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransferComplete = async () => {
    if (!selectedRequest) return;
    
    try {
      setProcessing(true);
      
      // Transfer each process to the new leader
      for (const process of leaderProcesses) {
        await assignmentService.transferProcessLeadership(
          process.id,
          selectedRequest.user_id,
          parseInt(selectedLeader)
        );
      }
      
      // Now complete the deactivation
      await processDeactivation(selectedRequest.id, true);
      
      success('Procesos transferidos y cuenta desactivada correctamente');
    } catch (err) {
      console.error('Error transferring processes:', err);
      showError('Error al transferir procesos');
    } finally {
      setProcessing(false);
    }
  };

  const handleNextStep = () => {
    if (!selectedLeader) {
      showError('Por favor selecciona un líder para transferir los procesos');
      return;
    }
    setTransferModalStep(2);
  };

  const renderTransferModal = () => {
    if (!showTransferModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-3">
          <div className="flex items-center mb-4 text-primary">
            <FaExchangeAlt className="text-xl mr-2" />
            <h2 className="text-xl font-semibold">Transferir Procesos</h2>
          </div>
          
          <LoadingOverlay loading={processing} />
          
          {transferModalStep === 1 && (
            <>
              <p className="text-gray-600 mb-4">
                El usuario tiene {leaderProcesses.length} procesos asignados. 
                Debes transferirlos a otro líder antes de desactivar la cuenta.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecciona un líder para transferir todos los procesos
                </label>
                <select
                  value={selectedLeader}
                  onChange={(e) => setSelectedLeader(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={availableLeaders.length === 0}
                >
                  <option value="">-- Selecciona un líder --</option>
                  {availableLeaders.map(leader => (
                    <option key={leader.id} value={leader.id}>
                      {leader.name} ({leader.email})
                    </option>
                  ))}
                </select>
                {availableLeaders.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    No hay líderes disponibles. Debes crear un nuevo líder antes de desactivar esta cuenta.
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  disabled={!selectedLeader || availableLeaders.length === 0}
                >
                  Continuar
                </button>
              </div>
            </>
          )}
          
          {transferModalStep === 2 && (
            <>
              <p className="text-gray-600 mb-4">
                Estás a punto de transferir {leaderProcesses.length} procesos al líder seleccionado
                y desactivar la cuenta del usuario.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                <h3 className="font-medium text-yellow-800 mb-2">Procesos a transferir:</h3>
                <ul className="list-disc pl-5">
                  {leaderProcesses.map(process => (
                    <li key={process.id} className="text-yellow-700">
                      {process.name}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTransferModalStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleTransferComplete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={processing}
                >
                  {processing ? 'Procesando...' : 'Confirmar y Desactivar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold text-primary mb-4">Solicitudes de Desactivación de Cuentas</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center text-gray-500 rounded-lg">
          No hay solicitudes de desactivación pendientes.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Solicitud</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{request.user_name}</div>
                      <div className="text-gray-500 text-sm">{request.user_email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate">
                      {request.reason.length > 100 
                        ? request.reason.substring(0, 100) + '...' 
                        : request.reason
                      }
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproveRequest(request)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                        disabled={processing}
                      >
                        <FaCheck className="mr-1" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                        disabled={processing}
                      >
                        <FaTimes className="mr-1" />
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {renderTransferModal()}
    </div>
  );
};

export default DeactivationRequests;
