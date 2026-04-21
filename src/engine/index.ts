/**
 * エントリポイント
 *
 * 外部に公開する API を集約して再エクスポート。
 */

export { calculate, clamp, neutralInput } from './calculator';
export {
  AGE_COEFFICIENTS,
  EMOTION_BASELINE,
  EXPRESSION_BASELINE,
  FACTOR_RULES,
  THRESHOLDS,
} from './weights';
export type {
  AgeBracket,
  AgeBracketInput,
  CoreEmotion,
  Emotion,
  EmotionLayer,
  EmotionProfile,
  EmotionScore,
  EmotionScores,
  EnvironmentInput,
  EventScores,
  ExpressionKey,
  ExpressionStyle,
  ExtendedEmotion,
  FactorRule,
  FamilyScores,
  RuleEffect,
  RuleTarget,
  SchoolScores,
  TopFactor,
} from './types';
export {
  AGE_BRACKETS,
  ALL_EMOTIONS,
  CORE_EMOTIONS,
  EMOTION_LAYERS,
  EXPRESSION_KEYS,
  EXTENDED_EMOTIONS,
} from './types';
