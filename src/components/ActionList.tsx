'use client';

import { useMemo, useState } from 'react';

import { ActionCard } from './ActionCard';
import type { ActionCategory, ActionRecommendation } from '@/engine';
import { ACTION_CATEGORIES } from '@/engine';

interface Props {
  sessionId: string;
  recommendations: ActionRecommendation[];
  /** 既に保存済みの rule id → saved_action id のマップ */
  savedMap?: Record<string, string>;
}

export function ActionList({ sessionId, recommendations, savedMap = {} }: Props) {
  const [active, setActive] = useState<ActionCategory | 'all'>('all');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of recommendations) c[r.category] = (c[r.category] ?? 0) + 1;
    return c;
  }, [recommendations]);

  const filtered = useMemo(
    () => (active === 'all' ? recommendations : recommendations.filter((r) => r.category === active)),
    [recommendations, active]
  );

  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-ink-400">
        現在のスコアからは特に緊急度の高い介入候補はありません。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <nav role="tablist" className="flex gap-1 rounded-md border border-ink-700 bg-ink-800 p-1 overflow-x-auto">
        <TabButton
          active={active === 'all'}
          onClick={() => setActive('all')}
          label={`すべて (${recommendations.length})`}
        />
        {ACTION_CATEGORIES.map((cat) => (
          <TabButton
            key={cat}
            active={active === cat}
            onClick={() => setActive(cat)}
            label={`${cat} (${counts[cat] ?? 0})`}
          />
        ))}
      </nav>
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((r) => (
          <ActionCard
            key={r.ruleId}
            sessionId={sessionId}
            recommendation={r}
            initiallySavedId={savedMap[r.ruleId] ?? null}
          />
        ))}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 text-xs rounded transition ${
        active ? 'bg-ink-100 text-ink-900' : 'text-ink-200 hover:bg-ink-700'
      }`}
    >
      {label}
    </button>
  );
}
