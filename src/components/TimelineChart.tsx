'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { calculate, type EnvironmentInput, AGE_BRACKETS, type AgeBracket } from '@/engine';
import { AGE_RANGE_LABEL, CORE_EMOTION_ORDER, EMOTION_COLOR, EMOTION_LABEL } from '@/lib/emotionMeta';

interface Props {
  input: EnvironmentInput;
}

/**
 * 年齢区分ごとに「その区分だけ」を活かし、他区分を中立にした
 * EnvironmentInput で calculate を回し、コア感情の強度を得る。
 * → どの年齢区分が各感情にどれだけ寄与したかが直感的に見える。
 */
export function TimelineChart({ input }: Props) {
  const data = AGE_BRACKETS.map((b) => {
    const isolated = isolateBracket(input, b);
    const profile = calculate(isolated);
    const row: Record<string, number | string> = { age: AGE_RANGE_LABEL[b] };
    for (const e of CORE_EMOTION_ORDER) {
      row[EMOTION_LABEL[e]] = Math.round(profile.emotions[e].intensity);
    }
    return row;
  });

  return (
    <div className="w-full h-[320px] sm:h-[380px]">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
          <CartesianGrid stroke="#2a2a33" strokeDasharray="3 3" />
          <XAxis
            dataKey="age"
            tick={{ fill: '#b8b8c2', fontSize: 12 }}
            axisLine={{ stroke: '#3b3b46' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#5a5a68', fontSize: 10 }}
            axisLine={{ stroke: '#3b3b46' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#16161c',
              border: '1px solid #2a2a33',
              fontSize: 12,
            }}
            labelStyle={{ color: '#e2e2e7' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#b8b8c2' }} iconSize={10} />
          {CORE_EMOTION_ORDER.map((e) => (
            <Line
              key={e}
              type="monotone"
              dataKey={EMOTION_LABEL[e]}
              stroke={EMOTION_COLOR[e]}
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function isolateBracket(input: EnvironmentInput, keep: AgeBracket): EnvironmentInput {
  const neutral = {
    family: { affection: 50, stability: 50, control: 50 },
    school: { belonging: 50, stress: 50, socialSuccess: 50 },
    events: { stressEvents: 0, successEvents: 0 },
  };
  return {
    '0-5': keep === '0-5' ? input['0-5'] : structuredClone(neutral),
    '6-10': keep === '6-10' ? input['6-10'] : structuredClone(neutral),
    '11-15': keep === '11-15' ? input['11-15'] : structuredClone(neutral),
    '16-20': keep === '16-20' ? input['16-20'] : structuredClone(neutral),
  };
}
