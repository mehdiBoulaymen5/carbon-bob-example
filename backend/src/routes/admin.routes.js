/**
 * Admin Routes
 * Handles admin-specific endpoints like dashboard, audit logs, and system health
 */

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const publicationController = require('../controllers/publication.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  validatePagination,
  validateDateRange,
  validateUuidParam,
  validatePublicationCreate,
  validatePublicationUpdate
} = require('../middleware/validation');
const { csrfProtection } = require('../middleware/security');

/**
 * Publication Management Routes
 */

/**
 * @route   GET /api/admin/publications
 * @desc    Get all publications (admin view)
 * @access  Private (Admin only)
 */
router.get(
  '/publications',
  authenticateToken,
  requireAdmin,
  validatePagination,
  publicationController.getAllPublications
);

/**
 * @route   POST /api/admin/publications
 * @desc    Create new publication
 * @access  Private (Admin only)
 */
router.post(
  '/publications',
  authenticateToken,
  requireAdmin,
  csrfProtection.verifyToken,
  validatePublicationCreate,
  publicationController.createPublication
);

/**
 * @route   GET /api/admin/publications/:id
 * @desc    Get publication by ID (admin view)
 * @access  Private (Admin only)
 */
router.get(
  '/publications/:id',
  authenticateToken,
  requireAdmin,
  validateUuidParam,
  publicationController.getPublicationByIdAdmin
);

/**
 * @route   PUT /api/admin/publications/:id
 * @desc    Update publication
 * @access  Private (Admin only)
 */
router.put(
  '/publications/:id',
  authenticateToken,
  requireAdmin,
  validateUuidParam,
  csrfProtection.verifyToken,
  validatePublicationUpdate,
  publicationController.updatePublication
);

/**
 * @route   DELETE /api/admin/publications/:id
 * @desc    Delete publication
 * @access  Private (Admin only)
 */
router.delete(
  '/publications/:id',
  authenticateToken,
  requireAdmin,
  validateUuidParam,
  csrfProtection.verifyToken,
  publicationController.deletePublication
);

/**
 * Dashboard and System Routes
 */

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get(
  '/dashboard/stats',
  authenticateToken,
  requireAdmin,
  adminController.getDashboardStats
);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Private (Admin only)
 */
router.get(
  '/audit-logs',
  authenticateToken,
  requireAdmin,
  validatePagination,
  validateDateRange,
  adminController.getAuditLogsController
);

/**
 * @route   GET /api/admin/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  Private (Admin only)
 */
router.get(
  '/audit-logs/stats',
  authenticateToken,
  requireAdmin,
  validateDateRange,
  adminController.getAuditStatsController
);

/**
 * @route   GET /api/admin/health
 * @desc    Get system health status
 * @access  Private (Admin only)
 */
router.get(
  '/health',
  authenticateToken,
  requireAdmin,
  adminController.getSystemHealth
);

/**
 * @route   GET /api/admin/users/:userId/activity
 * @desc    Get user activity summary
 * @access  Private (Admin only)
 */
router.get(
  '/users/:userId/activity',
  authenticateToken,
  requireAdmin,
  validateUuidParam,
  validateDateRange,
  adminController.getUserActivity
);

module.exports = router;

// Made with Bob
