// src/pages/AdminPanel.jsx

import React, { useState, useEffect } from 'react';
import { FaUsers, FaCog, FaProjectDiagram, FaChartBar, FaDatabase, FaFileAlt, FaUserSlash, FaClipboardCheck } from 'react-icons/fa';
import Header from '../components/Header';
import UserManagement from '../components/UserManagement';
import ProcessManagement from '../components/ProcessManagement';
import ConfigurationManagement from '../components/ConfigurationManagement';
import DeactivationRequests from '../components/DeactivationRequests';
import AuditManagement from '../components/AuditManagement';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import userService from '../services/userService';
import processService from '../services/processService';
import statisticsService from '../services/statisticsService';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    users: 0,
    processes: 0,
    activeActions: 0,
    isLoading: true,
    lastUpdated: null
  });
  const { user } = useAuth();
  
  // Only admins can access this panel
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setDashboardStats(prev => ({ ...prev, isLoading: true }));
      
      // Fetch users count
      const users = await userService.getAllUsers();
      
      // Fetch processes count
      const processes = await processService.getAllProcesses();
      
      // Fetch active actions statistics
      const actionStats = await statisticsService.getActionsByStatus();
      
      // Calculate active actions (assuming those with status "in_progress", "pending", etc.)
      let activeActions = 0;
      if (actionStats && actionStats.data) {
        // Sum up actions that are not completed or cancelled
        const activeStatuses = ['in_progress', 'pending', 'assigned', 'open'];
        activeActions = Object.entries(actionStats.data)
          .filter(([status]) => activeStatuses.includes(status))
          .reduce((sum, [_, count]) => sum + (count || 0), 0);
      }
      
      setDashboardStats({
        users: Array.isArray(users) ? users.length : 0,
        processes: Array.isArray(processes) ? processes.length : 0,
        activeActions,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      setDashboardStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Fetch dashboard statistics
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  // Dashboard content with admin statistics and quick actions
  const renderDashboard = () => (
    <div className="bg-white p-6 rounded-xl shadow space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Panel de Administración</h2>
        <button 
          onClick={() => {
            if (activeTab === 'dashboard') {
              fetchDashboardData();
            }
          }}
          className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
          disabled={dashboardStats.isLoading}
        >
          {dashboardStats.isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Actualizando...
            </span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar datos
            </>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Usuarios</p>
              {dashboardStats.isLoading ? (
                <div className="animate-pulse h-8 w-12 bg-blue-200 rounded"></div>
              ) : (
                <p className="text-2xl font-bold">{dashboardStats.users}</p>
              )}
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUsers className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Procesos</p>
              {dashboardStats.isLoading ? (
                <div className="animate-pulse h-8 w-12 bg-green-200 rounded"></div>
              ) : (
                <p className="text-2xl font-bold">{dashboardStats.processes}</p>
              )}
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaProjectDiagram className="text-green-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Acciones Activas</p>
              {dashboardStats.isLoading ? (
                <div className="animate-pulse h-8 w-12 bg-yellow-200 rounded"></div>
              ) : (
                <p className="text-2xl font-bold">{dashboardStats.activeActions}</p>
              )}
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaChartBar className="text-yellow-500 text-xl" />
            </div>
          </div>
        </div>
      </div>
      
      {!dashboardStats.isLoading && (
        <p className="text-xs text-gray-500 italic">
          * Los datos mostrados son dinámicos y reflejan los datos actuales en el sistema.
        </p>
      )}
      
      <h3 className="text-lg font-medium text-primary mt-6">Acciones Rápidas</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('users')}
          className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <FaUsers className="text-blue-500" />
          </div>
          <div className="text-left">
            <p className="font-medium">Gestión de Usuarios</p>
            <p className="text-sm text-gray-600">Añadir, editar o eliminar usuarios</p>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('processes')}
          className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          <div className="p-3 bg-green-100 rounded-full mr-4">
            <FaProjectDiagram className="text-green-500" />
          </div>
          <div className="text-left">
            <p className="font-medium">Gestión de Procesos</p>
            <p className="text-sm text-gray-600">Administrar los procesos del sistema</p>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('configuration')}
          className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          <div className="p-3 bg-gray-100 rounded-full mr-4">
            <FaCog className="text-gray-500" />
          </div>
          <div className="text-left">
            <p className="font-medium">Configuración</p>
            <p className="text-sm text-gray-600">Ajustes generales del sistema</p>
          </div>
        </button>
        
        <button
          className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          <div className="p-3 bg-red-100 rounded-full mr-4">
            <FaDatabase className="text-red-500" />
          </div>
          <div className="text-left">
            <p className="font-medium">Copias de Seguridad</p>
            <p className="text-sm text-gray-600">Gestionar respaldos del sistema</p>
          </div>
        </button>
        
        <button
          className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          <div className="p-3 bg-purple-100 rounded-full mr-4">
            <FaFileAlt className="text-purple-500" />
          </div>
          <div className="text-left">
            <p className="font-medium">Registros</p>
            <p className="text-sm text-gray-600">Ver logs de actividad del sistema</p>
          </div>
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium text-blue-800">Información del sistema</h3>
          {dashboardStats.isLoading ? (
            <div className="animate-pulse h-4 w-24 bg-blue-200 rounded"></div>
          ) : (
            <span className="text-xs bg-blue-200 px-2 py-1 rounded text-blue-800">
              En línea
            </span>
          )}
        </div>
        <ul className="mt-2 space-y-1 text-sm text-blue-700">
          <li>Versión: 1.0.0</li>
          <li>Fecha del servidor: {new Date().toLocaleDateString()}</li>
          <li>Base de datos: SQLite</li>
          {dashboardStats.lastUpdated && (
            <li>Datos actualizados: {dashboardStats.lastUpdated.toLocaleString()}</li>
          )}
        </ul>
      </div>
    </div>
  );

  // Navigation between different admin sections
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartBar /> },
    { id: 'users', label: 'Usuarios', icon: <FaUsers /> },
    { id: 'processes', label: 'Procesos', icon: <FaProjectDiagram /> },
    { id: 'deactivation', label: 'Solicitudes de Desactivación', icon: <FaUserSlash /> },
    { id: 'audits', label: 'Auditorías', icon: <FaClipboardCheck /> },
    { id: 'configuration', label: 'Configuración', icon: <FaCog /> }
  ];

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <Header
        activeTab="Admin Panel"
        setActiveTab={() => {}}
        tabs={['Resumen', 'Procesos']}
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar navigation */}
        <div className="md:w-64 bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold text-primary mb-4 px-2">Administración</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="mt-8 px-4 py-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600">
              Conectado como <span className="font-medium">{user?.name}</span>
            </p>
            <p className="text-xs text-gray-600">
              Rol: <span className="font-medium capitalize">{user?.role}</span>
            </p>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'processes' && <ProcessManagement />}
          {activeTab === 'deactivation' && <DeactivationRequests />}
          {activeTab === 'audits' && <AuditManagement />}
          {activeTab === 'configuration' && <ConfigurationManagement />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
