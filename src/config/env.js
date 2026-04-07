/**
 * Environment Configuration
 * 
 * Centralizes environment variable access and provides defaults for development.
 * In production, these values should be set via environment variables.
 */

/**
 * API Base URL for backend services
 * @type {string}
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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