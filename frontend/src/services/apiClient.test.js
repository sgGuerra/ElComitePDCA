import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient, { API_URL } from './apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/', pathname: '/' }
    });
    
    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should have the correct base URL', () => {
    expect(API_URL).toBeDefined();
    expect(apiClient.defaults.baseURL).toBe(API_URL);
  });

  it('should add Authorization header if token exists', async () => {
    localStorage.setItem('token', 'test-token');
    
    const requestInterceptor = apiClient.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };
    
    const result = await requestInterceptor(config);
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('should not add Authorization header if no token exists', async () => {
    const requestInterceptor = apiClient.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };
    
    const result = await requestInterceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should reject request error', async () => {
    const errorInterceptor = apiClient.interceptors.request.handlers[0].rejected;
    const error = new Error('Request error');
    
    await expect(errorInterceptor(error)).rejects.toThrow('Request error');
  });

  it('should pass through successful response', async () => {
    const responseInterceptor = apiClient.interceptors.response.handlers[0].fulfilled;
    const response = { data: 'success' };
    
    const result = await responseInterceptor(response);
    expect(result).toEqual(response);
  });

  it('should handle 401 error and clear localStorage and redirect', async () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('user', 'test');
    
    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;
    const error = { response: { status: 401, data: 'Unauthorized' } };
    
    await expect(errorInterceptor(error)).rejects.toEqual(error);
    
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle 401 error without redirecting if already on login page', async () => {
    window.location.pathname = '/login';
    
    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;
    const error = { response: { status: 401, data: 'Unauthorized' } };
    
    await expect(errorInterceptor(error)).rejects.toEqual(error);
    
    expect(window.location.href).not.toBe('/login');
  });

  it('should log 403 error', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'auditor', roles: ['auditor'] }));
    
    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;
    const error = { 
      response: { status: 403, data: 'Forbidden' },
      config: { url: '/test', method: 'get' }
    };
    
    await expect(errorInterceptor(error)).rejects.toEqual(error);
    expect(console.error).toHaveBeenCalledWith('Permission denied (403):', expect.any(Object));
  });

  it('should handle missing error response gracefully', async () => {
    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;
    const error = new Error('Network Error');
    
    await expect(errorInterceptor(error)).rejects.toEqual(error);
    expect(console.error).not.toHaveBeenCalled();
  });
});
