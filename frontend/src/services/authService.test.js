import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from './authService';
import apiClient from './apiClient';

// Mock apiClient
vi.mock('./apiClient', () => {
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
      interceptors,
      defaults: { baseURL: 'http://localhost:5000' },
    },
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _getStore: () => store,
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  // --- login ---
  describe('login', () => {
    it('should login successfully and store token and user', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-token-123',
          user_id: 1,
          active_role: 'admin',
          user_roles: ['admin', 'process_leader'],
          name: 'John Doe',
        },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login('test@test.com', 'password123');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.any(String),
        expect.objectContaining({ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token-123');
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error detail on login failure', async () => {
      const error = {
        response: { data: { detail: 'Credenciales incorrectas' } },
      };
      apiClient.post.mockRejectedValueOnce(error);

      await expect(authService.login('test@test.com', 'wrongpassword')).rejects.toBe('Credenciales incorrectas');
    });

    it('should throw default message when error has no detail', async () => {
      const error = { response: { data: {} } };
      apiClient.post.mockRejectedValueOnce(error);

      // When detail is undefined, the fallback string 'Error durante el inicio de sesión' is thrown
      await expect(authService.login('test@test.com', 'pass')).rejects.toBe('Error durante el inicio de sesión');
    });
  });

  // --- logout ---
  describe('logout', () => {
    it('should remove token and user from localStorage', () => {
      authService.logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  // --- getCurrentUser ---
  describe('getCurrentUser', () => {
    it('should return null when no user in localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should return parsed user object', () => {
      const user = { id: 1, role: 'admin', name: 'Test' };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(user));
      expect(authService.getCurrentUser()).toEqual(user);
    });
  });

  // --- isAuthenticated ---
  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorageMock.getItem.mockReturnValueOnce('some-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  // --- getToken ---
  describe('getToken', () => {
    it('should return the token from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce('my-token');
      expect(authService.getToken()).toBe('my-token');
    });
  });

  // --- updateCurrentUser ---
  describe('updateCurrentUser', () => {
    it('should store user data in localStorage', () => {
      const userData = { id: 1, name: 'Updated' };
      authService.updateCurrentUser(userData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(userData));
    });
  });

  // --- switchRole ---
  describe('switchRole', () => {
    it('should switch role and update user in localStorage', async () => {
      // Setup: getCurrentUser needs to find a user
      const currentUser = { id: 1, role: 'admin', roles: ['admin', 'process_leader'], name: 'Test' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(currentUser));

      const mockResponse = {
        data: {
          access_token: 'new-token',
          active_role: 'process_leader',
        },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.switchRole('process_leader');

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/switch-role', { role: 'process_leader' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
      expect(result.role).toBe('process_leader');
    });

    it('should throw error detail on failure', async () => {
      const error = { response: { data: { detail: 'No permission' } } };
      apiClient.post.mockRejectedValueOnce(error);

      await expect(authService.switchRole('auditor')).rejects.toBe('No permission');
    });

    it('should return response data when no current user found', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const mockResponse = {
        data: {
          access_token: 'new-token',
          active_role: 'process_leader',
        },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.switchRole('process_leader');
      expect(result).toEqual(mockResponse.data);
    });
  });
});
