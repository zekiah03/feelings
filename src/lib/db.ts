/**
 * Next.js 用の DB シングルトン (Postgres / Supabase)
 *
 * - HMR 対策で globalThis にキャッシュ
 * - 起動時に 1 回だけ冪等マイグレーションを適用
 * - DATABASE_URL は Vercel プロジェクト設定 (ローカルは .env.local)
 *
 * Supabase 接続文字列の取り方:
 *   Supabase dashboard → Project Settings → Database → Connection string
 *   "Transaction pooler" (port 6543) を選ぶ。URL 末尾の {PASSWORD} を実際の値に差し替える。
 */

import { createDb, type Db } from '../db/client';
import { EMBEDDED_MIGRATIONS } from '../db/embeddedMigrations';
import { PgUnitOfWork } from '../repositories/pgUnitOfWork';

type Cached = {
  db: Db;
  uow: PgUnitOfWork;
  close: () => Promise<void>;
};

const globalForDb = globalThis as unknown as {
  __feelingsDb?: Cached;
  __feelingsMigrationDone?: boolean;
};

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Configure it in Vercel (or .env.local) with the Supabase transaction pooler URL.'
    );
  }
  return url;
}

async function applyMigrations(db: Db): Promise<void> {
  // drizzle-orm/postgres-js では db.execute(sql.raw(...)) で生 SQL を流せる
  const { sql } = await import('drizzle-orm');
  for (const stmt of EMBEDDED_MIGRATIONS) {
    await db.execute(sql.raw(stmt));
  }
}

export function getDb(): Cached {
  if (!globalForDb.__feelingsDb) {
    const { db, close } = createDb({ url: requireDatabaseUrl() });
    globalForDb.__feelingsDb = {
      db,
      uow: new PgUnitOfWork(db),
      close,
    };
  }
  return globalForDb.__feelingsDb;
}

/**
 * マイグレーションを (プロセスで1回だけ) 適用する。
 * API ルートや Server Component の先頭で await する想定。
 */
export async function ensureMigrated(): Promise<void> {
  if (globalForDb.__feelingsMigrationDone) return;
  await applyMigrations(getDb().db);
  globalForDb.__feelingsMigrationDone = true;
}
