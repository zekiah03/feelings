/**
 * Next.js 用の DB シングルトン
 *
 * HMR で複数インスタンスが作られないよう globalThis にキャッシュする。
 *
 * 環境別のファイル配置:
 *   - ローカル / 自前サーバ: data/feelings.db (gitignore 済み)
 *   - Vercel 等 serverless: /tmp/feelings.db (インスタンス毎に分離・エフェメラル)
 *   - DATABASE_URL が指定されていればそれを使う (ホストDBへの切替口)
 *
 * マイグレーションは起動時に SQL 埋め込み版 (embeddedMigrations) で適用する。
 * これにより src/db/migrations/ の配信可否に依存せず、どの環境でも初期化できる。
 *
 * ※ Vercel の /tmp は永続しないため、本番利用では Turso / Postgres 等の
 *    ホストDBへの移行が必須。
 */

import path from 'node:path';
import fs from 'node:fs';

import { createDb, type Db } from '../db/client';
import { EMBEDDED_MIGRATIONS } from '../db/embeddedMigrations';
import { SqliteUnitOfWork } from '../repositories/sqliteUnitOfWork';

const IS_VERCEL = !!process.env.VERCEL;

function resolveDbFile(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (IS_VERCEL) return '/tmp/feelings.db';
  return path.resolve(process.cwd(), 'data', 'feelings.db');
}

type Cached = {
  db: Db;
  uow: SqliteUnitOfWork;
  close: () => void;
};

const globalForDb = globalThis as unknown as { __feelingsDb?: Cached };

function initialize(): Cached {
  const file = resolveDbFile();
  if (file !== ':memory:') {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // /tmp のように既に存在する + 書き込み可能なディレクトリの場合や、
        // 読み取り専用 FS の場合。作成に失敗しても file open 時に再度エラーになる。
      }
    }
  }

  const { db, close } = createDb({
    filename: file,
    runMigrations: true,
    // 常に埋め込み SQL を使う (ファイル配信に依存しない)
    embeddedMigrations: EMBEDDED_MIGRATIONS,
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
