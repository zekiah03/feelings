import { setupInMemoryDb } from './_helpers';

describe('SqliteSessionsRepository', () => {
  let env: ReturnType<typeof setupInMemoryDb>;

  beforeEach(() => {
    env = setupInMemoryDb();
  });

  afterEach(() => {
    env.close();
  });

  test('createSession() は新しいセッションを作り、id/createdAt を持つ', () => {
    const session = env.uow.repos.sessions.createSession('user-1', '2024年の自己分析');
    expect(session.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(session.userId).toBe('user-1');
    expect(session.label).toBe('2024年の自己分析');
    expect(session.createdAt).toBeInstanceOf(Date);
  });

  test('getSession() で作ったセッションを取得できる / 存在しない id は null', () => {
    const created = env.uow.repos.sessions.createSession('user-1', 'A');
    const found = env.uow.repos.sessions.getSession(created.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);

    const missing = env.uow.repos.sessions.getSession('non-existent');
    expect(missing).toBeNull();
  });

  test('listSessions(userId) は該当ユーザーのセッションのみ返す', () => {
    env.uow.repos.sessions.createSession('user-1', 'A');
    env.uow.repos.sessions.createSession('user-1', 'B');
    env.uow.repos.sessions.createSession('user-2', 'C');

    const user1 = env.uow.repos.sessions.listSessions('user-1');
    const user2 = env.uow.repos.sessions.listSessions('user-2');
    const user3 = env.uow.repos.sessions.listSessions('user-3');

    expect(user1.map((s) => s.label).sort()).toEqual(['A', 'B']);
    expect(user2.map((s) => s.label)).toEqual(['C']);
    expect(user3).toEqual([]);
  });
});
