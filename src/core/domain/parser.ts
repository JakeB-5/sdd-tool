/**
 * domains.yml 파서
 * YAML 파일을 파싱하고 Zod 스키마로 검증
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z, ZodError } from 'zod';
import { Result, success, failure } from '../../types/index.js';
import {
  DomainsConfigSchema,
  DomainsConfig,
  DomainInfo,
  toDomainInfoList,
  createEmptyDomainsConfig,
} from '../../schemas/domains.schema.js';

/**
 * 파싱 에러 상세
 */
export interface DomainParseError {
  code: string;
  message: string;
  path?: string[];
  line?: number;
}

/**
 * 파싱 결과
 */
export interface DomainParseResult {
  config: DomainsConfig;
  domains: DomainInfo[];
}

/**
 * Zod 에러를 파싱 에러로 변환
 */
function zodErrorToDomainErrors(error: ZodError): DomainParseError[] {
  return error.errors.map((e) => ({
    code: 'VALIDATION_ERROR',
    message: e.message,
    path: e.path.map(String),
  }));
}

/**
 * YAML 문자열을 파싱하여 DomainsConfig 반환
 */
export function parseDomainYaml(content: string): Result<DomainParseResult, DomainParseError[]> {
  // 빈 내용 처리
  if (!content || content.trim() === '') {
    const emptyConfig = createEmptyDomainsConfig();
    return success({
      config: emptyConfig,
      domains: [],
    });
  }

  // YAML 파싱
  let rawData: unknown;
  try {
    rawData = parseYaml(content);
  } catch (e) {
    return failure([
      {
        code: 'YAML_PARSE_ERROR',
        message: `YAML 파싱 오류: ${e instanceof Error ? e.message : String(e)}`,
      },
    ]);
  }

  // null/undefined 처리
  if (rawData === null || rawData === undefined) {
    const emptyConfig = createEmptyDomainsConfig();
    return success({
      config: emptyConfig,
      domains: [],
    });
  }

  // Zod 스키마 검증
  try {
    const config = DomainsConfigSchema.parse(rawData);
    const domains = toDomainInfoList(config);

    return success({
      config,
      domains,
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return failure(zodErrorToDomainErrors(e));
    }
    return failure([
      {
        code: 'UNKNOWN_ERROR',
        message: `검증 오류: ${e instanceof Error ? e.message : String(e)}`,
      },
    ]);
  }
}

/**
 * DomainsConfig를 YAML 문자열로 변환
 */
export function stringifyDomainConfig(config: DomainsConfig): string {
  // dependencies의 빈 배열은 제거하여 YAML을 깔끔하게 유지
  const cleanedConfig = {
    version: config.version,
    domains: Object.fromEntries(
      Object.entries(config.domains).map(([id, domain]) => {
        const cleaned: Record<string, unknown> = {
          description: domain.description,
        };

        if (domain.path) {
          cleaned.path = domain.path;
        }

        if (domain.specs && domain.specs.length > 0) {
          cleaned.specs = domain.specs;
        }

        // 의존성이 있는 경우만 포함
        const deps = domain.dependencies;
        if (deps) {
          const cleanedDeps: Record<string, string[]> = {};
          if (deps.uses && deps.uses.length > 0) {
            cleanedDeps.uses = deps.uses;
          }
          if (deps.extends && deps.extends.length > 0) {
            cleanedDeps.extends = deps.extends;
          }
          if (deps.implements && deps.implements.length > 0) {
            cleanedDeps.implements = deps.implements;
          }
          if (Object.keys(cleanedDeps).length > 0) {
            cleaned.dependencies = cleanedDeps;
          }
        }

        if (domain.defaults) {
          cleaned.defaults = domain.defaults;
        }

        if (domain.owner) {
          cleaned.owner = domain.owner;
        }

        if (domain.tags && domain.tags.length > 0) {
          cleaned.tags = domain.tags;
        }

        return [id, cleaned];
      })
    ),
    rules: config.rules && config.rules.length > 0 ? config.rules : undefined,
  };

  return stringifyYaml(cleanedConfig, {
    indent: 2,
    lineWidth: 120,
  });
}

/**
 * 도메인 ID로 도메인 정보 찾기
 */
export function findDomainById(config: DomainsConfig, id: string): DomainInfo | undefined {
  const domains = toDomainInfoList(config);
  return domains.find((d) => d.id === id);
}

/**
 * 도메인 목록 가져오기
 */
export function getDomainIds(config: DomainsConfig): string[] {
  return Object.keys(config.domains);
}

/**
 * 도메인에 스펙 추가
 */
export function addSpecToDomain(
  config: DomainsConfig,
  domainId: string,
  specId: string
): Result<DomainsConfig, Error> {
  const domain = config.domains[domainId];
  if (!domain) {
    return failure(new Error(`도메인을 찾을 수 없습니다: ${domainId}`));
  }

  // 이미 존재하는지 확인
  if (domain.specs?.includes(specId)) {
    return success(config); // 이미 있으면 그대로 반환
  }

  // 스펙 추가
  const updatedDomain = {
    ...domain,
    specs: [...(domain.specs ?? []), specId],
  };

  return success({
    ...config,
    domains: {
      ...config.domains,
      [domainId]: updatedDomain,
    },
  });
}

/**
 * 도메인에서 스펙 제거
 */
export function removeSpecFromDomain(
  config: DomainsConfig,
  domainId: string,
  specId: string
): Result<DomainsConfig, Error> {
  const domain = config.domains[domainId];
  if (!domain) {
    return failure(new Error(`도메인을 찾을 수 없습니다: ${domainId}`));
  }

  const updatedDomain = {
    ...domain,
    specs: (domain.specs ?? []).filter((s) => s !== specId),
  };

  return success({
    ...config,
    domains: {
      ...config.domains,
      [domainId]: updatedDomain,
    },
  });
}

/**
 * 새 도메인 추가
 */
export function addDomain(
  config: DomainsConfig,
  id: string,
  definition: Partial<{
    description: string;
    path?: string;
    specs?: string[];
    uses?: string[];
    extends?: string[];
    implements?: string[];
    owner?: string;
    tags?: string[];
  }>
): Result<DomainsConfig, Error> {
  // 이미 존재하는지 확인
  if (config.domains[id]) {
    return failure(new Error(`도메인이 이미 존재합니다: ${id}`));
  }

  const newDomain = {
    description: definition.description ?? '도메인 설명',
    path: definition.path,
    specs: definition.specs ?? [],
    dependencies: {
      uses: definition.uses ?? [],
      extends: definition.extends ?? [],
      implements: definition.implements ?? [],
    },
    owner: definition.owner,
    tags: definition.tags,
  };

  return success({
    ...config,
    domains: {
      ...config.domains,
      [id]: newDomain,
    },
  });
}

/**
 * 도메인 삭제
 */
export function removeDomain(
  config: DomainsConfig,
  id: string
): Result<DomainsConfig, Error> {
  if (!config.domains[id]) {
    return failure(new Error(`도메인을 찾을 수 없습니다: ${id}`));
  }

  const { [id]: removed, ...remainingDomains } = config.domains;

  return success({
    ...config,
    domains: remainingDomains,
  });
}

/**
 * 도메인 의존성 추가
 */
export function addDomainDependency(
  config: DomainsConfig,
  fromDomainId: string,
  toDomainId: string,
  type: 'uses' | 'extends' | 'implements'
): Result<DomainsConfig, Error> {
  const domain = config.domains[fromDomainId];
  if (!domain) {
    return failure(new Error(`도메인을 찾을 수 없습니다: ${fromDomainId}`));
  }

  if (!config.domains[toDomainId]) {
    return failure(new Error(`대상 도메인을 찾을 수 없습니다: ${toDomainId}`));
  }

  const deps = domain.dependencies ?? { uses: [], extends: [], implements: [] };
  const currentList = deps[type] ?? [];

  if (currentList.includes(toDomainId)) {
    return success(config); // 이미 있으면 그대로 반환
  }

  const updatedDeps = {
    ...deps,
    [type]: [...currentList, toDomainId],
  };

  return success({
    ...config,
    domains: {
      ...config.domains,
      [fromDomainId]: {
        ...domain,
        dependencies: updatedDeps,
      },
    },
  });
}

/**
 * 도메인 의존성 제거
 */
export function removeDomainDependency(
  config: DomainsConfig,
  fromDomainId: string,
  toDomainId: string,
  type: 'uses' | 'extends' | 'implements'
): Result<DomainsConfig, Error> {
  const domain = config.domains[fromDomainId];
  if (!domain) {
    return failure(new Error(`도메인을 찾을 수 없습니다: ${fromDomainId}`));
  }

  const deps = domain.dependencies ?? { uses: [], extends: [], implements: [] };
  const currentList = deps[type] ?? [];

  const updatedDeps = {
    ...deps,
    [type]: currentList.filter((d) => d !== toDomainId),
  };

  return success({
    ...config,
    domains: {
      ...config.domains,
      [fromDomainId]: {
        ...domain,
        dependencies: updatedDeps,
      },
    },
  });
}

/**
 * 에러 메시지 포맷팅
 */
export function formatDomainErrors(errors: DomainParseError[]): string {
  return errors
    .map((e) => {
      let msg = `[${e.code}] ${e.message}`;
      if (e.path && e.path.length > 0) {
        msg += ` (경로: ${e.path.join('.')})`;
      }
      if (e.line !== undefined) {
        msg += ` (라인: ${e.line})`;
      }
      return msg;
    })
    .join('\n');
}
