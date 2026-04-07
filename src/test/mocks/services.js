import { vi } from 'vitest';

export const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  },
};

export const mockAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn(() => false),
  clearTokens: vi.fn(),
};

export const mockPublicationService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  getFeatured: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

export const mockAdminService = {
  getDashboard: vi.fn(),
  getAuditLogs: vi.fn(),
  getPublications: vi.fn(),
  createPublication: vi.fn(),
  updatePublication: vi.fn(),
  deletePublication: vi.fn(),
};

export const mockSSEService = {
  on: vi.fn(() => vi.fn()),
  off: vi.fn(),
  getStatus: vi.fn(() => ({
    isConnected: false,
    connectionType: 'public',
    error: null,
  })),
  connectToAdminEvents: vi.fn(),
  connectToPublicEvents: vi.fn(),
  disconnect: vi.fn(),
};
