'use client';

import type { ExpressionStyle } from '@/engine';
import { EXPRESSION_LABEL } from '@/lib/emotionMeta';

interface Props {
  expression: ExpressionStyle;
}

const STYLE_COLORS: Record<keyof ExpressionStyle, string> = {
  humor: '#F0B429',
  empathy: '#4CAF7D',
  suppression: '#5B8BD6',
  explosiveness: '#E05252',
};

export function StyleBarChart({ expression }: Props) {
  const keys: (keyof ExpressionStyle)[] = ['humor', 'empathy', 'suppression', 'explosiveness'];
  return (
    <div className="space-y-4">
      {keys.map((k) => {
        const value = expression[k];
        const pct = Math.max(0, Math.min(100, value));
        return (
          <div key={k}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-sm text-ink-100">{EXPRESSION_LABEL[k]}</span>
              <span className="text-xs tabular-nums text-ink-300">
                {value.toFixed(0)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${pct}%`, backgroundColor: STYLE_COLORS[k] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
