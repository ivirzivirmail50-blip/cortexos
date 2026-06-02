import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users (Clerk ile sync)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Dökümanlar / notlar
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('note'),
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Hedefler
export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('active'),
  priority: integer('priority').default(1),
  deadline: timestamp('deadline'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Görevler
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('todo'),
  priority: integer('priority').default(1),
  dueDate: timestamp('due_date'),
  estimatedTime: integer('estimated_time'),
  actualTime: integer('actual_time'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Ajan oturumları
export const agentSessions = pgTable('agent_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  agentType: varchar('agent_type', { length: 100 }),
  title: varchar('title', { length: 300 }),
  status: varchar('status', { length: 50 }).default('active'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Mesajlar
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => agentSessions.id, { onDelete: 'cascade' }).notNull(),
  senderType: varchar('sender_type', { length: 50 }).notNull(),
  senderId: varchar('sender_id', { length: 255 }),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('text'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reflection kayıtları
export const reflections = pgTable('reflections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  period: varchar('period', { length: 50 }).notNull(), // 'daily' | 'weekly'
  content: text('content').notNull(),
  insights: jsonb('insights'),
  mood: integer('mood'), // 1-10
  date: timestamp('date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// İlişkiler
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  goals: many(goals),
  tasks: many(tasks),
  agentSessions: many(agentSessions),
  reflections: many(reflections),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  goal: one(goals, { fields: [tasks.goalId], references: [goals.id] }),
}));
