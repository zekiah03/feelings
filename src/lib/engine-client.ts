/**
 * クライアント用エンジンラッパー
 *
 * Phase 1 のロジックはブラウザでもそのまま動く (純粋関数、Nodeのみ依存なし)。
 * ここは 'use client' コードから import しやすいよう再エクスポートするだけ。
 */

export {
  calculate,
  neutralInput,
  AGE_BRACKETS,
  CORE_EMOTIONS,
  inverseInterventions,
  VARIABLES,
  recommend,
} from '@/engine';
export type {
  AgeBracket,
  AgeBracketInput,
  CoreEmotion,
  Emotion,
  EmotionLayer,
  EmotionProfile,
  EmotionScore,
  EnvironmentInput,
  EventScores,
  FamilyScores,
  SchoolScores,
  Intervention,
  InverseGoal,
  VariableMeta,
  ActionRecommendation,
  ActionCategory,
  Difficulty,
} from '@/engine';
