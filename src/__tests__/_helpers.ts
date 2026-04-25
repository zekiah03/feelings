/**
 * テスト用ヘルパ: pglite (インメモリ Postgres) を使い、毎回マイグレーションを適用した
 * 空の DB を提供する。
 */

import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { sql } from 'drizzle-orm';

import * as schema from '../db/schema';
import { EMBEDDED_MIGRATIONS } from '../db/embeddedMigrations';
import { PgUnitOfWork } from '../repositories/pgUnitOfWork';
import type { Db } from '../db/client';
import type { EnvironmentInputData } from '../repositories/interface';

export interface TestEnv {
  db: Db;
  pglite: PGlite;
  close: () => Promise<void>;
  uow: PgUnitOfWork;
}

export async function setupInMemoryDb(): Promise<TestEnv> {
  const pglite = new PGlite();
  // drizzle-orm/pglite の返り値の型は Db (PostgresJsDatabase) とは別物だが、
  // 実行時 API は互換なのでリポジトリ実装はそのまま動く。
  const pgliteDb = drizzle(pglite, { schema }) as unknown as PgliteDatabase<typeof schema>;
  const db = pgliteDb as unknown as Db;

  for (const stmt of EMBEDDED_MIGRATIONS) {
    await db.execute(sql.raw(stmt));
  }

  const uow = new PgUnitOfWork(db);
  return {
    db,
    pglite,
    uow,
    close: async () => {
      await pglite.close();
    },
  };
}

export function sampleData(overrides: Partial<EnvironmentInputData> = {}): EnvironmentInputData {
  return {
    familyAffection: 50,
    familyStability: 50,
    familyControl: 50,
    schoolBelonging: 50,
    schoolStress: 50,
    schoolSocialSuccess: 50,
    eventsStressCount: 0,
    eventsSuccessCount: 0,
    ...overrides,
  };
}
