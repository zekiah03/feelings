import { NextResponse } from 'next/server';

import { getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';
import { patchActionRequestSchema } from '@/lib/validation';

export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

export async function PATCH(request: Request, { params }: Ctx) {
  const userId = getCurrentUserId();
  const body = await request.json().catch(() => null);
  const parsed = patchActionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = getDb().uow.repos.actions.updateStatus(
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
  const userId = getCurrentUserId();
  const ok = getDb().uow.repos.actions.delete(params.id, userId);
  if (!ok) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
