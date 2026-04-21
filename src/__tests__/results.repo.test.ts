import { calculate, neutralInput } from '../engine';
import { setupInMemoryDb } from './_helpers';

describe('SqliteResultsRepository', () => {
  let env: ReturnType<typeof setupInMemoryDb>;
  let sessionId: string;

  beforeEach(() => {
    env = setupInMemoryDb();
    sessionId = env.uow.repos.sessions.createSession('user-1', 'test').id;
  });

  afterEach(() => {
    env.close();
  });

  test('saveResult() は保存したレコードを返し、profile は JSON ラウンドトリップで復元できる', () => {
    const profile = calculate(neutralInput());
    const saved = env.uow.repos.results.saveResult(sessionId, profile);
    expect(saved.sessionId).toBe(sessionId);
    expect(saved.calculatedAt).toBeInstanceOf(Date);
    expect(saved.profile).toEqual(profile);
  });

  test('getLatestResult() は最新1件を返す', () => {
    const p1 = calculate(neutralInput());
    env.uow.repos.results.saveResult(sessionId, p1);

    // 時刻が重なっても確実に後に書かれた方が最新になるよう、2件目を明示
    const input2 = neutralInput();
    input2['0-5'].family.affection = 0;
    const p2 = calculate(input2);
    // 少し時刻をずらすためスピンで保証する
    const start = Date.now();
    while (Date.now() === start) {
      /* spin for ≤1ms to ensure next timestamp differs */
    }
    env.uow.repos.results.saveResult(sessionId, p2);

    const latest = env.uow.repos.results.getLatestResult(sessionId);
    expect(latest).not.toBeNull();
    expect(latest?.profile).toEqual(p2);
  });

  test('getLatestResult() 結果がなければ null', () => {
    const latest = env.uow.repos.results.getLatestResult(sessionId);
    expect(latest).toBeNull();
  });

  test('getResultHistory() は新しい順で全件返す', () => {
    const profile = calculate(neutralInput());
    env.uow.repos.results.saveResult(sessionId, profile);
    const start = Date.now();
    while (Date.now() === start) {
      /* spin */
    }
    env.uow.repos.results.saveResult(sessionId, profile);
    const start2 = Date.now();
    while (Date.now() === start2) {
      /* spin */
    }
    env.uow.repos.results.saveResult(sessionId, profile);

    const history = env.uow.repos.results.getResultHistory(sessionId);
    expect(history).toHaveLength(3);
    // 降順
    for (let i = 1; i < history.length; i++) {
      expect(history[i - 1].calculatedAt.getTime()).toBeGreaterThanOrEqual(
        history[i].calculatedAt.getTime()
      );
    }
  });
});
