import { setupInMemoryDb, type TestEnv } from './_helpers';

describe('PgActionsRepository', () => {
  let env: TestEnv;
  let sessionId: string;
  const userId = 'user-1';

  beforeEach(async () => {
    env = await setupInMemoryDb();
    sessionId = (await env.uow.repos.sessions.createSession(userId, 'test')).id;
  });

  afterEach(async () => {
    await env.close();
  });

  test('create() は保存して status="saved" の SavedAction を返す', async () => {
    const saved = await env.uow.repos.actions.create({
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

  test('listByUser() は降順 (新しい順) で該当ユーザー分だけを返す', async () => {
    await env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'A',
      category: '感情調整',
    });
    await new Promise((r) => setTimeout(r, 5));
    await env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'B',
      category: '習慣',
    });
    const otherSid = (await env.uow.repos.sessions.createSession('other-user', 'x')).id;
    await env.uow.repos.actions.create({
      userId: 'other-user',
      sessionId: otherSid,
      actionText: 'X',
      category: '環境設計',
    });

    const mine = await env.uow.repos.actions.listByUser(userId);
    expect(mine.map((a) => a.actionText)).toEqual(['B', 'A']);
  });

  test('updateStatus() はステータスを更新し、updatedAt を進める', async () => {
    const saved = await env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'A',
      category: '習慣',
    });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await env.uow.repos.actions.updateStatus(saved.id, userId, 'doing');
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('doing');
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(saved.updatedAt.getTime());
  });

  test('updateStatus() は他ユーザーでは更新できず null を返す', async () => {
    const saved = await env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'A',
      category: '習慣',
    });
    const result = await env.uow.repos.actions.updateStatus(saved.id, 'other', 'done');
    expect(result).toBeNull();

    const refetched = await env.uow.repos.actions.getById(saved.id);
    expect(refetched?.status).toBe('saved');
  });

  test('delete() は本人のみ削除でき、他ユーザーでは false を返す', async () => {
    const saved = await env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'A',
      category: '感情調整',
    });
    expect(await env.uow.repos.actions.delete(saved.id, 'other')).toBe(false);
    expect(await env.uow.repos.actions.getById(saved.id)).not.toBeNull();
    expect(await env.uow.repos.actions.delete(saved.id, userId)).toBe(true);
    expect(await env.uow.repos.actions.getById(saved.id)).toBeNull();
  });

  test('セッション削除で cascade 削除される', async () => {
    const saved = await env.uow.repos.actions.create({
      userId,
      sessionId,
      actionText: 'A',
      category: '感情調整',
    });
    await env.pglite.exec(`DELETE FROM sessions WHERE id = '${sessionId}'`);
    expect(await env.uow.repos.actions.getById(saved.id)).toBeNull();
  });
});
