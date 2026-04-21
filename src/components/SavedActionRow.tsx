'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { ActionStatus, SavedAction } from '@/repositories/interface';

interface Props {
  action: SavedAction;
}

const STATUS_LABEL: Record<ActionStatus, string> = {
  saved: '保留',
  doing: '実践中',
  done: '完了',
};

const STATUS_ORDER: ActionStatus[] = ['saved', 'doing', 'done'];

export function SavedActionRow({ action }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ActionStatus>(action.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(next: ActionStatus) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/actions/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('この提案を削除しますか？')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/actions/${action.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(String(res.status));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-100 leading-relaxed">{action.actionText}</p>
        <span className="shrink-0 text-[10px] tracking-widest uppercase text-ink-400">
          {action.category}
        </span>
      </div>
      <p className="text-[11px] text-ink-400">
        保存日: {new Date(action.createdAt).toLocaleDateString('ja-JP')}
        {action.updatedAt.getTime() !== action.createdAt.getTime() && (
          <>
            {' '}
            · 更新: {new Date(action.updatedAt).toLocaleDateString('ja-JP')}
          </>
        )}
      </p>
      <div className="flex items-center gap-1 flex-wrap">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => updateStatus(s)}
            disabled={busy || status === s}
            className={`text-xs rounded px-2.5 py-1 transition ${
              status === s
                ? 'bg-ink-100 text-ink-900 cursor-default'
                : 'bg-ink-700 text-ink-200 hover:bg-ink-600 disabled:opacity-50'
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="ml-auto text-xs text-ink-400 hover:text-emotion-anger disabled:opacity-50"
        >
          削除
        </button>
      </div>
      {error && <p className="text-xs text-emotion-anger">{error}</p>}
    </div>
  );
}
