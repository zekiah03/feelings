import { EMOTION_BASELINE } from '../engine';
import { saveAndCalculate, type BracketInputs } from '../services/analyzeService';
import { sampleData, setupInMemoryDb, type TestEnv } from './_helpers';
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
  let env: TestEnv;

  beforeEach(async () => {
    env = await setupInMemoryDb();
  });

  afterEach(async () => {
    await env.close();
  });

  test('入力保存 → 計算 → 結果保存を1トランザクションで完了する', async () => {
    const session = await env.uow.repos.sessions.createSession('user-1', 'trial');
    const inputs = allNeutral();
    inputs['0-5'] = sampleData({ familyAffection: 0 });

    const { inputs: saved, result, profile } = await saveAndCalculate(
      env.uow,
      session.id,
      inputs
    );

    expect(saved).toHaveLength(4);
    const ranges = saved.map((s) => s.ageRange).sort() as AgeRange[];
    expect(ranges).toEqual(['0-5', '11-15', '16-20', '6-10'].sort());

    expect(profile.emotions.fear.intensity).toBeGreaterThan(
      EMOTION_BASELINE.intensity
    );

    const latest = await env.uow.repos.results.getLatestResult(session.id);
    expect(latest?.id).toBe(result.id);
    expect(latest?.profile).toEqual(profile);
  });

  test('2回呼び出すと入力は upsert され、結果は履歴に増える', async () => {
    const session = await env.uow.repos.sessions.createSession('user-1', 'trial');

    await saveAndCalculate(env.uow, session.id, allNeutral());
    await new Promise((r) => setTimeout(r, 5));
    const modified = allNeutral();
    modified['11-15'] = sampleData({ eventsStressCount: 10 });
    await saveAndCalculate(env.uow, session.id, modified);

    const allInputs = await env.uow.repos.inputs.getInputsBySession(session.id);
    expect(allInputs).toHaveLength(4);

    const history = await env.uow.repos.results.getResultHistory(session.id);
    expect(history).toHaveLength(2);
  });

  test('存在しないセッションIDではロールバックされ、何も書き込まれない', async () => {
    await expect(
      saveAndCalculate(env.uow, '00000000-0000-0000-0000-000000000000', allNeutral())
    ).rejects.toThrow(/Session not found/);

    const results = await env.uow.repos.results.getResultHistory(
      '00000000-0000-0000-0000-000000000000'
    );
    const inputs = await env.uow.repos.inputs.getInputsBySession(
      '00000000-0000-0000-0000-000000000000'
    );
    expect(results).toHaveLength(0);
    expect(inputs).toHaveLength(0);
  });

  test('途中で throw するとトランザクションがロールバックされ入力も保存されない', async () => {
    const session = await env.uow.repos.sessions.createSession('user-1', 'rollback-test');

    const existing = await env.uow.repos.inputs.upsertInput(
      session.id,
      '0-5',
      sampleData({ familyAffection: 42 })
    );

    await expect(
      env.uow.withTransaction(async (repos) => {
        await repos.inputs.upsertInput(session.id, '0-5', sampleData({ familyAffection: 99 }));
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    const after = await env.uow.repos.inputs.getInputsBySession(session.id);
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(existing.id);
    expect(after[0].familyAffection).toBe(42);
  });
});
