/**
 * Authentication Routes
 * Handles user authentication endpoints
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticateToken, authenticateRefreshToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get access token
 * @access  Public
 */
router.post('/login', authLimiter, validateLogin, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires refresh token in cookie)
 */
router.post('/refresh', authenticateRefreshToken, authController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and revoke refresh token
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;

// Made with Bob
