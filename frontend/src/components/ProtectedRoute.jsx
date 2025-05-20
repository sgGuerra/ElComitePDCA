import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingOverlay from './LoadingOverlay';

const ProtectedRoute = ({ adminOnly = false, roleRequired = null }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return <LoadingOverlay loading={true} message="Verificando autenticación..." />;
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires admin privilege and user is not admin (legacy support)
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // If route requires a specific role
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and has the required role, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
