import { vi } from 'vitest';

export const createAuthContextValue = (overrides = {}) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  token: null,
  isLoading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  refreshAuth: vi.fn(),
  clearError: vi.fn(),
  ...overrides,
});
