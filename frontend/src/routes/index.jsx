import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ProcessList from '../pages/ProcessList';
import Actions from '../pages/ActionsList';
import ActionDetail from '../pages/ActionDetail';
import AdminPanel from '../pages/AdminPanel';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/procesos" element={<ProcessList />} />
      <Route path="/procesos/:processId/acciones" element={<Actions />} />
      <Route path="/procesos/:processId/acciones/:actionId" element={<ActionDetail />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}
