import { FaBell, FaCog, FaUserCircle } from 'react-icons/fa';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F1F3F7] text-[#143261] font-sans p-4 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-8">
          <h1 className="text-3xl font-serif font-bold">El Comité</h1>
          <nav className="space-x-4">
            <button className="px-3 py-1 rounded-full bg-[#143261] text-white font-semibold">Resumen</button>
            <button className="px-3 py-1 rounded-full hover:bg-gray-200">Procesos</button>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <button className="border border-[#143261] px-3 py-1 rounded-md text-sm">Admin Panel</button>
          <FaBell className="text-lg relative">
            {/* Notificaciones */}
          </FaBell>
          <FaCog className="text-lg" />
          <FaUserCircle className="text-2xl" />
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Último registro realizado */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Último registro realizado</h2>
          <p className="text-sm">por Nombre Apellido hace X días / horas</p>

          <div>
            <p className="text-sm font-medium">Porcentaje de cumplimiento <span className="ml-2">30%</span></p>
            <div className="w-full bg-gray-300 rounded-full h-2 mt-1">
              <div className="bg-[#143261] h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
            <p className="text-sm mt-1 text-[#143261]">En proceso</p>
          </div>

          <div>
            <h3 className="font-semibold">Observaciones o descripción</h3>
            <p className="text-sm text-justify">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
            </p>
          </div>
        </div>

        {/* Gráficas*/}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">Vista global</h2>
            <div className="flex flex-col items-center justify-center">
              <div className="w-40 h-40 bg-gray-200 rounded-full mb-4" />
              <ul className="text-sm list-disc ml-6 space-y-1">
                <li>Auditorías Internas de Calidad</li>
                <li>Auditorías Externas</li>
                <li>PQR</li>
                <li>Encuestas de Satisfacción</li>
                <li>Resultado de Indicadores</li>
                <li>Eventos Adversos</li>
                <li>Rondas de Seguridad</li>
                <li>Inspecciones</li>
              </ul>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">Resumen anual</h2>
            {/* Placeholder para el gráfico de barras */}
            <div className="w-full h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Importantes */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-[#143261] mb-4">Importantes</h2>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-2">A punto de vencer</h3>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#F1F3F7] rounded-md px-3 py-2 my-1 flex items-center justify-between">
                <span>Elemento {i + 1}</span>
                <span className="text-lg">⏱</span>
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Completados</h3>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#F1F3F7] rounded-md px-3 py-2 my-1 flex items-center justify-between">
                <span>Elemento {i + 1}</span>
                <span className="text-lg">✅</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
