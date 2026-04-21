/**
 * メイン計算ロジック (純粋関数)
 *
 * 入力: EnvironmentInput (年齢区分ごとの生育環境スコア)
 * 出力: EmotionProfile (感情特性プロファイル)
 *
 * 計算の流れ:
 *   1. 各年齢区分 × 各ルールの組み合わせで発火強度を算出
 *   2. 効果 = delta × strength × 年齢係数 を該当ターゲットに加算
 *   3. ベースライン + 累積Δ を 0-100 にクランプ
 *   4. 各感情ごとに Top 3 要因 (要因×年齢区分) を絶対値でランキング
 */

import type {
  AgeBracket,
  Emotion,
  EmotionLayer,
  EmotionProfile,
  EmotionScore,
  EnvironmentInput,
  ExpressionKey,
  ExpressionStyle,
  TopFactor,
} from './types';
import {
  AGE_BRACKETS,
  ALL_EMOTIONS,
  EMOTION_LAYERS,
  EXPRESSION_KEYS,
} from './types';
import {
  AGE_COEFFICIENTS,
  EMOTION_BASELINE,
  EXPRESSION_BASELINE,
  FACTOR_RULES,
} from './weights';

// ===== ヘルパー =====

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

interface Contribution {
  factor: string;
  label: string;
  ageBracket: AgeBracket;
  contribution: number;
}

type EmotionKey = `${Emotion}:${EmotionLayer}`;

const emotionKey = (emotion: Emotion, layer: EmotionLayer): EmotionKey =>
  `${emotion}:${layer}`;

// ===== メイン関数 =====

export function calculate(input: EnvironmentInput): EmotionProfile {
  // 累積Δと寄与ログを格納する
  const emotionDeltas: Partial<Record<EmotionKey, number>> = {};
  const emotionContribs: Partial<Record<EmotionKey, Contribution[]>> = {};
  const expressionDeltas: Partial<Record<ExpressionKey, number>> = {};

  // 全 (年齢区分, ルール) を走査
  for (const bracket of AGE_BRACKETS) {
    const bracketInput = input[bracket];
    const ageCoef = AGE_COEFFICIENTS[bracket];

    for (const rule of FACTOR_RULES) {
      const strength = rule.strength(bracketInput);
      if (strength <= 0) continue;

      for (const effect of rule.effects) {
        const delta = effect.delta * strength * ageCoef;

        if (effect.target.kind === 'emotion') {
          const key = emotionKey(effect.target.emotion, effect.target.layer);
          emotionDeltas[key] = (emotionDeltas[key] ?? 0) + delta;
          const log = emotionContribs[key] ?? [];
          log.push({
            factor: rule.id,
            label: rule.label,
            ageBracket: bracket,
            contribution: delta,
          });
          emotionContribs[key] = log;
        } else {
          const key = effect.target.key;
          expressionDeltas[key] = (expressionDeltas[key] ?? 0) + delta;
        }
      }
    }
  }

  // 各感情のスコアを組み立てる
  const emotions = {} as Record<Emotion, EmotionScore>;
  for (const emotion of ALL_EMOTIONS) {
    const intensity = clamp(
      EMOTION_BASELINE.intensity + (emotionDeltas[emotionKey(emotion, 'intensity')] ?? 0)
    );
    const sensitivity = clamp(
      EMOTION_BASELINE.sensitivity + (emotionDeltas[emotionKey(emotion, 'sensitivity')] ?? 0)
    );
    const duration = clamp(
      EMOTION_BASELINE.duration + (emotionDeltas[emotionKey(emotion, 'duration')] ?? 0)
    );

    // Top 3 要因: 3層すべての寄与を集計し、(factor, ageBracket) でグループ化
    const allContribs: Contribution[] = [];
    for (const layer of EMOTION_LAYERS) {
      allContribs.push(...(emotionContribs[emotionKey(emotion, layer)] ?? []));
    }
    const topFactors = aggregateTopFactors(allContribs, 3);

    emotions[emotion] = { intensity, sensitivity, duration, topFactors };
  }

  // 表現スタイル
  const expression = {} as ExpressionStyle;
  for (const key of EXPRESSION_KEYS) {
    expression[key] = clamp(EXPRESSION_BASELINE[key] + (expressionDeltas[key] ?? 0));
  }

  return { emotions, expression };
}

// ===== Top 要因の集計 =====

function aggregateTopFactors(contribs: Contribution[], limit: number): TopFactor[] {
  // (factor, ageBracket) 単位で寄与を合算
  const grouped = new Map<string, TopFactor>();
  for (const c of contribs) {
    const key = `${c.factor}@${c.ageBracket}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.contribution += c.contribution;
    } else {
      grouped.set(key, {
        factor: c.factor,
        label: c.label,
        ageBracket: c.ageBracket,
        contribution: c.contribution,
      });
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, limit);
}

// ===== 便利関数 =====

/** 中立的な (全スコア50、イベント0件) 入力を生成 */
export function neutralInput(): EnvironmentInput {
  const bracket = {
    family: { affection: 50, stability: 50, control: 50 },
    school: { belonging: 50, stress: 50, socialSuccess: 50 },
    events: { stressEvents: 0, successEvents: 0 },
  };
  return {
    '0-5': structuredClone(bracket),
    '6-10': structuredClone(bracket),
    '11-15': structuredClone(bracket),
    '16-20': structuredClone(bracket),
  };
}
