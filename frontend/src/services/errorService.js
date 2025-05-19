// Error handling service for consistent error management across the application

/**
 * Format and handle API errors
 * @param {Error} error - The error object from API calls
 * @param {string} fallbackMessage - A fallback message if error details aren't available
 * @returns {string} Formatted error message
 */
const formatApiError = (error, fallbackMessage = 'Ha ocurrido un error. Por favor, inténtelo de nuevo.') => {
  if (error.response && error.response.data) {
    const { message, errors } = error.response.data;
    
    // Return specific error message from API if available
    if (message) return message;
    
    // Handle validation errors (array of errors)
    if (errors && Array.isArray(errors) && errors.length > 0) {
      return errors.map(err => err.message || err).join('. ');
    }
  }
  
  // Use error message if available, otherwise fallback
  return error.message || fallbackMessage;
};

/**
 * Handle form validation errors from backend
 * @param {Object} error - The error response from API
 * @returns {Object|null} Object with field names as keys and error messages as values, or null
 */
const handleValidationErrors = (error) => {
  if (error.response && error.response.data && error.response.data.errors) {
    const { errors } = error.response.data;
    
    // Create an object with field names as keys and error messages as values
    if (Array.isArray(errors)) {
      const validationErrors = {};
      
      errors.forEach(err => {
        if (err.field) {
          validationErrors[err.field] = err.message;
        }
      });
      
      return Object.keys(validationErrors).length > 0 ? validationErrors : null;
    }
    
    // If errors is already an object with field names as keys
    if (typeof errors === 'object') {
      return errors;
    }
  }
  
  return null;
};

/**
 * Check if error is an authentication error (401)
 * @param {Object} error - The error object
 * @returns {boolean} True if it's an auth error
 */
const isAuthError = (error) => {
  return error.response && error.response.status === 401;
};

/**
 * Check if error is a permission error (403)
 * @param {Object} error - The error object
 * @returns {boolean} True if it's a permission error
 */
const isPermissionError = (error) => {
  return error.response && error.response.status === 403;
};

/**
 * Check if error is a not found error (404)
 * @param {Object} error - The error object
 * @returns {boolean} True if it's a not found error
 */
const isNotFoundError = (error) => {
  return error.response && error.response.status === 404;
};

const errorService = {
  formatApiError,
  handleValidationErrors,
  isAuthError,
  isPermissionError,
  isNotFoundError
};

export default errorService;