/**
 * Centralized Error Handler Middleware
 * Catches and processes all errors in the application
 */

const response = require('../utils/response');

/**
 * Custom Application Error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Handle operational errors (known errors)
  if (err.isOperational) {
    return response.error(
      res,
      err.code,
      err.message,
      err.statusCode,
      err.details
    );
  }

  // Handle specific error types
  
  // Database errors
  if (err.code === '23505') { // PostgreSQL unique violation
    return response.conflict(res, 'Resource already exists');
  }
  
  if (err.code === '23503') { // PostgreSQL foreign key violation
    return response.badRequest(res, 'Referenced resource does not exist');
  }
  
  if (err.code === '23502') { // PostgreSQL not null violation
    return response.badRequest(res, 'Required field is missing');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return response.unauthorized(res, 'Invalid token', 'INVALID_TOKEN');
  }
  
  if (err.name === 'TokenExpiredError') {
    return response.unauthorized(res, 'Token expired', 'TOKEN_EXPIRED');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return response.validationError(res, err.details || err.message);
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    return response.badRequest(res, `File upload error: ${err.message}`);
  }

  // Default to internal server error for unknown errors
  return response.internalError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message
  );
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  response.notFound(res, 'Endpoint', `Endpoint ${req.method} ${req.path} not found`);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};

// Made with Bob
