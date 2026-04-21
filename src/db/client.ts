/**
 * Drizzle + better-sqlite3 クライアント初期化
 *
 * - 本番/開発: ファイルパス指定で永続DB
 * - テスト: ':memory:' でインメモリDB
 *
 * migrate() は drizzle-kit 生成のマイグレーションを適用する。
 */

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';

import * as schema from './schema';

export type Db = BetterSQLite3Database<typeof schema>;

export interface CreateDbOptions {
  /** SQLite ファイルパス or ':memory:' */
  filename?: string;
  /** 初期化時にマイグレーションを適用するか (テスト/初回起動で true) */
  runMigrations?: boolean;
  /** マイグレーションフォルダ (既定値: src/db/migrations) */
  migrationsFolder?: string;
}

/**
 * DB クライアントを生成する。
 * 呼び出し側が close() できるよう、sqlite ハンドルも一緒に返す。
 */
export function createDb(options: CreateDbOptions = {}): {
  db: Db;
  sqlite: Database.Database;
  close: () => void;
} {
  const filename = options.filename ?? ':memory:';
  const sqlite = new Database(filename);
  // 外部キー制約を有効化 (SQLite のデフォルトは OFF)
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });

  if (options.runMigrations) {
    const folder =
      options.migrationsFolder ?? path.resolve(__dirname, 'migrations');
    migrate(db, { migrationsFolder: folder });
  }

  return {
    db,
    sqlite,
    close: () => sqlite.close(),
  };
}
