/**
 * SessionsRepository の Postgres 実装
 */

import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';

import type { Db } from '../db/client';
import { sessions, users, type SessionRow } from '../db/schema';
import type { Session, SessionsRepository } from './interface';

export class PgSessionsRepository implements SessionsRepository {
  constructor(private readonly db: Db) {}

  async createSession(userId: string, label: string): Promise<Session> {
    // 未登録ユーザーを受け入れるため、先に users を upsert
    await this.db
      .insert(users)
      .values({ id: userId })
      .onConflictDoNothing({ target: users.id });

    const id = randomUUID();
    const [row] = await this.db
      .insert(sessions)
      .values({ id, userId, label })
      .returning();
    return rowToSession(row);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    return rows[0] ? rowToSession(rows[0]) : null;
  }

  async listSessions(userId: string): Promise<Session[]> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(asc(sessions.createdAt));
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
