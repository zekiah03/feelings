/**
 * 生育環境 × 感情特性 分析エンジン — 型定義
 */

// ===== 入力: 年齢区分ごとの生育環境 =====

export const AGE_BRACKETS = ['0-5', '6-10', '11-15', '16-20'] as const;
export type AgeBracket = (typeof AGE_BRACKETS)[number];

export interface FamilyScores {
  /** 愛情量 (0-100) */
  affection: number;
  /** 安定性 (0-100) */
  stability: number;
  /** 支配度 (0=自由, 100=支配) */
  control: number;
}

export interface SchoolScores {
  /** 所属感 (0-100) */
  belonging: number;
  /** ストレス (0-100) */
  stress: number;
  /** 社会的成功体験 (0-100) */
  socialSuccess: number;
}

export interface EventScores {
  /** ストレスイベント数 (件数) */
  stressEvents: number;
  /** 成功体験数 (件数) */
  successEvents: number;
}

export interface AgeBracketInput {
  family: FamilyScores;
  school: SchoolScores;
  events: EventScores;
}

export type EnvironmentInput = Record<AgeBracket, AgeBracketInput>;

// ===== 出力: 感情特性プロファイル =====

export const CORE_EMOTIONS = [
  'anger',
  'sadness',
  'fear',
  'joy',
  'disgust',
  'surprise',
] as const;
export type CoreEmotion = (typeof CORE_EMOTIONS)[number];

export const EXTENDED_EMOTIONS = ['numbness', 'guilt', 'shame'] as const;
export type ExtendedEmotion = (typeof EXTENDED_EMOTIONS)[number];

export const ALL_EMOTIONS = [...CORE_EMOTIONS, ...EXTENDED_EMOTIONS] as const;
export type Emotion = (typeof ALL_EMOTIONS)[number];

export const EMOTION_LAYERS = ['intensity', 'sensitivity', 'duration'] as const;
export type EmotionLayer = (typeof EMOTION_LAYERS)[number];

export interface TopFactor {
  /** 要因ID (例: "low_affection") */
  factor: string;
  /** 要因の表示ラベル */
  label: string;
  /** 発火した年齢区分 */
  ageBracket: AgeBracket;
  /** その要因×年齢区分が寄与した合計値 (符号付き、0-100クランプ前) */
  contribution: number;
}

export interface EmotionScore {
  /** 感情強度 (0-100) */
  intensity: number;
  /** トリガー感度 (0-100) */
  sensitivity: number;
  /** 持続時間 (0-100) */
  duration: number;
  /** 主な影響要因トップ3 (説明可能性のため) */
  topFactors: TopFactor[];
}

export type EmotionScores = Record<Emotion, EmotionScore>;

export const EXPRESSION_KEYS = [
  'humor',
  'empathy',
  'suppression',
  'explosiveness',
] as const;
export type ExpressionKey = (typeof EXPRESSION_KEYS)[number];

export type ExpressionStyle = Record<ExpressionKey, number>;

export interface EmotionProfile {
  emotions: EmotionScores;
  expression: ExpressionStyle;
}

// ===== ルール定義 (weights.ts から利用) =====

export type RuleTarget =
  | { kind: 'emotion'; emotion: Emotion; layer: EmotionLayer }
  | { kind: 'expression'; key: ExpressionKey };

export interface RuleEffect {
  target: RuleTarget;
  /** 満強度 (strength=1) かつ 年齢係数=1 のときの加算値 */
  delta: number;
}

export interface FactorRule {
  id: string;
  label: string;
  /** 年齢区分の入力から 0-1 の発火強度を返す純粋関数 */
  strength: (input: AgeBracketInput) => number;
  effects: RuleEffect[];
  /**
   * このルールが適用される年齢区分 (省略時は全区分)。
   * 思春期固有の効果 (theory.md §4.3 R1.8) などに使う。
   */
  ageBrackets?: AgeBracket[];
}
