/**
 * SQLite 向けの UnitOfWork 実装
 *
 * Drizzle の db.transaction() を使い、コールバック内でリポジトリを
 * トランザクション中の db インスタンスでラップして渡す。
 * コールバックが throw すると Drizzle が自動でロールバックする。
 */

import type { Db } from '../db/client';
import { SqliteInputsRepository } from './inputs';
import { SqliteResultsRepository } from './results';
import { SqliteSessionsRepository } from './sessions';
import type { Repositories, UnitOfWork } from './interface';

function buildRepos(db: Db): Repositories {
  return {
    sessions: new SqliteSessionsRepository(db),
    inputs: new SqliteInputsRepository(db),
    results: new SqliteResultsRepository(db),
  };
}

export class SqliteUnitOfWork implements UnitOfWork {
  readonly repos: Repositories;

  constructor(private readonly db: Db) {
    this.repos = buildRepos(db);
  }

  withTransaction<T>(fn: (repos: Repositories) => T): T {
    return this.db.transaction((tx) => fn(buildRepos(tx as Db)));
  }
}
