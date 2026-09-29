import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBell } from 'react-icons/fa';
import Header from '../components/Header';
import LoadingOverlay from '../components/LoadingOverlay';
import notificationService from '../services/notificationService';
import { useToast } from '../contexts/ToastContext';

const NotificationsHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Procesos');
  const navigate = useNavigate();
  const { error: showError } = useToast();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await notificationService.getUserNotifications({ limit: 100 });
        setNotifications(data);
      } catch {
        showError('Error al cargar las notificaciones');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [showError]);

  return (
    <div className="min-h-screen bg-lightgray p-4 md:p-6">
      <LoadingOverlay loading={loading} />
      <div className="max-w-5xl mx-auto">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} tabs={['Resumen', 'Procesos']} />
        <main className="bg-white rounded-lg shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-primary">Historial de notificaciones</h1>
              <p className="text-sm text-gray-600 mt-1">Notificaciones recibidas por tu cuenta</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/perfil')}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <FaArrowLeft aria-hidden="true" />
              Perfil
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-500" role="status">
              <FaBell className="mx-auto text-3xl text-gray-300 mb-3" aria-hidden="true" />
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <li key={notification.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-medium text-gray-900">{notification.title}</h2>
                      <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                      <time className="mt-2 block text-xs text-gray-500" dateTime={notification.created_at}>
                        {new Date(notification.created_at).toLocaleString('es-ES')}
                      </time>
                    </div>
                    <span className={`shrink-0 text-xs ${notification.read ? 'text-gray-500' : 'font-medium text-blue-700'}`}>
                      {notification.read ? 'Leída' : 'Sin leer'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
};

export default NotificationsHistory;