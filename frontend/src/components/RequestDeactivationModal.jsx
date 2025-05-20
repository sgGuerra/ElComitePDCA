import { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';

const RequestDeactivationModal = ({ isOpen, onClose }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      showError('Por favor ingresa un motivo para la desactivación');
      return;
    }
    
    setLoading(true);
    try {
      const response = await userService.requestDeactivation(reason);
      success('Solicitud de desactivación enviada correctamente');
      setReason('');
      onClose();
    } catch (err) {
      console.error('Error requesting deactivation:', err);
      showError('Error al enviar la solicitud de desactivación');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-3">
        <div className="flex items-center mb-4 text-yellow-600">
          <FaExclamationTriangle className="text-xl mr-2" />
          <h2 className="text-xl font-semibold">Solicitar Desactivación de Cuenta</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          Estás a punto de solicitar la desactivación de tu cuenta. Un administrador revisará tu solicitud.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de la solicitud
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              rows="4"
              placeholder="Por favor, explica por qué deseas desactivar tu cuenta..."
              required
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestDeactivationModal;
