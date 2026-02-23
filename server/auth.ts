import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express } from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { users, activityLogs, insertUserSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, type SelectUser } from './db/schema.js';
import { db, pool } from './db/index.js';
import { eq, count } from 'drizzle-orm';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const PostgresSessionStore = connectPg(session);

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

async function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email)).limit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function setupAuth(app: Express) {
  const store = new PostgresSessionStore({ 
    pool, 
    createTableIfMissing: true,
    tableName: 'session'
  });
  
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET 환경변수가 설정되지 않았습니다. 프로덕션에서는 반드시 설정해야 합니다.');
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'kcoat-dev-only-secret',
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const [user] = await getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다' });
          }
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다' });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: '너무 많은 요청이 발생했습니다. 15분 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.post('/api/register', authLimiter, async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues[0]?.message || '입력값이 올바르지 않습니다' });
      }

      const [existingUser] = await getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ error: '이미 등록된 이메일입니다' });
      }

      const [userCount] = await db.select({ value: count() }).from(users);
      const isFirstUser = userCount.value === 0;
      const isDefaultAdmin = process.env.DEFAULT_ADMIN_EMAIL ? result.data.email === process.env.DEFAULT_ADMIN_EMAIL : false;

      const hashedPassword = await hashPassword(result.data.password);
      const [user] = await db.insert(users).values({
        name: result.data.name,
        email: result.data.email,
        password: hashedPassword,
        role: (isFirstUser || isDefaultAdmin) ? 'admin' : 'user',
        approved: (isFirstUser || isDefaultAdmin) ? true : false,
      }).returning();

      await db.insert(activityLogs).values({
        userId: user.id,
        action: 'register',
        details: `회원가입: ${user.name} (${user.email})`,
      });

      if (!user.approved) {
        return res.status(201).json({ 
          needsApproval: true, 
          message: '관리자 승인을 기다려주세요' 
        });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
        }
        res.status(201).json({ 
          id: user.id, 
          name: user.name, 
          email: user.email,
          role: user.role,
          approved: user.approved
        });
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다' });
    }
  });

  app.post('/api/login', authLimiter, (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message || '입력값이 올바르지 않습니다' });
    }

    passport.authenticate('local', async (err: any, user: SelectUser | false, info: { message: string }) => {
      if (err) {
        return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || '이메일 또는 비밀번호가 올바르지 않습니다' });
      }
      const isDefaultAdmin = process.env.DEFAULT_ADMIN_EMAIL ? user.email === process.env.DEFAULT_ADMIN_EMAIL : false;
      if (isDefaultAdmin && (!user.approved || user.role !== 'admin')) {
        try {
          const [updated] = await db.update(users).set({ role: 'admin', approved: true }).where(eq(users.id, user.id)).returning();
          if (updated) user = updated;
        } catch (e) {
          console.error('Failed to auto-promote default admin:', e);
          return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
        }
      }
      if (!user.approved) {
        return res.status(403).json({ error: '관리자 승인을 기다려주세요. 승인 후 로그인이 가능합니다.' });
      }
      req.login(user, async (err) => {
        if (err) {
          return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
        }
        await db.insert(activityLogs).values({
          userId: user.id,
          action: 'login',
          details: `로그인: ${user.name}`,
        });
        res.json({ 
          id: user.id, 
          name: user.name, 
          email: user.email,
          role: user.role,
          approved: user.approved
        });
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: '로그아웃 처리 중 오류가 발생했습니다' });
      }
      res.json({ message: '로그아웃되었습니다' });
    });
  });

  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: '로그인이 필요합니다' });
    }
    const user = req.user as SelectUser;
    res.json({ 
      id: user.id, 
      name: user.name, 
      email: user.email,
      role: user.role,
      approved: user.approved
    });
  });

  app.post('/api/forgot-password', authLimiter, async (req, res) => {
    try {
      const result = forgotPasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues[0]?.message || '올바른 이메일을 입력해주세요' });
      }

      const [user] = await getUserByEmail(result.data.email);
      if (!user) {
        return res.json({ message: '비밀번호 재설정 링크가 이메일로 전송되었습니다' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await db.update(users)
        .set({ resetToken, resetTokenExpiry })
        .where(eq(users.id, user.id));

      const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@kcoat.studio',
          to: user.email,
          subject: 'K-COAT Studio 비밀번호 재설정',
          html: `
            <h2>비밀번호 재설정</h2>
            <p>아래 링크를 클릭하여 비밀번호를 재설정해주세요:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>이 링크는 1시간 후 만료됩니다.</p>
          `,
        });
      } else {
        console.log('Password reset link:', resetUrl);
      }

      res.json({ message: '비밀번호 재설정 링크가 이메일로 전송되었습니다' });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: '비밀번호 재설정 처리 중 오류가 발생했습니다' });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      const result = resetPasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues[0]?.message || '입력값이 올바르지 않습니다' });
      }

      const [user] = await db.select().from(users)
        .where(eq(users.resetToken, result.data.token))
        .limit(1);

      if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        return res.status(400).json({ error: '유효하지 않거나 만료된 토큰입니다' });
      }

      const hashedPassword = await hashPassword(result.data.password);
      await db.update(users)
        .set({ 
          password: hashedPassword, 
          resetToken: null, 
          resetTokenExpiry: null 
        })
        .where(eq(users.id, user.id));

      res.json({ message: '비밀번호가 성공적으로 변경되었습니다' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다' });
    }
  });
}
