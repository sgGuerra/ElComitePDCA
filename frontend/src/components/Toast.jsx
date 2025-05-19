// src/components/Toast.jsx

import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

/**
 * Individual Toast notification component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.toast - Toast data (id, message, type, duration)
 * @param {Function} props.onClose - Function to call when toast is closed
 * @returns {JSX.Element} Toast component
 */
const Toast = ({ toast, onClose }) => {
  const { id, message, type, duration } = toast;

  // Auto-remove toast after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);
  
  // Get icon and styles based on toast type
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          className: 'bg-green-100 border-l-4 border-green-500 text-green-700',
          icon: <FaCheckCircle className="text-green-500" />
        };
      case 'error':
        return {
          className: 'bg-red-100 border-l-4 border-red-500 text-red-700',
          icon: <FaExclamationCircle className="text-red-500" />
        };
      case 'warning':
        return {
          className: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700',
          icon: <FaExclamationTriangle className="text-yellow-500" />
        };
      case 'info':
      default:
        return {
          className: 'bg-blue-100 border-l-4 border-blue-500 text-blue-700',
          icon: <FaInfoCircle className="text-blue-500" />
        };
    }
  };
  
  const { className, icon } = getToastStyles();
  
  // Add animation classes
  const animationClasses = 'transform transition-all duration-300 ease-in-out';
  
  return (
    <div 
      className={`${className} ${animationClasses} px-4 py-3 rounded shadow-md flex justify-between items-start mb-2`}
      role="alert"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-2">
          {icon}
        </div>
        <div className="mr-2 text-sm font-medium">{message}</div>
      </div>
      <button 
        onClick={() => onClose(id)}
        className="text-gray-500 hover:text-gray-800 focus:outline-none"
        aria-label="Close"
      >
        <FaTimes />
      </button>
    </div>
  );
};

/**
 * Toast container component that displays all active toasts
 * 
 * @param {Object} props - Component props
 * @param {Array} props.toasts - Array of toast objects
 * @param {Function} props.removeToast - Function to remove a toast
 * @returns {JSX.Element|null} Toast container or null if no toasts
 */
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
