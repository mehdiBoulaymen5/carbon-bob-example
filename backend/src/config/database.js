/**
 * Database Configuration and Connection Pool
 * PostgreSQL connection using pg library with optional file-backed fallback
 */

const { Pool } = require('pg');
require('dotenv').config();

const { isFileStorage } = require('./storage');

let pool = null;

/**
 * PostgreSQL connection pool configuration
 */
const poolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
} : {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'admin_system',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

if (!isFileStorage()) {
  pool = new Pool(poolConfig);

  pool.on('connect', () => {
    console.log('✓ Database connected successfully');
  });

  pool.on('error', (err) => {
    console.error('✗ Unexpected database error:', err);
    process.exit(-1);
  });
}

/**
 * Execute a query with error handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
  if (isFileStorage()) {
    throw new Error('Direct SQL queries are not available in file storage mode');
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: result.rowCount });
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
const getClient = async () => {
  if (isFileStorage()) {
    throw new Error('Database clients are not available in file storage mode');
  }

  const client = await pool.connect();
  const clientQuery = client.query;
  const release = client.release;

  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  client.query = (...args) => {
    client.lastQuery = args;
    return clientQuery.apply(client, args);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = clientQuery;
    client.release = release;
    return release.apply(client);
  };

  return client;
};

/**
 * Execute a transaction
 * @param {Function} callback - Transaction callback function
 * @returns {Promise<any>} Transaction result
 */
const transaction = async (callback) => {
  if (isFileStorage()) {
    return callback(null);
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Test database connection and retry if failed
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in milliseconds
 */
const testConnection = async (retries = 5, delay = 5000) => {
  if (isFileStorage()) {
    console.log('✓ File storage mode enabled - skipping database connection test');
    return true;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const result = await query('SELECT NOW()');
      console.log('✓ Database connection test successful:', result.rows[0].now);
      return true;
    } catch (error) {
      console.error(`✗ Database connection attempt ${i + 1}/${retries} failed:`, error.message);

      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('✗ All database connection attempts failed');
        throw error;
      }
    }
  }
};

/**
 * Close all database connections
 */
const closePool = async () => {
  if (isFileStorage()) {
    console.log('✓ File storage mode shutdown complete');
    return;
  }

  await pool.end();
  console.log('✓ Database pool closed');
};

module.exports = {
  query,
  getClient,
  transaction,
  testConnection,
  closePool,
  pool
};

// Made with Bob
