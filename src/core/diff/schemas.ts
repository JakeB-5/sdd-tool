/**
 * sdd diff 스키마 정의
 */
import { z } from 'zod';

/**
 * RFC 2119 키워드
 */
export const Rfc2119KeywordSchema = z.enum([
  'SHALL',
  'SHALL NOT',
  'SHOULD',
  'SHOULD NOT',
  'MAY',
  'MUST',
  'MUST NOT',
  'REQUIRED',
  'RECOMMENDED',
  'OPTIONAL',
]);
export type Rfc2119Keyword = z.infer<typeof Rfc2119KeywordSchema>;

/**
 * 변경 타입
 */
export const ChangeTypeSchema = z.enum(['added', 'modified', 'removed']);
export type ChangeType = z.infer<typeof ChangeTypeSchema>;

/**
 * 키워드 변경 영향도
 */
export const KeywordImpactSchema = z.enum(['strengthened', 'weakened', 'changed']);
export type KeywordImpact = z.infer<typeof KeywordImpactSchema>;

/**
 * 요구사항 변경
 */
export const RequirementDiffSchema = z.object({
  id: z.string(),
  type: ChangeTypeSchema,
  title: z.string().optional(),
  before: z.string().optional(),
  after: z.string().optional(),
});
export type RequirementDiff = z.infer<typeof RequirementDiffSchema>;

/**
 * 시나리오 변경
 */
export const ScenarioDiffSchema = z.object({
  name: z.string(),
  type: ChangeTypeSchema,
  before: z.string().optional(),
  after: z.string().optional(),
});
export type ScenarioDiff = z.infer<typeof ScenarioDiffSchema>;

/**
 * 메타데이터 변경
 */
export const MetadataDiffSchema = z.object({
  type: ChangeTypeSchema,
  before: z.record(z.unknown()).optional(),
  after: z.record(z.unknown()).optional(),
  changedFields: z.array(z.string()),
});
export type MetadataDiff = z.infer<typeof MetadataDiffSchema>;

/**
 * 키워드 변경
 */
export const KeywordChangeSchema = z.object({
  reqId: z.string(),
  before: Rfc2119KeywordSchema,
  after: Rfc2119KeywordSchema,
  impact: KeywordImpactSchema,
});
export type KeywordChange = z.infer<typeof KeywordChangeSchema>;

/**
 * 단일 스펙 파일 Diff
 */
export const SpecDiffSchema = z.object({
  file: z.string(),
  requirements: z.array(RequirementDiffSchema),
  scenarios: z.array(ScenarioDiffSchema),
  metadata: MetadataDiffSchema.optional(),
  keywordChanges: z.array(KeywordChangeSchema),
});
export type SpecDiff = z.infer<typeof SpecDiffSchema>;

/**
 * 전체 Diff 결과
 */
export const DiffResultSchema = z.object({
  files: z.array(SpecDiffSchema),
  summary: z.object({
    totalFiles: z.number(),
    addedRequirements: z.number(),
    modifiedRequirements: z.number(),
    removedRequirements: z.number(),
    addedScenarios: z.number(),
    modifiedScenarios: z.number(),
    removedScenarios: z.number(),
    keywordChanges: z.number(),
  }),
});
export type DiffResult = z.infer<typeof DiffResultSchema>;

/**
 * Diff 옵션
 */
export const DiffOptionsSchema = z.object({
  staged: z.boolean().optional(),
  stat: z.boolean().optional(),
  nameOnly: z.boolean().optional(),
  json: z.boolean().optional(),
  noColor: z.boolean().optional(),
  specId: z.string().optional(),
  commit1: z.string().optional(),
  commit2: z.string().optional(),
});
export type DiffOptions = z.infer<typeof DiffOptionsSchema>;
