/**
 * 入力フォーム用の Zustand ストア
 *
 * - 4区分 × 8項目の値を保持
 * - 各区分ごとに `saved` フラグ (サーバーに保存済みか) を持つ
 * - ストアは1セッション分だけを保持 (セッション切り替え時に reset)
 */

'use client';

import { create } from 'zustand';

import type { InputData } from './validation';

export type AgeRange = '0-5' | '6-10' | '11-15' | '16-20';
export const AGE_RANGES: AgeRange[] = ['0-5', '6-10', '11-15', '16-20'];

export const DEFAULT_DATA: InputData = {
  familyAffection: 50,
  familyStability: 50,
  familyControl: 50,
  schoolBelonging: 50,
  schoolStress: 50,
  schoolSocialSuccess: 50,
  eventsStressCount: 0,
  eventsSuccessCount: 0,
};

type SaveStatus = 'untouched' | 'dirty' | 'saving' | 'saved' | 'error';

interface FormState {
  sessionId: string | null;
  values: Record<AgeRange, InputData>;
  status: Record<AgeRange, SaveStatus>;
  activeRange: AgeRange;
  init: (sessionId: string, existing: Partial<Record<AgeRange, InputData>>) => void;
  setValue: (range: AgeRange, field: keyof InputData, value: number) => void;
  setStatus: (range: AgeRange, status: SaveStatus) => void;
  setActiveRange: (range: AgeRange) => void;
}

const defaultValues = (): Record<AgeRange, InputData> => ({
  '0-5': { ...DEFAULT_DATA },
  '6-10': { ...DEFAULT_DATA },
  '11-15': { ...DEFAULT_DATA },
  '16-20': { ...DEFAULT_DATA },
});

const defaultStatuses = (): Record<AgeRange, SaveStatus> => ({
  '0-5': 'untouched',
  '6-10': 'untouched',
  '11-15': 'untouched',
  '16-20': 'untouched',
});

export const useFormStore = create<FormState>((set) => ({
  sessionId: null,
  values: defaultValues(),
  status: defaultStatuses(),
  activeRange: '0-5',
  init: (sessionId, existing) => {
    const values = defaultValues();
    const status = defaultStatuses();
    for (const range of AGE_RANGES) {
      if (existing[range]) {
        values[range] = existing[range]!;
        status[range] = 'saved';
      }
    }
    set({ sessionId, values, status, activeRange: '0-5' });
  },
  setValue: (range, field, value) =>
    set((s) => ({
      values: {
        ...s.values,
        [range]: { ...s.values[range], [field]: value },
      },
      status: { ...s.status, [range]: 'dirty' as SaveStatus },
    })),
  setStatus: (range, status) =>
    set((s) => ({ status: { ...s.status, [range]: status } })),
  setActiveRange: (activeRange) => set({ activeRange }),
}));

export function allSaved(status: Record<AgeRange, SaveStatus>): boolean {
  return AGE_RANGES.every((r) => status[r] === 'saved');
}
