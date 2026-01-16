import express from 'express';
import cors from 'cors';
import { setupAuth } from './auth';
import { db, pool } from './db';
import { users } from './schema';
import { sql } from 'drizzle-orm';

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5000', 'http://0.0.0.0:5000'],
  credentials: true,
}));
app.use(express.json());

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

setupAuth(app);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});
