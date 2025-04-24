// frontend/src/components/Header.jsx

import React, { useState, useEffect } from 'react';
import { FaBell, FaCog, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';

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
        n.id === id ? { ...n, read: 1 } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: 1 })));
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
        {user?.role === 'admin' && (
          <button
            onClick={() => handleTabClick('Admin Panel')}
            className="border border-primary text-primary px-3 py-1 rounded-md text-sm font-medium hover:bg-primary/10"
          >
            Admin Panel
          </button>
        )}
        
        <div className="relative">
          <FaBell 
            className="text-xl text-gray-600 hover:text-primary cursor-pointer" 
            onClick={handleNotificationClick}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 rounded-full border-2 border-white text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          
          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-20 border border-gray-200 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-medium">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
              
              <div className="divide-y divide-gray-200">
                {notifications.length === 0 ? (
                  <div className="py-4 px-3 text-center text-gray-500">
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-3 hover:bg-gray-50 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
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
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <FaCog className="text-xl text-gray-600 hover:text-primary cursor-pointer" />
        
        <div className="relative">
          <div className="flex items-center" onClick={() => setShowUserMenu(!showUserMenu)}>
            <FaUserCircle className="text-3xl text-gray-400 hover:text-primary cursor-pointer" />
          </div>
          
          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
              <div className="p-3 border-b border-gray-200">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
                <p className="text-xs text-gray-600 mt-1 capitalize">{user?.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FaSignOutAlt className="text-gray-500" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
