import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiClient, { API_URL } from './apiClient';

// ---------------------------------------------------------------------------
// Helper: a minimal in-memory Storage mock so every standard method
// (getItem, setItem, removeItem, clear) behaves exactly like the real API.
// ---------------------------------------------------------------------------
function createStorageMock() {
  let store = {};
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
}

describe('apiClient', () => {
  let storageMock;

  beforeEach(() => {
    // Arrange – shared setup for every test
    vi.clearAllMocks();

    storageMock = createStorageMock();
    vi.stubGlobal('localStorage', storageMock);

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/', pathname: '/' },
    });

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -----------------------------------------------------------------------
  // Base URL
  // -----------------------------------------------------------------------
  it('should have the correct base URL', () => {
    // Arrange – API_URL is already imported

    // Act – read the defaults configured on the axios instance
    const baseURL = apiClient.defaults.baseURL;

    // Assert
    expect(API_URL).toBeDefined();
    expect(baseURL).toBe(API_URL);
  });

  // -----------------------------------------------------------------------
  // Request interceptor – token present
  // -----------------------------------------------------------------------
  it('should add Authorization header if token exists', async () => {
    // Arrange
    storageMock.getItem.mockReturnValue('test-token');
    const requestInterceptor = apiClient.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };

    // Act
    const result = await requestInterceptor(config);

    // Assert
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  // -----------------------------------------------------------------------
  // Request interceptor – no token
  // -----------------------------------------------------------------------
  it('should not add Authorization header if no token exists', async () => {
    // Arrange
    storageMock.getItem.mockReturnValue(null);
    const requestInterceptor = apiClient.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };

    // Act
    const result = await requestInterceptor(config);

    // Assert
    expect(result.headers.Authorization).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // Request interceptor – error path
  // -----------------------------------------------------------------------
  it('should reject request error', async () => {
    // Arrange
    const errorInterceptor = apiClient.interceptors.request.handlers[0].rejected;
    const error = new Error('Request error');

    // Act & Assert
    await expect(errorInterceptor(error)).rejects.toThrow('Request error');
  });

  // -----------------------------------------------------------------------
  // Response interceptor – success path
  // -----------------------------------------------------------------------
  it('should pass through successful response', async () => {
    // Arrange
    const responseInterceptor = apiClient.interceptors.response.handlers[0].fulfilled;
    const response = { data: 'success' };

    // Act
    const result = await responseInterceptor(response);

    // Assert
    expect(result).toEqual(response);
  });

  // -----------------------------------------------------------------------
  // Response interceptor – 401 clears storage & redirects
  // -----------------------------------------------------------------------
  it('should handle 401 error and clear localStorage and redirect', async () => {
    // Arrange
    storageMock.setItem('token', 'test');
    storageMock.setItem('user', 'test');
    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;
    const error = { response: { status: 401, data: 'Unauthorized' } };

    // Act
    await expect(errorInterceptor(error)).rejects.toEqual(error);

    // Assert
    expect(storageMock.removeItem).toHaveBeenCalledWith('token');
    expect(storageMock.removeItem).toHaveBeenCalledWith('user');
    expect(window.location.href).toBe('/login');
    expect(console.error).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Response interceptor – 401 on /login does NOT redirect again
  // -----------------------------------------------------------------------
  it('should handle 401 error without redirecting if already on login page', async () => {
    // Arrange
    window.location.pathname = '/login';
    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;
    const error = { response: { status: 401, data: 'Unauthorized' } };

    // Act
    await expect(errorInterceptor(error)).rejects.toEqual(error);

    // Assert
    expect(window.location.href).not.toBe('/login');
  });

  // -----------------------------------------------------------------------
  // Response interceptor – 403 logs the error
  // -----------------------------------------------------------------------
  it('should log 403 error', async () => {
    // Arrange
    storageMock.getItem.mockReturnValue(
      JSON.stringify({ role: 'auditor', roles: ['auditor'] })
    );
    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;
    const error = {
      response: { status: 403, data: 'Forbidden' },
      config: { url: '/test', method: 'get' },
    };

    // Act
    await expect(errorInterceptor(error)).rejects.toEqual(error);

    // Assert
    expect(console.error).toHaveBeenCalledWith(
      'Permission denied (403):',
      expect.any(Object)
    );
  });

  // -----------------------------------------------------------------------
  // Response interceptor – no response object (e.g. network failure)
  // -----------------------------------------------------------------------
  it('should handle missing error response gracefully', async () => {
    // Arrange
    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;
    const error = new Error('Network Error');

    // Act
    await expect(errorInterceptor(error)).rejects.toEqual(error);

    // Assert
    expect(console.error).not.toHaveBeenCalled();
  });
});
