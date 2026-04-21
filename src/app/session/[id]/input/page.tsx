import { notFound, redirect } from 'next/navigation';

import { InputFormShell } from '@/components/InputFormShell';
import { getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';
import type { AgeRange } from '@/lib/formStore';
import type { InputData } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export default function InputPage({ params }: { params: { id: string } }) {
  const userId = getCurrentUserId();
  const { uow } = getDb();

  const session = uow.repos.sessions.getSession(params.id);
  if (!session) notFound();
  if (session.userId !== userId) redirect('/');

  const existing = uow.repos.inputs.getInputsBySession(params.id);
  const initialInputs: Partial<Record<AgeRange, InputData>> = {};
  for (const row of existing) {
    initialInputs[row.ageRange] = {
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

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs tracking-widest text-ink-400 uppercase">セッション</p>
        <h1 className="text-2xl sm:text-3xl font-semibold">{session.label}</h1>
        <p className="text-sm text-ink-400">
          各年齢区分の環境を入力してください。スライダーを動かすと自動保存されます。
        </p>
      </header>
      <InputFormShell sessionId={params.id} initialInputs={initialInputs} />
    </div>
  );
}
