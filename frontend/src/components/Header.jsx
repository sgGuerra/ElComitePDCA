// frontend/src/components/Header.jsx

import React, { useState, useEffect } from 'react';
import { FaBell, FaCog, FaUserCircle, FaSignOutAlt, FaExchangeAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';
import RoleSelector from './RoleSelector';

const Header = ({ activeTab, setActiveTab, tabs }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Fetch unread notification count
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchUnreadCount();
    
    // Poll for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getUserNotifications({ limit: 5 });
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'Procesos') {
      navigate('/procesos');
    } else if (tab === 'Resumen') {
      navigate('/dashboard');
    } else if (tab === 'Admin Panel') {
      navigate('/admin');
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-6">
      <nav className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150 ${
              activeTab === tab ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="text-3xl font-serif font-bold text-primary hidden md:block">El Comité</h1>
      </div>

      <div className="flex items-center space-x-4">
        {user?.roles && user.roles.length > 1 && (
          <RoleSelector />
        )}
        
        {user?.role === 'admin' && (
          <button
            onClick={() => handleTabClick('Admin Panel')}
            className="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Admin Panel
          </button>
        )}
        
        {user?.role === 'auditor' && (
          <button
            onClick={() => navigate('/auditor')}
            className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Panel de Auditor
          </button>
        )}
        
        <div className="relative">
          <button
            onClick={handleNotificationClick}
            className="relative p-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 rounded-full border-2 border-white text-white text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-[70vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-medium text-primary">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
              
              <div className="divide-y divide-gray-200">
                {notifications.length === 0 ? (
                  <div className="py-8 px-3 text-center text-gray-500">
                    <FaBell className="mx-auto text-gray-300 text-3xl mb-2" />
                    <p>No hay notificaciones</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-4 hover:bg-gray-50 transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                    >
                      <div className="flex justify-between">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.read && (
                          <button 
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-primary hover:text-primary/80"
                          >
                            Marcar como leída
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 border-t border-gray-200 text-center">
                <button 
                  onClick={() => navigate('/perfil/notificaciones')}
                  className="text-sm text-primary hover:underline"
                >
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 transition-colors"
        >
          <FaCog className="text-xl" />
        </button>
        
        <div className="relative">
          <button 
            className="flex items-center" 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium border border-primary/30 hover:bg-primary/20 transition-colors">
              {user?.name?.charAt(0)}
            </div>
          </button>
          
          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <div className="mt-2 bg-gray-50 text-xs py-1 px-2 rounded-md text-gray-700 inline-block">
                  Rol: {user?.role === 'admin' ? 'Administrador' : user?.role === 'process_leader' ? 'Líder de Proceso' : 'Auditor'}
                </div>
              </div>
              <div className="py-1">
                <button 
                  onClick={() => { navigate('/perfil'); setShowUserMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FaUserCircle className="text-gray-500" />
                  Mi Perfil
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FaSignOutAlt className="text-red-500" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
