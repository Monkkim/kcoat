import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const isProd = process.env.NODE_ENV === 'production';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let isConnected = false;

function createPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return null;
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProd ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });
}

async function initializeDatabase(): Promise<boolean> {
  try {
    if (!pool) {
      pool = createPool();
      if (!pool) return false;
    }

    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message);
      isConnected = false;
    });

    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    db = drizzle(pool, { schema });
    isConnected = true;
    console.log('PostgreSQL connected successfully');
    return true;
  } catch (err: any) {
    console.error('Database connection error:', err.message);
    isConnected = false;
    return false;
  }
}

async function retryConnection(maxRetries = 3, delayMs = 2000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    console.log(`Database connection attempt ${i + 1}/${maxRetries}...`);
    const success = await initializeDatabase();
    if (success) return true;
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool;
}

function isDatabaseConnected() {
  return isConnected;
}

export { getDb as db, getPool as pool, retryConnection, isDatabaseConnected, initializeDatabase };
