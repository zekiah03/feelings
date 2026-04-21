import { setupInMemoryDb } from './_helpers';

describe('SqliteActionsRepository', () => {
  let env: ReturnType<typeof setupInMemoryDb>;
  let sessionId: string;
  const userId = 'user-1';

  beforeEach(() => {
    env = setupInMemoryDb();
    sessionId = env.uow.repos.sessions.createSession(userId, 'test').id;
  });

  afterEach(() => {
    env.close();
  });

  test('create() は保存して status="saved" の SavedAction を返す', () => {
    const saved = env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: '有酸素運動を週3回',
      category: '感情調整',
    });
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.userId).toBe(userId);
    expect(saved.sessionId).toBe(sessionId);
    expect(saved.status).toBe('saved');
    expect(saved.createdAt).toBeInstanceOf(Date);
  });

  test('listByUser() は降順 (新しい順) で該当ユーザー分だけを返す', () => {
    env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'A',
      category: '感情調整',
    });
    const start = Date.now();
    while (Date.now() === start) {
      /* spin */
    }
    env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'B',
      category: '習慣',
    });
    // 別ユーザーの行動
    const otherSid = env.uow.repos.sessions.createSession('other-user', 'x').id;
    env.uow.repos.actions.create({
      userId: 'other-user',
      sessionId: otherSid,
      actionText: 'X',
      category: '環境設計',
    });

    const mine = env.uow.repos.actions.listByUser(userId);
    expect(mine.map((a) => a.actionText)).toEqual(['B', 'A']);
  });

  test('updateStatus() はステータスを更新し、updatedAt を進める', () => {
    const saved = env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'A',
      category: '習慣',
    });
    const start = Date.now();
    while (Date.now() === start) {
      /* spin */
    }
    const updated = env.uow.repos.actions.updateStatus(saved.id, userId, 'doing');
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('doing');
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(saved.updatedAt.getTime());
  });

  test('updateStatus() は他ユーザーでは更新できず null を返す', () => {
    const saved = env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'A',
      category: '習慣',
    });
    const result = env.uow.repos.actions.updateStatus(saved.id, 'other', 'done');
    expect(result).toBeNull();

    // 元のステータスが変わっていないこと
    const refetched = env.uow.repos.actions.getById(saved.id);
    expect(refetched?.status).toBe('saved');
  });

  test('delete() は本人のみ削除でき、他ユーザーでは false を返す', () => {
    const saved = env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'A',
      category: '感情調整',
    });
    expect(env.uow.repos.actions.delete(saved.id, 'other')).toBe(false);
    expect(env.uow.repos.actions.getById(saved.id)).not.toBeNull();
    expect(env.uow.repos.actions.delete(saved.id, userId)).toBe(true);
    expect(env.uow.repos.actions.getById(saved.id)).toBeNull();
  });

  test('セッション削除で cascade 削除される', () => {
    const saved = env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'A',
      category: '感情調整',
    });
    env.sqlite.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    expect(env.uow.repos.actions.getById(saved.id)).toBeNull();
  });
});
