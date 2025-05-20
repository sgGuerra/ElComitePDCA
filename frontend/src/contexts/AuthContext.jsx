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
      await authService.login(email, password);
      const loggedInUser = authService.getCurrentUser();
      setUser(loggedInUser);
      setLoading(false);
      return loggedInUser;
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

  const updateUserProfile = (updatedProfileData) => {
    const currentUser = authService.getCurrentUser();
    const updatedUser = { ...currentUser, ...updatedProfileData };
    setUser(updatedUser);
    authService.updateCurrentUser(updatedUser);
  };

  const switchRole = async (newActiveRole) => {
    try {
      setLoading(true);
      const updatedUser = await authService.switchRole(newActiveRole);
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
