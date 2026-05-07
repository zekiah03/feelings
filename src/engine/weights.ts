/**
 * 重みテーブル — 因果ルールと定数
 *
 * 差し替え可能になるよう、すべての数値をこのファイルに集約する。
 */

import type { AgeBracket, FactorRule } from './types';

// ===== 年齢係数 =====
// 幼少期ほど影響が大きい
export const AGE_COEFFICIENTS: Record<AgeBracket, number> = {
  '0-5': 1.5,
  '6-10': 1.3,
  '11-15': 1.1,
  '16-20': 1.0,
};

// ===== ベースライン =====
// 全スコアのスタート値 (中立)
export const EMOTION_BASELINE = {
  intensity: 30,
  sensitivity: 30,
  duration: 30,
} as const;

export const EXPRESSION_BASELINE = {
  humor: 30,
  empathy: 30,
  suppression: 30,
  explosiveness: 30,
} as const;

// ===== 強度関数のヘルパー =====

/** 値が閾値より低いほど強く発火 (threshold未満の範囲を0-1に線形マッピング) */
const lowThan =
  (threshold: number) =>
  (value: number): number =>
    Math.max(0, Math.min(1, (threshold - value) / threshold));

/** 値が閾値より高いほど強く発火 */
const higherThan =
  (threshold: number) =>
  (value: number): number =>
    Math.max(0, Math.min(1, (value - threshold) / (100 - threshold)));

/** カウント系: 基準件数で満強度 */
const countOver =
  (fullStrengthCount: number) =>
  (count: number): number =>
    Math.max(0, Math.min(1, count / fullStrengthCount));

// しきい値の定数 (一箇所で管理)
export const THRESHOLDS = {
  affectionLow: 50,
  stabilityLow: 50,
  belongingLow: 50,
  controlHigh: 50,
  socialSuccessHigh: 50,
  stressEventsFull: 5,
  successEventsFull: 5,
} as const;

// ===== 因果ルール =====
// タスクの初期重みテーブルをそのまま実装。
// 数値は暫定値で、このファイルだけ編集すれば差し替え可能。
export const FACTOR_RULES: FactorRule[] = [
  {
    id: 'low_affection',
    label: '愛情量が低い',
    strength: (i) => lowThan(THRESHOLDS.affectionLow)(i.family.affection),
    effects: [
      { target: { kind: 'emotion', emotion: 'fear', layer: 'intensity' }, delta: 12 },
      { target: { kind: 'emotion', emotion: 'joy', layer: 'intensity' }, delta: -8 },
    ],
  },
  {
    id: 'low_family_stability',
    label: '家庭安定性が低い',
    strength: (i) => lowThan(THRESHOLDS.stabilityLow)(i.family.stability),
    effects: [
      { target: { kind: 'emotion', emotion: 'fear', layer: 'intensity' }, delta: 10 },
      { target: { kind: 'emotion', emotion: 'anger', layer: 'intensity' }, delta: 6 },
    ],
  },
  {
    id: 'high_stress_events',
    label: 'ストレスイベントが多い',
    strength: (i) => countOver(THRESHOLDS.stressEventsFull)(i.events.stressEvents),
    effects: [
      { target: { kind: 'emotion', emotion: 'anger', layer: 'intensity' }, delta: 10 },
      { target: { kind: 'emotion', emotion: 'sadness', layer: 'intensity' }, delta: 8 },
      { target: { kind: 'emotion', emotion: 'numbness', layer: 'intensity' }, delta: 5 },
    ],
  },
  {
    id: 'high_social_success',
    label: '社会的成功体験が高い',
    strength: (i) => higherThan(THRESHOLDS.socialSuccessHigh)(i.school.socialSuccess),
    effects: [
      { target: { kind: 'emotion', emotion: 'joy', layer: 'intensity' }, delta: 9 },
      { target: { kind: 'emotion', emotion: 'fear', layer: 'intensity' }, delta: -4 },
    ],
  },
  {
    id: 'economic_instability',
    label: '経済的不安定 (安定性低い)',
    strength: (i) => lowThan(THRESHOLDS.stabilityLow)(i.family.stability),
    effects: [
      { target: { kind: 'emotion', emotion: 'fear', layer: 'sensitivity' }, delta: 7 },
    ],
  },
  {
    id: 'low_belonging',
    label: '所属感が低い',
    strength: (i) => lowThan(THRESHOLDS.belongingLow)(i.school.belonging),
    effects: [
      { target: { kind: 'emotion', emotion: 'sadness', layer: 'intensity' }, delta: 8 },
      { target: { kind: 'emotion', emotion: 'shame', layer: 'intensity' }, delta: 6 },
    ],
  },
  {
    id: 'high_control',
    label: '支配度が高い',
    strength: (i) => higherThan(THRESHOLDS.controlHigh)(i.family.control),
    effects: [
      { target: { kind: 'emotion', emotion: 'anger', layer: 'sensitivity' }, delta: 8 },
      { target: { kind: 'expression', key: 'suppression' }, delta: 10 },
    ],
  },

  // ===== 第二版追加ルール (theory.md §4.3) =====

  // R1.8: 所属感低 × 思春期以降。R1.6 の効果に加えて思春期/前期成人期だけ追加で乗る。
  // peer 関係性が同一性形成に強く効く時期 (Erikson 1968) — α_b の単調減少への補正。
  {
    id: 'low_belonging_adolescent_amplifier',
    label: '思春期以降の所属感の低さ',
    strength: (i) => lowThan(THRESHOLDS.belongingLow)(i.school.belonging),
    effects: [
      { target: { kind: 'emotion', emotion: 'sadness', layer: 'intensity' }, delta: 2 },
      { target: { kind: 'emotion', emotion: 'shame', layer: 'intensity' }, delta: 2 },
    ],
    ageBrackets: ['11-15', '16-20'],
  },

  // R1.9: 成功体験の累積。喜びの強度+感度を引き上げる (hedonic anchor)。
  // 現状 R1.4 (社会的成功) のみで joy への経路が薄かった非対称を緩和する。
  {
    id: 'cumulative_success',
    label: '成功体験の累積',
    strength: (i) => Math.max(0, Math.min(1, i.events.successEvents / THRESHOLDS.successEventsFull)),
    effects: [
      { target: { kind: 'emotion', emotion: 'joy', layer: 'intensity' }, delta: 6 },
      { target: { kind: 'emotion', emotion: 'joy', layer: 'sensitivity' }, delta: 4 },
    ],
  },

  // R1.10: 心理的支配 → 罪悪感誘導 (Barber 1996)。R1.7 と同じ trigger だが、
  //        guilt 強度に効く別経路として独立させる (説明可能性のため)。
  {
    id: 'high_control_guilt_induction',
    label: '心理的支配による罪悪感の内面化',
    strength: (i) => higherThan(THRESHOLDS.controlHigh)(i.family.control),
    effects: [
      { target: { kind: 'emotion', emotion: 'guilt', layer: 'intensity' }, delta: 8 },
    ],
  },
];
