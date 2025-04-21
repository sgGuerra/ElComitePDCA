import React, { useState, useEffect } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error('Error al obtener los usuarios:', error));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      setSuccessMessage('Por favor, completa todos los campos.');
      return;
    }

    fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Error al agregar el usuario');
        return response.json();
      })
      .then((data) => {
        setUsers([...users, { id: data.id, name: newUser.name, email: newUser.email }]);
        setNewUser({ name: '', email: '', password: '' });
        setSuccessMessage('¡Usuario agregado exitosamente!');
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch((error) => {
        console.error('Error al agregar el usuario:', error);
        setSuccessMessage('Hubo un error al agregar el usuario.');
      });
  };

  const handleDeleteUser = (id) => {
    fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE' })
      .then((response) => {
        if (!response.ok) throw new Error('Error al eliminar el usuario');
        setUsers(users.filter((user) => user.id !== id));
        setSuccessMessage('¡Usuario eliminado exitosamente!');
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch((error) => {
        console.error('Error al eliminar el usuario:', error);
        setSuccessMessage('Hubo un error al eliminar el usuario.');
      });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold text-primary">Gestión de Usuarios</h2>

      {successMessage && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-md">
          {successMessage}
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
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Agregar Usuario
        </button>
      </form>

      <table className="min-w-full text-sm border border-gray-200 rounded-lg mt-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Nombre</th>
            <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Correo Electrónico</th>
            <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-100 transition-colors">
              <td className="py-3 px-4 text-gray-800">{user.name}</td>
              <td className="py-3 px-4 text-gray-800">{user.email}</td>
              <td className="py-3 px-4">
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;