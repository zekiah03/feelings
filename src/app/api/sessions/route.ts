import { NextResponse } from 'next/server';

import { getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';
import { createSessionRequestSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = getCurrentUserId();
  const session = getDb().uow.repos.sessions.createSession(userId, parsed.data.label);
  return NextResponse.json({ session }, { status: 201 });
}

export async function GET() {
  const userId = getCurrentUserId();
  const sessions = getDb().uow.repos.sessions.listSessions(userId);
  return NextResponse.json({ sessions });
}
