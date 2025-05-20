import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = await authService.login(email, password);
      // Create a user object from the response data
      const user = {
        id: data.user_id,
        role: data.user_role
      };
      setUser(user);
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    authService.updateCurrentUser(updatedUser);
  };

  const switchRole = async (role) => {
    try {
      setLoading(true);
      const updatedUser = await authService.switchRole(role);
      setUser(updatedUser);
      setLoading(false);
      return updatedUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUserProfile,
    switchRole,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
