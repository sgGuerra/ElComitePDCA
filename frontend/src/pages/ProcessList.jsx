import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const ProcessList = () => {
  const [processes, setProcesses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newProcess, setNewProcess] = useState({ name: '', description: '' });
  const [editProcess, setEditProcess] = useState(null);
  const [errors, setErrors] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/processes', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setProcesses(data.data || []));
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
    const process = editProcess || newProcess;
    if (!process.name.trim()) {
      setErrors('El nombre es obligatorio.');
      return false;
    }
    return true;
  };

  const handleAddProcess = async (e) => {
    e.preventDefault();
    setErrors('');
    if (!validateForm()) return;

    try {
      const res = await fetch('http://localhost:5000/api/processes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newProcess)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProcesses([...processes, data.data]);
        setShowForm(false);
        setNewProcess({ name: '', description: '' });
        setSuccessMessage('¡Proceso creado exitosamente!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors(data.message || 'Error al crear el proceso.');
      }
    } catch (error) {
      setErrors('Error de red al crear el proceso.');
    }
  };

  const handleEditProcess = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    fetch(`http://localhost:5000/api/processes/${editProcess.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: editProcess.name,
        description: editProcess.description
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setProcesses(
            processes.map((process) =>
              process.id === editProcess.id ? { ...process, ...editProcess } : process
            )
          );
          setEditProcess(null);
          setShowEditForm(false);
          setSuccessMessage('¡Proceso editado exitosamente!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setErrors(data.message || 'Hubo un error al editar el proceso.');
        }
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
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Descripción</th>
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
                      {process.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-800">{process.description || ''}</td>
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
                    {/* Aquí puedes agregar el botón Eliminar si lo necesitas */}
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
                    name="name"
                    value={newProcess.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <input
                    type="text"
                    name="description"
                    value={newProcess.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
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
                    name="name"
                    value={editProcess?.name || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <input
                    type="text"
                    name="description"
                    value={editProcess?.description || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
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