import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupAuth } from './auth';
import { retryConnection, isDatabaseConnected, pool } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const PORT = isProd ? 5000 : 3001;

app.use(cors({
  origin: isProd ? true : ['http://localhost:5000', 'http://0.0.0.0:5000'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

async function initDatabase() {
  try {
    const dbPool = pool();
    
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log('Database tables initialized');
  } catch (err: any) {
    console.error('Database initialization error:', err.message);
    throw err;
  }
}

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: isDatabaseConnected(),
    environment: isProd ? 'production' : 'development'
  });
});

if (isProd) {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
}

async function startServer() {
  console.log(`Starting server in ${isProd ? 'production' : 'development'} mode...`);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  const dbConnected = await retryConnection(5, 3000);
  
  if (!dbConnected) {
    console.error('Failed to connect to database after retries');
    if (isProd) {
      console.error('Production requires database. Check DATABASE_URL configuration.');
      process.exit(1);
    }
  } else {
    await initDatabase();
    setupAuth(app);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database connected: ${isDatabaseConnected()}`);
  });
}

startServer();
