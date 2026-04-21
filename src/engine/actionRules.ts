/**
 * 行動提案ルールテーブル
 *
 * weights.ts と同じく、ここだけ編集すれば提案文言・閾値を差し替え可能。
 * 各ルールは EmotionProfile を入力に受け取り、発火判定と「過剰度スコア (0-1)」を返す。
 */

import type { EmotionProfile } from './types';

export const ACTION_CATEGORIES = ['感情調整', '環境設計', '習慣'] as const;
export type ActionCategory = (typeof ACTION_CATEGORIES)[number];

export const DIFFICULTIES = ['低', '中', '高'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface ActionRuleEvaluation {
  matches: boolean;
  /** 閾値からの超過度 (0-1)。発火しないときは 0。 */
  score: number;
  /** どの指標・どの値で発火したかの人間可読な説明 */
  basis: string;
}

export interface ActionRule {
  id: string;
  category: ActionCategory;
  text: string;
  difficulty: Difficulty;
  evaluate: (profile: EmotionProfile) => ActionRuleEvaluation;
}

// ===== ヘルパ =====

/** value が threshold を超えた「超過度」を返す (0-1)。越えなければ 0。 */
function excessOver(value: number, threshold: number): number {
  if (value <= threshold) return 0;
  const span = 100 - threshold;
  if (span <= 0) return 1;
  return Math.min(1, (value - threshold) / span);
}

/** value が threshold を下回った「不足度」を返す (0-1)。越えなければ 0。 */
function shortfallUnder(value: number, threshold: number): number {
  if (value >= threshold) return 0;
  if (threshold <= 0) return 1;
  return Math.min(1, (threshold - value) / threshold);
}

const fmt = (n: number) => Math.round(n);

// ===== ルール =====

export const ACTION_RULES: ActionRule[] = [
  {
    id: 'high_anger_intensity',
    category: '感情調整',
    text: '有酸素運動を週3回以上: 身体的な発散を通じて怒りの背景圧を下げる。',
    difficulty: '中',
    evaluate: (p) => {
      const v = p.emotions.anger.intensity;
      const score = excessOver(v, 70);
      return {
        matches: score > 0,
        score,
        basis: `怒りの強度が ${fmt(v)} (閾値 70)`,
      };
    },
  },
  {
    id: 'high_anger_sensitivity',
    category: '環境設計',
    text: '刺激の多い環境から距離を置く: 物理的・情報的な入力を減らして発火点を上げる。',
    difficulty: '中',
    evaluate: (p) => {
      const v = p.emotions.anger.sensitivity;
      const score = excessOver(v, 70);
      return {
        matches: score > 0,
        score,
        basis: `怒りの感度が ${fmt(v)} (閾値 70)`,
      };
    },
  },
  {
    id: 'low_joy_intensity',
    category: '習慣',
    text: '週1回、意図的に初めての体験を入れる: 新奇性が喜びのベースラインを押し上げる。',
    difficulty: '低',
    evaluate: (p) => {
      const v = p.emotions.joy.intensity;
      const score = shortfallUnder(v, 30);
      return {
        matches: score > 0,
        score,
        basis: `喜びの強度が ${fmt(v)} (閾値 30)`,
      };
    },
  },
  {
    id: 'low_joy_sensitivity',
    category: '感情調整',
    text: '小さな達成を記録する習慣をつける: 気づきにくい喜びを捕まえる練習になる。',
    difficulty: '低',
    evaluate: (p) => {
      const v = p.emotions.joy.sensitivity;
      const score = shortfallUnder(v, 30);
      return {
        matches: score > 0,
        score,
        basis: `喜びの感度が ${fmt(v)} (閾値 30)`,
      };
    },
  },
  {
    id: 'high_fear_intensity',
    category: '習慣',
    text: '朝のルーティンを固定して予測可能性を上げる: 不安のベース水準が下がりやすい。',
    difficulty: '低',
    evaluate: (p) => {
      const v = p.emotions.fear.intensity;
      const score = excessOver(v, 70);
      return {
        matches: score > 0,
        score,
        basis: `不安の強度が ${fmt(v)} (閾値 70)`,
      };
    },
  },
  {
    id: 'high_fear_sensitivity',
    category: '環境設計',
    text: '意思決定の数を減らす: 定番化・固定化で判断コストを下げる。',
    difficulty: '中',
    evaluate: (p) => {
      const v = p.emotions.fear.sensitivity;
      const score = excessOver(v, 70);
      return {
        matches: score > 0,
        score,
        basis: `不安の感度が ${fmt(v)} (閾値 70)`,
      };
    },
  },
  {
    id: 'high_numbness',
    category: '感情調整',
    text: '身体感覚を使う活動 (運動・料理・自然) を増やす: 無感動は認知過多で出やすい。',
    difficulty: '中',
    evaluate: (p) => {
      const v = p.emotions.numbness.intensity;
      const score = excessOver(v, 60);
      return {
        matches: score > 0,
        score,
        basis: `無感動の強度が ${fmt(v)} (閾値 60)`,
      };
    },
  },
  {
    id: 'high_suppression',
    category: '感情調整',
    text: '安全な場で感情を言語化する練習をする: 書く・話す相手を1人決めるだけで十分。',
    difficulty: '中',
    evaluate: (p) => {
      const v = p.expression.suppression;
      const score = excessOver(v, 70);
      return {
        matches: score > 0,
        score,
        basis: `感情抑制が ${fmt(v)} (閾値 70)`,
      };
    },
  },
  {
    id: 'high_explosiveness',
    category: '習慣',
    text: '感情が高まる前のシグナルを記録する: 体感・時間帯・状況を紐付ける。',
    difficulty: '中',
    evaluate: (p) => {
      const v = p.expression.explosiveness;
      const score = excessOver(v, 70);
      return {
        matches: score > 0,
        score,
        basis: `感情爆発性が ${fmt(v)} (閾値 70)`,
      };
    },
  },
  {
    id: 'long_sadness_duration',
    category: '感情調整',
    text: '悲しみに時間制限を設ける (例: 15分だけ感じる): 持続を切る介入になる。',
    difficulty: '中',
    evaluate: (p) => {
      const v = p.emotions.sadness.duration;
      const score = excessOver(v, 70);
      return {
        matches: score > 0,
        score,
        basis: `悲しみの持続が ${fmt(v)} (閾値 70)`,
      };
    },
  },
];
