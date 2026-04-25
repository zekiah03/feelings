/**
 * ActionsRepository の Postgres 実装
 */

import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';

import type { Db } from '../db/client';
import { savedActions, type SavedActionRow } from '../db/schema';
import type {
  ActionsRepository,
  ActionStatus,
  CreateActionInput,
  SavedAction,
} from './interface';

export class PgActionsRepository implements ActionsRepository {
  constructor(private readonly db: Db) {}

  async create(input: CreateActionInput): Promise<SavedAction> {
    const id = randomUUID();
    const [row] = await this.db
      .insert(savedActions)
      .values({
        id,
        userId: input.userId,
        sessionId: input.sessionId,
        actionText: input.actionText,
        category: input.category,
      })
      .returning();
    return rowToAction(row);
  }

  async getById(id: string): Promise<SavedAction | null> {
    const rows = await this.db
      .select()
      .from(savedActions)
      .where(eq(savedActions.id, id))
      .limit(1);
    return rows[0] ? rowToAction(rows[0]) : null;
  }

  async listByUser(userId: string): Promise<SavedAction[]> {
    const rows = await this.db
      .select()
      .from(savedActions)
      .where(eq(savedActions.userId, userId))
      .orderBy(desc(savedActions.createdAt));
    return rows.map(rowToAction);
  }

  async updateStatus(
    id: string,
    userId: string,
    status: ActionStatus
  ): Promise<SavedAction | null> {
    const rows = await this.db
      .update(savedActions)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(savedActions.id, id), eq(savedActions.userId, userId)))
      .returning();
    return rows[0] ? rowToAction(rows[0]) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const rows = await this.db
      .delete(savedActions)
      .where(and(eq(savedActions.id, id), eq(savedActions.userId, userId)))
      .returning({ id: savedActions.id });
    return rows.length > 0;
  }
}

function rowToAction(row: SavedActionRow): SavedAction {
  return {
    id: row.id,
    userId: row.userId,
    sessionId: row.sessionId,
    actionText: row.actionText,
    category: row.category,
    status: row.status as ActionStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
