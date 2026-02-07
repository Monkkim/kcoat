import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupAuth } from './auth.js';
import { db } from './db/index.js';
import { users, blogPosts, activityLogs } from './db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';

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

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
  if ((req.user as any).role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
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
    const { title, content, buildingName, workDate, productType, photoSets, status } = req.body;
    
    const [newPost] = await db
      .insert(blogPosts)
      .values({
        userId,
        title,
        content: content || '',
        buildingName,
        workDate,
        productType,
        photoSets,
        status: status || 'completed'
      })
      .returning();

    await db.insert(activityLogs).values({
      userId,
      action: 'blog_create',
      details: `블로그 생성: ${title}`,
    });
    
    res.status(201).json(newPost);
  } catch (err) {
    console.error('Error creating blog post:', err);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

app.put('/api/blog-posts/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const postId = parseInt(req.params.id as string);
    const { title, content, hashtags, status } = req.body;
    
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))
      .limit(1);
    
    if (!post || post.userId !== userId) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (status !== undefined) updateData.status = status;
    
    const [updatedPost] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, postId))
      .returning();
    
    res.json(updatedPost);
  } catch (err) {
    console.error('Error updating blog post:', err);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

app.patch('/api/blog-posts/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const postId = parseInt(req.params.id as string);
    const { content } = req.body;
    
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))
      .limit(1);
    
    if (!post || post.userId !== userId) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    await db.update(blogPosts)
      .set({ content })
      .where(eq(blogPosts.id, postId));
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error patching blog post:', err);
    res.status(500).json({ error: 'Failed to patch blog post' });
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

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        approved: users.approved,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    res.json(allUsers);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id as string);
    await db.update(users).set({ approved: true }).where(eq(users.id, userId));
    await db.insert(activityLogs).values({
      userId: req.user!.id,
      action: 'user_approve',
      details: `회원 승인: ID ${userId}`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

app.post('/api/admin/users/:id/reject', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id as string);
    await db.insert(activityLogs).values({
      userId: req.user!.id,
      action: 'user_reject',
      details: `회원 거절: ID ${userId}`,
    });
    await db.delete(users).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (err) {
    console.error('Error rejecting user:', err);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

app.post('/api/admin/users/:id/set-admin', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id as string);
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, userId));
    await db.insert(activityLogs).values({
      userId: req.user!.id,
      action: 'set_admin',
      details: `관리자 지정: ID ${userId}`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error setting admin:', err);
    res.status(500).json({ error: 'Failed to set admin' });
  }
});

app.post('/api/admin/users/:id/remove-admin', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id as string);
    if (userId === req.user!.id) {
      return res.status(400).json({ error: '자신의 관리자 권한은 해제할 수 없습니다' });
    }
    await db.update(users).set({ role: 'user' }).where(eq(users.id, userId));
    await db.insert(activityLogs).values({
      userId: req.user!.id,
      action: 'remove_admin',
      details: `관리자 해제: ID ${userId}`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error removing admin:', err);
    res.status(500).json({ error: 'Failed to remove admin' });
  }
});

app.get('/api/admin/activity-logs', requireAdmin, async (req, res) => {
  try {
    const logs = await db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(100);
    res.json(logs);
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
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
