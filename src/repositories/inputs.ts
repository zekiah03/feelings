/**
 * InputsRepository の Postgres 実装
 *
 * upsert は (session_id, age_range) のユニーク制約にぶら下がる
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

export class PgInputsRepository implements InputsRepository {
  constructor(private readonly db: Db) {}

  async upsertInput(
    sessionId: string,
    ageRange: AgeRange,
    data: EnvironmentInputData
  ): Promise<EnvironmentInputRecord> {
    const id = randomUUID();
    await this.db
      .insert(environmentInputs)
      .values({ id, sessionId, ageRange, ...data })
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
          createdAt: new Date(),
        },
      });

    const rows = await this.db
      .select()
      .from(environmentInputs)
      .where(
        and(
          eq(environmentInputs.sessionId, sessionId),
          eq(environmentInputs.ageRange, ageRange)
        )
      )
      .limit(1);
    if (!rows[0]) {
      throw new Error('upsertInput: row unexpectedly not found after upsert');
    }
    return rowToRecord(rows[0]);
  }

  async getInputsBySession(sessionId: string): Promise<EnvironmentInputRecord[]> {
    const rows = await this.db
      .select()
      .from(environmentInputs)
      .where(eq(environmentInputs.sessionId, sessionId))
      .orderBy(asc(environmentInputs.ageRange));
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
