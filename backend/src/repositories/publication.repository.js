/**
 * Publication Repository
 * Database operations for publications table
 */

const BaseRepository = require('./base.repository');
const { PUBLICATION_STATUS } = require('../config/constants');
const { isFileStorage } = require('../config/storage');

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
    if (isFileStorage()) {
      return this.findAll({
        ...options,
        search: searchQuery,
        where: options.status ? { status: options.status } : options.where
      });
    }

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
    if (isFileStorage()) {
      const publications = await this.findAll({
        limit: Number.MAX_SAFE_INTEGER,
        offset: 0
      });

      return publications.reduce((acc, publication) => {
        acc[publication.status] = (acc[publication.status] || 0) + 1;
        return acc;
      }, {});
    }

    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM ${this.tableName}
      GROUP BY status
    `;

    const result = await this.raw(query);
    return result.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {});
  }

  /**
   * Increment view count
   * @param {string} publicationId - Publication ID
   * @returns {Promise<Object>} Updated publication
   */
  async incrementViewCount(publicationId) {
    if (isFileStorage()) {
      const publication = await this.findById(publicationId);

      if (!publication) {
        return null;
      }

      return this.updateById(publicationId, {
        view_count: (publication.view_count || 0) + 1
      });
    }

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
    if (isFileStorage()) {
      return this.delete({ id: ids });
    }

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
    if (isFileStorage()) {
      return this.findAll({
        ...options,
        where: { ...(options.where || {}), status: PUBLICATION_STATUS.PUBLISHED },
        arrayOverlap: { ...(options.arrayOverlap || {}), topics: [topic] }
      });
    }

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
    if (isFileStorage()) {
      const publications = await this.findAll({
        where: { status: PUBLICATION_STATUS.PUBLISHED },
        limit: Number.MAX_SAFE_INTEGER,
        offset: 0
      });

      return [...new Set(
        publications.flatMap(publication => Array.isArray(publication.topics) ? publication.topics : [])
      )].sort();
    }

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
    if (isFileStorage()) {
      const publications = await this.findAll({
        limit: Number.MAX_SAFE_INTEGER,
        offset: 0
      });

      const total = publications.length;
      const published = publications.filter(item => item.status === PUBLICATION_STATUS.PUBLISHED).length;
      const draft = publications.filter(item => item.status === PUBLICATION_STATUS.DRAFT).length;
      const totalViews = publications.reduce((sum, item) => sum + (item.view_count || 0), 0);

      return {
        total,
        published,
        draft,
        totalViews,
        avgViews: total === 0 ? 0 : totalViews / total
      };
    }

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
      total: parseInt(stats.total, 10),
      published: parseInt(stats.published, 10),
      draft: parseInt(stats.draft, 10),
      totalViews: parseInt(stats.total_views, 10) || 0,
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
    if (isFileStorage()) {
      const currentPublication = await this.findById(publicationId);

      if (!currentPublication) {
        return [];
      }

      const currentTopics = Array.isArray(currentPublication.topics) ? currentPublication.topics : [];
      const publications = await this.findAll({
        where: { status: PUBLICATION_STATUS.PUBLISHED },
        limit: Number.MAX_SAFE_INTEGER,
        offset: 0
      });

      return publications
        .filter(publication => publication.id !== publicationId)
        .map(publication => {
          const topics = Array.isArray(publication.topics) ? publication.topics : [];
          const matchingTopics = topics.filter(topic => currentTopics.includes(topic)).length;
          return { ...publication, matching_topics: matchingTopics };
        })
        .filter(publication => publication.matching_topics > 0)
        .sort((a, b) => {
          if (b.matching_topics !== a.matching_topics) {
            return b.matching_topics - a.matching_topics;
          }

          return String(b.created_at).localeCompare(String(a.created_at));
        })
        .slice(0, limit);
    }

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
