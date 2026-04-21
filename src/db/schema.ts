/**
 * Drizzle ORM スキーマ定義 (SQLite)
 *
 * テーブル: users / sessions / environment_inputs / emotion_results
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ===== users =====
// Phase 2 では認証スコープ外。将来のマルチユーザー対応のためスキーマだけ用意する。
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ===== sessions =====
// 分析セッション単位 (例: "2024年の自己分析")
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ===== environment_inputs =====
// 1セッション × 1年齢区分で一意 (upsert対象)
export const environmentInputs = sqliteTable(
  'environment_inputs',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    ageRange: text('age_range').notNull(), // '0-5' | '6-10' | '11-15' | '16-20'
    familyAffection: integer('family_affection').notNull(),
    familyStability: integer('family_stability').notNull(),
    familyControl: integer('family_control').notNull(),
    schoolBelonging: integer('school_belonging').notNull(),
    schoolStress: integer('school_stress').notNull(),
    schoolSocialSuccess: integer('school_social_success').notNull(),
    eventsStressCount: integer('events_stress_count').notNull(),
    eventsSuccessCount: integer('events_success_count').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    sessionAgeUnique: uniqueIndex('environment_inputs_session_age_unique').on(
      table.sessionId,
      table.ageRange
    ),
  })
);

// ===== emotion_results =====
// 計算結果履歴。最新1件の取得と履歴閲覧の両方に使う
export const emotionResults = sqliteTable('emotion_results', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  calculatedAt: integer('calculated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  resultJson: text('result_json').notNull(), // EmotionProfile を JSON 化した文字列
});

// ===== 型エクスポート =====
export type UserRow = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type EnvironmentInputRow = typeof environmentInputs.$inferSelect;
export type EmotionResultRow = typeof emotionResults.$inferSelect;
