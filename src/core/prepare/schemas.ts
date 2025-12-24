/**
 * Prepare 모듈 Zod 스키마 정의
 */
import { z } from 'zod';

// ============================================================
// 도구 유형
// ============================================================

/**
 * 도구 유형 (서브에이전트 또는 스킬)
 */
export const ToolTypeSchema = z.enum(['agent', 'skill']);
export type ToolType = z.infer<typeof ToolTypeSchema>;

/**
 * 도구 상태
 */
export const ToolStatusSchema = z.enum(['exists', 'missing', 'outdated']);
export type ToolStatus = z.infer<typeof ToolStatusSchema>;

// ============================================================
// 감지 결과
// ============================================================

/**
 * 감지 근거 (파일:라인)
 */
export const DetectionSourceSchema = z.object({
  file: z.string(),
  line: z.number(),
  text: z.string(),
  keyword: z.string(),
});
export type DetectionSource = z.infer<typeof DetectionSourceSchema>;

/**
 * 감지된 도구
 */
export const DetectedToolSchema = z.object({
  type: ToolTypeSchema,
  name: z.string(),
  description: z.string(),
  sources: z.array(DetectionSourceSchema),
});
export type DetectedTool = z.infer<typeof DetectedToolSchema>;

// ============================================================
// 서브에이전트
// ============================================================

/**
 * 서브에이전트 메타데이터
 */
export const AgentMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  tools: z.array(z.string()).optional(),
  model: z.string().optional(),
});
export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;

/**
 * 스캔된 서브에이전트
 */
export const ScannedAgentSchema = z.object({
  name: z.string(),
  filePath: z.string(),
  metadata: AgentMetadataSchema,
  content: z.string(),
});
export type ScannedAgent = z.infer<typeof ScannedAgentSchema>;

// ============================================================
// 스킬
// ============================================================

/**
 * 스킬 메타데이터
 */
export const SkillMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  'allowed-tools': z.array(z.string()).optional(),
});
export type SkillMetadata = z.infer<typeof SkillMetadataSchema>;

/**
 * 스캔된 스킬
 */
export const ScannedSkillSchema = z.object({
  name: z.string(),
  dirPath: z.string(),
  filePath: z.string(),
  metadata: SkillMetadataSchema,
  content: z.string(),
});
export type ScannedSkill = z.infer<typeof ScannedSkillSchema>;

// ============================================================
// 점검 결과
// ============================================================

/**
 * 도구 점검 결과
 */
export const ToolCheckResultSchema = z.object({
  tool: DetectedToolSchema,
  status: ToolStatusSchema,
  filePath: z.string().optional(),
  action: z.string(),
});
export type ToolCheckResult = z.infer<typeof ToolCheckResultSchema>;

/**
 * 준비 보고서
 */
export const PrepareReportSchema = z.object({
  feature: z.string(),
  totalTasks: z.number(),
  agents: z.object({
    required: z.number(),
    existing: z.number(),
    missing: z.number(),
    checks: z.array(ToolCheckResultSchema),
  }),
  skills: z.object({
    required: z.number(),
    existing: z.number(),
    missing: z.number(),
    checks: z.array(ToolCheckResultSchema),
  }),
  proposals: z.array(z.object({
    type: ToolTypeSchema,
    name: z.string(),
    filePath: z.string(),
    content: z.string(),
  })),
  createdAt: z.string(),
});
export type PrepareReport = z.infer<typeof PrepareReportSchema>;

// ============================================================
// 키워드 매핑
// ============================================================

/**
 * 키워드 → 도구 매핑
 */
export const KeywordMappingSchema = z.object({
  keywords: z.array(z.string()),
  agent: z.string().nullable(),
  skill: z.string(),
  agentDescription: z.string().optional(),
  skillDescription: z.string().optional(),
});
export type KeywordMapping = z.infer<typeof KeywordMappingSchema>;

/**
 * 기본 키워드 매핑 테이블
 */
export const DEFAULT_KEYWORD_MAPPINGS: KeywordMapping[] = [
  {
    keywords: ['test', '테스트', 'vitest', 'jest', '단위 테스트', 'unit test'],
    agent: 'test-runner',
    skill: 'test',
    agentDescription: '테스트 실행 및 결과 분석 에이전트',
    skillDescription: '테스트 작성 및 실행 스킬',
  },
  {
    keywords: ['api', 'rest', 'endpoint', '엔드포인트', 'graphql'],
    agent: 'api-scaffold',
    skill: 'gen-api',
    agentDescription: 'REST API 보일러플레이트 생성 에이전트',
    skillDescription: 'API 엔드포인트 생성 스킬',
  },
  {
    keywords: ['component', '컴포넌트', 'react', 'vue', 'ui'],
    agent: 'component-gen',
    skill: 'gen-component',
    agentDescription: 'UI 컴포넌트 생성 에이전트',
    skillDescription: '컴포넌트 보일러플레이트 생성 스킬',
  },
  {
    keywords: ['db', 'database', 'prisma', 'migration', '마이그레이션', '데이터베이스'],
    agent: null,
    skill: 'db-migrate',
    skillDescription: '데이터베이스 마이그레이션 스킬',
  },
  {
    keywords: ['doc', '문서', 'readme', 'jsdoc', '주석', 'documentation'],
    agent: 'doc-generator',
    skill: 'doc',
    agentDescription: '문서 생성 에이전트',
    skillDescription: '문서화 스킬',
  },
  {
    keywords: ['type', '타입', 'schema', 'zod', 'typescript'],
    agent: null,
    skill: 'gen-types',
    skillDescription: '타입 정의 생성 스킬',
  },
  {
    keywords: ['lint', 'eslint', 'prettier', '포맷', 'format'],
    agent: null,
    skill: 'lint',
    skillDescription: '코드 린트 및 포맷 스킬',
  },
  {
    keywords: ['review', '리뷰', '검증', 'code review', '코드 리뷰'],
    agent: 'code-reviewer',
    skill: 'review',
    agentDescription: '코드 리뷰 및 품질 검증 에이전트',
    skillDescription: '코드 리뷰 스킬',
  },
];
