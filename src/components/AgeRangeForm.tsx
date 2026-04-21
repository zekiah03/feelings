'use client';

import { useEffect, useRef } from 'react';

import { useFormStore, type AgeRange } from '@/lib/formStore';
import type { InputData } from '@/lib/validation';

type SliderConfig = {
  field: keyof InputData;
  label: string;
  min: number;
  max: number;
  /** スライダーの両端に添える補助ラベル */
  extrema?: [string, string];
};

const FAMILY_FIELDS: SliderConfig[] = [
  { field: 'familyAffection', label: '愛情量', min: 0, max: 100, extrema: ['冷たい', '温かい'] },
  { field: 'familyStability', label: '安定性', min: 0, max: 100, extrema: ['不安定', '安定'] },
  {
    field: 'familyControl',
    label: '支配度',
    min: 0,
    max: 100,
    extrema: ['自由', '支配的'],
  },
];
const SCHOOL_FIELDS: SliderConfig[] = [
  { field: 'schoolBelonging', label: '所属感', min: 0, max: 100, extrema: ['孤立', '居場所あり'] },
  { field: 'schoolStress', label: 'ストレス', min: 0, max: 100, extrema: ['穏やか', '強い'] },
  {
    field: 'schoolSocialSuccess',
    label: '社会的成功体験',
    min: 0,
    max: 100,
    extrema: ['少ない', '多い'],
  },
];
const EVENT_FIELDS: SliderConfig[] = [
  { field: 'eventsStressCount', label: '大きなストレスイベント数', min: 0, max: 10 },
  { field: 'eventsSuccessCount', label: '成功体験数', min: 0, max: 10 },
];

const SAVE_DEBOUNCE_MS = 300;

export function AgeRangeForm({ range }: { range: AgeRange }) {
  const sessionId = useFormStore((s) => s.sessionId);
  const values = useFormStore((s) => s.values[range]);
  const status = useFormStore((s) => s.status[range]);
  const setValue = useFormStore((s) => s.setValue);
  const setStatus = useFormStore((s) => s.setStatus);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValues = useRef(values);
  latestValues.current = values;

  // dirty になったら debounce して保存
  useEffect(() => {
    if (status !== 'dirty' || !sessionId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setStatus(range, 'saving');
      try {
        const res = await fetch(`/api/sessions/${sessionId}/inputs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ageRange: range, data: latestValues.current }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus(range, 'saved');
      } catch {
        setStatus(range, 'error');
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [values, status, sessionId, range, setStatus]);

  return (
    <div className="space-y-8">
      <FieldGroup title="家庭">
        {FAMILY_FIELDS.map((f) => (
          <Slider
            key={f.field}
            config={f}
            value={values[f.field]}
            onChange={(v) => setValue(range, f.field, v)}
          />
        ))}
      </FieldGroup>
      <FieldGroup title="学校">
        {SCHOOL_FIELDS.map((f) => (
          <Slider
            key={f.field}
            config={f}
            value={values[f.field]}
            onChange={(v) => setValue(range, f.field, v)}
          />
        ))}
      </FieldGroup>
      <FieldGroup title="イベント">
        {EVENT_FIELDS.map((f) => (
          <Slider
            key={f.field}
            config={f}
            value={values[f.field]}
            onChange={(v) => setValue(range, f.field, v)}
          />
        ))}
      </FieldGroup>
      <SaveStatusLabel status={status} />
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h3 className="text-sm font-medium tracking-widest text-ink-300 uppercase">
        {title}
      </h3>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Slider({
  config,
  value,
  onChange,
}: {
  config: SliderConfig;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm text-ink-100">{config.label}</label>
        <span className="text-xs tabular-nums text-ink-300">{value}</span>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="w-full"
      />
      {config.extrema && (
        <div className="flex justify-between text-[10px] text-ink-400">
          <span>{config.extrema[0]}</span>
          <span>{config.extrema[1]}</span>
        </div>
      )}
    </div>
  );
}

function SaveStatusLabel({ status }: { status: string }) {
  const text =
    status === 'saved'
      ? '保存済み'
      : status === 'saving'
        ? '保存中…'
        : status === 'dirty'
          ? '変更あり'
          : status === 'error'
            ? '保存に失敗しました'
            : '未入力';
  const tone =
    status === 'error'
      ? 'text-emotion-anger'
      : status === 'saved'
        ? 'text-emotion-disgust'
        : 'text-ink-400';
  return <p className={`text-xs ${tone}`}>{text}</p>;
}
