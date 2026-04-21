'use client';

import { useState } from 'react';

import type { ActionRecommendation } from '@/engine';

interface Props {
  sessionId: string;
  recommendation: ActionRecommendation;
  /** 既に保存済みの場合、その id を渡すと「保存済み」の表示になる */
  initiallySavedId?: string | null;
}

export function ActionCard({ sessionId, recommendation, initiallySavedId }: Props) {
  const [savedId, setSavedId] = useState<string | null>(initiallySavedId ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          actionText: recommendation.text,
          category: recommendation.category,
        }),
      });
      if (!res.ok) throw new Error(`failed: ${res.status}`);
      const body = (await res.json()) as { action: { id: string } };
      setSavedId(body.action.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  const badgeTone =
    recommendation.difficulty === '低'
      ? 'bg-emotion-disgust/20 text-emotion-disgust'
      : recommendation.difficulty === '中'
        ? 'bg-emotion-joy/20 text-emotion-joy'
        : 'bg-emotion-anger/20 text-emotion-anger';

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-100 leading-relaxed">{recommendation.text}</p>
        <span
          className={`shrink-0 text-[10px] tracking-widest uppercase rounded px-1.5 py-0.5 ${badgeTone}`}
        >
          難度{recommendation.difficulty}
        </span>
      </div>
      <p className="text-xs text-ink-400">
        <span className="tracking-widest uppercase mr-1">根拠</span>
        {recommendation.basis}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !!savedId}
          className={`text-xs rounded px-3 py-1.5 transition ${
            savedId
              ? 'bg-ink-700 text-ink-300 cursor-default'
              : 'bg-ink-100 text-ink-900 hover:bg-white disabled:opacity-50'
          }`}
        >
          {savedId ? '✓ 保存済み' : busy ? '保存中…' : '保存する'}
        </button>
        {error && <span className="text-xs text-emotion-anger">{error}</span>}
      </div>
    </div>
  );
}
