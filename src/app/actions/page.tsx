import Link from 'next/link';

import { SavedActionRow } from '@/components/SavedActionRow';
import { ACTION_CATEGORIES, type ActionCategory } from '@/engine';
import { getCurrentUserId } from '@/lib/currentUser';
import { getDb } from '@/lib/db';
import type { SavedAction } from '@/repositories/interface';

export const dynamic = 'force-dynamic';

export default function SavedActionsPage() {
  const userId = getCurrentUserId();
  const actions = getDb().uow.repos.actions.listByUser(userId);

  const statusGroups = {
    saved: actions.filter((a) => a.status === 'saved'),
    doing: actions.filter((a) => a.status === 'doing'),
    done: actions.filter((a) => a.status === 'done'),
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs tracking-widest text-ink-400 uppercase">行動提案</p>
        <h1 className="text-2xl sm:text-3xl font-semibold">保存した提案</h1>
        <p className="text-sm text-ink-400">
          セッションをまたいで保存した行動提案。ステータスを切り替えて実践を管理できます。
        </p>
      </header>

      {actions.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-ink-700 bg-ink-800/50 p-6">
          <p className="text-sm text-ink-300">まだ保存された提案はありません。</p>
          <Link
            href="/"
            className="inline-block text-sm text-ink-100 underline-offset-4 hover:underline"
          >
            ホームへ戻る →
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          <GroupSection title="実践中" items={statusGroups.doing} />
          <GroupSection title="保留" items={statusGroups.saved} />
          <GroupSection title="完了" items={statusGroups.done} />
          <CategoryBreakdown actions={actions} />
        </div>
      )}
    </div>
  );
}

function GroupSection({
  title,
  items,
}: {
  title: string;
  items: SavedAction[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium tracking-widest text-ink-300 uppercase">
        {title} ({items.length})
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((a) => (
          <SavedActionRow key={a.id} action={a} />
        ))}
      </div>
    </section>
  );
}

function CategoryBreakdown({ actions }: { actions: SavedAction[] }) {
  const counts: Record<ActionCategory, number> = {
    '感情調整': 0,
    '環境設計': 0,
    '習慣': 0,
  };
  for (const a of actions) {
    const cat = a.category as ActionCategory;
    if (cat in counts) counts[cat] += 1;
  }
  return (
    <section className="rounded-xl border border-ink-700 bg-ink-800/30 p-4 sm:p-5">
      <p className="text-[11px] tracking-widest uppercase text-ink-400 mb-3">カテゴリ内訳</p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        {ACTION_CATEGORIES.map((cat) => (
          <div key={cat}>
            <p className="text-ink-100 tabular-nums">{counts[cat]}</p>
            <p className="text-xs text-ink-400">{cat}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
