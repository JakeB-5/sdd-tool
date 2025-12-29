/**
 * domains.yml 스키마 정의
 * 도메인 기반 스펙 관리를 위한 Zod 스키마
 */
import { z } from 'zod';

/**
 * 도메인 식별자 패턴
 * - 소문자, 숫자, 하이픈만 허용
 * - 영문 소문자로 시작해야 함
 */
export const DomainIdPattern = /^[a-z][a-z0-9-]*$/;
export const DomainIdSchema = z
  .string()
  .regex(DomainIdPattern, '도메인 ID는 영문 소문자로 시작하고, 소문자/숫자/하이픈만 사용할 수 있습니다');

/**
 * 의존성 타입
 * - uses: 일반적인 의존 (해당 도메인의 기능 사용)
 * - extends: 확장 (해당 도메인의 개념 확장)
 * - implements: 구현 (해당 도메인의 인터페이스 구현)
 */
export const DependencyTypeSchema = z.enum(['uses', 'extends', 'implements']);
export type DependencyType = z.infer<typeof DependencyTypeSchema>;

/**
 * 도메인 의존성 정의
 */
export const DomainDependenciesSchema = z.object({
  uses: z.array(DomainIdSchema).optional().default([]),
  extends: z.array(DomainIdSchema).optional().default([]),
  implements: z.array(DomainIdSchema).optional().default([]),
});
export type DomainDependencies = z.infer<typeof DomainDependenciesSchema>;

/**
 * 도메인 기본값 설정
 */
export const DomainDefaultsSchema = z.object({
  author: z.string().optional(),
  reviewers: z.array(z.string()).optional(),
});
export type DomainDefaults = z.infer<typeof DomainDefaultsSchema>;

/**
 * 단일 도메인 정의
 */
export const DomainDefinitionSchema = z.object({
  /** 도메인 설명 */
  description: z.string().min(1, '도메인 설명은 필수입니다'),

  /** 소스 코드 경로 (선택) */
  path: z.string().optional(),

  /** 이 도메인에 속한 스펙 ID 목록 */
  specs: z.array(z.string()).optional().default([]),

  /** 의존성 정의 */
  dependencies: DomainDependenciesSchema.optional().default({
    uses: [],
    extends: [],
    implements: [],
  }),

  /** 기본값 설정 */
  defaults: DomainDefaultsSchema.optional(),

  /** 도메인 소유자 */
  owner: z.string().optional(),

  /** 태그 */
  tags: z.array(z.string()).optional(),
});
export type DomainDefinition = z.infer<typeof DomainDefinitionSchema>;

/**
 * 도메인 규칙 (도메인 간 의존성 규칙)
 */
export const DomainRuleSchema = z.object({
  /** 출발 도메인 */
  from: DomainIdSchema,

  /** 도착 도메인 */
  to: DomainIdSchema,

  /** 의존성 타입 */
  type: DependencyTypeSchema,

  /** 허용 여부 */
  allowed: z.boolean(),

  /** 규칙 설명 (위반 시 표시) */
  reason: z.string().optional(),
});
export type DomainRule = z.infer<typeof DomainRuleSchema>;

/**
 * domains.yml 전체 스키마
 */
export const DomainsConfigSchema = z.object({
  /** 스키마 버전 */
  version: z.string().default('1.0'),

  /** 도메인 정의 맵 */
  domains: z.record(DomainIdSchema, DomainDefinitionSchema),

  /** 도메인 간 규칙 (선택) */
  rules: z.array(DomainRuleSchema).optional().default([]),
});
export type DomainsConfig = z.infer<typeof DomainsConfigSchema>;

/**
 * 도메인 정보 (파싱 후 사용하기 쉬운 형태)
 */
export interface DomainInfo {
  /** 도메인 ID */
  id: string;
  /** 도메인 설명 */
  description: string;
  /** 소스 코드 경로 */
  path?: string;
  /** 스펙 ID 목록 */
  specs: string[];
  /** 의존하는 도메인 목록 (모든 타입 합침) */
  dependsOn: string[];
  /** 의존성 상세 */
  dependencies: DomainDependencies;
  /** 기본값 */
  defaults?: DomainDefaults;
  /** 소유자 */
  owner?: string;
  /** 태그 */
  tags?: string[];
}

/**
 * DomainsConfig → DomainInfo[] 변환
 */
export function toDomainInfoList(config: DomainsConfig): DomainInfo[] {
  return Object.entries(config.domains).map(([id, def]) => ({
    id,
    description: def.description,
    path: def.path,
    specs: def.specs ?? [],
    dependsOn: [
      ...(def.dependencies?.uses ?? []),
      ...(def.dependencies?.extends ?? []),
      ...(def.dependencies?.implements ?? []),
    ],
    dependencies: def.dependencies ?? { uses: [], extends: [], implements: [] },
    defaults: def.defaults,
    owner: def.owner,
    tags: def.tags,
  }));
}

/**
 * 특정 도메인 ID가 유효한지 확인
 */
export function isValidDomainId(id: string): boolean {
  return DomainIdPattern.test(id);
}

/**
 * 도메인 ID 목록에서 중복 제거
 */
export function uniqueDomainIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

/**
 * 빈 도메인 설정 생성
 */
export function createEmptyDomainsConfig(): DomainsConfig {
  return {
    version: '1.0',
    domains: {},
    rules: [],
  };
}

/**
 * 기본 도메인 설정 템플릿 생성
 */
export function createDefaultDomainsConfig(): DomainsConfig {
  return {
    version: '1.0',
    domains: {
      core: {
        description: '핵심 공통 기능',
        path: 'src/core',
        specs: [],
        dependencies: { uses: [], extends: [], implements: [] },
      },
    },
    rules: [],
  };
}
