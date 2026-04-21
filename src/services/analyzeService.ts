/**
 * Phase 1 の calculator と Phase 2 の永続化層を繋ぐサービス層
 *
 * saveAndCalculate: 1回の呼び出しで
 *   1. 4つの年齢区分の環境スコアを upsert
 *   2. 完成した入力から EmotionProfile を計算
 *   3. 計算結果を保存
 * の3ステップを単一トランザクションで atomic に行う。
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

/** saveAndCalculate の入力: 全4区分を要求する */
export type BracketInputs = Record<AgeRange, EnvironmentInputData>;

export interface SaveAndCalculateResult {
  inputs: EnvironmentInputRecord[];
  result: EmotionResultRecord;
  profile: EmotionProfile;
}

export function saveAndCalculate(
  uow: UnitOfWork,
  sessionId: string,
  inputs: BracketInputs
): SaveAndCalculateResult {
  return uow.withTransaction((repos) => {
    // セッション存在チェック (存在しなければ throw → rollback)
    const session = repos.sessions.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // 全4区分を upsert
    const ageRanges: AgeRange[] = ['0-5', '6-10', '11-15', '16-20'];
    const savedInputs: EnvironmentInputRecord[] = [];
    for (const ageRange of ageRanges) {
      const saved = repos.inputs.upsertInput(sessionId, ageRange, inputs[ageRange]);
      savedInputs.push(saved);
    }

    // 計算
    const envInput = recordsToEnvironmentInput(savedInputs);
    const profile = calculate(envInput);

    // 保存
    const result = repos.results.saveResult(sessionId, profile);

    return { inputs: savedInputs, result, profile };
  });
}
