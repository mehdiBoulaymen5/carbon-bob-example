/**
 * Publication Repository
 * Database operations for publications table
 */

const BaseRepository = require('./base.repository');
const { PUBLICATION_STATUS } = require('../config/constants');

class PublicationRepository extends BaseRepository {
  constructor() {
    super('publications');
  }

  /**
   * Find published publications
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Publications
   */
  async findPublished(options = {}) {
    return this.findAll({
      ...options,
      where: { status: PUBLICATION_STATUS.PUBLISHED, ...options.where }
    });
  }

  /**
   * Get paginated published publications
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results
   */
  async paginatePublished(options = {}) {
    return this.paginate({
      ...options,
      where: { status: PUBLICATION_STATUS.PUBLISHED, ...options.where }
    });
  }

  /**
   * Search publications by text
   * @param {string} searchQuery - Search query
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Publications
   */
  async search(searchQuery, options = {}) {
    const { limit = 20, offset = 0, status = null } = options;
    
    let whereClause = `WHERE (
      title ILIKE $1 OR
      description ILIKE $1 OR
      topics::text ILIKE $1
    )`;
    
    const values = [`%${searchQuery}%`];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    const query = `
      SELECT *
      FROM ${this.tableName}
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    values.push(limit, offset);
    const result = await this.raw(query, values);
    return result.rows;
  }

  /**
   * Get publication count by status
   * @returns {Promise<Object>} Status counts
   */
  async getStatusCounts() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM ${this.tableName}
      GROUP BY status
    `;
    
    const result = await this.raw(query);
    return result.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});
  }

  /**
   * Increment view count
   * @param {string} publicationId - Publication ID
   * @returns {Promise<Object>} Updated publication
   */
  async incrementViewCount(publicationId) {
    const query = `
      UPDATE ${this.tableName}
      SET view_count = view_count + 1
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.raw(query, [publicationId]);
    return result.rows[0];
  }

  /**
   * Get top viewed publications
   * @param {number} limit - Number of publications to return
   * @returns {Promise<Array>} Publications
   */
  async getTopViewed(limit = 10) {
    return this.findAll({
      where: { status: PUBLICATION_STATUS.PUBLISHED },
      orderBy: { view_count: 'DESC' },
      limit
    });
  }

  /**
   * Get recent publications
   * @param {number} limit - Number of publications to return
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} Publications
   */
  async getRecent(limit = 10, status = null) {
    const options = {
      orderBy: { created_at: 'DESC' },
      limit
    };
    
    if (status) {
      options.where = { status };
    }
    
    return this.findAll(options);
  }

  /**
   * Bulk delete publications
   * @param {Array} ids - Publication IDs
   * @returns {Promise<Array>} Deleted publications
   */
  async bulkDelete(ids) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE id = ANY($1)
      RETURNING *
    `;
    
    const result = await this.raw(query, [ids]);
    return result.rows;
  }

  /**
   * Get publications by topic
   * @param {string} topic - Topic name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Publications
   */
  async findByTopic(topic, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    const query = `
      SELECT *
      FROM ${this.tableName}
      WHERE $1 = ANY(topics)
      AND status = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await this.raw(query, [
      topic,
      PUBLICATION_STATUS.PUBLISHED,
      limit,
      offset
    ]);
    
    return result.rows;
  }

  /**
   * Get all unique topics
   * @returns {Promise<Array>} Array of topics
   */
  async getAllTopics() {
    const query = `
      SELECT DISTINCT unnest(topics) as topic
      FROM ${this.tableName}
      WHERE status = $1
      ORDER BY topic
    `;
    
    const result = await this.raw(query, [PUBLICATION_STATUS.PUBLISHED]);
    return result.rows.map(row => row.topic);
  }

  /**
   * Get publication statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'published') as published,
        COUNT(*) FILTER (WHERE status = 'draft') as draft,
        SUM(view_count) as total_views,
        AVG(view_count) as avg_views
      FROM ${this.tableName}
    `;
    
    const result = await this.raw(query);
    const stats = result.rows[0];
    
    return {
      total: parseInt(stats.total),
      published: parseInt(stats.published),
      draft: parseInt(stats.draft),
      totalViews: parseInt(stats.total_views) || 0,
      avgViews: parseFloat(stats.avg_views) || 0
    };
  }

  /**
   * Find related publications
   * @param {string} publicationId - Publication ID
   * @param {number} limit - Number of related publications
   * @returns {Promise<Array>} Related publications
   */
  async findRelated(publicationId, limit = 3) {
    const query = `
      WITH current_pub AS (
        SELECT topics FROM ${this.tableName} WHERE id = $1
      )
      SELECT p.*,
        (
          SELECT COUNT(*)
          FROM unnest(p.topics) topic
          WHERE topic = ANY(SELECT unnest(topics) FROM current_pub)
        ) as matching_topics
      FROM ${this.tableName} p
      WHERE p.id != $1
        AND p.status = $2
        AND p.topics && (SELECT topics FROM current_pub)
      ORDER BY matching_topics DESC, p.created_at DESC
      LIMIT $3
    `;
    
    const result = await this.raw(query, [
      publicationId,
      PUBLICATION_STATUS.PUBLISHED,
      limit
    ]);
    
    return result.rows;
  }
}

module.exports = new PublicationRepository();

// Made with Bob
