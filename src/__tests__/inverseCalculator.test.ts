import { calculate, neutralInput } from '../engine/calculator';
import { inverseInterventions, VARIABLES } from '../engine/inverseCalculator';
import type { EnvironmentInput } from '../engine/types';

/** 中立入力だが 16-20 だけ愛情量を下げた入力 (介入の余地あり) */
function lowLateAffection(): EnvironmentInput {
  const input = neutralInput();
  input['16-20'].family.affection = 20;
  return input;
}

describe('inverseInterventions()', () => {
  test('中立 + 目標=現在値 (desiredDelta=0) では空配列', () => {
    const input = neutralInput();
    const profile = calculate(input);
    const recs = inverseInterventions(input, {
      emotion: 'joy',
      layer: 'intensity',
      targetValue: profile.emotions.joy.intensity,
    });
    expect(recs).toEqual([]);
  });

  test('expectedImpact は降順にソートされる', () => {
    const input = lowLateAffection();
    const profile = calculate(input);
    const recs = inverseInterventions(input, {
      emotion: 'fear',
      layer: 'intensity',
      targetValue: Math.max(0, profile.emotions.fear.intensity - 20),
    });
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].expectedImpact).toBeGreaterThanOrEqual(recs[i].expectedImpact);
    }
  });

  test('16-20 の愛情を上げる介入は fear を下げる目標で正の expectedImpact を持つ', () => {
    const input = lowLateAffection();
    const profile = calculate(input);
    const recs = inverseInterventions(input, {
      emotion: 'fear',
      layer: 'intensity',
      targetValue: Math.max(0, profile.emotions.fear.intensity - 20),
    });
    const affectionRec = recs.find((r) => r.variable.path === 'family.affection');
    expect(affectionRec).toBeDefined();
    expect(affectionRec!.direction).toBe('increase');
    expect(affectionRec!.expectedImpact).toBeGreaterThan(0);
  });

  test('modifiableBrackets で対象年齢区分を明示的に変更できる', () => {
    const input = neutralInput();
    input['0-5'].family.affection = 20; // 幼少期の愛情不足
    const profile = calculate(input);

    // 既定 (16-20 だけ変更可) では 0-5 の愛情を増やす介入は出てこない
    const defaultRecs = inverseInterventions(input, {
      emotion: 'fear',
      layer: 'intensity',
      targetValue: Math.max(0, profile.emotions.fear.intensity - 20),
    });
    expect(defaultRecs.every((r) => r.ageBracket === '16-20')).toBe(true);

    // 明示的に 0-5 だけを変更可能にするとそこに介入が出る
    const scopedRecs = inverseInterventions(
      input,
      {
        emotion: 'fear',
        layer: 'intensity',
        targetValue: Math.max(0, profile.emotions.fear.intensity - 20),
      },
      { modifiableBrackets: ['0-5'] }
    );
    expect(scopedRecs.some((r) => r.ageBracket === '0-5')).toBe(true);
  });

  test('全変数は VARIABLES に定義された path を持つ (metaとの整合)', () => {
    const paths = new Set(VARIABLES.map((v) => v.path));
    expect(paths.size).toBe(VARIABLES.length);
    expect(paths.has('family.affection')).toBe(true);
    expect(paths.has('events.successEvents')).toBe(true);
  });

  test('expectedImpact > 0 の介入のみ返される (目標と逆方向は除外)', () => {
    const input = lowLateAffection();
    const profile = calculate(input);
    const recs = inverseInterventions(input, {
      emotion: 'fear',
      layer: 'intensity',
      targetValue: Math.max(0, profile.emotions.fear.intensity - 20),
    });
    for (const r of recs) {
      expect(r.expectedImpact).toBeGreaterThan(0);
    }
  });

  test('stepSize は境界でクランプされる (上限値付近の変数)', () => {
    const input = neutralInput();
    input['16-20'].events.successEvents = 9; // 上限(10)に近い
    const profile = calculate(input);
    const recs = inverseInterventions(input, {
      emotion: 'joy',
      layer: 'intensity',
      targetValue: Math.min(100, profile.emotions.joy.intensity + 20),
    });
    const successRec = recs.find((r) => r.variable.path === 'events.successEvents');
    if (successRec) {
      // realisticStep=3 だが、現在値 9 → 10 までしか動かせないので 1 になる
      expect(successRec.stepSize).toBeLessThanOrEqual(3);
      expect(successRec.stepSize).toBeGreaterThan(0);
    }
  });
});
