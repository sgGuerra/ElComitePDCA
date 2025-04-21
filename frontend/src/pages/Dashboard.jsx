import React, { useState } from 'react';
import { FaBell, FaCog, FaUserCircle, FaRegClock, FaRegCheckCircle, FaPlus } from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import Header from '../components/Header';
import Procesos from './ProcessList';

const pieChartData = [
  { name: 'Auditorías Internas', value: 40, fill: '#143261' },
  { name: 'Auditorías Externas', value: 30, fill: '#6b7280' },
  { name: 'Encuestas', value: 20, fill: '#a0aec0' },
  { name: 'Eventos Adversos', value: 10, fill: '#cbd5e0' },
];

const barChartData = [
  { name: 'Ene', uv: 4, pv: 7 }, { name: 'Feb', uv: 3, pv: 8 },
  { name: 'Mar', uv: 2, pv: 9 }, { name: 'Abr', uv: 2.7, pv: 6 },
  { name: 'May', uv: 1.8, pv: 8 }, { name: 'Jun', uv: 2.3, pv: 5 },
  { name: 'Jul', uv: 3.4, pv: 7 }, { name: 'Ago', uv: 2.5, pv: 9 },
  { name: 'Sep', uv: 3.2, pv: 8 }, { name: 'Oct', uv: 1.9, pv: 6 },
  { name: 'Nov', uv: 2.8, pv: 7 }, { name: 'Dic', uv: 4.1, pv: 10 },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Resumen');

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={['Resumen', 'Procesos']}
      />

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

      {activeTab === 'Procesos' && <Procesos />}
    </div>
  );
};

export default Dashboard;
