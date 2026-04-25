import { sampleData, setupInMemoryDb, type TestEnv } from './_helpers';
import type { AgeRange } from '../repositories/interface';

describe('PgInputsRepository', () => {
  let env: TestEnv;
  let sessionId: string;

  beforeEach(async () => {
    env = await setupInMemoryDb();
    const s = await env.uow.repos.sessions.createSession('user-1', 'test');
    sessionId = s.id;
  });

  afterEach(async () => {
    await env.close();
  });

  test('upsertInput() は新規挿入すると保存済みレコードを返す', async () => {
    const data = sampleData({ familyAffection: 80 });
    const row = await env.uow.repos.inputs.upsertInput(sessionId, '0-5', data);
    expect(row.sessionId).toBe(sessionId);
    expect(row.ageRange).toBe('0-5');
    expect(row.familyAffection).toBe(80);
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  test('upsertInput() は同じ (session, ageRange) に対して更新を行う', async () => {
    const first = await env.uow.repos.inputs.upsertInput(
      sessionId,
      '0-5',
      sampleData({ familyAffection: 30 })
    );
    const second = await env.uow.repos.inputs.upsertInput(
      sessionId,
      '0-5',
      sampleData({ familyAffection: 70 })
    );

    expect(second.id).toBe(first.id);
    expect(second.familyAffection).toBe(70);

    const all = await env.uow.repos.inputs.getInputsBySession(sessionId);
    expect(all).toHaveLength(1);
    expect(all[0].familyAffection).toBe(70);
  });

  test('getInputsBySession() は該当セッションの全区分を返す', async () => {
    const ranges: AgeRange[] = ['0-5', '6-10', '11-15', '16-20'];
    for (const r of ranges) {
      await env.uow.repos.inputs.upsertInput(sessionId, r, sampleData());
    }
    const rows = await env.uow.repos.inputs.getInputsBySession(sessionId);
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.ageRange).sort()).toEqual([...ranges].sort());
  });

  test('存在しない session_id への upsert は外部キー違反で reject', async () => {
    await expect(
      env.uow.repos.inputs.upsertInput(
        '00000000-0000-0000-0000-000000000000',
        '0-5',
        sampleData()
      )
    ).rejects.toThrow();
  });
});
