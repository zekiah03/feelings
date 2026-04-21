'use client';

import { useMemo, useState } from 'react';

import {
  inverseInterventions,
  type EmotionProfile,
  type EnvironmentInput,
  type Emotion,
  type EmotionLayer,
  type Intervention,
} from '@/lib/engine-client';
import { AGE_RANGE_LABEL, EMOTION_COLOR, EMOTION_LABEL } from '@/lib/emotionMeta';

interface Props {
  input: EnvironmentInput;
  profile: EmotionProfile;
}

const GOAL_EMOTIONS: Emotion[] = [
  'joy',
  'anger',
  'sadness',
  'fear',
  'disgust',
  'surprise',
  'numbness',
  'guilt',
  'shame',
];
const GOAL_LAYERS: EmotionLayer[] = ['intensity', 'sensitivity', 'duration'];
const LAYER_LABEL: Record<EmotionLayer, string> = {
  intensity: '強度',
  sensitivity: '感度',
  duration: '持続',
};

export function GoalPanel({ input, profile }: Props) {
  const [emotion, setEmotion] = useState<Emotion>('joy');
  const [layer, setLayer] = useState<EmotionLayer>('intensity');

  const readLayer = (e: Emotion, l: EmotionLayer): number => {
    const score = profile.emotions[e];
    if (l === 'intensity') return score.intensity;
    if (l === 'sensitivity') return score.sensitivity;
    return score.duration;
  };

  const currentValue = readLayer(emotion, layer);
  const [target, setTarget] = useState<number>(() => Math.min(100, Math.max(0, currentValue + 15)));

  // emotion/layer が変わったら current に合わせて目標を再初期化
  const resetTarget = (e: Emotion, l: EmotionLayer) => {
    const v = readLayer(e, l);
    setEmotion(e);
    setLayer(l);
    setTarget(Math.min(100, Math.max(0, v + 15)));
  };

  const interventions: Intervention[] = useMemo(() => {
    return inverseInterventions(input, { emotion, layer, targetValue: target }).slice(0, 5);
  }, [input, emotion, layer, target]);

  const desiredDelta = target - currentValue;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[11px] tracking-widest uppercase text-ink-400">目標の感情</label>
          <select
            value={emotion}
            onChange={(e) => resetTarget(e.currentTarget.value as Emotion, layer)}
            className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-100"
          >
            {GOAL_EMOTIONS.map((e) => (
              <option key={e} value={e}>
                {EMOTION_LABEL[e]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] tracking-widest uppercase text-ink-400">層</label>
          <div className="flex rounded-md border border-ink-700 bg-ink-800 overflow-hidden">
            {GOAL_LAYERS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => resetTarget(emotion, l)}
                className={`flex-1 px-3 py-2 text-xs transition ${
                  layer === l ? 'bg-ink-100 text-ink-900' : 'text-ink-200 hover:bg-ink-700'
                }`}
              >
                {LAYER_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-ink-100">
            {EMOTION_LABEL[emotion]} の{LAYER_LABEL[layer]}
          </span>
          <span className="text-xs tabular-nums text-ink-300">
            現在 {currentValue.toFixed(0)} → 目標 {target}
            {desiredDelta !== 0 && (
              <span className={desiredDelta > 0 ? 'ml-1 text-emotion-joy' : 'ml-1 text-emotion-sadness'}>
                ({desiredDelta > 0 ? '+' : ''}
                {desiredDelta.toFixed(0)})
              </span>
            )}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={target}
          onChange={(e) => setTarget(Number(e.currentTarget.value))}
          className="w-full"
          style={{ accentColor: EMOTION_COLOR[emotion] }}
        />
      </div>

      <div className="space-y-3 border-t border-ink-700 pt-5">
        <p className="text-[11px] tracking-widest uppercase text-ink-400">
          効果的な介入 (上位 {interventions.length}件)
        </p>
        {interventions.length === 0 ? (
          <p className="text-sm text-ink-400">
            目標に近づく介入候補が見つかりません。目標値を調整してください。
          </p>
        ) : (
          <ul className="space-y-3">
            {interventions.map((iv, i) => (
              <li
                key={`${iv.variable.path}@${iv.ageBracket}@${iv.direction}`}
                className="rounded-lg border border-ink-700 bg-ink-800 p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm text-ink-100 truncate">
                      <span className="text-ink-400 mr-2 tabular-nums">#{i + 1}</span>
                      {iv.label}
                    </p>
                    <p className="text-[11px] text-ink-400">
                      {iv.variable.label} · {AGE_RANGE_LABEL[iv.ageBracket] ?? iv.ageBracket} · 難度{iv.difficulty}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs tabular-nums text-emotion-disgust">
                      期待変化 +{iv.expectedImpact.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-ink-400">
                      step {iv.direction === 'increase' ? '+' : '-'}
                      {iv.stepSize}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-ink-400">
          既定では「16–20歳区分」だけを変更可能とみなしています (= 現在の環境の近似)。
        </p>
      </div>
    </div>
  );
}
