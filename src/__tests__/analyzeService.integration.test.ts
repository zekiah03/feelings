import { EMOTION_BASELINE } from '../engine';
import { saveAndCalculate, type BracketInputs } from '../services/analyzeService';
import { sampleData, setupInMemoryDb } from './_helpers';
import type { AgeRange } from '../repositories/interface';

function allNeutral(): BracketInputs {
  return {
    '0-5': sampleData(),
    '6-10': sampleData(),
    '11-15': sampleData(),
    '16-20': sampleData(),
  };
}

describe('saveAndCalculate (integration)', () => {
  let env: ReturnType<typeof setupInMemoryDb>;

  beforeEach(() => {
    env = setupInMemoryDb();
  });

  afterEach(() => {
    env.close();
  });

  test('入力保存 → 計算 → 結果保存を1トランザクションで完了する', () => {
    const session = env.uow.repos.sessions.createSession('user-1', 'trial');
    const inputs = allNeutral();
    // 0-5 で愛情を極端に下げる → fear 上昇が期待される
    inputs['0-5'] = sampleData({ familyAffection: 0 });

    const { inputs: saved, result, profile } = saveAndCalculate(
      env.uow,
      session.id,
      inputs
    );

    // 入力は4区分分保存されている
    expect(saved).toHaveLength(4);
    const ranges = saved.map((s) => s.ageRange).sort() as AgeRange[];
    expect(ranges).toEqual(['0-5', '11-15', '16-20', '6-10'].sort());

    // fear intensity がベースラインを超えている
    expect(profile.emotions.fear.intensity).toBeGreaterThan(
      EMOTION_BASELINE.intensity
    );

    // 結果が永続化されている
    const latest = env.uow.repos.results.getLatestResult(session.id);
    expect(latest?.id).toBe(result.id);
    expect(latest?.profile).toEqual(profile);
  });

  test('2回呼び出すと入力は upsert され (件数は4のまま)、結果は履歴に増える', () => {
    const session = env.uow.repos.sessions.createSession('user-1', 'trial');

    saveAndCalculate(env.uow, session.id, allNeutral());
    // タイムスタンプが被らないよう微待機
    const start = Date.now();
    while (Date.now() === start) {
      /* spin */
    }
    const modified = allNeutral();
    modified['11-15'] = sampleData({ eventsStressCount: 10 });
    saveAndCalculate(env.uow, session.id, modified);

    const allInputs = env.uow.repos.inputs.getInputsBySession(session.id);
    expect(allInputs).toHaveLength(4);

    const history = env.uow.repos.results.getResultHistory(session.id);
    expect(history).toHaveLength(2);
  });

  test('存在しないセッションIDではロールバックされ、何も書き込まれない', () => {
    expect(() =>
      saveAndCalculate(env.uow, 'non-existent-session', allNeutral())
    ).toThrow(/Session not found/);

    const results = env.uow.repos.results.getResultHistory('non-existent-session');
    const inputs = env.uow.repos.inputs.getInputsBySession('non-existent-session');
    expect(results).toHaveLength(0);
    expect(inputs).toHaveLength(0);
  });

  test('途中で throw するとトランザクションがロールバックされ入力も保存されない', () => {
    const session = env.uow.repos.sessions.createSession('user-1', 'rollback-test');

    // 1件だけ事前に入れておき、既存値を覚える
    const existing = env.uow.repos.inputs.upsertInput(
      session.id,
      '0-5',
      sampleData({ familyAffection: 42 })
    );

    // withTransaction を直接呼び、途中で明示的に throw させる
    expect(() =>
      env.uow.withTransaction((repos) => {
        repos.inputs.upsertInput(session.id, '0-5', sampleData({ familyAffection: 99 }));
        throw new Error('boom');
      })
    ).toThrow('boom');

    // 既存値が保持されている (99 に上書きされていない)
    const after = env.uow.repos.inputs.getInputsBySession(session.id);
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(existing.id);
    expect(after[0].familyAffection).toBe(42);
  });
});
