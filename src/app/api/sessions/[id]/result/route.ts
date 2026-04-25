import { NextResponse } from 'next/server';

import { ensureMigrated, getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';

export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  await ensureMigrated();
  const userId = getCurrentUserId();
  const { uow } = getDb();

  const session = await uow.repos.sessions.getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const latest = await uow.repos.results.getLatestResult(params.id);
  if (!latest) {
    return NextResponse.json({ error: 'No result yet' }, { status: 404 });
  }
  return NextResponse.json({ result: latest });
}
