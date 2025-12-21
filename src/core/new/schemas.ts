/**
 * 신규 기능 워크플로우 스키마
 */
import { z } from 'zod';

/**
 * 기능 상태 스키마
 */
export const FeatureStatusSchema = z.enum([
  'draft',      // 초안 작성 중
  'specified',  // 명세 완료
  'planned',    // 계획 완료
  'tasked',     // 작업 분해 완료
  'implementing', // 구현 중
  'completed',  // 완료
]);

export type FeatureStatus = z.infer<typeof FeatureStatusSchema>;

/**
 * 작업 상태 스키마
 */
export const TaskStatusSchema = z.enum([
  'pending',     // 대기 중
  'in_progress', // 진행 중
  'completed',   // 완료
  'blocked',     // 차단됨
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/**
 * 작업 우선순위 스키마
 */
export const TaskPrioritySchema = z.enum([
  'high',   // 높음
  'medium', // 중간
  'low',    // 낮음
]);

export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

/**
 * 기능 메타데이터 스키마
 */
export const FeatureMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: FeatureStatusSchema,
  created: z.string(),
  updated: z.string().optional(),
  branch: z.string().optional(),
  depends: z.array(z.string()).nullable().default(null),
});

export type FeatureMetadata = z.infer<typeof FeatureMetadataSchema>;

/**
 * 작업 항목 스키마
 */
export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  assignee: z.string().optional(),
  files: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
});

export type TaskItem = z.infer<typeof TaskItemSchema>;

/**
 * 구현 계획 스키마
 */
export const PlanSchema = z.object({
  overview: z.string(),
  techDecisions: z.array(z.object({
    decision: z.string(),
    rationale: z.string(),
    alternatives: z.array(z.string()).optional(),
  })),
  phases: z.array(z.object({
    name: z.string(),
    description: z.string(),
    deliverables: z.array(z.string()),
  })),
  risks: z.array(z.object({
    risk: z.string(),
    mitigation: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
  })).optional(),
  testingStrategy: z.string().optional(),
});

export type Plan = z.infer<typeof PlanSchema>;

/**
 * 기능 ID 생성
 */
export function generateFeatureId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/**
 * 작업 ID 생성
 */
export function generateTaskId(featureId: string, index: number): string {
  return `${featureId}-task-${String(index).padStart(3, '0')}`;
}

/**
 * 브랜치명 생성
 */
export function generateBranchName(featureId: string): string {
  return `feature/${featureId}`;
}
