import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaExchangeAlt, FaUserCog, FaUserTie, FaUserShield } from 'react-icons/fa';
import { useToast } from '../contexts/ToastContext';

const RoleSelector = () => {
  const { user, switchRole } = useAuth();
  const { success, error: showError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  if (!user || !user.roles || user.roles.length <= 1) {
    return null; // Don't show selector if user has only one role
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleRoleChange = async (role) => {
    if (role === user.role) return; // No change needed
    
    try {
      await switchRole(role);
      success(`Cambiado a rol: ${getRoleName(role)}`);
      setIsOpen(false);
      // Refresh the page to update all components with new role
      window.location.reload();
    } catch (err) {
      console.error('Error switching role:', err);
      showError('Error al cambiar de rol');
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'process_leader':
        return 'Líder de Proceso';
      case 'auditor':
        return 'Auditor';
      default:
        return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <FaUserCog className="text-primary" />;
      case 'process_leader':
        return <FaUserTie className="text-blue-600" />;
      case 'auditor':
        return <FaUserShield className="text-green-600" />;
      default:
        return <FaUserCog />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 bg-white border border-primary text-primary text-sm rounded-md hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      >
        {getRoleIcon(user.role)}
        <span className="ml-2 font-medium">{getRoleName(user.role)}</span>
        <FaExchangeAlt className="ml-2 text-xs opacity-70" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
          <div className="px-4 py-3 bg-gray-50 rounded-t-md">
            <p className="text-sm text-gray-700">Cambiar de rol</p>
          </div>
          <div className="py-1">
            {user.roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                disabled={role === user.role}
                className={`flex items-center w-full text-left px-4 py-3 text-sm ${
                  role === user.role 
                    ? 'bg-gray-50 text-gray-500 cursor-default' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3 text-lg">
                  {getRoleIcon(role)}
                </span>
                <div>
                  <p className="font-medium">{getRoleName(role)}</p>
                  <p className="text-xs text-gray-500">
                    {role === 'admin' && 'Gestión completa del sistema'}
                    {role === 'process_leader' && 'Gestión de procesos asignados'}
                    {role === 'auditor' && 'Visualización y auditoría'}
                  </p>
                </div>
                {role === user.role && (
                  <span className="ml-auto px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    Activo
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
