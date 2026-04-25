import { NextResponse } from 'next/server';

import { ensureMigrated, getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';
import { upsertInputRequestSchema } from '@/lib/validation';

export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

async function requireOwnedSession(sessionId: string) {
  const userId = getCurrentUserId();
  const session = await getDb().uow.repos.sessions.getSession(sessionId);
  if (!session) {
    return {
      error: NextResponse.json({ error: 'Session not found' }, { status: 404 }),
    } as const;
  }
  if (session.userId !== userId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const;
  }
  return { session } as const;
}

export async function GET(_req: Request, { params }: Ctx) {
  await ensureMigrated();
  const gate = await requireOwnedSession(params.id);
  if ('error' in gate) return gate.error;

  const inputs = await getDb().uow.repos.inputs.getInputsBySession(params.id);
  return NextResponse.json({ inputs });
}

export async function POST(request: Request, { params }: Ctx) {
  await ensureMigrated();
  const gate = await requireOwnedSession(params.id);
  if ('error' in gate) return gate.error;

  const body = await request.json().catch(() => null);
  const parsed = upsertInputRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const saved = await getDb().uow.repos.inputs.upsertInput(
    params.id,
    parsed.data.ageRange,
    parsed.data.data
  );
  return NextResponse.json({ input: saved });
}
