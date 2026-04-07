/**
 * User Repository
 * Database operations for users table
 */

const BaseRepository = require('./base.repository');
const { isFileStorage } = require('../config/storage');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    return this.findOne({ email });
  }

  /**
   * Find active user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findActiveByEmail(email) {
    return this.findOne({ email, is_active: true });
  }

  /**
   * Update last login timestamp
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async updateLastLogin(userId) {
    return this.updateById(userId, { last_login_at: new Date().toISOString() });
  }

  /**
   * Get user with role
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User with role or null
   */
  async findWithRole(userId) {
    return this.findById(userId, ['id', 'email', 'name', 'role', 'is_active']);
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {string} excludeUserId - User ID to exclude from check
   * @returns {Promise<boolean>} True if exists
   */
  async emailExists(email, excludeUserId = null) {
    if (isFileStorage()) {
      const users = await this.findAll({
        limit: Number.MAX_SAFE_INTEGER,
        offset: 0
      });

      return users.some(user => user.email === email && user.id !== excludeUserId);
    }

    const where = { email };
    if (excludeUserId) {
      const query = `
        SELECT COUNT(*) as count
        FROM ${this.tableName}
        WHERE email = $1 AND id != $2
      `;
      const result = await this.raw(query, [email, excludeUserId]);
      return parseInt(result.rows[0].count, 10) > 0;
    }
    return this.exists(where);
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Users
   */
  async findByRole(role, options = {}) {
    return this.findAll({
      ...options,
      where: { role, ...options.where }
    });
  }

  /**
   * Deactivate user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async deactivate(userId) {
    return this.updateById(userId, { is_active: false });
  }

  /**
   * Activate user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async activate(userId) {
    return this.updateById(userId, { is_active: true });
  }
}

module.exports = new UserRepository();

// Made with Bob
