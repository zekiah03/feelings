/**
 * リポジトリ層のインターフェース定義
 *
 * 同期 API に統一する。理由: better-sqlite3 のトランザクションは同期
 * であり、async 関数内の例外は Promise rejection となるため、Drizzle が
 * ロールバックを検知できなくなる。将来 Postgres 等に移行する場合は
 * Promise 化する機械的リファクタが必要になるが、Phase 2 ではこの方針で
 * 正しいトランザクション境界を担保する。
 */

import type { EmotionProfile, EnvironmentInput } from '../engine';

// ===== ドメインモデル (DBスキーマとは疎結合にする) =====

export interface Session {
  id: string;
  userId: string;
  label: string;
  createdAt: Date;
}

export type AgeRange = '0-5' | '6-10' | '11-15' | '16-20';

export interface EnvironmentInputRecord {
  id: string;
  sessionId: string;
  ageRange: AgeRange;
  familyAffection: number;
  familyStability: number;
  familyControl: number;
  schoolBelonging: number;
  schoolStress: number;
  schoolSocialSuccess: number;
  eventsStressCount: number;
  eventsSuccessCount: number;
  createdAt: Date;
}

/** upsert 時の入力データ (id/createdAtは実装側で発行) */
export interface EnvironmentInputData {
  familyAffection: number;
  familyStability: number;
  familyControl: number;
  schoolBelonging: number;
  schoolStress: number;
  schoolSocialSuccess: number;
  eventsStressCount: number;
  eventsSuccessCount: number;
}

export interface EmotionResultRecord {
  id: string;
  sessionId: string;
  calculatedAt: Date;
  /** 保存時は JSON 文字列。利用側は profile で直接取得可 */
  profile: EmotionProfile;
}

// ===== リポジトリインターフェース =====

export interface SessionsRepository {
  createSession(userId: string, label: string): Session;
  getSession(sessionId: string): Session | null;
  listSessions(userId: string): Session[];
}

export interface InputsRepository {
  upsertInput(
    sessionId: string,
    ageRange: AgeRange,
    data: EnvironmentInputData
  ): EnvironmentInputRecord;
  getInputsBySession(sessionId: string): EnvironmentInputRecord[];
}

export interface ResultsRepository {
  saveResult(sessionId: string, profile: EmotionProfile): EmotionResultRecord;
  getLatestResult(sessionId: string): EmotionResultRecord | null;
  getResultHistory(sessionId: string): EmotionResultRecord[];
}

// ===== 行動提案 (saved_actions) =====

export type ActionStatus = 'saved' | 'doing' | 'done';

export interface SavedAction {
  id: string;
  userId: string;
  sessionId: string;
  actionText: string;
  category: string;
  status: ActionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActionInput {
  userId: string;
  sessionId: string;
  actionText: string;
  category: string;
}

export interface ActionsRepository {
  create(input: CreateActionInput): SavedAction;
  getById(id: string): SavedAction | null;
  listByUser(userId: string): SavedAction[];
  /** 本人 (userId 一致) の行のみ更新。該当なしなら null を返す。 */
  updateStatus(id: string, userId: string, status: ActionStatus): SavedAction | null;
  /** 本人 (userId 一致) の行のみ削除。削除件数 > 0 で true。 */
  delete(id: string, userId: string): boolean;
}

// ===== Unit of Work =====
// 複数リポジトリ操作をトランザクション境界でまとめるための抽象。
export interface Repositories {
  sessions: SessionsRepository;
  inputs: InputsRepository;
  results: ResultsRepository;
  actions: ActionsRepository;
}

export interface UnitOfWork {
  readonly repos: Repositories;
  /** コールバック内のリポジトリ呼び出しをトランザクションにまとめる */
  withTransaction<T>(fn: (repos: Repositories) => T): T;
}

// ===== InputsRepository 補助: EnvironmentInput 型への変換 =====

/**
 * レコード群を Phase 1 の EnvironmentInput 型に変換する。
 * 不足している年齢区分があれば throw する (calculator は全区分を要求する)。
 */
export function recordsToEnvironmentInput(
  records: EnvironmentInputRecord[]
): EnvironmentInput {
  const byAge = new Map<AgeRange, EnvironmentInputRecord>();
  for (const r of records) byAge.set(r.ageRange, r);

  const required: AgeRange[] = ['0-5', '6-10', '11-15', '16-20'];
  const missing = required.filter((a) => !byAge.has(a));
  if (missing.length > 0) {
    throw new Error(
      `EnvironmentInput is incomplete. Missing age ranges: ${missing.join(', ')}`
    );
  }

  const toBracket = (r: EnvironmentInputRecord) => ({
    family: {
      affection: r.familyAffection,
      stability: r.familyStability,
      control: r.familyControl,
    },
    school: {
      belonging: r.schoolBelonging,
      stress: r.schoolStress,
      socialSuccess: r.schoolSocialSuccess,
    },
    events: {
      stressEvents: r.eventsStressCount,
      successEvents: r.eventsSuccessCount,
    },
  });

  return {
    '0-5': toBracket(byAge.get('0-5')!),
    '6-10': toBracket(byAge.get('6-10')!),
    '11-15': toBracket(byAge.get('11-15')!),
    '16-20': toBracket(byAge.get('16-20')!),
  };
}
