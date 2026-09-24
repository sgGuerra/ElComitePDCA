import { describe, it, expect } from 'vitest';
import errorService from './errorService';

describe('errorService', () => {
  // --- formatApiError ---
  describe('formatApiError', () => {
    it('should return the message from error.response.data when available', () => {
      const error = { response: { data: { message: 'Server error occurred' } } };
      expect(errorService.formatApiError(error)).toBe('Server error occurred');
    });

    it('should join validation errors array into a single string', () => {
      const error = {
        response: {
          data: {
            errors: [
              { message: 'Field A is required' },
              { message: 'Field B must be a number' },
            ],
          },
        },
      };
      expect(errorService.formatApiError(error)).toBe('Field A is required. Field B must be a number');
    });

    it('should handle validation errors that are plain strings', () => {
      const error = {
        response: {
          data: {
            errors: ['Error one', 'Error two'],
          },
        },
      };
      expect(errorService.formatApiError(error)).toBe('Error one. Error two');
    });

    it('should return error.message when response.data has no message or errors', () => {
      const error = { message: 'Network Error', response: { data: {} } };
      expect(errorService.formatApiError(error)).toBe('Network Error');
    });

    it('should return fallback message when nothing is available', () => {
      const error = {};
      expect(errorService.formatApiError(error)).toBe('Ha ocurrido un error. Por favor, inténtelo de nuevo.');
    });

    it('should return custom fallback message', () => {
      const error = {};
      expect(errorService.formatApiError(error, 'Custom fallback')).toBe('Custom fallback');
    });

    it('should return error.message when there is no response', () => {
      const error = { message: 'Timeout exceeded' };
      expect(errorService.formatApiError(error)).toBe('Timeout exceeded');
    });

    it('should return fallback for empty errors array', () => {
      const error = { response: { data: { errors: [] } }, message: 'Fallback msg' };
      expect(errorService.formatApiError(error)).toBe('Fallback msg');
    });
  });

  // --- handleValidationErrors ---
  describe('handleValidationErrors', () => {
    it('should return object with field names and messages from array of errors', () => {
      const error = {
        response: {
          data: {
            errors: [
              { field: 'email', message: 'Email is required' },
              { field: 'password', message: 'Password too short' },
            ],
          },
        },
      };
      const result = errorService.handleValidationErrors(error);
      expect(result).toEqual({
        email: 'Email is required',
        password: 'Password too short',
      });
    });

    it('should return null when errors array has no field properties', () => {
      const error = {
        response: {
          data: {
            errors: [{ message: 'General error' }],
          },
        },
      };
      expect(errorService.handleValidationErrors(error)).toBeNull();
    });

    it('should return errors object directly when errors is an object', () => {
      const errorsObj = { name: 'Name is required', age: 'Must be a number' };
      const error = { response: { data: { errors: errorsObj } } };
      expect(errorService.handleValidationErrors(error)).toEqual(errorsObj);
    });

    it('should return null when there are no errors in response', () => {
      const error = { response: { data: {} } };
      expect(errorService.handleValidationErrors(error)).toBeNull();
    });

    it('should return null when there is no response', () => {
      const error = {};
      expect(errorService.handleValidationErrors(error)).toBeNull();
    });
  });

  // --- isAuthError ---
  describe('isAuthError', () => {
    it('should return true for 401 status', () => {
      expect(errorService.isAuthError({ response: { status: 401 } })).toBe(true);
    });

    it('should return false for non-401 status', () => {
      expect(errorService.isAuthError({ response: { status: 403 } })).toBe(false);
    });

    it('should return undefined when no response', () => {
      expect(errorService.isAuthError({})).toBeFalsy();
    });
  });

  // --- isPermissionError ---
  describe('isPermissionError', () => {
    it('should return true for 403 status', () => {
      expect(errorService.isPermissionError({ response: { status: 403 } })).toBe(true);
    });

    it('should return false for non-403 status', () => {
      expect(errorService.isPermissionError({ response: { status: 401 } })).toBe(false);
    });

    it('should return undefined when no response', () => {
      expect(errorService.isPermissionError({})).toBeFalsy();
    });
  });

  // --- isNotFoundError ---
  describe('isNotFoundError', () => {
    it('should return true for 404 status', () => {
      expect(errorService.isNotFoundError({ response: { status: 404 } })).toBe(true);
    });

    it('should return false for non-404 status', () => {
      expect(errorService.isNotFoundError({ response: { status: 500 } })).toBe(false);
    });

    it('should return undefined when no response', () => {
      expect(errorService.isNotFoundError({})).toBeFalsy();
    });
  });
});
