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
export { recommend } from './recommender';
export type { ActionRecommendation, RecommendOptions } from './recommender';
export {
  ACTION_CATEGORIES,
  ACTION_RULES,
  DIFFICULTIES,
} from './actionRules';
export type {
  ActionCategory,
  ActionRule,
  ActionRuleEvaluation,
  Difficulty,
} from './actionRules';
export { inverseInterventions, VARIABLES } from './inverseCalculator';
export type {
  Intervention,
  InverseGoal,
  InverseOptions,
  VariableCategory,
  VariableMeta,
} from './inverseCalculator';
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
