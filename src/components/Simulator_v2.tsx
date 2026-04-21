'use client';

import { useState } from 'react';

import { Simulator } from './Simulator';
import { GoalPanel } from './GoalPanel';
import type { EmotionProfile, EnvironmentInput } from '@/lib/engine-client';

interface Props {
  baseline: EnvironmentInput;
  baselineProfile: EmotionProfile;
}

type Mode = 'forward' | 'inverse';

export function SimulatorV2({ baseline, baselineProfile }: Props) {
  const [mode, setMode] = useState<Mode>('forward');

  return (
    <div className="space-y-6">
      <nav role="tablist" className="flex rounded-md border border-ink-700 bg-ink-800 overflow-hidden self-start">
        <Tab active={mode === 'forward'} onClick={() => setMode('forward')} label="順方向" />
        <Tab active={mode === 'inverse'} onClick={() => setMode('inverse')} label="逆算 (目標から介入を提案)" />
      </nav>
      {mode === 'forward' ? (
        <Simulator baseline={baseline} baselineProfile={baselineProfile} />
      ) : (
        <GoalPanel input={baseline} profile={baselineProfile} />
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-3 py-2 text-xs transition ${
        active ? 'bg-ink-100 text-ink-900' : 'text-ink-200 hover:bg-ink-700'
      }`}
    >
      {label}
    </button>
  );
}
