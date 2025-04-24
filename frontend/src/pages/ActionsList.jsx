import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaCalendarAlt } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';


const Actions = () => {
  const { processId } = useParams();
  const [actionsData, setActionsData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newAction, setNewAction] = useState({
    nombre: '',
    lider: '',
    origen: '',
    hallazgo: '',
    fechaOrigen: '',
    que: '',
    porQue: '',
    como: '',
    meta: '',
    tipoAccion: '',
    donde: '',
    fechaInicio: '',
    fechaVencimiento: '',
    atributoCalidad: '',
    estado: 'En proceso',
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAction({ ...newAction, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];
    const minYear = 1972;
  
    if (!newAction.nombre) newErrors.nombre = 'El nombre es obligatorio.';
    if (!newAction.lider) newErrors.lider = 'El líder es obligatorio.';
    if (!newAction.origen) newErrors.origen = 'El origen es obligatorio.';
    if (!newAction.hallazgo) newErrors.hallazgo = 'El hallazgo es obligatorio.';
    if (!newAction.que) newErrors.que = 'El campo "¿Qué?" es obligatorio.';
    if (!newAction.porQue) newErrors.porQue = 'El campo "¿Por Qué?" es obligatorio.';
    if (!newAction.como) newErrors.como = 'El campo "¿Cómo?" es obligatorio.';
    if (!newAction.meta) newErrors.meta = 'La meta es obligatoria.';
    if (!newAction.tipoAccion) newErrors.tipoAccion = 'El tipo de acción es obligatorio.';
    if (!newAction.donde) newErrors.donde = 'El campo "¿Dónde?" es obligatorio.';
    if (!newAction.atributoCalidad) newErrors.atributoCalidad = 'El atributo de calidad es obligatorio.';
  
    if (!newAction.fechaOrigen) {
      newErrors.fechaOrigen = 'La fecha de origen es obligatoria.';
    } else {
      const year = new Date(newAction.fechaOrigen).getFullYear();
      if (year < minYear) {
        newErrors.fechaOrigen = `El año de la fecha de origen debe ser mínimo ${minYear}.`;
      } else if (newAction.fechaOrigen > today) {
        newErrors.fechaOrigen = 'La fecha de origen no puede ser mayor al día de hoy.';
      }
    }
  
    if (!newAction.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria.';
    } else if (newAction.fechaInicio < today) {
      newErrors.fechaInicio = 'La fecha de inicio debe ser igual o mayor al día de hoy.';
    }
  
    if (!newAction.fechaVencimiento) {
      newErrors.fechaVencimiento = 'La fecha de vencimiento es obligatoria.';
    } else if (newAction.fechaVencimiento < newAction.fechaInicio) {
      newErrors.fechaVencimiento = 'La fecha de vencimiento debe ser igual o mayor a la fecha de inicio.';
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/processes/${processId}/actions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setActionsData(data.data));
  }, []);

  const handleAddAction = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/processes/${processId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          leader_id: newAction.lider,
          name: newAction.nombre,
          origin: newAction.origen,
          start_date: newAction.fechaInicio,
          due_date: newAction.fechaVencimiento,
          goal: newAction.meta,
          what: newAction.que,
          why: newAction.porQue,
          how: newAction.como,
          location: newAction.donde,
          status: newAction.estado,
          type: newAction.tipoAccion
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionsData([...actionsData, data.data]);
        setShowForm(false);
        setSuccessMessage('¡Acción creada exitosamente!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors(data.message || 'Error al crear la acción.');
      }
    } catch (error) {
      setErrors('Error de red al crear la acción.');
    }
  };

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <Header
        activeTab="Planes"
        setActiveTab={() => {}}
        tabs={['Resumen', 'Procesos']}
      />
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-primary">Planes de Mejoramiento Continuo</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90"
          >
            Crear Plan
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
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Líder</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Origen</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Fecha Inicio</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Fecha Vencimiento</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Meta</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200">Estado</th>
              </tr>
            </thead>
            <tbody>
              {actionsData.map((proceso, index) => (
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
            <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-3xl h-[80%] overflow-y-auto">
              <h3 className="text-lg font-semibold text-primary mb-4">Crear Plan de Mejoramiento</h3>
              <form onSubmit={handleAddAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Nombre del plan de mejoramiento</label>
                  <input
                    type="text"
                    name="nombre"
                    value={newAction.nombre}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Líder de proceso</label>
                  <input
                    type="text"
                    name="lider"
                    value={newAction.lider}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.lider ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.lider && <p className="text-red-500 text-xs mt-1">{errors.lider}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Origen</label>
                  <select
                    name="origen"
                    value={newAction.origen}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.origen ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Auditorías Internas de Calidad">Auditorías Internas de Calidad</option>
                    <option value="Auditorias Externas">Auditorias Externas</option>
                    <option value="PQR">PQR</option>
                    <option value="Encuestas de Satisfacción">Encuestas de Satisfacción</option>
                    <option value="Resultado de Indicadores">Resultado de Indicadores</option>
                    <option value="Gestión de Eventos Adversos">Gestión de Eventos Adversos</option>
                    <option value="Rondas de Seguridad">Rondas de Seguridad</option>
                    <option value="Inspecciones de Seguridad">Inspecciones de Seguridad</option>
                  </select>
                  {errors.origen && <p className="text-red-500 text-xs mt-1">{errors.origen}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Hallazgo</label>
                  <textarea
                    name="hallazgo"
                    value={newAction.hallazgo}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.hallazgo ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.hallazgo && <p className="text-red-500 text-xs mt-1">{errors.hallazgo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Origen del Hallazgo</label>
                  <input
                    type="date"
                    name="fechaOrigen"
                    value={newAction.fechaOrigen}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.fechaOrigen ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.fechaOrigen && <p className="text-red-500 text-xs mt-1">{errors.fechaOrigen}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Qué?</label>
                  <input
                    type="text"
                    name="que"
                    value={newAction.que}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.que ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.que && <p className="text-red-500 text-xs mt-1">{errors.que}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Por Qué?</label>
                  <input
                    type="text"
                    name="porQue"
                    value={newAction.porQue}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.porQue ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.porQue && <p className="text-red-500 text-xs mt-1">{errors.porQue}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Cómo?</label>
                  <input
                    type="text"
                    name="como"
                    value={newAction.como}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.como ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.como && <p className="text-red-500 text-xs mt-1">{errors.como}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Meta de la Acción</label>
                  <textarea
                    name="meta"
                    value={newAction.meta}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.meta ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.meta && <p className="text-red-500 text-xs mt-1">{errors.meta}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Acción</label>
                  <select
                    name="tipoAccion"
                    value={newAction.tipoAccion}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.tipoAccion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Preventiva">Preventiva</option>
                    <option value="Correctiva">Correctiva</option>
                    <option value="De mejoramiento">De mejoramiento</option>
                  </select>
                  {errors.tipoAccion && <p className="text-red-500 text-xs mt-1">{errors.tipoAccion}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">¿Dónde?</label>
                  <input
                    type="text"
                    name="donde"
                    value={newAction.donde}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.donde ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.donde && <p className="text-red-500 text-xs mt-1">{errors.donde}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                  <input
                    type="date"
                    name="fechaInicio"
                    value={newAction.fechaInicio}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.fechaInicio ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.fechaInicio && <p className="text-red-500 text-xs mt-1">{errors.fechaInicio}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    name="fechaVencimiento"
                    value={newAction.fechaVencimiento}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.fechaVencimiento ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  />
                  {errors.fechaVencimiento && <p className="text-red-500 text-xs mt-1">{errors.fechaVencimiento}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Atributo de Calidad</label>
                  <select
                    name="atributoCalidad"
                    value={newAction.atributoCalidad}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.atributoCalidad ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-primary focus:border-primary`}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Accesibilidad">Accesibilidad</option>
                    <option value="Continuidad">Continuidad</option>
                    <option value="Integralidad">Integralidad</option>
                    <option value="Mejoramiento">Mejoramiento</option>
                    <option value="Oportunidad">Oportunidad</option>
                    <option value="Pertinencia">Pertinencia</option>
                    <option value="Satisfacción">Satisfacción</option>
                    <option value="Seguridad">Seguridad</option>
                  </select>
                  {errors.atributoCalidad && <p className="text-red-500 text-xs mt-1">{errors.atributoCalidad}</p>}
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

export default Actions;