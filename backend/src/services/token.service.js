/**
 * Token Service
 * Centralized token management (generation, validation, storage)
 */

const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const db = require('../config/database');
const { TOKEN_EXPIRY_MS, COOKIE_CONFIG } = require('../config/constants');
const { AppError } = require('../middleware/errorHandler');
const { isFileStorage } = require('../config/storage');
const { createId, now, readStore, updateStore } = require('../config/fileStore');

class TokenService {
  /**
   * Generate access and refresh tokens for user
   * @param {Object} user - User object
   * @returns {Promise<Object>} Tokens
   */
  async generateTokenPair(user) {
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      sub: user.id
    });

    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: TOKEN_EXPIRY_MS.ACCESS_TOKEN / 1000
    };
  }

  /**
   * Store refresh token in database
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Stored token record
   */
  async storeRefreshToken(userId, refreshToken) {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS.REFRESH_TOKEN).toISOString();

    if (isFileStorage()) {
      const tokenRecord = {
        id: createId(),
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: now(),
        revoked_at: null
      };

      await updateStore(store => {
        store.refresh_tokens = store.refresh_tokens || [];
        store.refresh_tokens.push(tokenRecord);
        return tokenRecord;
      });

      return tokenRecord;
    }

    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, expires_at, created_at
    `;

    const result = await db.query(query, [userId, tokenHash, expiresAt]);
    return result.rows[0];
  }

  /**
   * Verify and rotate refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token pair and user info
   */
  async rotateRefreshToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded || !decoded.sub) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    const tokenHash = this.hashToken(refreshToken);
    let tokenRecord;

    if (isFileStorage()) {
      const store = await readStore();
      const token = (store.refresh_tokens || []).find(item =>
        item.token_hash === tokenHash &&
        item.revoked_at === null &&
        new Date(item.expires_at) > new Date()
      );

      if (!token) {
        throw new AppError('Refresh token not found or expired', 401, 'TOKEN_EXPIRED');
      }

      const user = (store.users || []).find(item => item.id === token.user_id);

      if (!user) {
        throw new AppError('User not found', 401, 'USER_NOT_FOUND');
      }

      tokenRecord = {
        ...token,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      };
    } else {
      const tokenQuery = `
        SELECT rt.*, u.id, u.email, u.role, u.is_active
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token_hash = $1
          AND rt.revoked_at IS NULL
          AND rt.expires_at > NOW()
      `;

      const tokenResult = await db.query(tokenQuery, [tokenHash]);

      if (tokenResult.rows.length === 0) {
        throw new AppError('Refresh token not found or expired', 401, 'TOKEN_EXPIRED');
      }

      tokenRecord = tokenResult.rows[0];
    }

    if (!tokenRecord.is_active) {
      throw new AppError('User account is inactive', 401, 'USER_INACTIVE');
    }

    await this.revokeAllUserTokens(tokenRecord.user_id);
    await this.deleteRevokedTokens(tokenRecord.user_id);

    const user = {
      id: tokenRecord.user_id,
      email: tokenRecord.email,
      role: tokenRecord.role
    };

    const newTokens = await this.generateTokenPair(user);

    return {
      ...newTokens,
      user
    };
  }

  /**
   * Revoke refresh token
   * @param {string} tokenId - Token ID
   * @returns {Promise<void>}
   */
  async revokeRefreshToken(tokenId) {
    if (isFileStorage()) {
      await updateStore(store => {
        store.refresh_tokens = (store.refresh_tokens || []).map(token => (
          token.id === tokenId
            ? { ...token, revoked_at: now() }
            : token
        ));
        return null;
      });
      return;
    }

    const query = `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE id = $1
    `;

    await db.query(query, [tokenId]);
  }

  /**
   * Revoke all user's refresh tokens
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of revoked tokens
   */
  async revokeAllUserTokens(userId) {
    if (isFileStorage()) {
      let count = 0;

      await updateStore(store => {
        store.refresh_tokens = (store.refresh_tokens || []).map(token => {
          if (token.user_id === userId && token.revoked_at === null) {
            count += 1;
            return { ...token, revoked_at: now() };
          }

          return token;
        });

        return count;
      });

      return count;
    }

    const query = `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE user_id = $1 AND revoked_at IS NULL
      RETURNING id
    `;

    const result = await db.query(query, [userId]);
    return result.rowCount;
  }

  /**
   * Delete revoked tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of deleted tokens
   */
  async deleteRevokedTokens(userId) {
    if (isFileStorage()) {
      let deletedCount = 0;

      await updateStore(store => {
        store.refresh_tokens = (store.refresh_tokens || []).filter(token => {
          const shouldDelete = token.user_id === userId && token.revoked_at !== null;
          if (shouldDelete) {
            deletedCount += 1;
          }
          return !shouldDelete;
        });

        return deletedCount;
      });

      return deletedCount;
    }

    const query = `
      DELETE FROM refresh_tokens
      WHERE user_id = $1 AND revoked_at IS NOT NULL
    `;

    const result = await db.query(query, [userId]);
    return result.rowCount;
  }

  /**
   * Revoke refresh token by token string
   * @param {string} refreshToken - Refresh token string
   * @returns {Promise<boolean>} True if revoked
   */
  async revokeRefreshTokenByString(refreshToken) {
    if (!refreshToken) {
      return false;
    }

    const tokenHash = this.hashToken(refreshToken);

    if (isFileStorage()) {
      let revoked = false;

      await updateStore(store => {
        store.refresh_tokens = (store.refresh_tokens || []).map(token => {
          if (token.token_hash === tokenHash && token.revoked_at === null) {
            revoked = true;
            return { ...token, revoked_at: now() };
          }

          return token;
        });

        return revoked;
      });

      return revoked;
    }

    const query = `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE token_hash = $1 AND revoked_at IS NULL
      RETURNING id
    `;

    const result = await db.query(query, [tokenHash]);
    return result.rowCount > 0;
  }

  /**
   * Clean up expired tokens
   * @returns {Promise<number>} Number of deleted tokens
   */
  async cleanupExpiredTokens() {
    if (isFileStorage()) {
      let deletedCount = 0;
      const threshold = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

      await updateStore(store => {
        store.refresh_tokens = (store.refresh_tokens || []).filter(token => {
          const expired = new Date(token.expires_at) < new Date();
          const oldRevoked = token.revoked_at && new Date(token.revoked_at) < threshold;
          const shouldDelete = expired || oldRevoked;

          if (shouldDelete) {
            deletedCount += 1;
          }

          return !shouldDelete;
        });

        return deletedCount;
      });

      return deletedCount;
    }

    const query = `
      DELETE FROM refresh_tokens
      WHERE expires_at < NOW() OR revoked_at < NOW() - INTERVAL '30 days'
      RETURNING id
    `;

    const result = await db.query(query);
    return result.rowCount;
  }

  /**
   * Get user's active tokens count
   * @param {string} userId - User ID
   * @returns {Promise<number>} Active tokens count
   */
  async getUserActiveTokensCount(userId) {
    if (isFileStorage()) {
      const store = await readStore();
      return (store.refresh_tokens || []).filter(token =>
        token.user_id === userId &&
        token.revoked_at === null &&
        new Date(token.expires_at) > new Date()
      ).length;
    }

    const query = `
      SELECT COUNT(*) as count
      FROM refresh_tokens
      WHERE user_id = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
    `;

    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Hash token for storage
   * @param {string} token - Token to hash
   * @returns {string} Hashed token
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Set refresh token cookie
   * @param {Object} res - Express response object
   * @param {string} refreshToken - Refresh token
   */
  setRefreshTokenCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, COOKIE_CONFIG.REFRESH_TOKEN);
  }

  /**
   * Clear refresh token cookie
   * @param {Object} res - Express response object
   */
  clearRefreshTokenCookie(res) {
    res.clearCookie('refreshToken');
  }

  /**
   * Generate CSRF token
   * @returns {string} CSRF token
   */
  generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Set CSRF token cookie
   * @param {Object} res - Express response object
   * @param {string} csrfToken - CSRF token
   */
  setCsrfTokenCookie(res, csrfToken) {
    res.cookie('csrfToken', csrfToken, COOKIE_CONFIG.CSRF_TOKEN);
  }
}

module.exports = new TokenService();

// Made with Bob
