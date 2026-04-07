/**
 * AuthContext Tests
 * 
 * Tests for the authentication context including:
 * - Authentication state management
 * - Login functionality
 * - Logout functionality
 * - Token persistence
 * - Token refresh
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import authService from '../../services/auth.service';

// Mock auth service
vi.mock('../../services/auth.service', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.isAuthenticated.mockReturnValue(false);
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide auth context when used within AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.login).toBeDefined();
      expect(result.current.logout).toBeDefined();
      expect(result.current.checkAuth).toBeDefined();
    });
  });

  describe('Initial State', () => {
    it('should provide initial authentication state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for checkAuth to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Final state after checkAuth completes
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should check authentication on mount', async () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(authService.isAuthenticated).toHaveBeenCalled();
      });
    });

    it('should load user data if authenticated on mount', async () => {
      const mockUser = { id: '1', email: 'user@example.com', role: 'user' };
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle authentication check failure', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockRejectedValue(new Error('Token expired'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(authService.clearTokens).toHaveBeenCalled();
      });
    });
  });

  describe('Login', () => {
    it('should handle successful login', async () => {
      const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' };
      authService.login.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin@example.com', 'password123');
      });

      expect(authService.login).toHaveBeenCalledWith('admin@example.com', 'password123');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(loginResult).toEqual(mockUser);
    });

    it('should set loading state during login', async () => {
      const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' };
      authService.login.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ user: mockUser }), 100))
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.login('admin@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle login failure', async () => {
      authService.login.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.login('admin@example.com', 'wrongpassword');
        });
      }).rejects.toThrow('Invalid credentials');

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid credentials');
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should clear previous errors on new login attempt', async () => {
      authService.login
        .mockRejectedValueOnce(new Error('Invalid credentials'))
        .mockResolvedValueOnce({ user: { id: '1', email: 'admin@example.com', role: 'admin' } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First login attempt fails
      await expect(async () => {
        await act(async () => {
          await result.current.login('admin@example.com', 'wrongpassword');
        });
      }).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid credentials');
      });

      // Second login attempt succeeds
      await act(async () => {
        await result.current.login('admin@example.com', 'correctpassword');
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Logout', () => {
    it('should handle successful logout', async () => {
      const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' };
      authService.login.mockResolvedValue({ user: mockUser });
      authService.logout.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login('admin@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(authService.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear user state even if logout fails', async () => {
      const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' };
      authService.login.mockResolvedValue({ user: mockUser });
      authService.logout.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login('admin@example.com', 'password123');
      });

      // Then logout (even though it fails)
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh authentication token', async () => {
      const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' };
      authService.refresh.mockResolvedValue();
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshAuth();
      });

      expect(authService.refresh).toHaveBeenCalled();
    });

    it('should handle token refresh failure', async () => {
      authService.refresh.mockRejectedValue(new Error('Refresh failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshAuth();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(authService.clearTokens).toHaveBeenCalled();
    });

    it('should automatically refresh token every 14 minutes when authenticated', async () => {
      vi.useFakeTimers();
      
      const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' };
      authService.login.mockResolvedValue({ user: mockUser });
      authService.refresh.mockResolvedValue();
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Login
      await act(async () => {
        await result.current.login('admin@example.com', 'password123');
      });

      // Fast-forward 14 minutes and run pending timers
      await act(async () => {
        vi.advanceTimersByTime(14 * 60 * 1000);
        await vi.runOnlyPendingTimersAsync();
      });

      expect(authService.refresh).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should not refresh token when not authenticated', async () => {
      vi.useFakeTimers();
      
      authService.refresh.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Fast-forward 14 minutes
      await act(async () => {
        vi.advanceTimersByTime(14 * 60 * 1000);
        await vi.runOnlyPendingTimersAsync();
      });

      expect(authService.refresh).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should clear refresh interval on unmount', async () => {
      vi.useFakeTimers();
      
      const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' };
      authService.login.mockResolvedValue({ user: mockUser });
      authService.refresh.mockResolvedValue();
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(mockUser);

      const { result, unmount } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Login
      await act(async () => {
        await result.current.login('admin@example.com', 'password123');
      });

      // Unmount
      unmount();

      // Fast-forward time after unmount
      await act(async () => {
        vi.advanceTimersByTime(14 * 60 * 1000);
        await vi.runOnlyPendingTimersAsync();
      });

      // Refresh should not be called after unmount
      expect(authService.refresh).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should provide clearError function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.clearError).toBeDefined();
      expect(typeof result.current.clearError).toBe('function');
    });

    it('should clear error when clearError is called', async () => {
      authService.login.mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger error
      await expect(async () => {
        await act(async () => {
          await result.current.login('admin@example.com', 'wrongpassword');
        });
      }).rejects.toThrow();

      expect(result.current.error).toBe('Login failed');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Context Value', () => {
    it('should provide all required context values', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('checkAuth');
      expect(result.current).toHaveProperty('refreshAuth');
      expect(result.current).toHaveProperty('clearError');
    });

    it('should provide functions that are callable', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.checkAuth).toBe('function');
      expect(typeof result.current.refreshAuth).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('Authentication Persistence', () => {
    it('should persist authentication across re-renders', async () => {
      const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' };
      authService.login.mockResolvedValue({ user: mockUser });

      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login
      await act(async () => {
        await result.current.login('admin@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Re-render
      rerender();

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });
});

// Made with Bob
