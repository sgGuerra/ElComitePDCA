import React from 'react';

const LoadingOverlay = ({ loading, message = "Cargando..." }) => {
  if (!loading) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-primary font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;