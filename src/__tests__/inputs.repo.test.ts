import { sampleData, setupInMemoryDb } from './_helpers';
import type { AgeRange } from '../repositories/interface';

describe('SqliteInputsRepository', () => {
  let env: ReturnType<typeof setupInMemoryDb>;
  let sessionId: string;

  beforeEach(() => {
    env = setupInMemoryDb();
    sessionId = env.uow.repos.sessions.createSession('user-1', 'test').id;
  });

  afterEach(() => {
    env.close();
  });

  test('upsertInput() は新規挿入すると保存済みレコードを返す', () => {
    const data = sampleData({ familyAffection: 80 });
    const row = env.uow.repos.inputs.upsertInput(sessionId, '0-5', data);
    expect(row.sessionId).toBe(sessionId);
    expect(row.ageRange).toBe('0-5');
    expect(row.familyAffection).toBe(80);
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  test('upsertInput() は同じ (session, ageRange) に対して更新を行う', () => {
    const first = env.uow.repos.inputs.upsertInput(
      sessionId,
      '0-5',
      sampleData({ familyAffection: 30 })
    );
    const second = env.uow.repos.inputs.upsertInput(
      sessionId,
      '0-5',
      sampleData({ familyAffection: 70 })
    );

    // id は同じまま (UNIQUE 制約にぶら下がる upsert)
    expect(second.id).toBe(first.id);
    expect(second.familyAffection).toBe(70);

    const all = env.uow.repos.inputs.getInputsBySession(sessionId);
    expect(all).toHaveLength(1);
    expect(all[0].familyAffection).toBe(70);
  });

  test('getInputsBySession() は該当セッションの全区分を返す', () => {
    const ranges: AgeRange[] = ['0-5', '6-10', '11-15', '16-20'];
    for (const r of ranges) {
      env.uow.repos.inputs.upsertInput(sessionId, r, sampleData());
    }
    const rows = env.uow.repos.inputs.getInputsBySession(sessionId);
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.ageRange).sort()).toEqual([...ranges].sort());
  });

  test('存在しない session_id への upsert は外部キー違反で throw', () => {
    expect(() =>
      env.uow.repos.inputs.upsertInput('non-existent-session', '0-5', sampleData())
    ).toThrow();
  });
});
