/**
 * Server Entry Point
 * Initializes and starts the Express server
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
require('dotenv').config();

const db = require('./config/database');
const {
  securityHeaders,
  apiLimiter,
  corsOptions,
  sanitizeInput,
  securityLogger,
  csrfProtection
} = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const response = require('./utils/response');

// Import routes
const authRoutes = require('./routes/auth.routes');
const publicationRoutes = require('./routes/publication.routes');
const adminRoutes = require('./routes/admin.routes');
const sseRoutes = require('./routes/sse.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Input sanitization
app.use(sanitizeInput);

// Security logging
app.use(securityLogger);

// Rate limiting for all API routes
app.use('/api/', apiLimiter);

// CSRF token generation for all requests
app.use(csrfProtection.generateToken);

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  response.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  response.success(res, {
    csrfToken: res.locals.csrfToken
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', publicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', sseRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await db.testConnection();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Database: Connected`);
      console.log(`✓ CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Handle graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await db.closePool();
    console.log('✓ Database connections closed');
    
    console.log('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error during shutdown:', error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

module.exports = app;

// Made with Bob
