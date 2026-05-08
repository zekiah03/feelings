'use client'
import { useState } from 'react'
import { contributeToTwin } from '@/lib/twin'

type Rating = 'yes' | 'mid' | 'no'

/**
 * SUST v0.3: 診断結果への自己整合性フィードバック。
 * M_self_rated_coherence への寄与となる。
 */
export function TwinSelfResonance({
  appId,
  context,
}: {
  appId: string
  context?: Record<string, unknown>
}) {
  const [rating, setRating] = useState<Rating | null>(null)

  function pick(r: Rating) {
    if (rating) return
    setRating(r)
    contributeToTwin(appId, {
      type: 'self_resonance',
      rating: r,
      ...(context ?? {}),
    })
  }

  const items: Array<{ key: Rating; label: string; color: string }> = [
    { key: 'yes', label: 'しっくり来た', color: '#10b981' },
    { key: 'mid', label: 'どちらとも',  color: '#94a3b8' },
    { key: 'no',  label: 'ピンと来ない', color: '#f59e0b' },
  ]

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800/50 p-4 sm:p-6">
      <p className="text-sm sm:text-base font-semibold text-ink-100 mb-1">
        この診断、しっくり来た?
      </p>
      <p className="text-xs text-ink-400 mb-4">
        あなたのツインの「自己物語整合性」推定に反映されます。
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map(({ key, label, color }) => {
          const selected = rating === key
          const dim = rating && !selected
          return (
            <button
              key={key}
              onClick={() => pick(key)}
              disabled={!!rating}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-opacity"
              style={{
                color,
                background: `${color}10`,
                border: `1px solid ${selected ? color : `${color}40`}`,
                opacity: dim ? 0.4 : 1,
                cursor: rating ? 'default' : 'pointer',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
      {rating && (
        <p className="text-xs text-ink-400 mt-3">
          ありがとうございます。記録しました。
        </p>
      )}
    </div>
  )
}
