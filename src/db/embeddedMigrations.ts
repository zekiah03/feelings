/**
 * ファイルシステム read-only 環境 (Vercel 等 serverless) 向けに、
 * drizzle-kit が生成したマイグレーション SQL をコードに埋め込む。
 *
 * - 冪等性のため CREATE TABLE IF NOT EXISTS / CREATE UNIQUE INDEX IF NOT EXISTS に揃える
 * - drizzle-kit の `__drizzle_migrations` テーブルは使わない (スキーマは CREATE IF NOT EXISTS で idempotent)
 * - スキーマに破壊的変更を加える場合は、この配列に追記するだけでは不十分で、
 *   drizzle-kit generate の方で差分マイグレーションを作り、そこも反映する必要がある。
 */

export const EMBEDDED_MIGRATIONS: string[] = [
  // 0000: users / sessions / environment_inputs / emotion_results
  `
  CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY NOT NULL,
    created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    label text NOT NULL,
    created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
  );
  CREATE TABLE IF NOT EXISTS environment_inputs (
    id text PRIMARY KEY NOT NULL,
    session_id text NOT NULL,
    age_range text NOT NULL,
    family_affection integer NOT NULL,
    family_stability integer NOT NULL,
    family_control integer NOT NULL,
    school_belonging integer NOT NULL,
    school_stress integer NOT NULL,
    school_social_success integer NOT NULL,
    events_stress_count integer NOT NULL,
    events_success_count integer NOT NULL,
    created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON UPDATE no action ON DELETE cascade
  );
  CREATE UNIQUE INDEX IF NOT EXISTS environment_inputs_session_age_unique
    ON environment_inputs(session_id, age_range);
  CREATE TABLE IF NOT EXISTS emotion_results (
    id text PRIMARY KEY NOT NULL,
    session_id text NOT NULL,
    calculated_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
    result_json text NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON UPDATE no action ON DELETE cascade
  );
  `,
  // 0001: saved_actions
  `
  CREATE TABLE IF NOT EXISTS saved_actions (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    session_id text NOT NULL,
    action_text text NOT NULL,
    category text NOT NULL,
    status text DEFAULT 'saved' NOT NULL,
    created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
    updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON UPDATE no action ON DELETE cascade
  );
  `,
];
