import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingOverlay from './LoadingOverlay';

// The `roleRequired` prop now implicitly checks against the user's *active* role
// because `user.role` from AuthContext is the active role.
const ProtectedRoute = ({ roleRequired = null }) => {
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

  // If a specific active role is required and the user's current active role doesn't match,
  // redirect to dashboard (or an unauthorized page).
  if (roleRequired && user.role !== roleRequired) {
    // Optional: Log for debugging
    // console.log(`Redirecting: User active role '${user.role}' does not match required active role '${roleRequired}'`);
    return <Navigate to="/dashboard" replace />; 
  }

  // If authenticated and has the required role, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
