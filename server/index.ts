import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupAuth } from './auth.js';
import { db } from './db/index.js';
import { blogPosts } from './db/schema.js';
import { eq, desc } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? 5000 : 3001;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

setupAuth(app);

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/blog-posts', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.userId, userId))
      .orderBy(desc(blogPosts.createdAt));
    res.json(posts);
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

app.post('/api/blog-posts', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { title, content, buildingName, workDate, productType, photoSets } = req.body;
    
    const [newPost] = await db
      .insert(blogPosts)
      .values({
        userId,
        title,
        content,
        buildingName,
        workDate,
        productType,
        photoSets
      })
      .returning();
    
    res.status(201).json(newPost);
  } catch (err) {
    console.error('Error creating blog post:', err);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

app.delete('/api/blog-posts/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const postId = parseInt(req.params.id as string);
    
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))
      .limit(1);
    
    if (!post || post.userId !== userId) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    await db.delete(blogPosts).where(eq(blogPosts.id, postId));
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting blog post:', err);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('/{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
