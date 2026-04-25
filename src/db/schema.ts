/**
 * Drizzle ORM スキーマ定義 (Postgres / Supabase)
 *
 * テーブル: users / sessions / environment_inputs / emotion_results / saved_actions
 */

import { integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// ===== users =====
// Phase 2 では認証スコープ外。将来のマルチユーザー対応のためスキーマだけ用意する。
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===== sessions =====
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===== environment_inputs =====
// 1セッション × 1年齢区分で一意 (upsert対象)
export const environmentInputs = pgTable(
  'environment_inputs',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    ageRange: text('age_range').notNull(),
    familyAffection: integer('family_affection').notNull(),
    familyStability: integer('family_stability').notNull(),
    familyControl: integer('family_control').notNull(),
    schoolBelonging: integer('school_belonging').notNull(),
    schoolStress: integer('school_stress').notNull(),
    schoolSocialSuccess: integer('school_social_success').notNull(),
    eventsStressCount: integer('events_stress_count').notNull(),
    eventsSuccessCount: integer('events_success_count').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionAgeUnique: uniqueIndex('environment_inputs_session_age_unique').on(
      table.sessionId,
      table.ageRange
    ),
  })
);

// ===== emotion_results =====
export const emotionResults = pgTable('emotion_results', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  resultJson: text('result_json').notNull(),
});

// ===== saved_actions =====
export const savedActions = pgTable('saved_actions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  actionText: text('action_text').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull().default('saved'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===== 型エクスポート =====
export type UserRow = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type EnvironmentInputRow = typeof environmentInputs.$inferSelect;
export type EmotionResultRow = typeof emotionResults.$inferSelect;
export type SavedActionRow = typeof savedActions.$inferSelect;
