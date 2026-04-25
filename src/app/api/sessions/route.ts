import { NextResponse } from 'next/server';

import { ensureMigrated, getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';
import { createSessionRequestSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  await ensureMigrated();
  const body = await request.json().catch(() => null);
  const parsed = createSessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = getCurrentUserId();
  const session = await getDb().uow.repos.sessions.createSession(userId, parsed.data.label);
  return NextResponse.json({ session }, { status: 201 });
}

export async function GET() {
  await ensureMigrated();
  const userId = getCurrentUserId();
  const sessions = await getDb().uow.repos.sessions.listSessions(userId);
  return NextResponse.json({ sessions });
}
