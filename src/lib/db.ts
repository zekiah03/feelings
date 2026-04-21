/**
 * Next.js 用の DB シングルトン
 *
 * HMR で複数インスタンスが作られないよう globalThis にキャッシュする。
 * SQLite ファイルは data/feelings.db (gitignore 済み)。
 * 起動時にマイグレーションを自動適用する。
 */

import path from 'node:path';
import fs from 'node:fs';

import { createDb, type Db } from '../db/client';
import { SqliteUnitOfWork } from '../repositories/sqliteUnitOfWork';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = process.env.DATABASE_URL ?? path.join(DATA_DIR, 'feelings.db');
const MIGRATIONS_FOLDER = path.resolve(process.cwd(), 'src', 'db', 'migrations');

type Cached = {
  db: Db;
  uow: SqliteUnitOfWork;
  close: () => void;
};

const globalForDb = globalThis as unknown as { __feelingsDb?: Cached };

function initialize(): Cached {
  if (DB_FILE !== ':memory:' && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const { db, close } = createDb({
    filename: DB_FILE,
    runMigrations: true,
    migrationsFolder: MIGRATIONS_FOLDER,
  });
  const uow = new SqliteUnitOfWork(db);
  return { db, uow, close };
}

export function getDb(): Cached {
  if (!globalForDb.__feelingsDb) {
    globalForDb.__feelingsDb = initialize();
  }
  return globalForDb.__feelingsDb;
}
