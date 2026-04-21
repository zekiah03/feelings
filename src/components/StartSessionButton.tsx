'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function StartSessionButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const label = defaultLabel();
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error(`failed: ${res.status}`);
      const { session } = (await res.json()) as { session: { id: string } };
      router.push(`/session/${session.id}/input`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-ink-100 text-ink-900 px-5 py-3 text-sm font-medium tracking-wide transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '作成中…' : '分析をはじめる'}
        <span aria-hidden>→</span>
      </button>
      {error && <p className="text-sm text-emotion-anger">{error}</p>}
    </div>
  );
}

function defaultLabel(): string {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月 の自己分析`;
}
