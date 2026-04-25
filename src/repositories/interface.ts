/**
 * リポジトリ層のインターフェース定義 (async / Postgres 前提)
 *
 * postgres-js のトランザクションは Promise ベースで、async 関数内の
 * reject も正しくロールバックされる。Phase 2 で sync に倒した判断は
 * Postgres 移行で巻き戻しが必要だったため、ここで async 化している。
 */

import type { EmotionProfile, EnvironmentInput } from '../engine';

// ===== ドメインモデル =====

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
  profile: EmotionProfile;
}

// ===== リポジトリインターフェース (async) =====

export interface SessionsRepository {
  createSession(userId: string, label: string): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  listSessions(userId: string): Promise<Session[]>;
}

export interface InputsRepository {
  upsertInput(
    sessionId: string,
    ageRange: AgeRange,
    data: EnvironmentInputData
  ): Promise<EnvironmentInputRecord>;
  getInputsBySession(sessionId: string): Promise<EnvironmentInputRecord[]>;
}

export interface ResultsRepository {
  saveResult(sessionId: string, profile: EmotionProfile): Promise<EmotionResultRecord>;
  getLatestResult(sessionId: string): Promise<EmotionResultRecord | null>;
  getResultHistory(sessionId: string): Promise<EmotionResultRecord[]>;
}

// ===== 行動提案 =====

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
  create(input: CreateActionInput): Promise<SavedAction>;
  getById(id: string): Promise<SavedAction | null>;
  listByUser(userId: string): Promise<SavedAction[]>;
  updateStatus(
    id: string,
    userId: string,
    status: ActionStatus
  ): Promise<SavedAction | null>;
  delete(id: string, userId: string): Promise<boolean>;
}

// ===== Unit of Work =====
export interface Repositories {
  sessions: SessionsRepository;
  inputs: InputsRepository;
  results: ResultsRepository;
  actions: ActionsRepository;
}

export interface UnitOfWork {
  readonly repos: Repositories;
  withTransaction<T>(fn: (repos: Repositories) => Promise<T>): Promise<T>;
}

// ===== 変換ヘルパ =====

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
