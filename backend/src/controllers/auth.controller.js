/**
 * Authentication Controller
 * Handles user authentication, token management, and session control
 */

const { comparePassword } = require('../utils/password');
const { logAudit, getIpAddress, getUserAgent } = require('../utils/audit');
const userRepository = require('../repositories/user.repository');
const tokenService = require('../services/token.service');
const response = require('../utils/response');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { TOKEN_EXPIRY, USER_ROLES, AUDIT_ACTIONS, ERROR_CODES } = require('../config/constants');

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = await userRepository.findByEmail(email);
  
  if (!user) {
    // Log failed login attempt
    await logAudit({
      userId: null,
      userEmail: email,
      action: AUDIT_ACTIONS.LOGIN,
      resourceType: 'user',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      success: false,
      errorMessage: 'Invalid credentials'
    });
    
    throw new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIALS);
  }
  
  // Check if user is active
  if (!user.is_active) {
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.LOGIN,
      resourceType: 'user',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      success: false,
      errorMessage: 'User account is inactive'
    });
    
    throw new AppError('User account is inactive', 401, ERROR_CODES.USER_INACTIVE);
  }
  
  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  
  if (!isPasswordValid) {
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.LOGIN,
      resourceType: 'user',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      success: false,
      errorMessage: 'Invalid credentials'
    });
    
    throw new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIALS);
  }
  
  // Generate token pair
  const tokens = await tokenService.generateTokenPair(user);
  
  // Update last login timestamp
  await userRepository.updateLastLogin(user.id);
  
  // Set refresh token as httpOnly cookie
  tokenService.setRefreshTokenCookie(res, tokens.refreshToken);
  
  // Generate and set CSRF token
  const csrfToken = tokenService.generateCsrfToken();
  tokenService.setCsrfTokenCookie(res, csrfToken);
  
  // Log successful login
  await logAudit({
    userId: user.id,
    userEmail: user.email,
    action: AUDIT_ACTIONS.LOGIN,
    resourceType: 'user',
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
    success: true
  });
  
  // Return user data and access token
  return response.success(res, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    accessToken: tokens.accessToken,
    csrfToken: csrfToken,
    expiresIn: tokens.expiresIn
  }, 'Login successful');
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    throw new AppError('Refresh token not found', 401, ERROR_CODES.TOKEN_MISSING);
  }
  
  // Rotate refresh token
  const result = await tokenService.rotateRefreshToken(refreshToken);
  
  // Set new refresh token cookie
  tokenService.setRefreshTokenCookie(res, result.refreshToken);
  
  // Generate and set new CSRF token
  const csrfToken = tokenService.generateCsrfToken();
  tokenService.setCsrfTokenCookie(res, csrfToken);
  
  return response.success(res, {
    accessToken: result.accessToken,
    csrfToken: csrfToken,
    expiresIn: result.expiresIn
  }, 'Token refreshed successfully');
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (refreshToken) {
    // Revoke refresh token
    await tokenService.revokeRefreshTokenByString(refreshToken);
  }
  
  // Clear refresh token cookie
  tokenService.clearRefreshTokenCookie(res);
  
  // Log logout
  if (req.user) {
    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: AUDIT_ACTIONS.LOGOUT,
      resourceType: 'user',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      success: true
    });
  }
  
  return response.success(res, null, 'Logged out successfully');
});

/**
 * Get current user information
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  // User info attached by authenticateToken middleware
  const { id } = req.user;
  
  // Get full user details
  const user = await userRepository.findById(id);
  
  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  }
  
  return response.success(res, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.is_active,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at
  });
});

module.exports = {
  login,
  refresh,
  logout,
  getCurrentUser
};

// Made with Bob
