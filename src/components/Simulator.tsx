'use client';

import { useMemo, useState } from 'react';

import { calculate, type AgeBracket, type EnvironmentInput, type EmotionProfile } from '@/lib/engine-client';
import { AGE_RANGE_LABEL, CORE_EMOTION_ORDER, EMOTION_COLOR, EMOTION_LABEL } from '@/lib/emotionMeta';

interface Props {
  /** 実際の入力 (比較基準) */
  baseline: EnvironmentInput;
  /** 実際の計算結果 (比較基準) */
  baselineProfile: EmotionProfile;
}

const AGE_BRACKETS: AgeBracket[] = ['0-5', '6-10', '11-15', '16-20'];

type FlatField = {
  path: string;
  label: string;
  min: number;
  max: number;
};

const FAMILY_FIELDS: FlatField[] = [
  { path: 'family.affection', label: '家庭: 愛情量', min: 0, max: 100 },
  { path: 'family.stability', label: '家庭: 安定性', min: 0, max: 100 },
  { path: 'family.control', label: '家庭: 支配度', min: 0, max: 100 },
];
const SCHOOL_FIELDS: FlatField[] = [
  { path: 'school.belonging', label: '学校: 所属感', min: 0, max: 100 },
  { path: 'school.stress', label: '学校: ストレス', min: 0, max: 100 },
  { path: 'school.socialSuccess', label: '学校: 成功体験', min: 0, max: 100 },
];
const EVENT_FIELDS: FlatField[] = [
  { path: 'events.stressEvents', label: 'イベント: ストレス数', min: 0, max: 10 },
  { path: 'events.successEvents', label: 'イベント: 成功数', min: 0, max: 10 },
];
const ALL_FIELDS = [...FAMILY_FIELDS, ...SCHOOL_FIELDS, ...EVENT_FIELDS];

export function Simulator({ baseline, baselineProfile }: Props) {
  const [activeBracket, setActiveBracket] = useState<AgeBracket>('0-5');
  const [simulated, setSimulated] = useState<EnvironmentInput>(() =>
    structuredClone(baseline)
  );

  const simulatedProfile = useMemo(() => calculate(simulated), [simulated]);

  const handleChange = (bracket: AgeBracket, path: string, value: number) => {
    setSimulated((prev) => {
      const next = structuredClone(prev);
      setByPath(next[bracket] as unknown as Record<string, unknown>, path, value);
      return next;
    });
  };

  const resetToBaseline = () => setSimulated(structuredClone(baseline));

  const active = simulated[activeBracket];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <nav role="tablist" className="flex rounded-md border border-ink-700 bg-ink-800 overflow-hidden">
          {AGE_BRACKETS.map((b) => (
            <button
              key={b}
              type="button"
              role="tab"
              aria-selected={b === activeBracket}
              onClick={() => setActiveBracket(b)}
              className={`px-3 py-2 text-xs transition ${
                b === activeBracket
                  ? 'bg-ink-100 text-ink-900'
                  : 'text-ink-200 hover:bg-ink-700'
              }`}
            >
              {AGE_RANGE_LABEL[b]}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={resetToBaseline}
          className="text-xs text-ink-300 underline-offset-2 hover:underline"
        >
          実際の入力に戻す
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          {ALL_FIELDS.map((f) => {
            const current = getByPath(active as unknown as Record<string, unknown>, f.path) as number;
            const baselineVal = getByPath(
              baseline[activeBracket] as unknown as Record<string, unknown>,
              f.path
            ) as number;
            const diff = current - baselineVal;
            return (
              <div key={f.path} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <label className="text-sm text-ink-100">{f.label}</label>
                  <span className="text-xs tabular-nums text-ink-300">
                    {current}
                    {diff !== 0 && (
                      <span
                        className={`ml-1 ${
                          diff > 0 ? 'text-emotion-joy' : 'text-emotion-sadness'
                        }`}
                      >
                        ({diff > 0 ? '+' : ''}
                        {diff})
                      </span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={1}
                  value={current}
                  onChange={(e) =>
                    handleChange(activeBracket, f.path, Number(e.currentTarget.value))
                  }
                  className="w-full"
                />
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <p className="text-[11px] tracking-widest text-ink-400 uppercase">
            シミュレーション結果 (強度の変化)
          </p>
          <ul className="space-y-3">
            {CORE_EMOTION_ORDER.map((e) => {
              const current = simulatedProfile.emotions[e].intensity;
              const base = baselineProfile.emotions[e].intensity;
              const diff = current - base;
              const pct = Math.max(0, Math.min(100, current));
              const basePct = Math.max(0, Math.min(100, base));
              return (
                <li key={e} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-ink-100">{EMOTION_LABEL[e]}</span>
                    <span className="text-xs tabular-nums text-ink-300">
                      {current.toFixed(0)}
                      {Math.abs(diff) >= 0.5 && (
                        <span
                          className={`ml-1 ${
                            diff > 0 ? 'text-emotion-anger' : 'text-emotion-disgust'
                          }`}
                        >
                          ({diff > 0 ? '+' : ''}
                          {diff.toFixed(0)})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-ink-700 overflow-hidden">
                    {/* ベースライン (薄い) */}
                    <div
                      className="absolute inset-y-0 left-0 opacity-30"
                      style={{ width: `${basePct}%`, backgroundColor: EMOTION_COLOR[e] }}
                    />
                    {/* シミュ値 */}
                    <div
                      className="absolute inset-y-0 left-0 transition-[width] duration-200"
                      style={{ width: `${pct}%`, backgroundColor: EMOTION_COLOR[e] }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-ink-400 pt-2">
            薄い色のバー: 実際の結果 / 濃い色のバー: シミュレーション値
          </p>
        </div>
      </div>
    </div>
  );
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cursor: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const next = cursor[k];
    if (!next || typeof next !== 'object') {
      cursor[k] = {};
    }
    cursor = cursor[k] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
}
