import { NextResponse } from 'next/server';

import { getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';

export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const userId = getCurrentUserId();
  const { uow } = getDb();

  const session = uow.repos.sessions.getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const latest = uow.repos.results.getLatestResult(params.id);
  if (!latest) {
    return NextResponse.json({ error: 'No result yet' }, { status: 404 });
  }
  return NextResponse.json({ result: latest });
}
