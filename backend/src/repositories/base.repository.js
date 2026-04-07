/**
 * Base Repository
 * Provides common database operations and query building
 */

const db = require('../config/database');
const { PAGINATION } = require('../config/constants');
const { isFileStorage } = require('../config/storage');
const FileRepository = require('./file.repository');

/**
 * Base Repository class with common CRUD operations
 */
class BaseRepository {
  /**
   * Constructor
   * @param {string} tableName - Name of the database table
   */
  constructor(tableName) {
    this.tableName = tableName;
    this.fileRepository = isFileStorage() ? new FileRepository(tableName) : null;
  }

  /**
   * Find all records with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {Object} options.where - WHERE conditions
   * @param {Array} options.select - Columns to select
   * @param {Object} options.orderBy - Order by clause
   * @param {number} options.limit - Limit
   * @param {number} options.offset - Offset
   * @returns {Promise<Array>} Array of records
   */
  async findAll(options = {}) {
    if (this.fileRepository) {
      return this.fileRepository.findAll(options);
    }

    const {
      where = {},
      arrayOverlap = {},
      search = '',
      select = ['*'],
      orderBy = { created_at: 'DESC' },
      limit = PAGINATION.DEFAULT_LIMIT,
      offset = 0
    } = options;

    const { whereClause, values } = this.buildWhereClause(where, arrayOverlap, search);
    const selectClause = select.join(', ');
    const orderByClause = this.buildOrderByClause(orderBy);

    const query = `
      SELECT ${selectClause}
      FROM ${this.tableName}
      ${whereClause}
      ${orderByClause}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(limit, offset);
    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Find one record by conditions
   * @param {Object} where - WHERE conditions
   * @param {Array} select - Columns to select
   * @returns {Promise<Object|null>} Record or null
   */
  async findOne(where, select = ['*']) {
    if (this.fileRepository) {
      return this.fileRepository.findOne(where, select);
    }

    const { whereClause, values } = this.buildWhereClause(where);
    const selectClause = select.join(', ');

    const query = `
      SELECT ${selectClause}
      FROM ${this.tableName}
      ${whereClause}
      LIMIT 1
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Find record by ID
   * @param {string|number} id - Record ID
   * @param {Array} select - Columns to select
   * @returns {Promise<Object|null>} Record or null
   */
  async findById(id, select = ['*']) {
    return this.findOne({ id }, select);
  }

  /**
   * Count records with optional filtering
   * @param {Object} where - WHERE conditions
   * @param {Object} arrayOverlap - Array overlap conditions
   * @param {string} search - Search query
   * @returns {Promise<number>} Count
   */
  async count(where = {}, arrayOverlap = {}, search = '') {
    if (this.fileRepository) {
      return this.fileRepository.count(where, arrayOverlap, search);
    }

    const { whereClause, values } = this.buildWhereClause(where, arrayOverlap, search);

    const query = `
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
    `;

    const result = await db.query(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @param {Array} returning - Columns to return
   * @returns {Promise<Object>} Created record
   */
  async create(data, returning = ['*']) {
    if (this.fileRepository) {
      return this.fileRepository.create(data, returning);
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const returningClause = returning.join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING ${returningClause}
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update record(s)
   * @param {Object} where - WHERE conditions
   * @param {Object} data - Data to update
   * @param {Array} returning - Columns to return
   * @returns {Promise<Array>} Updated records
   */
  async update(where, data, returning = ['*']) {
    if (this.fileRepository) {
      return this.fileRepository.update(where, data, returning);
    }

    const { whereClause, values: whereValues } = this.buildWhereClause(where);

    const setClause = Object.keys(data)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');

    const values = [...Object.values(data), ...whereValues];
    const returningClause = returning.join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      ${whereClause.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num, 10) + Object.keys(data).length}`)}
      RETURNING ${returningClause}
    `;

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Update record by ID
   * @param {string|number} id - Record ID
   * @param {Object} data - Data to update
   * @param {Array} returning - Columns to return
   * @returns {Promise<Object|null>} Updated record or null
   */
  async updateById(id, data, returning = ['*']) {
    const results = await this.update({ id }, data, returning);
    return results[0] || null;
  }

  /**
   * Delete record(s)
   * @param {Object} where - WHERE conditions
   * @param {Array} returning - Columns to return
   * @returns {Promise<Array>} Deleted records
   */
  async delete(where, returning = ['*']) {
    if (this.fileRepository) {
      return this.fileRepository.delete(where, returning);
    }

    const { whereClause, values } = this.buildWhereClause(where);
    const returningClause = returning.join(', ');

    const query = `
      DELETE FROM ${this.tableName}
      ${whereClause}
      RETURNING ${returningClause}
    `;

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Delete record by ID
   * @param {string|number} id - Record ID
   * @param {Array} returning - Columns to return
   * @returns {Promise<Object|null>} Deleted record or null
   */
  async deleteById(id, returning = ['*']) {
    const results = await this.delete({ id }, returning);
    return results[0] || null;
  }

  /**
   * Soft delete (set deleted_at timestamp)
   * @param {Object} where - WHERE conditions
   * @returns {Promise<Array>} Soft deleted records
   */
  async softDelete(where) {
    return this.update(where, { deleted_at: new Date() });
  }

  /**
   * Check if record exists
   * @param {Object} where - WHERE conditions
   * @returns {Promise<boolean>} True if exists
   */
  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Get paginated results
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results with metadata
   */
  async paginate(options = {}) {
    if (this.fileRepository) {
      return this.fileRepository.paginate(options);
    }

    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      ...queryOptions
    } = options;

    const safeLimit = Math.min(Math.max(limit, PAGINATION.MIN_LIMIT), PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * safeLimit;

    const [items, totalCount] = await Promise.all([
      this.findAll({ ...queryOptions, limit: safeLimit, offset }),
      this.count(queryOptions.where || {}, queryOptions.arrayOverlap || {}, queryOptions.search || '')
    ]);

    return {
      items,
      pagination: {
        page,
        limit: safeLimit,
        totalPages: Math.ceil(totalCount / safeLimit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / safeLimit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Build WHERE clause from conditions object
   * @param {Object} conditions - WHERE conditions
   * @param {Object} arrayOverlap - Array overlap conditions (PostgreSQL && operator)
   * @param {string} search - Search query for text fields
   * @returns {Object} WHERE clause and values
   */
  buildWhereClause(conditions, arrayOverlap = {}, search = '') {
    const clauses = [];
    const values = [];
    let paramCount = 1;

    const keys = Object.keys(conditions);
    keys.forEach(key => {
      const value = conditions[key];

      if (value === null) {
        clauses.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramCount++}`).join(', ');
        clauses.push(`${key} IN (${placeholders})`);
        values.push(...value);
      } else if (typeof value === 'object' && value.operator) {
        clauses.push(`${key} ${value.operator} $${paramCount++}`);
        values.push(value.value);
      } else {
        clauses.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    });

    const overlapKeys = Object.keys(arrayOverlap);
    overlapKeys.forEach(key => {
      const value = arrayOverlap[key];
      if (Array.isArray(value) && value.length > 0) {
        clauses.push(`${key} && $${paramCount++}::text[]`);
        values.push(value);
      }
    });

    if (search) {
      const searchPattern = `%${search}%`;
      clauses.push(`(
        title ILIKE $${paramCount} OR
        description ILIKE $${paramCount} OR
        topics::text ILIKE $${paramCount}
      )`);
      values.push(searchPattern);
      paramCount++;
    }

    if (clauses.length === 0) {
      return { whereClause: '', values: [] };
    }

    return {
      whereClause: `WHERE ${clauses.join(' AND ')}`,
      values
    };
  }

  /**
   * Build ORDER BY clause
   * @param {Object} orderBy - Order by object
   * @returns {string} ORDER BY clause
   */
  buildOrderByClause(orderBy = {}) {
    const entries = Object.entries(orderBy);

    if (entries.length === 0) {
      return '';
    }

    const clauses = entries.map(([column, direction]) => {
      const safeDirection = String(direction).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      return `${column} ${safeDirection}`;
    });

    return `ORDER BY ${clauses.join(', ')}`;
  }

  /**
   * Execute raw query
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async raw(query, params = []) {
    if (this.fileRepository) {
      return this.fileRepository.raw(query, params);
    }

    return db.query(query, params);
  }
}

module.exports = BaseRepository;

// Made with Bob
