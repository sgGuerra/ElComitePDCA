// src/pages/AdminPanel.jsx

import React, { useState } from 'react';
import { FaUsers, FaCog, FaProjectDiagram, FaChartBar, FaDatabase, FaFileAlt, FaUserSlash, FaClipboardCheck } from 'react-icons/fa';
import Header from '../components/Header';
import UserManagement from '../components/UserManagement';
import ProcessManagement from '../components/ProcessManagement';
import ConfigurationManagement from '../components/ConfigurationManagement';
import DeactivationRequests from '../components/DeactivationRequests';
import AuditManagement from '../components/AuditManagement';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  
  // Only admins can access this panel
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Dashboard content with admin statistics and quick actions
  const renderDashboard = () => (
    <div className="bg-white p-6 rounded-xl shadow space-y-6">
      <h2 className="text-xl font-semibold text-primary">Panel de Administración</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Usuarios</p>
              <p className="text-2xl font-bold">12</p>
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
              <p className="text-2xl font-bold">8</p>
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
              <p className="text-2xl font-bold">43</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaChartBar className="text-yellow-500 text-xl" />
            </div>
          </div>
        </div>
      </div>
      
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
        <h3 className="text-md font-medium text-blue-800">Información del sistema</h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-700">
          <li>Versión: 1.0.0</li>
          <li>Última actualización: {new Date().toLocaleDateString()}</li>
          <li>Base de datos: PostgreSQL</li>
          <li>Espacio en disco: 1.2 GB / 10 GB (12%)</li>
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
