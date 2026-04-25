/**
 * 起動時に適用する Postgres マイグレーション (冪等)
 *
 * 1エントリ=1ステートメント (postgres-js / pglite の prepared statement は
 * 複数コマンドを許さないため)。 FK はテーブル作成時に inline で埋めてあり、
 * `IF NOT EXISTS` 付きなので何度流しても失敗しない。
 */

export const EMBEDDED_MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS environment_inputs (
    id text PRIMARY KEY NOT NULL,
    session_id text NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    age_range text NOT NULL,
    family_affection integer NOT NULL,
    family_stability integer NOT NULL,
    family_control integer NOT NULL,
    school_belonging integer NOT NULL,
    school_stress integer NOT NULL,
    school_social_success integer NOT NULL,
    events_stress_count integer NOT NULL,
    events_success_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS environment_inputs_session_age_unique
    ON environment_inputs (session_id, age_range)`,
  `CREATE TABLE IF NOT EXISTS emotion_results (
    id text PRIMARY KEY NOT NULL,
    session_id text NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    calculated_at timestamp with time zone DEFAULT now() NOT NULL,
    result_json text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS saved_actions (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id text NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    action_text text NOT NULL,
    category text NOT NULL,
    status text DEFAULT 'saved' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  )`,
];
