/**
 * SSE Routes
 * Routes for Server-Sent Events
 */

const express = require('express');
const router = express.Router();
const sseController = require('../controllers/sse.controller');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/events
 * @desc    SSE endpoint for public clients
 * @access  Public
 */
router.get('/events', (req, res) => {
  sseController.setupPublicSSE(req, res);
});

/**
 * @route   GET /api/admin/events
 * @desc    SSE endpoint for admin clients
 * @access  Private (Admin only)
 */
router.get('/admin/events', authenticateToken, (req, res) => {
  sseController.setupAdminSSE(req, res);
});

/**
 * @route   GET /api/events/stats
 * @desc    Get SSE connection statistics
 * @access  Private (Admin only)
 */
router.get('/events/stats', authenticateToken, (req, res) => {
  const stats = sseController.getStats();
  res.json(stats);
});

module.exports = router;

// Made with Bob
