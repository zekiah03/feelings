import Link from 'next/link';

import { getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';
import { StartSessionButton } from '@/components/StartSessionButton';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const userId = getCurrentUserId();
  const sessions = getDb().uow.repos.sessions.listSessions(userId);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          あなたの感情は、どこから来ているのか。
        </h1>
        <p className="text-ink-300 text-base sm:text-lg leading-relaxed max-w-2xl">
          0歳から20歳までの生育環境 — 家庭・学校・経験の記憶 — を入力すると、
          今の感情の強度・感度・持続を推定します。
          自分の感情の形を俯瞰するための、簡単な自己分析ツールです。
        </p>
        <div className="pt-2">
          <StartSessionButton />
        </div>
      </section>

      {sessions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium tracking-widest text-ink-300 uppercase">
            過去のセッション
          </h2>
          <ul className="divide-y divide-ink-700 rounded-lg border border-ink-700 overflow-hidden">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/session/${s.id}/input`}
                  className="block px-4 py-3 hover:bg-ink-800 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-ink-100 truncate">{s.label}</span>
                    <span className="text-xs text-ink-400 shrink-0">
                      {new Date(s.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
