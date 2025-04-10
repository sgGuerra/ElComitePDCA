import React, { useState } from 'react';
import { FaBell, FaCog, FaUserCircle, FaRegClock, FaRegCheckCircle, FaPlus } from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const pieChartData = [
  { name: 'Auditorías Internas', value: 400, fill: '#143261' },
  { name: 'Auditorías Externas', value: 300, fill: '#6b7280' },
  { name: 'Encuestas', value: 200, fill: '#a0aec0' },
  { name: 'Eventos Adversos', value: 100, fill: '#cbd5e0' },
];

const barChartData = [
  { name: 'Ene', uv: 4, pv: 7 }, { name: 'Feb', uv: 3, pv: 8 },
  { name: 'Mar', uv: 2, pv: 9 }, { name: 'Abr', uv: 2.7, pv: 6 },
  { name: 'May', uv: 1.8, pv: 8 }, { name: 'Jun', uv: 2.3, pv: 5 },
  { name: 'Jul', uv: 3.4, pv: 7 }, { name: 'Ago', uv: 2.5, pv: 9 },
  { name: 'Sep', uv: 3.2, pv: 8 }, { name: 'Oct', uv: 1.9, pv: 6 },
  { name: 'Nov', uv: 2.8, pv: 7 }, { name: 'Dic', uv: 4.1, pv: 10 },
];

const procesosData = [
  { id: 1, nombre: 'Auditoría Interna', estado: 'En proceso', fecha: '2025-04-08' },
  { id: 2, nombre: 'Encuesta de satisfacción', estado: 'Completado', fecha: '2025-03-22' },
  { id: 3, nombre: 'Evaluación anual', estado: 'Pendiente', fecha: '2025-04-30' },
  { id: 4, nombre: 'Reporte financiero', estado: 'Completado', fecha: '2025-03-15' },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Resumen');

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-6">
        <nav className="flex space-x-2">
          {['Resumen', 'Procesos'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150 ${
                activeTab === tab ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-3xl font-serif font-bold text-primary hidden md:block">El Comité</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button className="border border-primary text-primary px-3 py-1 rounded-md text-sm font-medium hover:bg-primary/10">
            Admin Panel
          </button>
          <div className="relative">
            <FaBell className="text-xl text-gray-600 hover:text-primary cursor-pointer" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
          </div>
          <FaCog className="text-xl text-gray-600 hover:text-primary cursor-pointer" />
          <FaUserCircle className="text-3xl text-gray-400 hover:text-primary cursor-pointer" />
        </div>
      </header>

      {activeTab === 'Resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-primary">Último registro realizado</h2>
              <button className="flex items-center space-x-2 text-sm text-primary hover:underline">
                <FaPlus className="text-xs" />
                <span>Nuevo Registro</span>
              </button>
            </div>
            <p className="text-xs text-gray-500">por Nombre Apellido hace 2 días</p>

            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-gray-700">Porcentaje de cumplimiento</p>
                <span className="text-sm font-bold text-primary">30%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '30%' }}></div>
              </div>
              <p className="text-xs mt-1.5 text-primary font-medium">En proceso</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Observaciones o descripción</h3>
              <p className="text-sm text-gray-600 text-justify leading-relaxed">
                Este es un ejemplo de observación detallada de los últimos procesos realizados en la plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm pt-2">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">A punto de vencer</h3>
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={`vencer-${i}`} className="bg-lightgray rounded-md px-3 py-2.5 flex items-center justify-between hover:shadow-sm">
                      <span className="text-xs text-gray-700">Elemento {i + 1}</span>
                      <FaRegClock className="text-lg text-orange-500" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Completados</h3>
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={`completado-${i}`} className="bg-lightgray rounded-md px-3 py-2.5 flex items-center justify-between hover:shadow-sm">
                      <span className="text-xs text-gray-700">Elemento {i + 1}</span>
                      <FaRegCheckCircle className="text-lg text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 grid grid-rows-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-lg font-semibold text-primary mb-2">Vista global</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieChartData} dataKey="value" outerRadius={80} label>
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow space-y-3">
              <h2 className="text-lg font-semibold text-primary">Resumen anual</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" stroke="#4B5563" fontSize={10} />
                  <YAxis stroke="#4B5563" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="pv" stackId="a" fill="#143261" />
                  <Bar dataKey="uv" stackId="a" fill="#a0aec0" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-lg font-semibold text-primary">Indicadores Clave</h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Reporte mensual de cumplimiento</li>
              <li>Comparativo con el año anterior</li>
              <li>Evaluación por comité</li>
              <li>Documentación validada</li>
              <li>Alertas activas</li>
            </ul>
            <div className="text-xs text-gray-500 mt-2">Actualizado el 10 de abril, 2025</div>
          </div>
        </div>
      )}

      {activeTab === 'Procesos' && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold text-primary">Procesos</h2>
          <table className="min-w-full text-sm mt-4">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="py-2 px-4">Nombre</th>
                <th className="py-2 px-4">Estado</th>
                <th className="py-2 px-4">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {procesosData.map((proceso) => (
                <tr key={proceso.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-4 text-gray-800">{proceso.nombre}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      proceso.estado === 'Completado' ? 'bg-green-100 text-green-700' :
                      proceso.estado === 'En proceso' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {proceso.estado}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-gray-500">{proceso.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
