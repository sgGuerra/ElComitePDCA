import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const ProcessList = () => {
  const [processes, setProcesses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newProcess, setNewProcess] = useState({ nombre: '' });
  const [editProcess, setEditProcess] = useState(null);
  const [errors, setErrors] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/procesos')
      .then((response) => response.json())
      .then((data) => setProcesses(data))
      .catch((error) => console.error('Error al obtener los procesos:', error));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editProcess) {
      setEditProcess({ ...editProcess, [name]: value });
    } else {
      setNewProcess({ ...newProcess, [name]: value });
    }
    setErrors('');
  };

  const validateForm = () => {
    if (!newProcess.nombre.trim() && !editProcess?.nombre.trim()) {
      setErrors('El nombre es obligatorio.');
      return false;
    }
    return true;
  };

  const handleAddProcess = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    fetch('http://localhost:5000/api/procesos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProcess, estado: 'En proceso' }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Error al crear el proceso');
        return response.json();
      })
      .then((data) => {
        setProcesses([...processes, { id: data.id, ...newProcess, acciones: 0 }]);
        setNewProcess({ nombre: '' });
        setShowForm(false);
        setSuccessMessage('¡Proceso creado exitosamente!');
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch((error) => {
        console.error('Error al crear el proceso:', error);
        setErrors('Hubo un error al crear el proceso.');
      });
  };

  const handleEditProcess = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    fetch(`http://localhost:5000/api/procesos/${editProcess.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editProcess),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Error al editar el proceso');
        return response.json();
      })
      .then(() => {
        setProcesses(
          processes.map((process) =>
            process.id === editProcess.id ? editProcess : process
          )
        );
        setEditProcess(null);
        setShowEditForm(false);
        setSuccessMessage('¡Proceso editado exitosamente!');
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch((error) => {
        console.error('Error al editar el proceso:', error);
        setErrors('Hubo un error al editar el proceso.');
      });
  };

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <Header
        activeTab="Procesos"
        setActiveTab={() => {}}
        tabs={['Resumen', 'Procesos']}
      />
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-primary">Lista de Procesos</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90"
          >
            Crear Proceso
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-md mb-4">
            {successMessage}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Nombre</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Planes de mejoramiento asignados</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((process, index) => (
                <tr
                  key={process.id}
                  className={`${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-gray-100 transition-colors`}
                >
                  <td className="py-3 px-4 text-gray-800">
                    <Link
                      to={`/procesos/${process.id}/acciones`}
                      className="text-primary hover:underline"
                    >
                      {process.nombre}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-800">{process.acciones || 0}</td>
                  <td className="py-3 px-4 space-x-2">
                    <button
                      onClick={() => {
                        setEditProcess(process);
                        setShowEditForm(true);
                      }}
                      className="text-sm text-blue-500 hover:underline"
                    >
                      Editar
                    </button>
                    <button className="text-sm text-red-500 hover:underline">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Formulario para crear un nuevo proceso */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
              <h3 className="text-lg font-semibold text-primary mb-4">Crear Proceso</h3>
              <form onSubmit={handleAddProcess} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Proceso</label>
                  <input
                    type="text"
                    name="nombre"
                    value={newProcess.nombre}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors && <p className="text-red-500 text-xs mt-1">{errors}</p>}
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Formulario para editar un proceso */}
        {showEditForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
              <h3 className="text-lg font-semibold text-primary mb-4">Editar Proceso</h3>
              <form onSubmit={handleEditProcess} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Proceso</label>
                  <input
                    type="text"
                    name="nombre"
                    value={editProcess?.nombre || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors && <p className="text-red-500 text-xs mt-1">{errors}</p>}
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessList;