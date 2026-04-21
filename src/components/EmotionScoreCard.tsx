'use client';

import type { Emotion, EmotionScore } from '@/engine';
import { AGE_RANGE_LABEL, EMOTION_COLOR, EMOTION_LABEL } from '@/lib/emotionMeta';

interface Props {
  emotion: Emotion;
  score: EmotionScore;
}

export function EmotionScoreCard({ emotion, score }: Props) {
  const color = EMOTION_COLOR[emotion];

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <h3 className="text-sm font-semibold text-ink-100">{EMOTION_LABEL[emotion]}</h3>
      </div>

      <div className="space-y-3">
        <Gauge label="強度" value={score.intensity} color={color} />
        <Gauge label="感度" value={score.sensitivity} color={color} />
        <Gauge label="持続" value={score.duration} color={color} />
      </div>

      {score.topFactors.length > 0 && (
        <div className="border-t border-ink-700 pt-3 space-y-1.5">
          <p className="text-[10px] tracking-widest text-ink-400 uppercase">
            主な影響要因
          </p>
          <ul className="space-y-1">
            {score.topFactors.map((f, i) => (
              <li
                key={`${f.factor}-${f.ageBracket}-${i}`}
                className="flex items-baseline justify-between gap-3 text-xs"
              >
                <span className="text-ink-100 truncate">{f.label}</span>
                <span className="shrink-0 tabular-nums text-ink-400">
                  {AGE_RANGE_LABEL[f.ageBracket] ?? f.ageBracket}{' '}
                  <span className={f.contribution >= 0 ? 'text-emotion-joy' : 'text-emotion-sadness'}>
                    {f.contribution >= 0 ? '+' : ''}
                    {f.contribution.toFixed(1)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Gauge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[11px] tracking-widest text-ink-300 uppercase">
          {label}
        </span>
        <span className="text-xs tabular-nums text-ink-100">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
