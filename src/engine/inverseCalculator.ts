/**
 * 逆算ロジック
 *
 * 目的: 目標感情スコア (emotion + layer + targetValue) に近づけるためには
 *       どの環境変数をどちらに動かすのが最も効率的か、をランキング表示する。
 *
 * 方針:
 *   1. 各変数を +1 単位変化させて calculate() を回し、単位勾配 (∂target/∂variable) を測る
 *   2. 目標方向に近づく符号の変数のみ採用
 *   3. 現実的ステップ (スコア ±20 / 件数 ±3) で calculate() を再度回し、
 *      期待される変化量 (目標に近づく方向に正) を算出
 *   4. 期待変化量の大きい順にソートして上位を返す
 */

import { calculate } from './calculator';
import type {
  AgeBracket,
  AgeBracketInput,
  Emotion,
  EmotionLayer,
  EmotionProfile,
  EnvironmentInput,
} from './types';
import type { Difficulty } from './actionRules';

// ===== 変数メタデータ =====

export type VariableCategory = 'family' | 'school' | 'events';

export interface VariableMeta {
  /** 'family.affection' のようなドット区切りパス */
  path: string;
  category: VariableCategory;
  key: string; // 末端キー
  label: string;
  min: number;
  max: number;
  kind: 'score' | 'count';
  /** 現実的な一歩のサイズ (UI表示および expectedImpact の計算に使う) */
  realisticStep: number;
  difficulty: Difficulty;
  increaseLabel: string;
  decreaseLabel: string;
}

export const VARIABLES: VariableMeta[] = [
  {
    path: 'family.affection',
    category: 'family',
    key: 'affection',
    label: '家庭: 愛情量',
    min: 0,
    max: 100,
    kind: 'score',
    realisticStep: 20,
    difficulty: '高',
    increaseLabel: '親密な関係を増やし、温かい関わりを意図的に作る',
    decreaseLabel: '過剰な依存的関係から距離を取る',
  },
  {
    path: 'family.stability',
    category: 'family',
    key: 'stability',
    label: '家庭: 安定性',
    min: 0,
    max: 100,
    kind: 'score',
    realisticStep: 20,
    difficulty: '高',
    increaseLabel: '生活基盤・住環境を安定させる',
    decreaseLabel: '安定しすぎた環境に変化を入れる',
  },
  {
    path: 'family.control',
    category: 'family',
    key: 'control',
    label: '家庭: 支配度',
    min: 0,
    max: 100,
    kind: 'score',
    realisticStep: 20,
    difficulty: '中',
    increaseLabel: '自分で決めすぎる領域を委ねる',
    decreaseLabel: '他者に決められる領域を減らし、自律を増やす',
  },
  {
    path: 'school.belonging',
    category: 'school',
    key: 'belonging',
    label: '所属: 居場所感',
    min: 0,
    max: 100,
    kind: 'score',
    realisticStep: 20,
    difficulty: '中',
    increaseLabel: '自分が受け入れられるコミュニティを1つ作る',
    decreaseLabel: '依存的な所属から一歩離れる',
  },
  {
    path: 'school.stress',
    category: 'school',
    key: 'stress',
    label: '所属: ストレス',
    min: 0,
    max: 100,
    kind: 'score',
    realisticStep: 20,
    difficulty: '中',
    increaseLabel: '刺激を取り戻す (あえて挑戦を入れる)',
    decreaseLabel: '慢性ストレス源を減らす',
  },
  {
    path: 'school.socialSuccess',
    category: 'school',
    key: 'socialSuccess',
    label: '所属: 社会的成功体験',
    min: 0,
    max: 100,
    kind: 'score',
    realisticStep: 20,
    difficulty: '中',
    increaseLabel: '達成が可視化される活動を増やす',
    decreaseLabel: '成果主義から距離を置く',
  },
  {
    path: 'events.stressEvents',
    category: 'events',
    key: 'stressEvents',
    label: 'イベント: ストレスイベント数',
    min: 0,
    max: 10,
    kind: 'count',
    realisticStep: 3,
    difficulty: '中',
    increaseLabel: '(意図的増加は非推奨)',
    decreaseLabel: '大きな負荷を連鎖的に抱えないよう間引く',
  },
  {
    path: 'events.successEvents',
    category: 'events',
    key: 'successEvents',
    label: 'イベント: 成功体験数',
    min: 0,
    max: 10,
    kind: 'count',
    realisticStep: 3,
    difficulty: '低',
    increaseLabel: '小さな成功を積み上げる機会を仕込む',
    decreaseLabel: '(意図的減少は非推奨)',
  },
];

// ===== 目標定義 =====

export interface InverseGoal {
  emotion: Emotion;
  layer: EmotionLayer;
  targetValue: number;
}

export interface Intervention {
  variable: VariableMeta;
  ageBracket: AgeBracket;
  direction: 'increase' | 'decrease';
  /** 方向に沿った自然言語ラベル (VariableMeta から取り出したもの) */
  label: string;
  /** +1 単位変化あたりのターゲットスコアの変化量 (有限差分) */
  unitGradient: number;
  /** 現実的ステップ (変数の単位で、符号無し絶対値) */
  stepSize: number;
  /** 現実的ステップを適用した時の「目標に近づく方向への」変化量 (正値) */
  expectedImpact: number;
  difficulty: Difficulty;
}

export interface InverseOptions {
  /** 変更可能とみなす年齢区分 (既定: ['16-20']) */
  modifiableBrackets?: AgeBracket[];
}

// ===== メイン関数 =====

export function inverseInterventions(
  current: EnvironmentInput,
  goal: InverseGoal,
  options: InverseOptions = {}
): Intervention[] {
  const modifiable = options.modifiableBrackets ?? ['16-20' as const];
  const baselineProfile = calculate(current);
  const baselineValue = baselineProfile.emotions[goal.emotion][goal.layer];
  const desiredDelta = goal.targetValue - baselineValue;
  if (desiredDelta === 0) return [];
  const desiredSign = desiredDelta > 0 ? 1 : -1;

  const interventions: Intervention[] = [];

  for (const bracket of modifiable) {
    for (const variable of VARIABLES) {
      const currentValue = readPath(current[bracket], variable.path);
      if (currentValue === undefined) continue;

      // 勾配測定 (+1、境界で詰まる場合は -1 で測って符号反転)
      let probe = 1;
      if (currentValue + probe > variable.max) probe = -1;
      if (currentValue + probe < variable.min) continue; // 動かせない

      const probedInput = writeAt(current, bracket, variable.path, currentValue + probe);
      const probedProfile = calculate(probedInput);
      const probedValue = probedProfile.emotions[goal.emotion][goal.layer];
      // +1 当たりに正規化 (probe=-1 のときは符号反転)
      const unitGradient = (probedValue - baselineValue) / probe;
      if (unitGradient === 0) continue;

      // 目標に近づく方向を決める
      const direction: 'increase' | 'decrease' =
        Math.sign(unitGradient) * desiredSign > 0 ? 'increase' : 'decrease';
      const signedStep = direction === 'increase' ? variable.realisticStep : -variable.realisticStep;
      const appliedStep = clampStep(currentValue, signedStep, variable);
      if (appliedStep === 0) continue;

      // 現実的ステップを適用した影響量を実測
      const perturbedInput = writeAt(current, bracket, variable.path, currentValue + appliedStep);
      const perturbedProfile: EmotionProfile = calculate(perturbedInput);
      const perturbedValue = perturbedProfile.emotions[goal.emotion][goal.layer];
      const rawDelta = perturbedValue - baselineValue;
      const expectedImpact = rawDelta * desiredSign;
      if (expectedImpact <= 0) continue;

      interventions.push({
        variable,
        ageBracket: bracket,
        direction,
        label: direction === 'increase' ? variable.increaseLabel : variable.decreaseLabel,
        unitGradient,
        stepSize: Math.abs(appliedStep),
        expectedImpact,
        difficulty: variable.difficulty,
      });
    }
  }

  interventions.sort((a, b) => b.expectedImpact - a.expectedImpact);
  return interventions;
}

// ===== 補助関数 =====

function readPath(obj: AgeBracketInput, path: string): number | undefined {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'number' ? cur : undefined;
}

function writeAt(
  input: EnvironmentInput,
  bracket: AgeBracket,
  path: string,
  value: number
): EnvironmentInput {
  const cloned = structuredClone(input);
  const parts = path.split('.');
  let cur = cloned[bracket] as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur[parts[i]] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return cloned;
}

function clampStep(
  currentValue: number,
  signedStep: number,
  variable: VariableMeta
): number {
  const target = currentValue + signedStep;
  const clamped = Math.max(variable.min, Math.min(variable.max, target));
  return clamped - currentValue;
}
