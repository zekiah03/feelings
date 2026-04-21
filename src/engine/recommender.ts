/**
 * 行動提案抽出ロジック (純粋関数)
 *
 * EmotionProfile を入力に ActionRule 群を評価して、
 * 優先度順・カテゴリ別上限付きで上位 N 件を返す。
 */

import type { EmotionProfile } from './types';
import {
  ACTION_RULES,
  type ActionCategory,
  type ActionRule,
  type Difficulty,
} from './actionRules';

export interface ActionRecommendation {
  ruleId: string;
  category: ActionCategory;
  text: string;
  difficulty: Difficulty;
  /** 発火根拠の説明 */
  basis: string;
  /** 0-1 に正規化された優先度 (大きいほど優先) */
  score: number;
}

export interface RecommendOptions {
  /** 全体で返す上限 (default 5) */
  limit?: number;
  /** 1カテゴリあたりの最大件数 (default 2) */
  perCategoryLimit?: number;
  /** 適用するルール (主にテスト用。default は全ルール) */
  rules?: ActionRule[];
}

const DEFAULT_LIMIT = 5;
const DEFAULT_PER_CATEGORY = 2;

export function recommend(
  profile: EmotionProfile,
  options: RecommendOptions = {}
): ActionRecommendation[] {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const perCategoryLimit = options.perCategoryLimit ?? DEFAULT_PER_CATEGORY;
  const rules = options.rules ?? ACTION_RULES;

  // 発火したルールのみ抽出
  const matched: ActionRecommendation[] = [];
  for (const rule of rules) {
    const evalResult = rule.evaluate(profile);
    if (!evalResult.matches) continue;
    matched.push({
      ruleId: rule.id,
      category: rule.category,
      text: rule.text,
      difficulty: rule.difficulty,
      basis: evalResult.basis,
      score: evalResult.score,
    });
  }

  // 優先度順にソート
  matched.sort((a, b) => b.score - a.score);

  // カテゴリ別上限でフィルタ
  const perCategoryCount: Partial<Record<ActionCategory, number>> = {};
  const filtered: ActionRecommendation[] = [];
  for (const r of matched) {
    const current = perCategoryCount[r.category] ?? 0;
    if (current >= perCategoryLimit) continue;
    perCategoryCount[r.category] = current + 1;
    filtered.push(r);
    if (filtered.length >= limit) break;
  }
  return filtered;
}
