/**
 * 感情/表現スタイルの表示メタ情報 (ラベル・色)
 */

import type { CoreEmotion, Emotion, ExpressionKey } from '@/engine';

export const EMOTION_LABEL: Record<Emotion, string> = {
  anger: '怒り',
  sadness: '悲しみ',
  fear: '恐怖・不安',
  joy: '喜び',
  disgust: '嫌悪',
  surprise: '驚き',
  numbness: '無感動',
  guilt: '罪悪感',
  shame: '恥',
};

export const EMOTION_COLOR: Record<Emotion, string> = {
  anger: '#E05252',
  sadness: '#5B8BD6',
  fear: '#9B6FD4',
  joy: '#F0B429',
  disgust: '#4CAF7D',
  surprise: '#F07B29',
  numbness: '#8a8a95',
  guilt: '#7f6d5e',
  shame: '#c48da8',
};

export const CORE_EMOTION_ORDER: CoreEmotion[] = [
  'anger',
  'sadness',
  'fear',
  'joy',
  'disgust',
  'surprise',
];

export const EXPRESSION_LABEL: Record<ExpressionKey, string> = {
  humor: 'ユーモア',
  empathy: '共感力',
  suppression: '感情抑制',
  explosiveness: '感情爆発性',
};

export const AGE_RANGE_LABEL: Record<string, string> = {
  '0-5': '0–5歳',
  '6-10': '6–10歳',
  '11-15': '11–15歳',
  '16-20': '16–20歳',
};
