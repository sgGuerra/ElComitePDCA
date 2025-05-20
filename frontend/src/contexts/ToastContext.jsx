// src/contexts/ToastContext.jsx

import React, { createContext, useState, useContext, useCallback } from 'react';
import ToastContainer from '../components/Toast';

// Create context
const ToastContext = createContext();

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

/**
 * Toast Provider component
 * Manages toast notifications and provides methods to show/hide them
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a new toast notification
   * 
   * @param {string} message - Toast message to display
   * @param {string} type - Toast type (success, error, info, warning)
   * @param {number} duration - Duration in ms before auto-closing (0 for no auto-close)
   * @returns {string} Toast ID
   */
  const addToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };
    
    setToasts(prevToasts => [...prevToasts, newToast]);
    
    return id;
  }, []);

  /**
   * Remove a toast notification by ID
   * 
   * @param {string} id - Toast ID to remove
   */
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  /**
   * Show a success toast notification
   * 
   * @param {string} message - Toast message
   * @param {number} duration - Duration in ms
   * @returns {string} Toast ID
   */
  const success = useCallback((message, duration = 6000) => 
    addToast(message, TOAST_TYPES.SUCCESS, duration), [addToast]);
  
  /**
   * Show an error toast notification
   * 
   * @param {string} message - Toast message
   * @param {number} duration - Duration in ms
   * @returns {string} Toast ID
   */
  const error = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.ERROR, duration), [addToast]);
  
  /**
   * Show an info toast notification
   * 
   * @param {string} message - Toast message
   * @param {number} duration - Duration in ms
   * @returns {string} Toast ID
   */
  const info = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.INFO, duration), [addToast]);
  
  /**
   * Show a warning toast notification
   * 
   * @param {string} message - Toast message
   * @param {number} duration - Duration in ms
   * @returns {string} Toast ID
   */
  const warning = useCallback((message, duration) => 
    addToast(message, TOAST_TYPES.WARNING, duration), [addToast]);

  // Context value to be provided to consumers
  const contextValue = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * Custom hook to use toast notifications
 * 
 * @returns {Object} Toast context methods and values
 * @throws {Error} If used outside ToastProvider
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
