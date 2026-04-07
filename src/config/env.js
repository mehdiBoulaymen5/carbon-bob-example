/**
 * Environment Configuration
 * 
 * Centralizes environment variable access and provides defaults for development.
 * In production, these values should be set via environment variables.
 */

/**
 * Resolve a safe default API base URL.
 * - In development, use the local backend.
 * - In production, prefer an explicit [`VITE_API_BASE_URL`](src/config/env.js:12), otherwise
 *   fall back to a same-origin `/api` path so deployed frontends do not call localhost.
 * @returns {string}
 */
const resolveApiBaseUrl = () => {
  const configuredApiUrl = import.meta.env.VITE_API_BASE_URL;

  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (import.meta.env.MODE === 'production') {
    return '/api';
  }

  return 'http://localhost:3000/api';
};

/**
 * API Base URL for backend services
 * @type {string}
 */
export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Application environment
 * @type {string}
 */
export const NODE_ENV = import.meta.env.MODE || 'development';

/**
 * Check if running in development mode
 * @type {boolean}
 */
export const IS_DEV = NODE_ENV === 'development';

/**
 * Check if running in production mode
 * @type {boolean}
 */
export const IS_PROD = NODE_ENV === 'production';

// Made with Bob