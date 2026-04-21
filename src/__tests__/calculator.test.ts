import { calculate, neutralInput } from '../engine/calculator';
import { EMOTION_BASELINE, EXPRESSION_BASELINE } from '../engine/weights';
import { ALL_EMOTIONS, EMOTION_LAYERS, EXPRESSION_KEYS } from '../engine/types';
import type { EnvironmentInput } from '../engine/types';

describe('calculate()', () => {
  test('中立入力 (全50, イベント0) ではベースライン付近になる', () => {
    const profile = calculate(neutralInput());

    for (const emotion of ALL_EMOTIONS) {
      const score = profile.emotions[emotion];
      for (const layer of EMOTION_LAYERS) {
        // 中立入力では、"low_X" も "high_X" も閾値(50)ちょうどで発火強度0になる
        expect(score[layer]).toBeCloseTo(EMOTION_BASELINE[layer], 5);
      }
      expect(score.topFactors).toHaveLength(0);
    }
    for (const key of EXPRESSION_KEYS) {
      expect(profile.expression[key]).toBeCloseTo(EXPRESSION_BASELINE[key], 5);
    }
  });

  test('愛情量が全期間で極端に低い → fear intensity上昇、joy intensity低下', () => {
    const input = neutralInput();
    for (const b of ['0-5', '6-10', '11-15', '16-20'] as const) {
      input[b].family.affection = 0;
    }
    const profile = calculate(input);

    expect(profile.emotions.fear.intensity).toBeGreaterThan(EMOTION_BASELINE.intensity);
    expect(profile.emotions.joy.intensity).toBeLessThan(EMOTION_BASELINE.intensity);

    // 最上位の影響要因に "low_affection" が入る
    const topIds = profile.emotions.fear.topFactors.map((f) => f.factor);
    expect(topIds).toContain('low_affection');
  });

  test('ストレスイベント大量 → anger/sadness/numbness intensityが上昇', () => {
    const input = neutralInput();
    for (const b of ['0-5', '6-10', '11-15', '16-20'] as const) {
      input[b].events.stressEvents = 10; // 閾値5を超えるので満強度
    }
    const profile = calculate(input);

    expect(profile.emotions.anger.intensity).toBeGreaterThan(EMOTION_BASELINE.intensity);
    expect(profile.emotions.sadness.intensity).toBeGreaterThan(EMOTION_BASELINE.intensity);
    expect(profile.emotions.numbness.intensity).toBeGreaterThan(EMOTION_BASELINE.intensity);
  });

  test('幼少期 (0-5) の影響の方が思春期後期 (16-20) より強い (同条件・同ルール)', () => {
    // 0-5 のみ愛情量0
    const youngInput = neutralInput();
    youngInput['0-5'].family.affection = 0;
    const youngProfile = calculate(youngInput);

    // 16-20 のみ愛情量0
    const oldInput = neutralInput();
    oldInput['16-20'].family.affection = 0;
    const oldProfile = calculate(oldInput);

    // 0-5 は係数1.5, 16-20 は係数1.0 なので fear intensity の上昇幅は 0-5 の方が大きい
    const youngDelta = youngProfile.emotions.fear.intensity - EMOTION_BASELINE.intensity;
    const oldDelta = oldProfile.emotions.fear.intensity - EMOTION_BASELINE.intensity;
    expect(youngDelta).toBeGreaterThan(oldDelta);
  });

  test('極端な負入力でも0-100にクランプされる', () => {
    // すべての環境要因を最悪にする
    const input: EnvironmentInput = {
      '0-5': {
        family: { affection: 0, stability: 0, control: 100 },
        school: { belonging: 0, stress: 100, socialSuccess: 0 },
        events: { stressEvents: 100, successEvents: 0 },
      },
      '6-10': {
        family: { affection: 0, stability: 0, control: 100 },
        school: { belonging: 0, stress: 100, socialSuccess: 0 },
        events: { stressEvents: 100, successEvents: 0 },
      },
      '11-15': {
        family: { affection: 0, stability: 0, control: 100 },
        school: { belonging: 0, stress: 100, socialSuccess: 0 },
        events: { stressEvents: 100, successEvents: 0 },
      },
      '16-20': {
        family: { affection: 0, stability: 0, control: 100 },
        school: { belonging: 0, stress: 100, socialSuccess: 0 },
        events: { stressEvents: 100, successEvents: 0 },
      },
    };
    const profile = calculate(input);

    for (const emotion of ALL_EMOTIONS) {
      const score = profile.emotions[emotion];
      for (const layer of EMOTION_LAYERS) {
        expect(score[layer]).toBeGreaterThanOrEqual(0);
        expect(score[layer]).toBeLessThanOrEqual(100);
      }
    }
    for (const key of EXPRESSION_KEYS) {
      expect(profile.expression[key]).toBeGreaterThanOrEqual(0);
      expect(profile.expression[key]).toBeLessThanOrEqual(100);
    }
  });

  test('支配度が高い → 怒りの感度上昇 & 抑制スタイル上昇', () => {
    const input = neutralInput();
    for (const b of ['0-5', '6-10', '11-15', '16-20'] as const) {
      input[b].family.control = 100;
    }
    const profile = calculate(input);

    expect(profile.emotions.anger.sensitivity).toBeGreaterThan(EMOTION_BASELINE.sensitivity);
    expect(profile.expression.suppression).toBeGreaterThan(EXPRESSION_BASELINE.suppression);
  });

  test('Top 3 要因は絶対値の大きい順に最大3件', () => {
    // 0-5 のみ最悪環境にして、fearに多数のルールが発火する
    const input = neutralInput();
    input['0-5'] = {
      family: { affection: 0, stability: 0, control: 100 },
      school: { belonging: 0, stress: 100, socialSuccess: 100 },
      events: { stressEvents: 10, successEvents: 0 },
    };
    const profile = calculate(input);

    const topFactors = profile.emotions.fear.topFactors;
    expect(topFactors.length).toBeLessThanOrEqual(3);
    // 絶対値が降順であること
    for (let i = 1; i < topFactors.length; i++) {
      expect(Math.abs(topFactors[i - 1].contribution)).toBeGreaterThanOrEqual(
        Math.abs(topFactors[i].contribution)
      );
    }
  });

  test('純粋関数 (同入力は同出力 / 入力を変更しない)', () => {
    const input = neutralInput();
    input['11-15'].events.stressEvents = 3;
    const snapshot = JSON.parse(JSON.stringify(input));

    const r1 = calculate(input);
    const r2 = calculate(input);

    expect(r1).toEqual(r2);
    expect(input).toEqual(snapshot); // 入力は mutate されない
  });
});
