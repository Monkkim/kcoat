import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express } from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { users, insertUserSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, type SelectUser } from './db/schema.js';
import { db, pool } from './db/index.js';
import { eq } from 'drizzle-orm';

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
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'kcoat-studio-secret-key-2024',
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

  app.post('/api/register', async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues[0]?.message || '입력값이 올바르지 않습니다' });
      }

      const [existingUser] = await getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ error: '이미 등록된 이메일입니다' });
      }

      const hashedPassword = await hashPassword(result.data.password);
      const [user] = await db.insert(users).values({
        name: result.data.name,
        email: result.data.email,
        password: hashedPassword,
      }).returning();

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
        }
        res.status(201).json({ 
          id: user.id, 
          name: user.name, 
          email: user.email 
        });
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다' });
    }
  });

  app.post('/api/login', (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message || '입력값이 올바르지 않습니다' });
    }

    passport.authenticate('local', (err: any, user: SelectUser | false, info: { message: string }) => {
      if (err) {
        return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || '이메일 또는 비밀번호가 올바르지 않습니다' });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
        }
        res.json({ 
          id: user.id, 
          name: user.name, 
          email: user.email 
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
      email: user.email 
    });
  });

  app.post('/api/forgot-password', async (req, res) => {
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
