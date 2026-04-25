/**
 * ResultsRepository の Postgres 実装
 */

import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';

import type { Db } from '../db/client';
import { emotionResults, type EmotionResultRow } from '../db/schema';
import type { EmotionProfile } from '../engine';
import type { EmotionResultRecord, ResultsRepository } from './interface';

export class PgResultsRepository implements ResultsRepository {
  constructor(private readonly db: Db) {}

  async saveResult(
    sessionId: string,
    profile: EmotionProfile
  ): Promise<EmotionResultRecord> {
    const id = randomUUID();
    const [row] = await this.db
      .insert(emotionResults)
      .values({ id, sessionId, resultJson: JSON.stringify(profile) })
      .returning();
    return rowToRecord(row);
  }

  async getLatestResult(sessionId: string): Promise<EmotionResultRecord | null> {
    const rows = await this.db
      .select()
      .from(emotionResults)
      .where(eq(emotionResults.sessionId, sessionId))
      .orderBy(desc(emotionResults.calculatedAt))
      .limit(1);
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  async getResultHistory(sessionId: string): Promise<EmotionResultRecord[]> {
    const rows = await this.db
      .select()
      .from(emotionResults)
      .where(eq(emotionResults.sessionId, sessionId))
      .orderBy(desc(emotionResults.calculatedAt));
    return rows.map(rowToRecord);
  }
}

function rowToRecord(row: EmotionResultRow): EmotionResultRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    calculatedAt: row.calculatedAt,
    profile: JSON.parse(row.resultJson) as EmotionProfile,
  };
}
