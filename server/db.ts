import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const isProd = process.env.NODE_ENV === 'production';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set!');
  if (isProd) {
    console.error('Production database not configured. Please ensure the database is properly set up in Replit.');
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

pool.on('connect', () => {
  console.log('PostgreSQL connected successfully');
});

export const db = drizzle(pool, { schema });
export { pool };
