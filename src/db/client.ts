/**
 * Drizzle + postgres-js クライアント (Supabase 対応)
 *
 * Supabase の transaction pooler (6543) 経由で接続する場合、
 * prepared statement は使えないため `prepare: false` が必須。
 * サーバレス環境では接続を最小にするため `max: 1`。
 *
 * テスト時は pglite (インメモリ Postgres) を直接 drizzle ラップして使う。
 * 本ファイルは「本番向け = postgres-js」のみを扱う。
 */

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export type Db = PostgresJsDatabase<typeof schema>;

export interface CreateDbOptions {
  /** Postgres 接続 URL (Supabase pooled, port 6543 推奨) */
  url: string;
  /** 追加の postgres-js オプション */
  postgresOptions?: Record<string, unknown>;
}

export function createDb(options: CreateDbOptions): {
  db: Db;
  close: () => Promise<void>;
} {
  const client = postgres(options.url, {
    prepare: false, // Supabase transaction pooler 対応
    max: 1, // サーバレス向け最小接続
    ...(options.postgresOptions ?? {}),
  });
  const db = drizzle(client, { schema });
  return {
    db,
    close: async () => {
      await client.end({ timeout: 5 });
    },
  };
}
