import { setupInMemoryDb, type TestEnv } from './_helpers';

describe('PgSessionsRepository', () => {
  let env: TestEnv;

  beforeEach(async () => {
    env = await setupInMemoryDb();
  });

  afterEach(async () => {
    await env.close();
  });

  test('createSession() は新しいセッションを作り、id/createdAt を持つ', async () => {
    const session = await env.uow.repos.sessions.createSession('user-1', '2024年の自己分析');
    expect(session.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(session.userId).toBe('user-1');
    expect(session.label).toBe('2024年の自己分析');
    expect(session.createdAt).toBeInstanceOf(Date);
  });

  test('getSession() で作ったセッションを取得できる / 存在しない id は null', async () => {
    const created = await env.uow.repos.sessions.createSession('user-1', 'A');
    const found = await env.uow.repos.sessions.getSession(created.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);

    const missing = await env.uow.repos.sessions.getSession(
      '00000000-0000-0000-0000-000000000000'
    );
    expect(missing).toBeNull();
  });

  test('listSessions(userId) は該当ユーザーのセッションのみ返す', async () => {
    await env.uow.repos.sessions.createSession('user-1', 'A');
    await env.uow.repos.sessions.createSession('user-1', 'B');
    await env.uow.repos.sessions.createSession('user-2', 'C');

    const user1 = await env.uow.repos.sessions.listSessions('user-1');
    const user2 = await env.uow.repos.sessions.listSessions('user-2');
    const user3 = await env.uow.repos.sessions.listSessions('user-3');

    expect(user1.map((s) => s.label).sort()).toEqual(['A', 'B']);
    expect(user2.map((s) => s.label)).toEqual(['C']);
    expect(user3).toEqual([]);
  });
});
