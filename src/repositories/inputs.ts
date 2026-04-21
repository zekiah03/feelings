/**
 * InputsRepository の SQLite 実装
 *
 * upsert は (session_id, age_range) の UNIQUE 制約にぶら下がる
 * ON CONFLICT DO UPDATE で実装する。
 */

import { randomUUID } from 'node:crypto';
import { and, asc, eq } from 'drizzle-orm';

import type { Db } from '../db/client';
import { environmentInputs, type EnvironmentInputRow } from '../db/schema';
import type {
  AgeRange,
  EnvironmentInputData,
  EnvironmentInputRecord,
  InputsRepository,
} from './interface';

export class SqliteInputsRepository implements InputsRepository {
  constructor(private readonly db: Db) {}

  upsertInput(
    sessionId: string,
    ageRange: AgeRange,
    data: EnvironmentInputData
  ): EnvironmentInputRecord {
    const now = new Date();
    const id = randomUUID();

    this.db
      .insert(environmentInputs)
      .values({
        id,
        sessionId,
        ageRange,
        ...data,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [environmentInputs.sessionId, environmentInputs.ageRange],
        set: {
          familyAffection: data.familyAffection,
          familyStability: data.familyStability,
          familyControl: data.familyControl,
          schoolBelonging: data.schoolBelonging,
          schoolStress: data.schoolStress,
          schoolSocialSuccess: data.schoolSocialSuccess,
          eventsStressCount: data.eventsStressCount,
          eventsSuccessCount: data.eventsSuccessCount,
          // createdAt は保持しない。差し替え時刻を反映
          createdAt: now,
        },
      })
      .run();

    // upsert 結果 (既存レコードなら id は変わらない) を取り直す
    const row = this.db
      .select()
      .from(environmentInputs)
      .where(
        and(
          eq(environmentInputs.sessionId, sessionId),
          eq(environmentInputs.ageRange, ageRange)
        )
      )
      .get();
    if (!row) {
      throw new Error('upsertInput: row unexpectedly not found after upsert');
    }
    return rowToRecord(row);
  }

  getInputsBySession(sessionId: string): EnvironmentInputRecord[] {
    const rows = this.db
      .select()
      .from(environmentInputs)
      .where(eq(environmentInputs.sessionId, sessionId))
      .orderBy(asc(environmentInputs.ageRange))
      .all();
    return rows.map(rowToRecord);
  }
}

function rowToRecord(row: EnvironmentInputRow): EnvironmentInputRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    ageRange: row.ageRange as AgeRange,
    familyAffection: row.familyAffection,
    familyStability: row.familyStability,
    familyControl: row.familyControl,
    schoolBelonging: row.schoolBelonging,
    schoolStress: row.schoolStress,
    schoolSocialSuccess: row.schoolSocialSuccess,
    eventsStressCount: row.eventsStressCount,
    eventsSuccessCount: row.eventsSuccessCount,
    createdAt: row.createdAt,
  };
}
