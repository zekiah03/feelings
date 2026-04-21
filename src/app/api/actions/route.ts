import { NextResponse } from 'next/server';

import { getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';
import { createActionRequestSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const userId = getCurrentUserId();
  const body = await request.json().catch(() => null);
  const parsed = createActionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { uow } = getDb();

  // セッション所有者チェック
  const session = uow.repos.sessions.getSession(parsed.data.sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const saved = uow.repos.actions.create({
    userId,
    sessionId: parsed.data.sessionId,
    actionText: parsed.data.actionText,
    category: parsed.data.category,
  });
  return NextResponse.json({ action: saved }, { status: 201 });
}

export async function GET() {
  const userId = getCurrentUserId();
  const actions = getDb().uow.repos.actions.listByUser(userId);
  return NextResponse.json({ actions });
}
