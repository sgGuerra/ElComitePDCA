import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'process_leader' });
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error al obtener los usuarios. Por favor, inténtelo de nuevo.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    try {
      setLoading(true);
      const response = await userService.createUser(newUser);
      
      if (response.success) {
        setUsers([...users, response.data]);
        setNewUser({ name: '', email: '', password: '', role: 'process_leader' });
        setSuccessMessage('¡Usuario agregado exitosamente!');
        setError('');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(error.message || 'Error al agregar el usuario');
      setSuccessMessage('');
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser.id) {
      setError('No puedes eliminar tu propia cuenta');
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await userService.deleteUser(id);
      
      if (response.success) {
        setUsers(users.filter((user) => user.id !== id));
        setSuccessMessage('¡Usuario eliminado exitosamente!');
        setError('');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(error.message || 'Error al eliminar el usuario');
      setSuccessMessage('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold text-primary">Gestión de Usuarios</h2>

      {successMessage && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-md">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleAddUser} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            name="name"
            value={newUser.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
          <input
            type="email"
            name="email"
            value={newUser.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Rol</label>
          <select
            name="role"
            value={newUser.role}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            disabled={loading}
          >
            <option value="process_leader">Líder de Proceso</option>
            <option value="admin">Administrador</option>
            <option value="auditor">Auditor</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Agregando...
            </span>
          ) : 'Agregar Usuario'}
        </button>
      </form>

      {loading && !users.length ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Nombre</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Correo Electrónico</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Rol</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100 transition-colors">
                    <td className="py-3 px-4 text-gray-800">{user.name}</td>
                    <td className="py-3 px-4 text-gray-800">{user.email}</td>
                    <td className="py-3 px-4 text-gray-800 capitalize">{user.role}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className={`px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-70 ${
                          user.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={loading || user.id === currentUser.id}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
