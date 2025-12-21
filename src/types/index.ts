/**
 * 공통 타입 정의
 */

// ============================================================
// 스펙 관련 타입
// ============================================================

/**
 * 스펙 문서 구조
 */
export interface Spec {
  id: string;
  title: string;
  status: SpecStatus;
  requirements: Requirement[];
  scenarios: Scenario[];
  dependencies: string[];
  metadata: SpecMetadata;
}

export type SpecStatus = 'draft' | 'approved' | 'implemented';

export interface SpecMetadata {
  created?: string;
  updated?: string;
  author?: string;
}

/**
 * 요구사항 (RFC 2119)
 */
export interface Requirement {
  id: string;
  level: RequirementLevel;
  description: string;
}

export type RequirementLevel = 'SHALL' | 'MUST' | 'SHOULD' | 'MAY';

/**
 * 시나리오 (GIVEN-WHEN-THEN)
 */
export interface Scenario {
  name: string;
  given: string[];
  when: string;
  then: string[];
}

// ============================================================
// Constitution 관련 타입
// ============================================================

/**
 * Constitution 원칙
 */
export interface Principle {
  id: string;
  title: string;
  description: string;
  level: PrincipleLevel;
}

export type PrincipleLevel = 'core' | 'technical' | 'forbidden';

export interface Constitution {
  projectName: string;
  principles: Principle[];
  technicalStack?: string[];
  constraints?: string[];
}

// ============================================================
// 변경 워크플로우 관련 타입
// ============================================================

/**
 * 변경 제안
 */
export interface Proposal {
  id: string;
  title: string;
  rationale: string;
  affectedSpecs: string[];
  deltas: Delta[];
  status: ProposalStatus;
  createdAt: string;
}

export type ProposalStatus = 'draft' | 'review' | 'approved' | 'applied' | 'archived';

/**
 * 델타 (변경사항)
 */
export interface Delta {
  type: DeltaType;
  target: string;
  before?: string;
  after?: string;
}

export type DeltaType = 'ADDED' | 'MODIFIED' | 'REMOVED';

// ============================================================
// 검증 관련 타입
// ============================================================

/**
 * 검증 결과
 */
export interface ValidationResult {
  valid: boolean;
  errors: SpecValidationError[];
  warnings: SpecValidationWarning[];
}

export interface SpecValidationError {
  code: string;
  message: string;
  location?: Location;
}

export interface SpecValidationWarning {
  code: string;
  message: string;
  location?: Location;
}

export interface Location {
  file?: string;
  line?: number;
  column?: number;
}

// ============================================================
// 분석 관련 타입
// ============================================================

/**
 * 분석 결과
 */
export interface AnalysisResult {
  scale: Scale;
  recommendation: WorkflowRecommendation;
  confidence: number;
  rationale: string;
  alternatives: string[];
}

export type Scale = 'small' | 'medium' | 'large';
export type WorkflowRecommendation = 'direct' | 'change' | 'new';

// ============================================================
// 유틸리티 타입
// ============================================================

/**
 * Result 타입 (에러 처리용)
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * 성공 결과 생성 헬퍼
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * 실패 결과 생성 헬퍼
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}
