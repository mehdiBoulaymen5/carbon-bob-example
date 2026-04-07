/**
 * Authentication Middleware
 * Handles JWT verification and role-based access control
 */

const crypto = require('crypto');
const { verifyAccessToken, verifyRefreshToken } = require('../utils/jwt');
const db = require('../config/database');
const { isFileStorage } = require('../config/storage');
const { readStore } = require('../config/fileStore');

/**
 * Verify JWT access token from Authorization header
 * Attaches user information to req.user if valid
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_MISSING',
          message: 'Access token is required'
        }
      });
    }

    const decoded = verifyAccessToken(token);
    let user = null;

    if (isFileStorage()) {
      const store = await readStore();
      user = (store.users || []).find(item => item.id === decoded.sub);
    } else {
      const userQuery = 'SELECT id, email, name, role, is_active FROM users WHERE id = $1';
      const userResult = await db.query(userQuery, [decoded.sub]);
      user = userResult.rows[0] || null;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive'
        }
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.message === 'Access token expired') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid access token'
      }
    });
  }
};

/**
 * Require admin role
 * Must be used after authenticateToken middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required'
      }
    });
  }

  next();
};

/**
 * Verify refresh token from cookie
 * Used for token refresh endpoint
 */
const authenticateRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_MISSING',
          message: 'Refresh token is required'
        }
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    let tokenData = null;

    if (isFileStorage()) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const store = await readStore();
      const token = (store.refresh_tokens || []).find(item =>
        item.user_id === decoded.sub &&
        item.token_hash === tokenHash &&
        item.revoked_at === null &&
        new Date(item.expires_at) > new Date()
      );

      if (token) {
        const user = (store.users || []).find(item => item.id === token.user_id);
        if (user) {
          tokenData = {
            ...token,
            email: user.email,
            name: user.name,
            role: user.role,
            is_active: user.is_active
          };
        }
      }
    } else {
      const tokenQuery = `
        SELECT rt.*, u.email, u.name, u.role, u.is_active
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.user_id = $1 
          AND rt.token_hash = $2
          AND rt.expires_at > NOW()
          AND rt.revoked_at IS NULL
      `;

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const result = await db.query(tokenQuery, [decoded.sub, tokenHash]);
      tokenData = result.rows[0] || null;
    }

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_INVALID',
          message: 'Invalid or expired refresh token'
        }
      });
    }

    if (!tokenData.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive'
        }
      });
    }

    req.user = {
      id: tokenData.user_id,
      email: tokenData.email,
      name: tokenData.name,
      role: tokenData.role
    };
    req.refreshTokenId = tokenData.id;
    req.refreshToken = refreshToken;

    next();
  } catch (error) {
    console.error('Refresh token authentication error:', error);

    if (error.message === 'Refresh token expired') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token has expired'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Invalid refresh token'
      }
    });
  }
};

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't fail if missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);

    if (isFileStorage()) {
      const store = await readStore();
      const user = (store.users || []).find(item => item.id === decoded.sub && item.is_active === true);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }

      return next();
    }

    const userQuery = 'SELECT id, email, name, role, is_active FROM users WHERE id = $1 AND is_active = true';
    const userResult = await db.query(userQuery, [decoded.sub]);

    if (userResult.rows.length > 0) {
      req.user = {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        name: userResult.rows[0].name,
        role: userResult.rows[0].role
      };
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  authenticateRefreshToken,
  optionalAuth
};

// Made with Bob
