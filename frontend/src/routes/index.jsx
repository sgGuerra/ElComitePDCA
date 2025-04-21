import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Procesos from '../pages/ProcessList';
import ProcesoDetalle from '../pages/ProcessDetail';
import AdminPanel from '../pages/AdminPanel';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/procesos" element={<Procesos />} />
      <Route path="/procesos/:id" element={<ProcesoDetalle />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}