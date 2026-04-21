/**
 * API 境界の入力バリデーション (zod)
 */

import { z } from 'zod';

export const ageRangeSchema = z.enum(['0-5', '6-10', '11-15', '16-20']);

// 0-100 のスコア
const scoreSchema = z.number().int().min(0).max(100);
// イベント件数 (0-10 をフォームで許容、より大きい値も受理して Phase 1 の count スケールに任せる)
const countSchema = z.number().int().min(0).max(1000);

export const inputDataSchema = z.object({
  familyAffection: scoreSchema,
  familyStability: scoreSchema,
  familyControl: scoreSchema,
  schoolBelonging: scoreSchema,
  schoolStress: scoreSchema,
  schoolSocialSuccess: scoreSchema,
  eventsStressCount: countSchema,
  eventsSuccessCount: countSchema,
});

export const upsertInputRequestSchema = z.object({
  ageRange: ageRangeSchema,
  data: inputDataSchema,
});

export const createSessionRequestSchema = z.object({
  label: z.string().min(1).max(200),
});

export const actionCategorySchema = z.enum(['感情調整', '環境設計', '習慣']);
export const actionStatusSchema = z.enum(['saved', 'doing', 'done']);

export const createActionRequestSchema = z.object({
  sessionId: z.string().min(1),
  actionText: z.string().min(1).max(500),
  category: actionCategorySchema,
});

export const patchActionRequestSchema = z.object({
  status: actionStatusSchema,
});

export type AgeRangeInput = z.infer<typeof ageRangeSchema>;
export type InputData = z.infer<typeof inputDataSchema>;
export type UpsertInputRequest = z.infer<typeof upsertInputRequestSchema>;
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;
export type CreateActionRequest = z.infer<typeof createActionRequestSchema>;
export type PatchActionRequest = z.infer<typeof patchActionRequestSchema>;
