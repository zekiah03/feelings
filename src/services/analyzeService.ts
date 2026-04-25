/**
 * Phase 1 の calculator と永続化層を繋ぐサービス層 (async)
 *
 * saveAndCalculate: 4区分 upsert → calculate → saveResult を
 * 単一トランザクションで atomic に行う。
 */

import { calculate, type EmotionProfile } from '../engine';
import {
  recordsToEnvironmentInput,
  type AgeRange,
  type EmotionResultRecord,
  type EnvironmentInputData,
  type EnvironmentInputRecord,
  type UnitOfWork,
} from '../repositories/interface';

export type BracketInputs = Record<AgeRange, EnvironmentInputData>;

export interface SaveAndCalculateResult {
  inputs: EnvironmentInputRecord[];
  result: EmotionResultRecord;
  profile: EmotionProfile;
}

export async function saveAndCalculate(
  uow: UnitOfWork,
  sessionId: string,
  inputs: BracketInputs
): Promise<SaveAndCalculateResult> {
  return uow.withTransaction(async (repos) => {
    const session = await repos.sessions.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const ageRanges: AgeRange[] = ['0-5', '6-10', '11-15', '16-20'];
    const savedInputs: EnvironmentInputRecord[] = [];
    for (const ageRange of ageRanges) {
      const saved = await repos.inputs.upsertInput(sessionId, ageRange, inputs[ageRange]);
      savedInputs.push(saved);
    }

    const envInput = recordsToEnvironmentInput(savedInputs);
    const profile = calculate(envInput);
    const result = await repos.results.saveResult(sessionId, profile);

    return { inputs: savedInputs, result, profile };
  });
}
