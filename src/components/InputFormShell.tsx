'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AgeRangeForm } from './AgeRangeForm';
import { AGE_RANGES, allSaved, useFormStore, type AgeRange } from '@/lib/formStore';
import type { InputData } from '@/lib/validation';

interface Props {
  sessionId: string;
  initialInputs: Partial<Record<AgeRange, InputData>>;
}

export function InputFormShell({ sessionId, initialInputs }: Props) {
  const router = useRouter();
  const init = useFormStore((s) => s.init);
  const activeRange = useFormStore((s) => s.activeRange);
  const setActiveRange = useFormStore((s) => s.setActiveRange);
  const status = useFormStore((s) => s.status);

  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    init(sessionId, initialInputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const ready = allSaved(status);

  async function handleAnalyze() {
    setAnalyzeError(null);
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/analyze`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; missing?: string[] }
          | null;
        throw new Error(body?.error ?? `失敗しました: ${res.status}`);
      }
      router.push(`/session/${sessionId}/result`);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'unknown');
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-8">
      <nav
        role="tablist"
        aria-label="年齢区分"
        className="grid grid-cols-4 gap-1 rounded-md border border-ink-700 p-1 bg-ink-800"
      >
        {AGE_RANGES.map((r) => {
          const isActive = r === activeRange;
          const badge = statusBadge(status[r]);
          return (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveRange(r)}
              className={`px-2 py-2 rounded text-sm tabular-nums transition ${
                isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-200 hover:bg-ink-700'
              }`}
            >
              <span className="block">{r}</span>
              <span
                className={`mt-1 inline-block text-[10px] ${
                  isActive ? 'text-ink-500' : 'text-ink-400'
                }`}
                aria-hidden
              >
                {badge}
              </span>
            </button>
          );
        })}
      </nav>

      <AgeRangeForm range={activeRange} />

      <div className="flex flex-col gap-3 border-t border-ink-700 pt-6">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!ready || analyzing}
          className="self-start inline-flex items-center gap-2 rounded-md bg-emotion-joy text-ink-900 px-5 py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {analyzing ? '分析中…' : '分析する'}
          <span aria-hidden>→</span>
        </button>
        {!ready && (
          <p className="text-xs text-ink-400">
            すべての年齢区分を保存すると分析できます。
          </p>
        )}
        {analyzeError && <p className="text-sm text-emotion-anger">{analyzeError}</p>}
      </div>
    </div>
  );
}

function statusBadge(status: string): string {
  switch (status) {
    case 'saved':
      return '✓';
    case 'saving':
      return '…';
    case 'dirty':
      return '●';
    case 'error':
      return '!';
    default:
      return '未';
  }
}
