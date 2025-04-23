import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const ActionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proceso, setProceso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [observaciones, setObservaciones] = useState([]);
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [archivos, setArchivos] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/procesos/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al obtener los detalles del proceso.');
        }
        return response.json();
      })
      .then((data) => {
        setProceso(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudo cargar el proceso.');
        setLoading(false);
      });
  }, [id]);

  const handleAddObservacion = () => {
    if (nuevaObservacion.trim()) {
      const updatedObservaciones = [...observaciones, nuevaObservacion];
      setObservaciones(updatedObservaciones);
      setNuevaObservacion('');

      // Enviar las observaciones actualizadas al backend
      fetch(`http://localhost:5000/api/procesos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ observaciones: updatedObservaciones, archivos }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Error al actualizar las observaciones");
          }
          return response.json();
        })
        .then(() => {
          console.log("Observaciones actualizadas exitosamente");
        })
        .catch((error) => {
          console.error("Error al actualizar las observaciones:", error);
        });
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const updatedArchivos = [...archivos, ...uploadedFiles.map((file) => file.name)];
    setArchivos(updatedArchivos);

    // Enviar los archivos actualizados al backend
    fetch(`http://localhost:5000/api/procesos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ observaciones, archivos: updatedArchivos }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al actualizar los archivos");
        }
        return response.json();
      })
      .then(() => {
        console.log("Archivos actualizados exitosamente");
      })
      .catch((error) => {
        console.error("Error al actualizar los archivos:", error);
      });
  };

  if (loading) {
    return <div className="text-center mt-10">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="text-center mt-10 text-red-500">
        {error}
        <button
          onClick={() => navigate('/procesos')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Volver a la lista de procesos
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lightgray text-primary font-sans p-4 md:p-6 lg:p-8 space-y-6">
      <Header
        activeTab="Procesos"
        setActiveTab={() => {}}
        tabs={['Resumen', 'Procesos']}
      />
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-semibold text-primary">Detalles del Proceso</h1>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Nombre</h2>
            <p className="text-gray-800">{proceso.nombre}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Líder</h2>
            <p className="text-gray-800">{proceso.lider}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Origen</h2>
            <p className="text-gray-800">{proceso.origen}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Fecha de Inicio</h2>
            <p className="text-gray-800">{proceso.fechaInicio}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Fecha de Vencimiento</h2>
            <p className="text-gray-800">{proceso.fechaVencimiento}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Meta</h2>
            <p className="text-gray-800">{proceso.meta}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">¿Qué?</h2>
            <p className="text-gray-800">{proceso.que}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">¿Por qué?</h2>
            <p className="text-gray-800">{proceso.porQue}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">¿Cómo?</h2>
            <p className="text-gray-800">{proceso.como}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">¿Dónde?</h2>
            <p className="text-gray-800">{proceso.donde}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Estado</h2>
            <p
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                proceso.estado === 'Completado'
                  ? 'bg-green-100 text-green-700'
                  : proceso.estado === 'En proceso'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {proceso.estado}
            </p>
          </div>
        </div>

        {/* Observaciones */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700">Observaciones</h2>
          <ul className="list-disc pl-5 space-y-2">
            {observaciones.map((obs, index) => (
              <li key={index} className="text-gray-800">{obs}</li>
            ))}
          </ul>
          <div className="mt-4">
            <textarea
              value={nuevaObservacion}
              onChange={(e) => setNuevaObservacion(e.target.value)}
              placeholder="Añadir una nueva observación"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <button
              onClick={handleAddObservacion}
              className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Añadir Observación
            </button>
          </div>
        </div>

        {/* Archivos Adjuntos */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700">Archivos Adjuntos</h2>
          <ul className="list-disc pl-5 space-y-2">
            {archivos.map((file, index) => (
              <li key={index} className="text-gray-800">{file}</li>
            ))}
          </ul>
          <div className="mt-4">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
        </div>

        <button
          onClick={() => navigate('/procesos')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Volver a la lista de procesos
        </button>
      </div>
    </div>
  );
};

export default ActionDetail;