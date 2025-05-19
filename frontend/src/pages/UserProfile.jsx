// src/pages/UserProfile.jsx

import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaKey, FaBell, FaEnvelope, FaCheck, 
  FaUserCog, FaHistory, FaSignOutAlt, FaCamera 
} from 'react-icons/fa';
import Header from '../components/Header';
import LoadingOverlay from '../components/LoadingOverlay';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import userService from '../services/userService';
import actionService from '../services/actionService';

const UserProfile = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    bio: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    browserNotifications: false,
    actionAssigned: true,
    actionStatusChanged: true,
    actionDueDateReminder: true,
    systemUpdates: false,
    dailySummary: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [assignedActions, setAssignedActions] = useState([]);

  useEffect(() => {
    if (user) {
      // Initialize form with user data
      setUserForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        position: user.position || '',
        department: user.department || '',
        bio: user.bio || ''
      });
      
      // Fetch user recent activities and assigned actions
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // In a real application, these would be API calls to fetch user-specific data
      // For now, we'll simulate them with dummy data
      
      // Fetch user's assigned actions
      const actions = await actionService.getActionsByLeader(user.id);
      setAssignedActions(actions || []);
      
      // Simulate recent activities (in a real app, this would come from a separate API)
      setRecentActivities([
        { 
          id: 1, 
          type: 'login', 
          description: 'Inicio de sesión exitoso', 
          timestamp: new Date(Date.now() - 120000).toISOString() 
        },
        { 
          id: 2, 
          type: 'action_status', 
          description: 'Cambió el estado de la acción "Revisión de procedimientos" a Completada', 
          timestamp: new Date(Date.now() - 86400000).toISOString() 
        },
        { 
          id: 3, 
          type: 'comment', 
          description: 'Comentó en la acción "Implementación de controles"', 
          timestamp: new Date(Date.now() - 172800000).toISOString() 
        },
        { 
          id: 4, 
          type: 'document', 
          description: 'Subió el documento "Informe de auditoría Q1.pdf"', 
          timestamp: new Date(Date.now() - 259200000).toISOString() 
        }
      ]);
    } catch (err) {
      console.error('Error fetching user data:', err);
      showError('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const validateUserForm = () => {
    const errors = {};
    if (!userForm.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!userForm.email.trim()) errors.email = 'El correo electrónico es obligatorio';
    if (userForm.email && !/\S+@\S+\.\S+/.test(userForm.email)) {
      errors.email = 'El correo electrónico no es válido';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'La contraseña actual es obligatoria';
    if (!passwordForm.newPassword) errors.newPassword = 'La nueva contraseña es obligatoria';
    if (passwordForm.newPassword && passwordForm.newPassword.length < 8) {
      errors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateUserForm()) {
      return;
    }
    
    setLoading(true);
    try {
      // In a real application, this would be an API call to update the user's profile
      const updatedUser = {
        ...user,
        ...userForm
      };
      
      // Update the user profile in context and local storage
      updateUserProfile(updatedUser);
      success('Perfil actualizado exitosamente');
    } catch (err) {
      console.error('Error updating profile:', err);
      showError('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setLoading(true);
    try {
      // In a real application, this would be an API call to change the password
      
      // For demonstration purposes, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 800));
      
      success('Contraseña actualizada exitosamente');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error changing password:', err);
      showError('Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // In a real application, this would be an API call to update notification settings
      
      // For demonstration purposes, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 500));
      
      success('Preferencias de notificación actualizadas');
    } catch (err) {
      console.error('Error updating notification settings:', err);
      showError('Error al actualizar las preferencias de notificación');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return <FaUser className="text-blue-500" />;
      case 'action_status': return <FaCheck className="text-green-500" />;
      case 'comment': return <FaEnvelope className="text-purple-500" />;
      case 'document': return <FaEnvelope className="text-orange-500" />;
      default: return <FaHistory className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En progreso';
      case 'completed': return 'Completada';
      case 'canceled': return 'Cancelada';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-200 text-yellow-800';
      case 'in_progress': return 'bg-blue-200 text-blue-800';
      case 'completed': return 'bg-green-200 text-green-800';
      case 'canceled': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <Header
        activeTab=""
        setActiveTab={() => {}}
        tabs={['Resumen', 'Procesos']}
      />
      
      <LoadingOverlay loading={loading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - User info and navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user?.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-4xl" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer">
                  <FaCamera className="text-xs" />
                </div>
              </div>
              
              <h2 className="mt-4 text-xl font-bold">{user?.name}</h2>
              <p className="text-gray-600 capitalize">{user?.role || 'Usuario'}</p>
              <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'profile' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaUser className="mr-3" />
                  <span>Información Personal</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'password' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaKey className="mr-3" />
                  <span>Cambiar Contraseña</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'notifications' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaBell className="mr-3" />
                  <span>Notificaciones</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'activity' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaHistory className="mr-3" />
                  <span>Actividad Reciente</span>
                </button>
              </nav>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                <FaSignOutAlt className="mr-2" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="lg:col-span-3">
          {/* Profile Information Form */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-primary mb-6 flex items-center">
                <FaUserCog className="mr-2" />
                <span>Información Personal</span>
              </h2>
              
              <form onSubmit={handleUserProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      name="name"
                      value={userForm.name}
                      onChange={handleUserFormChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      name="email"
                      value={userForm.email}
                      onChange={handleUserFormChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary ${
                        formErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      name="phone"
                      value={userForm.phone}
                      onChange={handleUserFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                    <input
                      type="text"
                      name="position"
                      value={userForm.position}
                      onChange={handleUserFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <input
                      type="text"
                      name="department"
                      value={userForm.department}
                      onChange={handleUserFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                  <textarea
                    name="bio"
                    value={userForm.bio}
                    onChange={handleUserFormChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Cuéntanos un poco sobre ti..."
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Change Password Form */}
          {activeTab === 'password' && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-primary mb-6 flex items-center">
                <FaKey className="mr-2" />
                <span>Cambiar Contraseña</span>
              </h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFormChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary ${
                      formErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.currentPassword}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFormChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary ${
                      formErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.newPassword}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFormChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary ${
                      formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                  )}
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Actualizar Contraseña
                  </button>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700">
                    <strong>Consejo de seguridad:</strong> Utiliza una contraseña fuerte que incluya al menos 8 caracteres, 
                    combinando letras mayúsculas y minúsculas, números y caracteres especiales.
                  </p>
                </div>
              </form>
            </div>
          )}
          
          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-primary mb-6 flex items-center">
                <FaBell className="mr-2" />
                <span>Preferencias de Notificación</span>
              </h2>
              
              <form onSubmit={handleNotificationSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Canales de Notificación</h3>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      name="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                      Correo Electrónico
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="browserNotifications"
                      name="browserNotifications"
                      checked={notificationSettings.browserNotifications}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="browserNotifications" className="ml-2 text-sm text-gray-700">
                      Notificaciones del Navegador
                    </label>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Eventos de Notificación</h3>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="actionAssigned"
                      name="actionAssigned"
                      checked={notificationSettings.actionAssigned}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="actionAssigned" className="ml-2 text-sm text-gray-700">
                      Cuando me asignan una acción
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="actionStatusChanged"
                      name="actionStatusChanged"
                      checked={notificationSettings.actionStatusChanged}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="actionStatusChanged" className="ml-2 text-sm text-gray-700">
                      Cuando cambia el estado de una acción
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="actionDueDateReminder"
                      name="actionDueDateReminder"
                      checked={notificationSettings.actionDueDateReminder}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="actionDueDateReminder" className="ml-2 text-sm text-gray-700">
                      Recordatorios de fechas límite
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="systemUpdates"
                      name="systemUpdates"
                      checked={notificationSettings.systemUpdates}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="systemUpdates" className="ml-2 text-sm text-gray-700">
                      Actualizaciones del sistema
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="dailySummary"
                      name="dailySummary"
                      checked={notificationSettings.dailySummary}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="dailySummary" className="ml-2 text-sm text-gray-700">
                      Resumen diario
                    </label>
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Guardar Preferencias
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Recent Activity */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-primary mb-6 flex items-center">
                  <FaHistory className="mr-2" />
                  <span>Actividad Reciente</span>
                </h2>
                
                {recentActivities.length === 0 ? (
                  <p className="text-gray-500 italic">No hay actividades recientes.</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-start border-b border-gray-100 pb-4">
                        <div className="bg-gray-100 p-2 rounded-full mr-3">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <p className="text-gray-700">{activity.description}</p>
                          <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-primary mb-6">Acciones Asignadas</h2>
                
                {assignedActions.length === 0 ? (
                  <p className="text-gray-500 italic">No tienes acciones asignadas.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Proceso</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Fecha Límite</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {assignedActions.map(action => (
                          <tr key={action.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{action.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{action.process_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {action.target_date ? formatDate(action.target_date) : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(action.status)}`}>
                                {getStatusLabel(action.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
