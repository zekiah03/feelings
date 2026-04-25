import { calculate, neutralInput } from '../engine';
import { setupInMemoryDb, type TestEnv } from './_helpers';

describe('PgResultsRepository', () => {
  let env: TestEnv;
  let sessionId: string;

  beforeEach(async () => {
    env = await setupInMemoryDb();
    sessionId = (await env.uow.repos.sessions.createSession('user-1', 'test')).id;
  });

  afterEach(async () => {
    await env.close();
  });

  test('saveResult() は保存したレコードを返し、profile は JSON ラウンドトリップで復元できる', async () => {
    const profile = calculate(neutralInput());
    const saved = await env.uow.repos.results.saveResult(sessionId, profile);
    expect(saved.sessionId).toBe(sessionId);
    expect(saved.calculatedAt).toBeInstanceOf(Date);
    expect(saved.profile).toEqual(profile);
  });

  test('getLatestResult() は最新1件を返す', async () => {
    const p1 = calculate(neutralInput());
    await env.uow.repos.results.saveResult(sessionId, p1);

    const input2 = neutralInput();
    input2['0-5'].family.affection = 0;
    const p2 = calculate(input2);
    // タイムスタンプが重ならないようにマイクロ秒分ずらす
    await new Promise((r) => setTimeout(r, 10));
    await env.uow.repos.results.saveResult(sessionId, p2);

    const latest = await env.uow.repos.results.getLatestResult(sessionId);
    expect(latest).not.toBeNull();
    expect(latest?.profile).toEqual(p2);
  });

  test('getLatestResult() 結果がなければ null', async () => {
    const latest = await env.uow.repos.results.getLatestResult(sessionId);
    expect(latest).toBeNull();
  });

  test('getResultHistory() は新しい順で全件返す', async () => {
    const profile = calculate(neutralInput());
    await env.uow.repos.results.saveResult(sessionId, profile);
    await new Promise((r) => setTimeout(r, 5));
    await env.uow.repos.results.saveResult(sessionId, profile);
    await new Promise((r) => setTimeout(r, 5));
    await env.uow.repos.results.saveResult(sessionId, profile);

    const history = await env.uow.repos.results.getResultHistory(sessionId);
    expect(history).toHaveLength(3);
    for (let i = 1; i < history.length; i++) {
      expect(history[i - 1].calculatedAt.getTime()).toBeGreaterThanOrEqual(
        history[i].calculatedAt.getTime()
      );
    }
  });
});
