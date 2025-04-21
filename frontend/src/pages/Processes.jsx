import React, { useState } from 'react';
import { FaUserPlus, FaCalendarAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const Procesos = () => {
  const [procesosData, setProcesosData] = useState([
    {
      id: 1,
      nombre: 'Mejora en atención al cliente',
      lider: 'Juan Pérez',
      origen: 'Auditoría Interna',
      fechaInicio: '2025-04-01',
      fechaVencimiento: '2025-04-30',
      meta: 'Mejorar la calidad del servicio',
      que: 'Fallas en la atención al cliente',
      porQue: 'Incrementar la satisfacción del cliente',
      como: 'Capacitación al personal',
      donde: 'Departamento de atención al cliente',
      estado: 'En proceso',
    },
    {
      id: 2,
      nombre: 'Optimización de tiempos de espera',
      lider: 'María López',
      origen: 'Encuesta',
      fechaInicio: '2025-03-01',
      fechaVencimiento: '2025-03-31',
      meta: 'Reducir tiempos de espera',
      que: 'Largas filas en recepción',
      porQue: 'Optimizar recursos',
      como: 'Implementar turnos digitales',
      donde: 'Recepción principal',
      estado: 'Completado',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newProceso, setNewProceso] = useState({
    nombre: '',
    lider: '',
    origen: '',
    fechaInicio: '',
    fechaVencimiento: '',
    meta: '',
    que: '',
    porQue: '',
    como: '',
    donde: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProceso({ ...newProceso, [name]: value });
  };

  const handleAddProceso = (e) => {
    e.preventDefault();
    if (!newProceso.nombre || !newProceso.lider || !newProceso.origen || !newProceso.fechaInicio || !newProceso.fechaVencimiento) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }
    setProcesosData([
      ...procesosData,
      { id: procesosData.length + 1, ...newProceso },
    ]);
    setNewProceso({
      nombre: '',
      lider: '',
      origen: '',
      fechaInicio: '',
      fechaVencimiento: '',
      meta: '',
      que: '',
      porQue: '',
      como: '',
      donde: '',
    });
    setShowForm(false);
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
          <h2 className="text-xl font-semibold text-primary">Procesos</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90"
          >
            Crear Proceso
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Nombre</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Líder</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Origen</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Fecha Inicio</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Fecha Vencimiento</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Meta</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Estado</th>
              </tr>
            </thead>
            <tbody>
              {procesosData.map((proceso, index) => (
                <tr
                  key={proceso.id}
                  className={`${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-gray-100 transition-colors`}
                >
                  <td className="py-3 px-4 text-gray-800">
                    <Link
                      to={`/procesos/${proceso.id}`}
                      className="text-primary hover:underline"
                    >
                      {proceso.nombre}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-800">{proceso.lider}</td>
                  <td className="py-3 px-4 text-gray-800">{proceso.origen}</td>
                  <td className="py-3 px-4 text-gray-800">{proceso.fechaInicio}</td>
                  <td className="py-3 px-4 text-gray-800">{proceso.fechaVencimiento}</td>
                  <td className="py-3 px-4 text-gray-800">{proceso.meta}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        proceso.estado === 'Completado'
                          ? 'bg-green-100 text-green-700'
                          : proceso.estado === 'En proceso'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {proceso.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-[90%] max-w-4xl">
              <h3 className="text-lg font-semibold text-primary mb-6">Nombre del plan de mejora</h3>
              <form onSubmit={handleAddProceso} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Nombre del proceso</label>
                  <input
                    type="text"
                    name="nombre"
                    value={newProceso.nombre}
                    onChange={handleInputChange}
                    placeholder="Nombre del proceso"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Líder de proceso</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="lider"
                      value={newProceso.lider}
                      onChange={handleInputChange}
                      placeholder="Asignar líder de proceso"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <FaUserPlus className="absolute top-3 right-3 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Origen</label>
                  <select
                    name="origen"
                    value={newProceso.origen}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="">Seleccionar la fuente del hallazgo</option>
                    <option value="Auditoría Interna">Auditoría Interna</option>
                    <option value="Auditoría Externa">Auditoría Externa</option>
                    <option value="Encuesta">Encuesta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de inicio</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="fechaInicio"
                      value={newProceso.fechaInicio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <FaCalendarAlt className="absolute top-3 right-3 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de vencimiento</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="fechaVencimiento"
                      value={newProceso.fechaVencimiento}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <FaCalendarAlt className="absolute top-3 right-3 text-gray-400" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Meta de la acción</label>
                  <textarea
                    name="meta"
                    value={newProceso.meta}
                    onChange={handleInputChange}
                    placeholder="Describir los aspectos a mejorar con la implementación"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Qué?</label>
                  <input
                    type="text"
                    name="que"
                    value={newProceso.que}
                    onChange={handleInputChange}
                    placeholder="Defina los problemas o fallas de calidad"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Por qué?</label>
                  <input
                    type="text"
                    name="porQue"
                    value={newProceso.porQue}
                    onChange={handleInputChange}
                    placeholder="Defina las razones por las cuales las eligió"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Cómo?</label>
                  <input
                    type="text"
                    name="como"
                    value={newProceso.como}
                    onChange={handleInputChange}
                    placeholder="Acciones de mejoramiento"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Dónde?</label>
                  <input
                    type="text"
                    name="donde"
                    value={newProceso.donde}
                    onChange={handleInputChange}
                    placeholder="Proceso responsable de la implementación"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cerrar
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
      </div>
    </div>
  );
};

export default Procesos;