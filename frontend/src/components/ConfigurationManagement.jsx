// src/components/ConfigurationManagement.jsx

import React, { useState, useEffect } from 'react';
import { FaSave, FaCog, FaBell, FaEnvelope, FaUser, FaShieldAlt, FaServer } from 'react-icons/fa';
import { useToast } from '../contexts/ToastContext';
import LoadingOverlay from './LoadingOverlay';

const ConfigurationManagement = () => {
  // State for different configuration tabs
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [changes, setChanges] = useState(false);
  const { success, error: showError } = useToast();
  
  // Configuration state objects
  const [generalConfig, setGeneralConfig] = useState({
    siteName: 'El Comité',
    siteDescription: 'Sistema de mejoramiento continuo',
    defaultLanguage: 'es',
    itemsPerPage: 10,
    timezone: 'America/Bogota'
  });
  
  const [notificationConfig, setNotificationConfig] = useState({
    enableEmailNotifications: true,
    enableBrowserNotifications: false,
    notifyOnNewAction: true,
    notifyOnDueDateApproaching: true,
    notifyOnStatusChange: true,
    reminderDays: 3,
    dailyDigest: false
  });
  
  const [emailConfig, setEmailConfig] = useState({
    smtpServer: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    emailSender: 'notifications@elcomite.com',
    emailFooter: 'Este es un correo automático, por favor no responda a este mensaje.',
    enableSsl: true
  });
  
  const [userConfig, setUserConfig] = useState({
    allowUserRegistration: false,
    requireEmailVerification: true,
    passwordMinLength: 8,
    passwordRequiresSpecialChar: true,
    passwordRequiresNumber: true,
    sessionTimeout: 120,
    maxLoginAttempts: 5
  });
  
  const [securityConfig, setSecurityConfig] = useState({
    enableTwoFactorAuth: false,
    allowedIpAddresses: '',
    corsOrigins: '*',
    enableApiRateLimit: true,
    apiRateLimitRequests: 100,
    apiRateLimitTime: 15
  });
  
  const [systemConfig, setSystemConfig] = useState({
    enableLogs: true,
    logLevel: 'info',
    debugMode: false,
    enableBackups: true,
    backupFrequency: 'daily',
    backupRetentionDays: 30,
    maintenanceMode: false
  });
  
  // Save configuration function
  const saveConfig = async () => {
    try {
      setLoading(true);
      
      // Simulate API call to save configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real application, this would be an API call to save the configuration
      // await configService.saveConfiguration(activeTab, getActiveConfig());
      
      success('Configuración guardada exitosamente');
      setChanges(false);
    } catch (err) {
      console.error('Error saving configuration:', err);
      showError('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };
  
  // Get the current active configuration object based on the active tab
  const getActiveConfig = () => {
    switch (activeTab) {
      case 'general': return generalConfig;
      case 'notifications': return notificationConfig;
      case 'email': return emailConfig;
      case 'users': return userConfig;
      case 'security': return securityConfig;
      case 'system': return systemConfig;
      default: return generalConfig;
    }
  };
  
  // Handle input change for the current active configuration
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : 
                      type === 'number' ? parseInt(value, 10) : value;
    
    setChanges(true);
    
    switch (activeTab) {
      case 'general':
        setGeneralConfig(prev => ({ ...prev, [name]: inputValue }));
        break;
      case 'notifications':
        setNotificationConfig(prev => ({ ...prev, [name]: inputValue }));
        break;
      case 'email':
        setEmailConfig(prev => ({ ...prev, [name]: inputValue }));
        break;
      case 'users':
        setUserConfig(prev => ({ ...prev, [name]: inputValue }));
        break;
      case 'security':
        setSecurityConfig(prev => ({ ...prev, [name]: inputValue }));
        break;
      case 'system':
        setSystemConfig(prev => ({ ...prev, [name]: inputValue }));
        break;
      default:
        break;
    }
  };
  
  // Configuration tab definition
  const tabs = [
    { id: 'general', label: 'General', icon: <FaCog /> },
    { id: 'notifications', label: 'Notificaciones', icon: <FaBell /> },
    { id: 'email', label: 'Correo Electrónico', icon: <FaEnvelope /> },
    { id: 'users', label: 'Usuarios', icon: <FaUser /> },
    { id: 'security', label: 'Seguridad', icon: <FaShieldAlt /> },
    { id: 'system', label: 'Sistema', icon: <FaServer /> }
  ];
  
  // General configuration form
  const renderGeneralForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre del Sitio</label>
        <input
          type="text"
          name="siteName"
          value={generalConfig.siteName}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción del Sitio</label>
        <input
          type="text"
          name="siteDescription"
          value={generalConfig.siteDescription}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Idioma Predeterminado</label>
          <select
            name="defaultLanguage"
            value={generalConfig.defaultLanguage}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="pt">Portugués</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Elementos por Página</label>
          <input
            type="number"
            name="itemsPerPage"
            value={generalConfig.itemsPerPage}
            onChange={handleInputChange}
            min="5"
            max="100"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Zona Horaria</label>
        <select
          name="timezone"
          value={generalConfig.timezone}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        >
          <option value="America/Bogota">América/Bogotá</option>
          <option value="America/Mexico_City">América/Ciudad de México</option>
          <option value="America/Lima">América/Lima</option>
          <option value="America/Santiago">América/Santiago</option>
          <option value="America/Buenos_Aires">América/Buenos Aires</option>
        </select>
      </div>
    </div>
  );
  
  // Notification configuration form
  const renderNotificationForm = () => (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="enableEmailNotifications"
          name="enableEmailNotifications"
          checked={notificationConfig.enableEmailNotifications}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="enableEmailNotifications" className="ml-2 block text-sm text-gray-700">
          Activar notificaciones por correo electrónico
        </label>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="enableBrowserNotifications"
          name="enableBrowserNotifications"
          checked={notificationConfig.enableBrowserNotifications}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="enableBrowserNotifications" className="ml-2 block text-sm text-gray-700">
          Activar notificaciones en el navegador
        </label>
      </div>
      
      <div className="pl-6 space-y-3 border-l-2 border-gray-200">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="notifyOnNewAction"
            name="notifyOnNewAction"
            checked={notificationConfig.notifyOnNewAction}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="notifyOnNewAction" className="ml-2 block text-sm text-gray-700">
            Notificar cuando se crea una nueva acción
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="notifyOnDueDateApproaching"
            name="notifyOnDueDateApproaching"
            checked={notificationConfig.notifyOnDueDateApproaching}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="notifyOnDueDateApproaching" className="ml-2 block text-sm text-gray-700">
            Notificar cuando se aproxima la fecha límite
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="notifyOnStatusChange"
            name="notifyOnStatusChange"
            checked={notificationConfig.notifyOnStatusChange}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="notifyOnStatusChange" className="ml-2 block text-sm text-gray-700">
            Notificar cuando cambia el estado de una acción
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="reminderDays" className="block text-sm font-medium text-gray-700">
            Días de anticipación para recordatorios
          </label>
          <input
            type="number"
            id="reminderDays"
            name="reminderDays"
            value={notificationConfig.reminderDays}
            onChange={handleInputChange}
            min="1"
            max="14"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="dailyDigest"
          name="dailyDigest"
          checked={notificationConfig.dailyDigest}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="dailyDigest" className="ml-2 block text-sm text-gray-700">
          Enviar resumen diario de actividades
        </label>
      </div>
    </div>
  );
  
  // Email configuration form
  const renderEmailForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Servidor SMTP</label>
        <input
          type="text"
          name="smtpServer"
          value={emailConfig.smtpServer}
          onChange={handleInputChange}
          placeholder="smtp.example.com"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Puerto SMTP</label>
          <input
            type="number"
            name="smtpPort"
            value={emailConfig.smtpPort}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
        
        <div className="flex items-center h-full pt-6">
          <input
            type="checkbox"
            id="enableSsl"
            name="enableSsl"
            checked={emailConfig.enableSsl}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="enableSsl" className="ml-2 block text-sm text-gray-700">
            Usar SSL/TLS
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Usuario SMTP</label>
          <input
            type="text"
            name="smtpUsername"
            value={emailConfig.smtpUsername}
            onChange={handleInputChange}
            placeholder="user@example.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña SMTP</label>
          <input
            type="password"
            name="smtpPassword"
            value={emailConfig.smtpPassword}
            onChange={handleInputChange}
            placeholder="••••••••••"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Correo del Remitente</label>
        <input
          type="email"
          name="emailSender"
          value={emailConfig.emailSender}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Pie de página del correo</label>
        <textarea
          name="emailFooter"
          value={emailConfig.emailFooter}
          onChange={handleInputChange}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
    </div>
  );
  
  // User configuration form
  const renderUserForm = () => (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="allowUserRegistration"
          name="allowUserRegistration"
          checked={userConfig.allowUserRegistration}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="allowUserRegistration" className="ml-2 block text-sm text-gray-700">
          Permitir registro de usuarios
        </label>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="requireEmailVerification"
          name="requireEmailVerification"
          checked={userConfig.requireEmailVerification}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-700">
          Requerir verificación de correo electrónico
        </label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Longitud mínima de contraseña</label>
          <input
            type="number"
            name="passwordMinLength"
            value={userConfig.passwordMinLength}
            onChange={handleInputChange}
            min="6"
            max="20"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Tiempo de sesión (minutos)</label>
          <input
            type="number"
            name="sessionTimeout"
            value={userConfig.sessionTimeout}
            onChange={handleInputChange}
            min="5"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="passwordRequiresSpecialChar"
            name="passwordRequiresSpecialChar"
            checked={userConfig.passwordRequiresSpecialChar}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="passwordRequiresSpecialChar" className="ml-2 block text-sm text-gray-700">
            Requerir carácter especial
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="passwordRequiresNumber"
            name="passwordRequiresNumber"
            checked={userConfig.passwordRequiresNumber}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="passwordRequiresNumber" className="ml-2 block text-sm text-gray-700">
            Requerir número
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Máximo de intentos de inicio de sesión</label>
        <input
          type="number"
          name="maxLoginAttempts"
          value={userConfig.maxLoginAttempts}
          onChange={handleInputChange}
          min="1"
          max="10"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
    </div>
  );
  
  // Security configuration form
  const renderSecurityForm = () => (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="enableTwoFactorAuth"
          name="enableTwoFactorAuth"
          checked={securityConfig.enableTwoFactorAuth}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="enableTwoFactorAuth" className="ml-2 block text-sm text-gray-700">
          Habilitar autenticación de dos factores
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Direcciones IP permitidas</label>
        <textarea
          name="allowedIpAddresses"
          value={securityConfig.allowedIpAddresses}
          onChange={handleInputChange}
          placeholder="Dejar en blanco para permitir todas. Ej: 192.168.1.1, 10.0.0.0/24"
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
        <p className="mt-1 text-xs text-gray-500">
          Separar múltiples direcciones IP o rangos con comas.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Orígenes CORS permitidos</label>
        <input
          type="text"
          name="corsOrigins"
          value={securityConfig.corsOrigins}
          onChange={handleInputChange}
          placeholder="* para todos, o especifique dominios: https://example.com, https://api.example.com"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="enableApiRateLimit"
          name="enableApiRateLimit"
          checked={securityConfig.enableApiRateLimit}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="enableApiRateLimit" className="ml-2 block text-sm text-gray-700">
          Habilitar límite de tasa para API
        </label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Solicitudes máximas</label>
          <input
            type="number"
            name="apiRateLimitRequests"
            value={securityConfig.apiRateLimitRequests}
            onChange={handleInputChange}
            min="10"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Periodo de tiempo (minutos)</label>
          <input
            type="number"
            name="apiRateLimitTime"
            value={securityConfig.apiRateLimitTime}
            onChange={handleInputChange}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
  
  // System configuration form
  const renderSystemForm = () => (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="enableLogs"
          name="enableLogs"
          checked={systemConfig.enableLogs}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="enableLogs" className="ml-2 block text-sm text-gray-700">
          Habilitar registros (logs)
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Nivel de registro</label>
        <select
          name="logLevel"
          value={systemConfig.logLevel}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        >
          <option value="error">Error</option>
          <option value="warn">Advertencia</option>
          <option value="info">Información</option>
          <option value="debug">Depuración</option>
          <option value="trace">Seguimiento detallado</option>
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="debugMode"
          name="debugMode"
          checked={systemConfig.debugMode}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="debugMode" className="ml-2 block text-sm text-gray-700">
          Modo de depuración
        </label>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="enableBackups"
          name="enableBackups"
          checked={systemConfig.enableBackups}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="enableBackups" className="ml-2 block text-sm text-gray-700">
          Habilitar copias de seguridad automáticas
        </label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Frecuencia de copia de seguridad</label>
          <select
            name="backupFrequency"
            value={systemConfig.backupFrequency}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="hourly">Cada hora</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Días de retención de copias</label>
          <input
            type="number"
            name="backupRetentionDays"
            value={systemConfig.backupRetentionDays}
            onChange={handleInputChange}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="maintenanceMode"
          name="maintenanceMode"
          checked={systemConfig.maintenanceMode}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
          Modo de mantenimiento
        </label>
      </div>
    </div>
  );
  
  // Render the correct form based on the active tab
  const renderForm = () => {
    switch (activeTab) {
      case 'general': return renderGeneralForm();
      case 'notifications': return renderNotificationForm();
      case 'email': return renderEmailForm();
      case 'users': return renderUserForm();
      case 'security': return renderSecurityForm();
      case 'system': return renderSystemForm();
      default: return renderGeneralForm();
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-6">
      <LoadingOverlay loading={loading} />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Configuración del Sistema</h2>
        
        <button
          onClick={saveConfig}
          disabled={!changes}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            changes 
              ? 'bg-primary text-white hover:bg-primary/90' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <FaSave />
          <span>Guardar Cambios</span>
        </button>
      </div>
      
      <div className="flex flex-col sm:flex-row">
        {/* Sidebar with tabs */}
        <div className="w-full sm:w-64 mb-4 sm:mb-0 sm:mr-6">
          <div className="bg-gray-100 rounded-lg p-2">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              {tabs.find(tab => tab.id === activeTab)?.icon}
              <span className="ml-2">{tabs.find(tab => tab.id === activeTab)?.label}</span>
            </h3>
            
            {/* Render the active form */}
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationManagement;
