import { NextResponse } from 'next/server';

import { ensureMigrated, getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';
import { patchActionRequestSchema } from '@/lib/validation';

export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

export async function PATCH(request: Request, { params }: Ctx) {
  await ensureMigrated();
  const userId = getCurrentUserId();
  const body = await request.json().catch(() => null);
  const parsed = patchActionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await getDb().uow.repos.actions.updateStatus(
    params.id,
    userId,
    parsed.data.status
  );
  if (!updated) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
  }
  return NextResponse.json({ action: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  await ensureMigrated();
  const userId = getCurrentUserId();
  const ok = await getDb().uow.repos.actions.delete(params.id, userId);
  if (!ok) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
