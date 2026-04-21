import { NextResponse } from 'next/server';

import { getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';
import { saveAndCalculate, type BracketInputs } from '@/services/analyzeService';

export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

/**
 * POST /api/sessions/:id/analyze
 *
 * リクエストボディは不要: 既に保存済みの 4 区分の入力を用いて計算する。
 * (フォーム側は /inputs で都度 upsert していく前提)
 *
 * 4区分すべて揃っていない場合は 409 を返す。
 */
export async function POST(_req: Request, { params }: Ctx) {
  const userId = getCurrentUserId();
  const { uow } = getDb();

  const session = uow.repos.sessions.getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const inputs = uow.repos.inputs.getInputsBySession(params.id);
  const required: ('0-5' | '6-10' | '11-15' | '16-20')[] = ['0-5', '6-10', '11-15', '16-20'];
  const missing = required.filter((r) => !inputs.some((i) => i.ageRange === r));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'Incomplete inputs', missing },
      { status: 409 }
    );
  }

  // 既存レコードを BracketInputs に整形してから saveAndCalculate へ
  const bracketInputs: BracketInputs = {} as BracketInputs;
  for (const row of inputs) {
    bracketInputs[row.ageRange] = {
      familyAffection: row.familyAffection,
      familyStability: row.familyStability,
      familyControl: row.familyControl,
      schoolBelonging: row.schoolBelonging,
      schoolStress: row.schoolStress,
      schoolSocialSuccess: row.schoolSocialSuccess,
      eventsStressCount: row.eventsStressCount,
      eventsSuccessCount: row.eventsSuccessCount,
    };
  }

  const { result, profile } = saveAndCalculate(uow, params.id, bracketInputs);
  return NextResponse.json({ resultId: result.id, profile });
}
