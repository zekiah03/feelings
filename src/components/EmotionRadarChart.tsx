'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import type { EmotionProfile } from '@/engine';
import { CORE_EMOTION_ORDER, EMOTION_LABEL } from '@/lib/emotionMeta';

interface Props {
  profile: EmotionProfile;
}

export function EmotionRadarChart({ profile }: Props) {
  // 各コア感情について (強度・感度・持続) の3層をシリーズとして重ねる
  const data = CORE_EMOTION_ORDER.map((e) => ({
    emotion: EMOTION_LABEL[e],
    強度: profile.emotions[e].intensity,
    感度: profile.emotions[e].sensitivity,
    持続: profile.emotions[e].duration,
  }));

  return (
    <div className="w-full h-[340px] sm:h-[420px]">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#2a2a33" />
          <PolarAngleAxis
            dataKey="emotion"
            tick={{ fill: '#b8b8c2', fontSize: 12 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: '#5a5a68', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="強度"
            dataKey="強度"
            stroke="#F0B429"
            fill="#F0B429"
            fillOpacity={0.15}
            isAnimationActive
          />
          <Radar
            name="感度"
            dataKey="感度"
            stroke="#5B8BD6"
            fill="#5B8BD6"
            fillOpacity={0.12}
            isAnimationActive
          />
          <Radar
            name="持続"
            dataKey="持続"
            stroke="#9B6FD4"
            fill="#9B6FD4"
            fillOpacity={0.1}
            isAnimationActive
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#b8b8c2' }}
            iconSize={10}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
