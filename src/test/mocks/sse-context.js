import { vi } from 'vitest';

export const createSSEContextValue = (overrides = {}) => ({
  connectionStatus: {
    isConnected: false,
    connectionType: 'public',
    error: null,
  },
  subscribe: vi.fn(() => vi.fn()),
  unsubscribe: vi.fn(),
  getStatus: vi.fn(() => ({
    isConnected: false,
    connectionType: 'public',
    error: null,
  })),
  reconnect: vi.fn(),
  ...overrides,
});
