// src/config/database.ts — PostgreSQL Connection Pool

import { Pool, PoolClient } from 'pg';
import { env } from './env';

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,                  // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Log pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

/**
 * Execute a query using a pool connection.
 */
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number | null }> => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (env.isDev) {
    console.log('[DB]', { text: text.substring(0, 80), duration, rows: result.rowCount });
  }

  return result;
};

/**
 * Get a client from the pool for transactions.
 */
export const getClient = (): Promise<PoolClient> => pool.connect();

/**
 * Test database connectivity.
 */
export const testConnection = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected successfully');

    // Automatically check and alter the users table to add profile columns if they do not exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS admin_name VARCHAR(100) DEFAULT 'Admin User',
      ADD COLUMN IF NOT EXISTS shop_name VARCHAR(150) DEFAULT 'Sai Fertilizers & Chemicals',
      ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20) DEFAULT '+91 98765 43210',
      ADD COLUMN IF NOT EXISTS address TEXT DEFAULT 'NH Road, Shop No. 12, Main Market',
      ADD COLUMN IF NOT EXISTS gstin VARCHAR(50) DEFAULT '33AAAAA1111A1Z1';
    `);
    console.log('✅ Database schema verified and updated (users table profile columns)');
  } finally {
    client.release();
  }
};

export default pool;
