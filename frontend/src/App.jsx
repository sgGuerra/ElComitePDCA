// src/App.jsx

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AppRoutes from './routes';

/**
 * Main Application Component
 * 
 * Wraps the entire application with necessary providers:
 * - BrowserRouter: For routing functionality
 * - AuthProvider: For authentication state management
 * - ToastProvider: For application notifications
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
