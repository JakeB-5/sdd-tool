/**
 * Sync 모듈 스키마 정의
 */
import { z } from 'zod';

/**
 * 코드 위치 정보
 */
export const CodeLocationSchema = z.object({
  file: z.string(),
  line: z.number(),
  type: z.enum(['code', 'test']),
  text: z.string().optional(),
});

export type CodeLocation = z.infer<typeof CodeLocationSchema>;

/**
 * 요구사항 상태
 */
export const RequirementStatusSchema = z.object({
  id: z.string(), // REQ-001
  specId: z.string(), // user-auth
  title: z.string().optional(),
  keyword: z.enum(['SHALL', 'MUST', 'SHOULD', 'MAY', 'SHALL NOT', 'MUST NOT']).optional(),
  status: z.enum(['implemented', 'missing', 'partial']),
  locations: z.array(CodeLocationSchema),
});

export type RequirementStatus = z.infer<typeof RequirementStatusSchema>;

/**
 * 스펙 요약
 */
export const SpecSummarySchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  requirementCount: z.number(),
  implementedCount: z.number(),
  missingCount: z.number(),
  syncRate: z.number(),
});

export type SpecSummary = z.infer<typeof SpecSummarySchema>;

/**
 * 동기화 결과
 */
export const SyncResultSchema = z.object({
  specs: z.array(SpecSummarySchema),
  requirements: z.array(RequirementStatusSchema),
  syncRate: z.number(),
  implemented: z.array(z.string()),
  missing: z.array(z.string()),
  orphans: z.array(CodeLocationSchema),
  totalRequirements: z.number(),
  totalImplemented: z.number(),
});

export type SyncResult = z.infer<typeof SyncResultSchema>;

/**
 * Sync 옵션
 */
export const SyncOptionsSchema = z.object({
  specId: z.string().optional(),
  srcDir: z.string().optional(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  threshold: z.number().optional(),
  ci: z.boolean().optional(),
  json: z.boolean().optional(),
  markdown: z.boolean().optional(),
});

export type SyncOptions = z.infer<typeof SyncOptionsSchema>;

/**
 * 스펙에서 추출한 요구사항
 */
export const ExtractedRequirementSchema = z.object({
  id: z.string(),
  specId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  keyword: z.enum(['SHALL', 'MUST', 'SHOULD', 'MAY', 'SHALL NOT', 'MUST NOT']).optional(),
  line: z.number(),
});

export type ExtractedRequirement = z.infer<typeof ExtractedRequirementSchema>;

/**
 * 코드에서 발견된 스펙 참조
 */
export const CodeReferenceSchema = z.object({
  reqId: z.string(), // REQ-001
  file: z.string(),
  line: z.number(),
  type: z.enum(['code', 'test']),
  context: z.string().optional(),
});

export type CodeReference = z.infer<typeof CodeReferenceSchema>;
