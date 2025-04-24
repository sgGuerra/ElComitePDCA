import React, { useState } from 'react';
import Header from '../components/Header';
import UserManagement from '../components/UserManagement';


const AdminPanel = () => {
  const [view, setView] = useState('main'); // Estado para alternar vistas

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <Header
        activeTab="Admin Panel"
        setActiveTab={() => {}}
        tabs={['Resumen', 'Procesos']}
      />

      {view === 'main' && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h1 className="text-2xl font-semibold text-primary">Panel de Administración</h1>
          <p className="text-gray-700">
            Bienvenido al panel de administración. Aquí puedes gestionar usuarios, roles y configuraciones del sistema.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-lightgray p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-primary">Gestión de Usuarios</h2>
              <p className="text-sm text-gray-600">Añade, edita o elimina usuarios del sistema.</p>
              <button
                onClick={() => setView('userManagement')} // Cambiar a la vista de gestión de usuarios
                className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Gestionar Usuarios
              </button>
            </div>
            <div className="bg-lightgray p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-primary">Configuraciones</h2>
              <p className="text-sm text-gray-600">Ajusta las configuraciones generales del sistema.</p>
              <button className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                Configurar Sistema
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'userManagement' && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <button
            onClick={() => setView('main')} // Volver a la vista principal
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Volver al Panel de Administración
          </button>
          <UserManagement />
        </div>
      )}
    </div>
  );
};

export default AdminPanel;