// src/pages/NotFound.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaArrowLeft, FaSearch } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-lightgray flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-serif font-semibold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mt-2">Página no encontrada</h2>
        </div>
        
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        
        <div className="space-y-3">
          <Link 
            to="/dashboard" 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            <FaHome />
            <span>Ir al Inicio</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <FaArrowLeft />
            <span>Volver atrás</span>
          </button>
          
          <div className="relative mt-8">
            <input
              type="text"
              placeholder="Buscar en El Comité..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-gray-500 text-sm">
        <a href="mailto:soporte@elcomite.com" className="hover:text-primary">
          ¿Necesitas ayuda? Contacta a soporte.
        </a>
      </div>
    </div>
  );
};

export default NotFound;
