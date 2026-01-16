import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { readFileSync, existsSync } from 'fs';
import * as schema from './schema.js';

function getDatabaseUrl(): string {
  if (existsSync('/tmp/replitdb')) {
    try {
      return readFileSync('/tmp/replitdb', 'utf-8').trim();
    } catch {
      // Fall through to environment variable
    }
  }
  return process.env.DATABASE_URL || '';
}

export const pool = new Pool({
  connectionString: getDatabaseUrl(),
});

export const db = drizzle(pool, { schema });
