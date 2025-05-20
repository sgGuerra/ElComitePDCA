// src/routes/index.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout Components
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ProcessList from '../pages/ProcessList';
import ActionsList from '../pages/ActionsList';
import ActionDetail from '../pages/ActionDetail';
import ProcessStatistics from '../pages/ProcessStatistics';
import AdminPanel from '../pages/AdminPanel';
import AuditorPanel from '../pages/AuditorPanel';
import NotFound from '../pages/NotFound';
import UserProfile from '../pages/UserProfile';

/**
 * Main application routing
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected routes - require authentication */}
      <Route element={<ProtectedRoute />}>
        {/* Main routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/procesos" element={<ProcessList />} />
        <Route path="/perfil" element={<UserProfile />} />
        
        {/* Process routes */}
        <Route path="/procesos/:processId/acciones" element={<ActionsList />} />
        <Route path="/procesos/:processId/acciones/:actionId" element={<ActionDetail />} />
        <Route path="/procesos/:processId/estadisticas" element={<ProcessStatistics />} />
      </Route>

      {/* Admin routes - require admin role */}
      <Route element={<ProtectedRoute roleRequired="admin" />}>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/:section" element={<AdminPanel />} />
      </Route>

      {/* Auditor routes - require auditor role */}
      <Route element={<ProtectedRoute roleRequired="auditor" />}>
        <Route path="/auditor" element={<AuditorPanel />} />
      </Route>

      {/* Fallback route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
