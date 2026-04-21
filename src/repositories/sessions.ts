/**
 * SessionsRepository の SQLite 実装
 */

import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';

import type { Db } from '../db/client';
import { sessions, users, type SessionRow } from '../db/schema';
import type { Session, SessionsRepository } from './interface';

export class SqliteSessionsRepository implements SessionsRepository {
  constructor(private readonly db: Db) {}

  createSession(userId: string, label: string): Session {
    // users 行が無い場合は自動で作る (認証が無い Phase 2 では
    // 未登録ユーザーの受け入れが必要)
    this.db
      .insert(users)
      .values({ id: userId })
      .onConflictDoNothing()
      .run();

    const row: SessionRow = {
      id: randomUUID(),
      userId,
      label,
      createdAt: new Date(),
    };
    this.db.insert(sessions).values(row).run();
    return rowToSession(row);
  }

  getSession(sessionId: string): Session | null {
    const row = this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();
    return row ? rowToSession(row) : null;
  }

  listSessions(userId: string): Session[] {
    const rows = this.db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(asc(sessions.createdAt))
      .all();
    return rows.map(rowToSession);
  }
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.userId,
    label: row.label,
    createdAt: row.createdAt,
  };
}
