/**
 * Centralized Response Handler
 * Standardizes API responses across the application
 */

/**
 * Success response helper
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message (optional)
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const success = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    ...(message && { message }),
    data
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Created response helper (201)
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource data
 * @param {string} message - Success message (optional)
 */
const created = (res, data, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

/**
 * No content response helper (204)
 * @param {Object} res - Express response object
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Error response helper
 * @param {Object} res - Express response object
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Object} details - Additional error details (optional)
 */
const error = (res, code, message, statusCode = 400, details = null) => {
  const response = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Bad request error (400)
 */
const badRequest = (res, message = 'Bad request', details = null) => {
  return error(res, 'BAD_REQUEST', message, 400, details);
};

/**
 * Unauthorized error (401)
 */
const unauthorized = (res, message = 'Unauthorized', code = 'UNAUTHORIZED') => {
  return error(res, code, message, 401);
};

/**
 * Forbidden error (403)
 */
const forbidden = (res, message = 'Forbidden') => {
  return error(res, 'FORBIDDEN', message, 403);
};

/**
 * Not found error (404)
 */
const notFound = (res, resource = 'Resource', message = null) => {
  return error(
    res,
    'NOT_FOUND',
    message || `${resource} not found`,
    404
  );
};

/**
 * Conflict error (409)
 */
const conflict = (res, message = 'Resource already exists') => {
  return error(res, 'CONFLICT', message, 409);
};

/**
 * Validation error (422)
 */
const validationError = (res, errors) => {
  return error(
    res,
    'VALIDATION_ERROR',
    'Validation failed',
    422,
    errors
  );
};

/**
 * Internal server error (500)
 */
const internalError = (res, message = 'Internal server error') => {
  return error(res, 'INTERNAL_ERROR', message, 500);
};

/**
 * Paginated response helper
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination metadata
 */
const paginated = (res, items, pagination) => {
  return success(res, {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      totalCount: pagination.totalCount,
      hasNext: pagination.page < pagination.totalPages,
      hasPrev: pagination.page > 1
    }
  });
};

module.exports = {
  success,
  created,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  internalError,
  paginated
};

// Made with Bob
