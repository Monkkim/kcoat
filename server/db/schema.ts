import { pgTable, serial, varchar, timestamp, text, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  approved: boolean('approved').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = typeof users.$inferSelect;

export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull().default(''),
  buildingName: varchar('building_name', { length: 255 }),
  workDate: varchar('work_date', { length: 50 }),
  productType: varchar('product_type', { length: 100 }),
  photoSets: jsonb('photo_sets'),
  hashtags: text('hashtags').default(''),
  status: varchar('status', { length: 20 }).notNull().default('generating'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts, {
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type SelectBlogPost = typeof blogPosts.$inferSelect;

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
