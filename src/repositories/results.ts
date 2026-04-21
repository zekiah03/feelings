/**
 * ResultsRepository の SQLite 実装
 */

import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';

import type { Db } from '../db/client';
import { emotionResults, type EmotionResultRow } from '../db/schema';
import type { EmotionProfile } from '../engine';
import type { EmotionResultRecord, ResultsRepository } from './interface';

export class SqliteResultsRepository implements ResultsRepository {
  constructor(private readonly db: Db) {}

  saveResult(sessionId: string, profile: EmotionProfile): EmotionResultRecord {
    const row: EmotionResultRow = {
      id: randomUUID(),
      sessionId,
      calculatedAt: new Date(),
      resultJson: JSON.stringify(profile),
    };
    this.db.insert(emotionResults).values(row).run();
    return rowToRecord(row);
  }

  getLatestResult(sessionId: string): EmotionResultRecord | null {
    const row = this.db
      .select()
      .from(emotionResults)
      .where(eq(emotionResults.sessionId, sessionId))
      .orderBy(desc(emotionResults.calculatedAt))
      .limit(1)
      .get();
    return row ? rowToRecord(row) : null;
  }

  getResultHistory(sessionId: string): EmotionResultRecord[] {
    const rows = this.db
      .select()
      .from(emotionResults)
      .where(eq(emotionResults.sessionId, sessionId))
      .orderBy(desc(emotionResults.calculatedAt))
      .all();
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
