/**
 * Validation Middleware
 * Input validation schemas using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      }
    });
  }
  
  next();
};

/**
 * Login validation
 * Note: Password strength rules (min length) are enforced at registration/account creation,
 * not at login, to allow users with existing passwords to authenticate.
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Publication creation validation
 */
const validatePublicationCreate = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape(),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .escape(),
  
  body('topics')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 topics'),
  
  body('topics.*')
    .trim()
    .notEmpty()
    .withMessage('Topic cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Topic must not exceed 50 characters'),
  
  body('audience')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 audience types'),
  
  body('audience.*')
    .trim()
    .notEmpty()
    .withMessage('Audience type cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Audience type must not exceed 50 characters'),
  
  body('industries')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 industries'),
  
  body('industries.*')
    .trim()
    .notEmpty()
    .withMessage('Industry cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Industry must not exceed 50 characters'),
  
  body('owners')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 owners'),
  
  body('owners.*')
    .trim()
    .notEmpty()
    .withMessage('Owner cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Owner must not exceed 100 characters'),
  
  body('gitSource')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Git source must be a valid URL'),
  
  body('boxSource')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Box source must be a valid URL'),
  
  body('icon')
    .trim()
    .notEmpty()
    .withMessage('Icon is required')
    .isLength({ max: 50 })
    .withMessage('Icon name must not exceed 50 characters'),
  
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  
  handleValidationErrors
];

/**
 * Use case creation validation (status is optional, will be auto-set to published)
 */
const validateUseCaseCreate = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape(),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .escape(),
  
  body('topics')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 topics'),
  
  body('topics.*')
    .trim()
    .notEmpty()
    .withMessage('Topic cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Topic must not exceed 50 characters'),
  
  body('audience')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 audience types'),
  
  body('audience.*')
    .trim()
    .notEmpty()
    .withMessage('Audience type cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Audience type must not exceed 50 characters'),
  
  body('industries')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 industries'),
  
  body('industries.*')
    .trim()
    .notEmpty()
    .withMessage('Industry cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Industry must not exceed 50 characters'),
  
  body('owners')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 owners'),
  
  body('owners.*')
    .trim()
    .notEmpty()
    .withMessage('Owner cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Owner must not exceed 100 characters'),
  
  body('gitSource')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Git source must be a valid URL'),
  
  body('boxSource')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Box source must be a valid URL'),
  
  body('icon')
    .trim()
    .notEmpty()
    .withMessage('Icon is required')
    .isLength({ max: 50 })
    .withMessage('Icon name must not exceed 50 characters'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  
  handleValidationErrors
];

/**
 * Publication update validation
 */
const validatePublicationUpdate = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Publication ID is required')
    .isUUID()
    .withMessage('Publication ID must be a valid UUID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .escape(),
  
  body('topics')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 topics'),
  
  body('topics.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Topic cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Topic must not exceed 50 characters'),
  
  body('audience')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 audience types'),
  
  body('industries')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 industries'),
  
  body('owners')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 owners'),
  
  body('owners.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Owner cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Owner must not exceed 100 characters'),
  
  body('gitSource')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Git source must be a valid URL'),
  
  body('boxSource')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Box source must be a valid URL'),
  
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon name must not exceed 50 characters'),
  
  body('status')
    .optional()
    .trim()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  
  handleValidationErrors
];

/**
 * UUID parameter validation
 */
const validateUuidParam = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('ID is required')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
  
  handleValidationErrors
];

/**
 * Pagination query validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('sort')
    .optional()
    .trim()
    .isIn(['createdAt', 'updatedAt', 'title', 'viewCount', 'created_at', 'updated_at', 'view_count'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['ASC', 'DESC'])
    .withMessage('Order must be ASC or DESC'),
  
  handleValidationErrors
];

/**
 * Search query validation
 */
const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters')
    .escape(),
  
  query('status')
    .optional()
    .trim()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published'),
  
  query('topics')
    .optional()
    .trim()
    .customSanitizer(value => {
      // Convert comma-separated string to array
      return value.split(',').map(t => t.trim()).filter(t => t);
    }),
  
  query('industries')
    .optional()
    .trim()
    .customSanitizer(value => {
      // Convert comma-separated string to array
      return value.split(',').map(i => i.trim()).filter(i => i);
    }),
  
  handleValidationErrors
];

/**
 * Date range validation
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .toDate(),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .toDate()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validatePublicationCreate,
  validateUseCaseCreate,
  validatePublicationUpdate,
  validateUuidParam,
  validatePagination,
  validateSearch,
  validateDateRange,
  handleValidationErrors
};

// Made with Bob
