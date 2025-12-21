/**
 * 영향도 분석 스키마
 */
import { z } from 'zod';

/**
 * 의존성 유형
 */
export const DependencyTypeSchema = z.enum([
  'explicit', // frontmatter depends 필드
  'reference', // 문서 내 참조
  'data', // 데이터 모델 공유
  'api', // API 의존
  'component', // 컴포넌트 공유
]);

export type DependencyType = z.infer<typeof DependencyTypeSchema>;

/**
 * 영향도 수준
 */
export const ImpactLevelSchema = z.enum(['low', 'medium', 'high']);

export type ImpactLevel = z.infer<typeof ImpactLevelSchema>;

/**
 * 의존성 엣지
 */
export interface DependencyEdge {
  from: string; // 의존하는 스펙
  to: string; // 의존되는 스펙
  type: DependencyType;
  description?: string;
}

/**
 * 의존성 그래프 노드
 */
export interface DependencyNode {
  id: string;
  path: string;
  title?: string;
  dependsOn: string[]; // 이 스펙이 의존하는 것
  dependedBy: string[]; // 이 스펙에 의존하는 것
}

/**
 * 의존성 그래프
 */
export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
}

/**
 * 영향 받는 스펙 정보
 */
export interface AffectedSpec {
  id: string;
  path: string;
  title?: string;
  level: ImpactLevel;
  type: DependencyType;
  reason: string;
}

/**
 * 영향도 분석 결과
 */
export interface ImpactAnalysisResult {
  targetSpec: string;
  dependsOn: AffectedSpec[];
  affectedBy: AffectedSpec[];
  riskScore: number; // 1-10
  riskLevel: ImpactLevel;
  summary: string;
  recommendations: string[];
}

/**
 * 리스크 점수 계산 가중치
 */
export const RISK_WEIGHTS = {
  directDependency: 2, // 직접 의존
  indirectDependency: 1, // 간접 의존
  apiChange: 3, // API 변경
  dataModelChange: 2, // 데이터 모델 변경
  corePrinciple: 2, // 핵심 원칙 관련
} as const;

/**
 * 영향도 수준 판단 기준
 */
export function getImpactLevel(score: number): ImpactLevel {
  if (score <= 3) return 'low';
  if (score <= 6) return 'medium';
  return 'high';
}
