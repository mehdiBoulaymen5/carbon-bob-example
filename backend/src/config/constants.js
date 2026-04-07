/**
 * Application Constants
 * Centralized configuration values and magic numbers
 */

/**
 * Token expiration times (in seconds)
 */
const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  CSRF_TOKEN: 24 * 60 * 60 // 24 hours
};

/**
 * Token expiration times (in milliseconds)
 */
const TOKEN_EXPIRY_MS = {
  ACCESS_TOKEN: TOKEN_EXPIRY.ACCESS_TOKEN * 1000,
  REFRESH_TOKEN: TOKEN_EXPIRY.REFRESH_TOKEN * 1000,
  CSRF_TOKEN: TOKEN_EXPIRY.CSRF_TOKEN * 1000
};

/**
 * Rate limiting configuration
 */
const RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // login attempts per window
  },
  API: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30 // API calls per window
  }
};

/**
 * Pagination defaults
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

/**
 * User roles
 */
const USER_ROLES = {
  ADMIN: 'admin',
  VIEWER: 'viewer',
  EDITOR: 'editor'
};

/**
 * Publication status
 */
const PUBLICATION_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

/**
 * Audit action types
 */
const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REFRESH: 'REFRESH'
};

/**
 * Resource types for audit logging
 */
const RESOURCE_TYPES = {
  USER: 'user',
  PUBLICATION: 'publication',
  AUDIT_LOG: 'audit_log'
};

/**
 * HTTP status codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Error codes
 */
const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_INACTIVE: 'USER_INACTIVE',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

/**
 * Cookie configuration
 */
const COOKIE_CONFIG = {
  REFRESH_TOKEN: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY_MS.REFRESH_TOKEN
  },
  CSRF_TOKEN: {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY_MS.CSRF_TOKEN
  }
};

/**
 * Database configuration
 */
const DATABASE = {
  POOL_SIZE: 20,
  IDLE_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 2000, // 2 seconds
  QUERY_TIMEOUT: 10000 // 10 seconds
};

/**
 * Password hashing configuration
 */
const PASSWORD = {
  SALT_ROUNDS: 10,
  MIN_LENGTH: 8,
  MAX_LENGTH: 128
};

/**
 * File upload configuration
 */
const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
};

/**
 * Audit log retention
 */
const AUDIT = {
  RETENTION_DAYS: 90,
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * SSE (Server-Sent Events) configuration
 */
const SSE = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  RECONNECT_INTERVAL: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 5
};

/**
 * Cache configuration
 */
const CACHE = {
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 60 * 60 // 1 hour
  }
};

/**
 * Validation patterns
 */
const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  URL: /^https?:\/\/.+/
};

module.exports = {
  TOKEN_EXPIRY,
  TOKEN_EXPIRY_MS,
  RATE_LIMITS,
  PAGINATION,
  USER_ROLES,
  PUBLICATION_STATUS,
  AUDIT_ACTIONS,
  RESOURCE_TYPES,
  HTTP_STATUS,
  ERROR_CODES,
  COOKIE_CONFIG,
  DATABASE,
  PASSWORD,
  FILE_UPLOAD,
  AUDIT,
  SSE,
  CACHE,
  VALIDATION
};

// Made with Bob
