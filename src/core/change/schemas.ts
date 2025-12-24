/**
 * 변경 제안 스키마
 */
import { z } from 'zod';

/**
 * 변경 상태
 */
export const ChangeStatusSchema = z.enum([
  'draft',
  'proposed',
  'approved',
  'applied',
  'archived',
  'rejected',
]);

export type ChangeStatus = z.infer<typeof ChangeStatusSchema>;

/**
 * 변경 유형
 */
export const DeltaTypeSchema = z.enum(['ADDED', 'MODIFIED', 'REMOVED']);

export type DeltaType = z.infer<typeof DeltaTypeSchema>;

/**
 * 영향도 수준
 */
export const ImpactLevelSchema = z.enum(['low', 'medium', 'high']);

export type ImpactLevel = z.infer<typeof ImpactLevelSchema>;

/**
 * Proposal 메타데이터 스키마
 */
export const ProposalMetadataSchema = z.object({
  id: z.string().regex(/^CHG-\d{3,}$/, 'ID 형식: CHG-XXX'),
  status: ChangeStatusSchema,
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식: YYYY-MM-DD'),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  target: z.string().optional(),
});

export type ProposalMetadata = z.infer<typeof ProposalMetadataSchema>;

/**
 * 델타 항목 스키마
 */
export const DeltaItemSchema = z.object({
  type: DeltaTypeSchema,
  target: z.string().optional(),
  content: z.string(),
  before: z.string().optional(),
  after: z.string().optional(),
  description: z.string().optional(),
});

export type DeltaItem = z.infer<typeof DeltaItemSchema>;

/**
 * 델타 메타데이터 스키마
 */
export const DeltaMetadataSchema = z.object({
  proposal: z.string(),
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type DeltaMetadata = z.infer<typeof DeltaMetadataSchema>;

/**
 * 변경 제안 전체 스키마
 */
export const ProposalSchema = z.object({
  metadata: ProposalMetadataSchema,
  title: z.string(),
  rationale: z.string().optional(),
  affectedSpecs: z.array(z.string()),
  changeType: z.array(DeltaTypeSchema),
  summary: z.string().optional(),
  riskLevel: ImpactLevelSchema.optional(),
  complexity: ImpactLevelSchema.optional(),
});

export type Proposal = z.infer<typeof ProposalSchema>;

/**
 * 델타 전체 스키마
 */
export const DeltaSchema = z.object({
  metadata: DeltaMetadataSchema,
  title: z.string(),
  added: z.array(z.string()).optional(),
  modified: z.array(
    z.object({
      target: z.string(),
      before: z.string(),
      after: z.string(),
    })
  ).optional(),
  removed: z.array(z.string()).optional(),
});

export type Delta = z.infer<typeof DeltaSchema>;

/**
 * 다음 변경 ID 생성
 */
export function generateChangeId(existingIds: string[]): string {
  const maxId = existingIds
    .map((id) => {
      const match = id.match(/^CHG-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .reduce((max, curr) => Math.max(max, curr), 0);

  return `CHG-${String(maxId + 1).padStart(3, '0')}`;
}
