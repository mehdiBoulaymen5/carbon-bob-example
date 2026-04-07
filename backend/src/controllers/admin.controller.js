/**
 * Admin Controller
 * Handles admin-specific operations like dashboard stats and audit logs
 */

const { getAuditLogs, getAuditStats } = require('../utils/audit');
const publicationRepository = require('../repositories/publication.repository');
const userRepository = require('../repositories/user.repository');
const response = require('../utils/response');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { PAGINATION, PUBLICATION_STATUS, ERROR_CODES } = require('../config/constants');
const db = require('../config/database');
const { isFileStorage } = require('../config/storage');
const { readStore } = require('../config/fileStore');

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  // Get publication statistics
  const stats = await publicationRepository.getStatistics();

  // Get top viewed publications
  const topViewed = await publicationRepository.getTopViewed(5);

  if (isFileStorage()) {
    const store = await readStore();
    const publications = Array.isArray(store.publications) ? store.publications : [];
    const auditLogs = Array.isArray(store.audit_logs) ? store.audit_logs : [];

    const recentActivity = [...auditLogs]
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, 10)
      .map(({ id, user_email, action, resource_type, resource_id, timestamp, success }) => ({
        id,
        user_email,
        action,
        resource_type,
        resource_id,
        timestamp,
        success
      }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timelineMap = new Map();
    publications.forEach((publication) => {
      if (!publication.created_at) {
        return;
      }

      const createdAt = new Date(publication.created_at);
      if (Number.isNaN(createdAt.getTime()) || createdAt < thirtyDaysAgo) {
        return;
      }

      const date = createdAt.toISOString().split('T')[0];
      const status = publication.status || PUBLICATION_STATUS.DRAFT;
      const key = `${date}::${status}`;
      const currentCount = timelineMap.get(key) || 0;
      timelineMap.set(key, currentCount + 1);
    });

    const timeline = [...timelineMap.entries()]
      .map(([key, count]) => {
        const [date, status] = key.split('::');
        return { date, status, count };
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const topicCounts = publications
      .filter((publication) => publication.status === PUBLICATION_STATUS.PUBLISHED)
      .flatMap((publication) => Array.isArray(publication.topics) ? publication.topics : [])
      .reduce((acc, topic) => {
        acc.set(topic, (acc.get(topic) || 0) + 1);
        return acc;
      }, new Map());

    const topicDistribution = [...topicCounts.entries()]
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return response.success(res, {
      overview: {
        totalPublications: stats.total,
        publishedPublications: stats.published,
        draftPublications: stats.draft,
        totalViews: stats.totalViews,
        recentPublications: timeline.reduce((sum, item) => sum + Number(item.count || 0), 0)
      },
      topViewed,
      recentActivity,
      timeline,
      topicDistribution
    });
  }

  // Get recent activity (last 10 audit logs)
  const recentActivityQuery = `
    SELECT
      id, user_email, action, resource_type,
      resource_id, timestamp, success
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT 10
  `;
  const recentActivityResult = await db.query(recentActivityQuery);

  // Get publications by status over time (last 30 days)
  const timelineQuery = `
    SELECT
      DATE(created_at) as date,
      status,
      COUNT(*) as count
    FROM publications
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at), status
    ORDER BY date DESC
  `;
  const timelineResult = await db.query(timelineQuery);

  // Get topic distribution
  const topicsQuery = `
    SELECT
      unnest(topics) as topic,
      COUNT(*) as count
    FROM publications
    WHERE status = $1
    GROUP BY topic
    ORDER BY count DESC
    LIMIT 10
  `;
  const topicsResult = await db.query(topicsQuery, [PUBLICATION_STATUS.PUBLISHED]);

  return response.success(res, {
    overview: {
      totalPublications: stats.total,
      publishedPublications: stats.published,
      draftPublications: stats.draft,
      totalViews: stats.totalViews,
      recentPublications: stats.recentCount
    },
    topViewed,
    recentActivity: recentActivityResult.rows,
    timeline: timelineResult.rows,
    topicDistribution: topicsResult.rows
  });
});

/**
 * Get audit logs with filtering
 * GET /api/admin/audit-logs
 */
const getAuditLogsController = asyncHandler(async (req, res) => {
  const {
    userId,
    action,
    resourceType,
    resourceId,
    startDate,
    endDate,
    page = 1,
    limit = PAGINATION.AUDIT_LOGS_LIMIT
  } = req.query;
  
  const filters = {
    userId,
    action,
    resourceType,
    resourceId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    page: parseInt(page),
    limit: parseInt(limit)
  };
  
  const result = await getAuditLogs(filters);
  
  return response.paginated(res, result.logs, result.pagination);
});

/**
 * Get audit statistics
 * GET /api/admin/audit-logs/stats
 */
const getAuditStatsController = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const filters = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined
  };
  
  const stats = await getAuditStats(filters);
  
  return response.success(res, stats);
});

/**
 * Get system health status
 * GET /api/admin/health
 */
const getSystemHealth = asyncHandler(async (req, res) => {
  let dbHealthy = true;
  let databaseStats;

  if (isFileStorage()) {
    const store = await readStore();
    databaseStats = {
      users: Array.isArray(store.users) ? store.users.length : 0,
      publications: Array.isArray(store.publications) ? store.publications.length : 0,
      auditLogs: Array.isArray(store.audit_logs) ? store.audit_logs.length : 0,
      activeTokens: Array.isArray(store.refresh_tokens)
        ? store.refresh_tokens.filter(token => !token.revoked_at).length
        : 0
    };
  } else {
    // Check database connection
    const dbCheck = await db.query('SELECT NOW()');
    dbHealthy = dbCheck.rows.length > 0;

    // Get database stats
    const dbStatsQuery = `
      SELECT
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM publications) as publication_count,
        (SELECT COUNT(*) FROM audit_logs) as audit_log_count,
        (SELECT COUNT(*) FROM refresh_tokens WHERE revoked_at IS NULL) as active_token_count
    `;
    const dbStatsResult = await db.query(dbStatsQuery);
    const dbStats = dbStatsResult.rows[0];

    databaseStats = {
      users: parseInt(dbStats.user_count, 10),
      publications: parseInt(dbStats.publication_count, 10),
      auditLogs: parseInt(dbStats.audit_log_count, 10),
      activeTokens: parseInt(dbStats.active_token_count, 10)
    };
  }

  // System uptime
  const uptime = process.uptime();

  // Memory usage
  const memoryUsage = process.memoryUsage();

  return response.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      healthy: dbHealthy,
      stats: databaseStats
    },
    system: {
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      nodeVersion: process.version,
      platform: process.platform
    }
  });
});

/**
 * Get user activity summary
 * GET /api/admin/users/:userId/activity
 */
const getUserActivity = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;

  // Get user info
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  }

  if (isFileStorage()) {
    const store = await readStore();
    const logs = [...(store.audit_logs || [])]
      .filter(log => log.user_id === userId)
      .filter(log => !startDate || new Date(log.timestamp) >= new Date(startDate))
      .filter(log => !endDate || new Date(log.timestamp) <= new Date(endDate));

    const grouped = new Map();
    logs.forEach((log) => {
      const key = `${log.action}::${log.resource_type}`;
      const current = grouped.get(key) || {
        action: log.action,
        resource_type: log.resource_type,
        count: 0,
        last_action: log.timestamp
      };

      current.count += 1;
      if (String(log.timestamp).localeCompare(String(current.last_action)) > 0) {
        current.last_action = log.timestamp;
      }

      grouped.set(key, current);
    });

    const activitySummary = [...grouped.values()].sort((a, b) => b.count - a.count);
    const recentActions = logs
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, 20)
      .map(({ action, resource_type, resource_id, timestamp, success }) => ({
        action,
        resource_type,
        resource_id,
        timestamp,
        success
      }));

    return response.success(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at
      },
      activitySummary,
      recentActions
    });
  }

  // Build date filter
  const dateConditions = [];
  const values = [userId];
  let paramCount = 2;

  if (startDate) {
    dateConditions.push(`timestamp >= $${paramCount}`);
    values.push(new Date(startDate));
    paramCount++;
  }

  if (endDate) {
    dateConditions.push(`timestamp <= $${paramCount}`);
    values.push(new Date(endDate));
    paramCount++;
  }

  const dateFilter = dateConditions.length > 0 ? `AND ${dateConditions.join(' AND ')}` : '';

  // Get activity summary
  const activityQuery = `
    SELECT
      action,
      resource_type,
      COUNT(*) as count,
      MAX(timestamp) as last_action
    FROM audit_logs
    WHERE user_id = $1 ${dateFilter}
    GROUP BY action, resource_type
    ORDER BY count DESC
  `;
  const activityResult = await db.query(activityQuery, values);

  // Get recent actions
  const recentQuery = `
    SELECT
      action, resource_type, resource_id,
      timestamp, success
    FROM audit_logs
    WHERE user_id = $1 ${dateFilter}
    ORDER BY timestamp DESC
    LIMIT 20
  `;
  const recentResult = await db.query(recentQuery, values);

  return response.success(res, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at
    },
    activitySummary: activityResult.rows,
    recentActions: recentResult.rows
  });
});

module.exports = {
  getDashboardStats,
  getAuditLogsController,
  getAuditStatsController,
  getSystemHealth,
  getUserActivity
};

// Made with Bob
