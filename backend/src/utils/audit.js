/**
 * Audit Logging Utilities
 * Handles audit log creation for tracking admin actions
 */

const db = require('../config/database');
const { isFileStorage } = require('../config/storage');
const { createId, now, readStore, updateStore } = require('../config/fileStore');

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.userEmail - User email
 * @param {string} params.action - Action type (CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT)
 * @param {string} params.resourceType - Type of resource (user, publication, etc.)
 * @param {string} params.resourceId - ID of the resource (optional)
 * @param {Object} params.changes - Changes made (optional)
 * @param {string} params.ipAddress - IP address of the request
 * @param {string} params.userAgent - User agent string
 * @param {boolean} params.success - Whether the action was successful (default: true)
 * @param {string} params.errorMessage - Error message if action failed (optional)
 * @returns {Promise<Object>} Created audit log entry
 */
const logAudit = async ({
  userId,
  userEmail,
  action,
  resourceType,
  resourceId = null,
  changes = null,
  ipAddress = null,
  userAgent = null,
  success = true,
  errorMessage = null
}) => {
  try {
    if (isFileStorage()) {
      const entry = {
        id: createId(),
        user_id: userId,
        user_email: userEmail,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes,
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        error_message: errorMessage,
        timestamp: now()
      };

      await updateStore(store => {
        store.audit_logs = store.audit_logs || [];
        store.audit_logs.push(entry);
        return entry;
      });

      return entry;
    }

    const query = `
      INSERT INTO audit_logs (
        user_id,
        user_email,
        action,
        resource_type,
        resource_id,
        changes,
        ip_address,
        user_agent,
        success,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      changes ? JSON.stringify(changes) : null,
      ipAddress,
      userAgent,
      success,
      errorMessage
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
};

/**
 * Get audit logs with filtering and pagination
 * @param {Object} filters - Filter parameters
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.action - Filter by action type
 * @param {string} filters.resourceType - Filter by resource type
 * @param {string} filters.resourceId - Filter by resource ID
 * @param {Date} filters.startDate - Filter by start date
 * @param {Date} filters.endDate - Filter by end date
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 50)
 * @returns {Promise<Object>} Audit logs with pagination info
 */
const getAuditLogs = async (filters = {}) => {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters;

    if (isFileStorage()) {
      const store = await readStore();
      const logs = [...(store.audit_logs || [])]
        .filter(log => !userId || log.user_id === userId)
        .filter(log => !action || log.action === action)
        .filter(log => !resourceType || log.resource_type === resourceType)
        .filter(log => !resourceId || log.resource_id === resourceId)
        .filter(log => !startDate || new Date(log.timestamp) >= new Date(startDate))
        .filter(log => !endDate || new Date(log.timestamp) <= new Date(endDate))
        .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));

      const totalCount = logs.length;
      const offset = (page - 1) * limit;

      return {
        logs: logs.slice(offset, offset + limit),
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
          totalCount
        }
      };
    }

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (userId) {
      conditions.push(`user_id = $${paramCount++}`);
      values.push(userId);
    }

    if (action) {
      conditions.push(`action = $${paramCount++}`);
      values.push(action);
    }

    if (resourceType) {
      conditions.push(`resource_type = $${paramCount++}`);
      values.push(resourceType);
    }

    if (resourceId) {
      conditions.push(`resource_id = $${paramCount++}`);
      values.push(resourceId);
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramCount++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramCount++}`);
      values.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM audit_logs ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramCount++} OFFSET $${paramCount}
    `;
    values.push(limit, offset);

    const dataResult = await db.query(dataQuery, values);

    return {
      logs: dataResult.rows,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

/**
 * Get audit statistics
 * @param {Object} filters - Filter parameters
 * @param {Date} filters.startDate - Start date for statistics
 * @param {Date} filters.endDate - End date for statistics
 * @returns {Promise<Object>} Audit statistics
 */
const getAuditStats = async (filters = {}) => {
  try {
    const { startDate, endDate } = filters;

    if (isFileStorage()) {
      const store = await readStore();
      const logs = [...(store.audit_logs || [])]
        .filter(log => !startDate || new Date(log.timestamp) >= new Date(startDate))
        .filter(log => !endDate || new Date(log.timestamp) <= new Date(endDate));

      const groups = new Map();

      logs.forEach(log => {
        const key = `${log.action}::${log.resource_type}`;
        const current = groups.get(key) || {
          action: log.action,
          resource_type: log.resource_type,
          count: 0,
          success_count: 0,
          failure_count: 0
        };

        current.count += 1;
        if (log.success) {
          current.success_count += 1;
        } else {
          current.failure_count += 1;
        }

        groups.set(key, current);
      });

      return [...groups.values()].sort((a, b) => b.count - a.count);
    }

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (startDate) {
      conditions.push(`timestamp >= $${paramCount++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramCount++}`);
      values.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        action,
        resource_type,
        COUNT(*) as count,
        SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failure_count
      FROM audit_logs
      ${whereClause}
      GROUP BY action, resource_type
      ORDER BY count DESC
    `;

    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    throw error;
  }
};

/**
 * Clean up old audit logs
 * @param {number} daysToKeep - Number of days to keep logs (default: 90)
 * @returns {Promise<number>} Number of deleted logs
 */
const cleanupOldLogs = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    if (isFileStorage()) {
      let removedCount = 0;

      await updateStore(store => {
        const originalLogs = store.audit_logs || [];
        store.audit_logs = originalLogs.filter(log => {
          const keep = new Date(log.timestamp) >= cutoffDate;
          if (!keep) {
            removedCount += 1;
          }
          return keep;
        });

        return removedCount;
      });

      return removedCount;
    }

    const query = `
      DELETE FROM audit_logs
      WHERE timestamp < $1
      RETURNING id
    `;

    const result = await db.query(query, [cutoffDate]);
    return result.rowCount;
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    throw error;
  }
};

/**
 * Extract IP address from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
const getIpAddress = (req) => {
  return req.ip ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         'unknown';
};

/**
 * Extract user agent from request
 * @param {Object} req - Express request object
 * @returns {string} User agent
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

module.exports = {
  logAudit,
  getAuditLogs,
  getAuditStats,
  cleanupOldLogs,
  getIpAddress,
  getUserAgent
};

// Made with Bob
