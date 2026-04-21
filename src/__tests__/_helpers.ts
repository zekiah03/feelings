/**
 * テスト用ヘルパ: インメモリ DB を用意してマイグレーションを適用する。
 */

import path from 'node:path';
import { createDb, type Db } from '../db/client';
import { SqliteUnitOfWork } from '../repositories/sqliteUnitOfWork';
import type { EnvironmentInputData } from '../repositories/interface';

const MIGRATIONS_FOLDER = path.resolve(__dirname, '..', 'db', 'migrations');

export function setupInMemoryDb(): {
  db: Db;
  close: () => void;
  uow: SqliteUnitOfWork;
} {
  const { db, close } = createDb({
    filename: ':memory:',
    runMigrations: true,
    migrationsFolder: MIGRATIONS_FOLDER,
  });
  const uow = new SqliteUnitOfWork(db);
  return { db, close, uow };
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
