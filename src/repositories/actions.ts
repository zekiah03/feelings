/**
 * ActionsRepository の SQLite 実装
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

export class SqliteActionsRepository implements ActionsRepository {
  constructor(private readonly db: Db) {}

  create(input: CreateActionInput): SavedAction {
    const now = new Date();
    const row: SavedActionRow = {
      id: randomUUID(),
      userId: input.userId,
      sessionId: input.sessionId,
      actionText: input.actionText,
      category: input.category,
      status: 'saved',
      createdAt: now,
      updatedAt: now,
    };
    this.db.insert(savedActions).values(row).run();
    return rowToAction(row);
  }

  getById(id: string): SavedAction | null {
    const row = this.db.select().from(savedActions).where(eq(savedActions.id, id)).get();
    return row ? rowToAction(row) : null;
  }

  listByUser(userId: string): SavedAction[] {
    const rows = this.db
      .select()
      .from(savedActions)
      .where(eq(savedActions.userId, userId))
      .orderBy(desc(savedActions.createdAt))
      .all();
    return rows.map(rowToAction);
  }

  updateStatus(id: string, userId: string, status: ActionStatus): SavedAction | null {
    const existing = this.db
      .select()
      .from(savedActions)
      .where(and(eq(savedActions.id, id), eq(savedActions.userId, userId)))
      .get();
    if (!existing) return null;
    const updatedAt = new Date();
    this.db
      .update(savedActions)
      .set({ status, updatedAt })
      .where(eq(savedActions.id, id))
      .run();
    return rowToAction({ ...existing, status, updatedAt });
  }

  delete(id: string, userId: string): boolean {
    const res = this.db
      .delete(savedActions)
      .where(and(eq(savedActions.id, id), eq(savedActions.userId, userId)))
      .run();
    return res.changes > 0;
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
