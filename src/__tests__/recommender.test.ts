import { calculate, neutralInput } from '../engine/calculator';
import { recommend } from '../engine/recommender';
import { ACTION_RULES } from '../engine/actionRules';
import type { EmotionProfile } from '../engine/types';

// テスト用: 任意の感情スコアを指定して EmotionProfile を作る
function makeProfile(
  overrides: Partial<{
    anger: { intensity?: number; sensitivity?: number; duration?: number };
    joy: { intensity?: number; sensitivity?: number };
    fear: { intensity?: number; sensitivity?: number };
    sadness: { duration?: number };
    numbness: { intensity?: number };
    suppression: number;
    explosiveness: number;
  }>
): EmotionProfile {
  const base = calculate(neutralInput());
  const cloned = structuredClone(base);
  if (overrides.anger?.intensity !== undefined) cloned.emotions.anger.intensity = overrides.anger.intensity;
  if (overrides.anger?.sensitivity !== undefined) cloned.emotions.anger.sensitivity = overrides.anger.sensitivity;
  if (overrides.anger?.duration !== undefined) cloned.emotions.anger.duration = overrides.anger.duration;
  if (overrides.joy?.intensity !== undefined) cloned.emotions.joy.intensity = overrides.joy.intensity;
  if (overrides.joy?.sensitivity !== undefined) cloned.emotions.joy.sensitivity = overrides.joy.sensitivity;
  if (overrides.fear?.intensity !== undefined) cloned.emotions.fear.intensity = overrides.fear.intensity;
  if (overrides.fear?.sensitivity !== undefined) cloned.emotions.fear.sensitivity = overrides.fear.sensitivity;
  if (overrides.sadness?.duration !== undefined) cloned.emotions.sadness.duration = overrides.sadness.duration;
  if (overrides.numbness?.intensity !== undefined) cloned.emotions.numbness.intensity = overrides.numbness.intensity;
  if (overrides.suppression !== undefined) cloned.expression.suppression = overrides.suppression;
  if (overrides.explosiveness !== undefined) cloned.expression.explosiveness = overrides.explosiveness;
  return cloned;
}

describe('recommend()', () => {
  test('中立プロファイルでは発火しない', () => {
    const recs = recommend(calculate(neutralInput()));
    expect(recs).toEqual([]);
  });

  test('怒り強度を 85 にすると high_anger_intensity が発火する', () => {
    const profile = makeProfile({ anger: { intensity: 85 } });
    const recs = recommend(profile);
    expect(recs.some((r) => r.ruleId === 'high_anger_intensity')).toBe(true);
  });

  test('各ルールはそれぞれ対応する指標でピンポイントに発火する', () => {
    const cases: [string, EmotionProfile][] = [
      ['high_anger_intensity', makeProfile({ anger: { intensity: 85 } })],
      ['high_anger_sensitivity', makeProfile({ anger: { sensitivity: 85 } })],
      ['low_joy_intensity', makeProfile({ joy: { intensity: 10 } })],
      ['low_joy_sensitivity', makeProfile({ joy: { sensitivity: 10 } })],
      ['high_fear_intensity', makeProfile({ fear: { intensity: 85 } })],
      ['high_fear_sensitivity', makeProfile({ fear: { sensitivity: 85 } })],
      ['high_numbness', makeProfile({ numbness: { intensity: 80 } })],
      ['high_suppression', makeProfile({ suppression: 85 })],
      ['high_explosiveness', makeProfile({ explosiveness: 85 })],
      ['long_sadness_duration', makeProfile({ sadness: { duration: 85 } })],
    ];
    for (const [ruleId, profile] of cases) {
      const recs = recommend(profile, { perCategoryLimit: 10, limit: 20 });
      expect(recs.some((r) => r.ruleId === ruleId)).toBe(true);
    }
    // 10 ルール全部をカバー (逆算的チェック)
    const coveredIds = new Set(cases.map(([id]) => id));
    for (const rule of ACTION_RULES) {
      expect(coveredIds.has(rule.id)).toBe(true);
    }
  });

  test('同一カテゴリは perCategoryLimit で絞られる', () => {
    // 感情調整カテゴリのルールだけ複数発火させる
    const profile = makeProfile({
      anger: { intensity: 95 },
      joy: { sensitivity: 5 },
      numbness: { intensity: 90 },
      sadness: { duration: 95 },
      suppression: 95,
    });
    const recs = recommend(profile, { limit: 20, perCategoryLimit: 2 });
    const byCat = recs.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + 1;
      return acc;
    }, {});
    for (const [, count] of Object.entries(byCat)) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  test('score の降順でソートされ、優先度が高いものが先頭にくる', () => {
    // anger.intensity=99 (score ~0.97) と joy.sensitivity=20 (score ~0.33) を両方発火
    const profile = makeProfile({
      anger: { intensity: 99 },
      joy: { sensitivity: 20 },
    });
    const recs = recommend(profile);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score);
    }
    expect(recs[0].ruleId).toBe('high_anger_intensity');
  });

  test('limit で全体件数が制限される', () => {
    const profile = makeProfile({
      anger: { intensity: 95 },
      fear: { intensity: 95 },
      joy: { intensity: 5 },
      numbness: { intensity: 90 },
      suppression: 95,
      explosiveness: 95,
    });
    const recs = recommend(profile, { limit: 3 });
    expect(recs.length).toBe(3);
  });
});
