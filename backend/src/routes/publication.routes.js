/**
 * Publication Routes
 * Handles both admin and public publication endpoints
 */

const express = require('express');
const router = express.Router();

const publicationController = require('../controllers/publication.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  validatePublicationCreate,
  validateUseCaseCreate,
  validatePublicationUpdate,
  validateUuidParam,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

// ============================================================================
// ADMIN ROUTES (Protected)
// ============================================================================

/**
 * @route   GET /api/admin/publications
 * @desc    Get all publications with filtering and pagination (Admin)
 * @access  Private (Admin only)
 */
router.get(
  '/admin/publications',
  authenticateToken,
  requireAdmin,
  validatePagination,
  validateSearch,
  publicationController.getAllPublications
);

/**
 * @route   POST /api/admin/publications
 * @desc    Create new publication (Admin)
 * @access  Private (Admin only)
 */
router.post(
  '/admin/publications',
  authenticateToken,
  requireAdmin,
  validatePublicationCreate,
  publicationController.createPublication
);

/**
 * @route   PUT /api/admin/publications/:id
 * @desc    Update publication (Admin)
 * @access  Private (Admin only)
 */
router.put(
  '/admin/publications/:id',
  authenticateToken,
  requireAdmin,
  validatePublicationUpdate,
  publicationController.updatePublication
);

/**
 * @route   DELETE /api/admin/publications/:id
 * @desc    Delete publication (Admin)
 * @access  Private (Admin only)
 */
router.delete(
  '/admin/publications/:id',
  authenticateToken,
  requireAdmin,
  validateUuidParam,
  publicationController.deletePublication
);

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @route   GET /api/publications
 * @desc    Get published publications with filtering and pagination (Public)
 * @access  Public
 */
router.get(
  '/publications',
  validatePagination,
  validateSearch,
  publicationController.getPublishedPublications
);

/**
 * @route   GET /api/publications/:id
 * @desc    Get single published publication by ID (Public)
 * @access  Public
 */
router.get(
  '/publications/:id',
  validateUuidParam,
  publicationController.getPublicationById
);

// ============================================================================
// USE CASE ROUTES (Public - aliases to publications with auto-publish)
// ============================================================================

/**
 * @route   POST /api/usecases
 * @desc    Create new use case (Public - auto-published, no admin approval)
 * @access  Public
 */
router.post(
  '/usecases',
  validateUseCaseCreate,
  publicationController.createUseCase
);

/**
 * @route   GET /api/usecases
 * @desc    Get published use cases (alias to publications)
 * @access  Public
 */
router.get(
  '/usecases',
  validatePagination,
  validateSearch,
  publicationController.getPublishedPublications
);

/**
 * @route   GET /api/usecases/:id
 * @desc    Get single published use case by ID (alias to publications)
 * @access  Public
 */
router.get(
  '/usecases/:id',
  validateUuidParam,
  publicationController.getPublicationById
);

/**
 * @route   PUT /api/usecases/:id
 * @desc    Update use case (Admin only)
 * @access  Private (Admin only)
 */
router.put(
  '/usecases/:id',
  authenticateToken,
  requireAdmin,
  validatePublicationUpdate,
  publicationController.updatePublication
);

/**
 * @route   DELETE /api/usecases/:id
 * @desc    Delete use case (Admin only)
 * @access  Private (Admin only)
 */
router.delete(
  '/usecases/:id',
  authenticateToken,
  requireAdmin,
  validateUuidParam,
  publicationController.deletePublication
);

module.exports = router;

// Made with Bob
