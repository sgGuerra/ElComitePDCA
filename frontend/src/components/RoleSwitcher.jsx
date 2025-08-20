import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RoleSwitcher = () => {
  const { user, switchRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState(null);

  if (authLoading || !user || !user.roles || user.roles.length <= 1) {
    // Don't show switcher if loading, no user, no roles array, or only one/zero roles
    return null;
  }

  const handleRoleChange = async (event) => {
    const newRole = event.target.value;
    if (newRole === user.role) return; // No change

    setIsSwitching(true);
    setError(null);
    try {
      await switchRole(newRole);
      console.log('Role switched successfully to:', newRole);
      
      // Force a full page reload to ensure all components re-render with new permissions
      window.location.href = '/dashboard';
    } catch (err) {
      console.error("Failed to switch role:", err);
      setError(err.message || "Error al cambiar de rol.");
    }
    setIsSwitching(false);
  };

  return (
    <div style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label htmlFor="role-switcher" style={{ marginRight: '8px' }}>Rol Activo:</label>
      <select 
        id="role-switcher"
        value={user.role} 
        onChange={handleRoleChange} 
        disabled={isSwitching}
        style={{
          padding: '6px 10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: 'white',
          cursor: 'pointer'
        }}
      >
        {user.roles.map((role) => (
          <option key={role} value={role}>
            {/* Capitalize first letter for display, replace underscores */} 
            {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
          </option>
        ))}
      </select>
      {isSwitching && <span style={{ fontSize: '0.9em' }}>Cambiando...</span>}
      {error && <span style={{ fontSize: '0.9em', color: 'red' }}>{error}</span>}
    </div>
  );
};

export default RoleSwitcher;