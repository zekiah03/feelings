/**
 * Postgres 向け UnitOfWork 実装
 *
 * drizzle の `db.transaction(async tx => ...)` は Promise 対応で、
 * コールバックが reject するとロールバックされる。
 */

import type { Db } from '../db/client';
import { PgActionsRepository } from './actions';
import { PgInputsRepository } from './inputs';
import { PgResultsRepository } from './results';
import { PgSessionsRepository } from './sessions';
import type { Repositories, UnitOfWork } from './interface';

function buildRepos(db: Db): Repositories {
  return {
    sessions: new PgSessionsRepository(db),
    inputs: new PgInputsRepository(db),
    results: new PgResultsRepository(db),
    actions: new PgActionsRepository(db),
  };
}

export class PgUnitOfWork implements UnitOfWork {
  readonly repos: Repositories;

  constructor(private readonly db: Db) {
    this.repos = buildRepos(db);
  }

  async withTransaction<T>(fn: (repos: Repositories) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => fn(buildRepos(tx as Db)));
  }
}
