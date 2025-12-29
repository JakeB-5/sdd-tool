/**
 * 도메인 검증 로직
 * 도메인 구조, 스펙 일관성, 의존성 규칙 검증
 */

import type { DomainsConfig, DomainInfo, DomainRule } from '../../schemas/domains.schema.js';
import { toDomainInfoList, isValidDomainId } from '../../schemas/domains.schema.js';
import { DomainGraph, formatCyclePath, CyclePath } from '../domain/graph.js';

/**
 * 검증 에러 심각도
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * 검증 결과 항목
 */
export interface DomainValidationIssue {
  /** 코드 */
  code: string;
  /** 심각도 */
  severity: ValidationSeverity;
  /** 메시지 */
  message: string;
  /** 관련 도메인 ID */
  domain?: string;
  /** 관련 스펙 ID */
  spec?: string;
  /** 추가 컨텍스트 */
  context?: Record<string, unknown>;
}

/**
 * 검증 결과
 */
export interface DomainValidationResult {
  /** 유효 여부 (에러가 없으면 유효) */
  valid: boolean;
  /** 모든 이슈 */
  issues: DomainValidationIssue[];
  /** 에러만 */
  errors: DomainValidationIssue[];
  /** 경고만 */
  warnings: DomainValidationIssue[];
  /** 정보만 */
  infos: DomainValidationIssue[];
}

/**
 * 검증 옵션
 */
export interface DomainValidationOptions {
  /** 스펙-도메인 일관성 검증 (스펙 파일이 실제로 존재하는지 등) */
  validateSpecs?: boolean;
  /** 존재하는 스펙 ID 목록 (검증에 사용) */
  existingSpecs?: string[];
  /** 순환 의존성을 에러로 처리 */
  cyclesAsErrors?: boolean;
  /** 빈 도메인 경고 */
  warnEmptyDomains?: boolean;
  /** 고아 스펙 감지 (도메인에 속하지 않은 스펙) */
  detectOrphanSpecs?: boolean;
}

const DEFAULT_OPTIONS: DomainValidationOptions = {
  validateSpecs: true,
  cyclesAsErrors: true,
  warnEmptyDomains: true,
  detectOrphanSpecs: true,
};

/**
 * 도메인 설정 검증
 */
export function validateDomains(
  config: DomainsConfig,
  options: DomainValidationOptions = {}
): DomainValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const issues: DomainValidationIssue[] = [];
  const domains = toDomainInfoList(config);

  // 1. 도메인 ID 유효성 검사
  for (const domain of domains) {
    if (!isValidDomainId(domain.id)) {
      issues.push({
        code: 'INVALID_DOMAIN_ID',
        severity: 'error',
        message: `유효하지 않은 도메인 ID: "${domain.id}". 영문 소문자로 시작하고, 소문자/숫자/하이픈만 사용할 수 있습니다.`,
        domain: domain.id,
      });
    }
  }

  // 2. 도메인 존재 여부 검증 (의존성에 있는 도메인이 실제로 존재하는지)
  const domainIds = new Set(domains.map((d) => d.id));

  for (const domain of domains) {
    for (const dep of domain.dependsOn) {
      if (!domainIds.has(dep)) {
        issues.push({
          code: 'MISSING_DEPENDENCY_DOMAIN',
          severity: 'error',
          message: `도메인 "${domain.id}"이 존재하지 않는 도메인 "${dep}"에 의존합니다.`,
          domain: domain.id,
          context: { missingDomain: dep },
        });
      }
    }
  }

  // 3. 순환 의존성 검사
  const graph = new DomainGraph(config);
  const cycles = graph.findCycles();

  for (const cycle of cycles) {
    issues.push({
      code: 'CIRCULAR_DEPENDENCY',
      severity: opts.cyclesAsErrors ? 'error' : 'warning',
      message: `순환 의존성이 발견되었습니다: ${formatCyclePath(cycle)}`,
      context: { cycle: cycle.path, type: cycle.type },
    });
  }

  // 4. 스펙-도메인 일관성 검증
  if (opts.validateSpecs && opts.existingSpecs) {
    const existingSpecSet = new Set(opts.existingSpecs);
    const assignedSpecs = new Set<string>();

    for (const domain of domains) {
      for (const specId of domain.specs) {
        // 스펙이 실제로 존재하는지
        if (!existingSpecSet.has(specId)) {
          issues.push({
            code: 'MISSING_SPEC',
            severity: 'warning',
            message: `도메인 "${domain.id}"에 등록된 스펙 "${specId}"가 존재하지 않습니다.`,
            domain: domain.id,
            spec: specId,
          });
        }

        // 중복 할당 확인
        if (assignedSpecs.has(specId)) {
          issues.push({
            code: 'DUPLICATE_SPEC_ASSIGNMENT',
            severity: 'warning',
            message: `스펙 "${specId}"가 여러 도메인에 할당되어 있습니다.`,
            spec: specId,
            domain: domain.id,
          });
        }
        assignedSpecs.add(specId);
      }
    }

    // 5. 고아 스펙 감지
    if (opts.detectOrphanSpecs) {
      for (const specId of opts.existingSpecs) {
        if (!assignedSpecs.has(specId)) {
          issues.push({
            code: 'ORPHAN_SPEC',
            severity: 'warning',
            message: `스펙 "${specId}"가 어떤 도메인에도 속하지 않습니다.`,
            spec: specId,
          });
        }
      }
    }
  }

  // 6. 빈 도메인 경고
  if (opts.warnEmptyDomains) {
    for (const domain of domains) {
      if (domain.specs.length === 0) {
        issues.push({
          code: 'EMPTY_DOMAIN',
          severity: 'info',
          message: `도메인 "${domain.id}"에 스펙이 없습니다.`,
          domain: domain.id,
        });
      }
    }
  }

  // 7. 의존성 규칙 검증
  if (config.rules && config.rules.length > 0) {
    const ruleIssues = validateDomainRules(config, domains);
    issues.push(...ruleIssues);
  }

  // 결과 분류
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
    infos,
  };
}

/**
 * 도메인 규칙 검증
 */
function validateDomainRules(
  config: DomainsConfig,
  domains: DomainInfo[]
): DomainValidationIssue[] {
  const issues: DomainValidationIssue[] = [];
  const rules = config.rules ?? [];
  const domainMap = new Map(domains.map((d) => [d.id, d]));

  for (const rule of rules) {
    const fromDomain = domainMap.get(rule.from);
    const toDomain = domainMap.get(rule.to);

    // 규칙에 명시된 도메인이 존재하는지
    if (!fromDomain) {
      issues.push({
        code: 'INVALID_RULE_DOMAIN',
        severity: 'warning',
        message: `규칙에 명시된 도메인 "${rule.from}"이 존재하지 않습니다.`,
        context: { rule },
      });
      continue;
    }

    if (!toDomain) {
      issues.push({
        code: 'INVALID_RULE_DOMAIN',
        severity: 'warning',
        message: `규칙에 명시된 도메인 "${rule.to}"이 존재하지 않습니다.`,
        context: { rule },
      });
      continue;
    }

    // 규칙 위반 검사
    const hasDependency = fromDomain.dependencies[rule.type]?.includes(rule.to);

    if (rule.allowed === false && hasDependency) {
      // 금지된 의존성이 존재
      issues.push({
        code: 'RULE_VIOLATION',
        severity: 'error',
        message: `도메인 규칙 위반: "${rule.from}"은 "${rule.to}"에 ${rule.type} 의존할 수 없습니다.${rule.reason ? ` (${rule.reason})` : ''}`,
        domain: rule.from,
        context: { rule },
      });
    }
  }

  return issues;
}

/**
 * 특정 스펙이 특정 도메인의 스펙에 의존할 수 있는지 검증
 */
export function canDependOn(
  config: DomainsConfig,
  fromDomainId: string,
  toDomainId: string
): { allowed: boolean; reason?: string } {
  // 같은 도메인이면 허용
  if (fromDomainId === toDomainId) {
    return { allowed: true };
  }

  const domains = toDomainInfoList(config);
  const fromDomain = domains.find((d) => d.id === fromDomainId);

  if (!fromDomain) {
    return { allowed: false, reason: `도메인 "${fromDomainId}"을 찾을 수 없습니다.` };
  }

  // 의존성에 있으면 허용
  if (fromDomain.dependsOn.includes(toDomainId)) {
    return { allowed: true };
  }

  // 규칙 확인
  const rules = config.rules ?? [];
  for (const rule of rules) {
    if (rule.from === fromDomainId && rule.to === toDomainId) {
      if (rule.allowed) {
        return { allowed: true };
      } else {
        return { allowed: false, reason: rule.reason ?? '도메인 규칙에 의해 금지됨' };
      }
    }
  }

  // 의존성 선언이 없으면 기본적으로 불허
  return {
    allowed: false,
    reason: `도메인 "${fromDomainId}"은 "${toDomainId}"에 대한 의존성이 선언되지 않았습니다.`,
  };
}

/**
 * 고아 스펙 제안 - 어떤 도메인에 속해야 하는지 추천
 */
export function suggestDomainForSpec(
  config: DomainsConfig,
  specId: string,
  specPath?: string
): string[] {
  const domains = toDomainInfoList(config);
  const suggestions: { id: string; score: number }[] = [];

  for (const domain of domains) {
    let score = 0;

    // 경로 기반 매칭
    if (specPath && domain.path) {
      if (specPath.includes(domain.path) || domain.path.includes(specPath.split('/')[0])) {
        score += 10;
      }
    }

    // 도메인 ID가 스펙 ID에 포함되어 있는지
    if (specId.toLowerCase().includes(domain.id.toLowerCase())) {
      score += 5;
    }

    // 스펙 ID의 일부가 도메인 ID와 매칭되는지
    const specParts = specId.toLowerCase().split(/[-_/]/);
    for (const part of specParts) {
      if (domain.id.toLowerCase().includes(part) || part.includes(domain.id.toLowerCase())) {
        score += 3;
      }
    }

    if (score > 0) {
      suggestions.push({ id: domain.id, score });
    }
  }

  // 점수 높은 순으로 정렬
  suggestions.sort((a, b) => b.score - a.score);

  return suggestions.map((s) => s.id);
}

/**
 * 검증 결과 포맷팅
 */
export function formatValidationResult(result: DomainValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✅ 도메인 검증 통과');
  } else {
    lines.push('❌ 도메인 검증 실패');
  }

  lines.push('');

  if (result.errors.length > 0) {
    lines.push(`📛 에러 (${result.errors.length}개):`);
    for (const error of result.errors) {
      lines.push(`  • [${error.code}] ${error.message}`);
    }
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push(`⚠️ 경고 (${result.warnings.length}개):`);
    for (const warning of result.warnings) {
      lines.push(`  • [${warning.code}] ${warning.message}`);
    }
    lines.push('');
  }

  if (result.infos.length > 0) {
    lines.push(`ℹ️ 정보 (${result.infos.length}개):`);
    for (const info of result.infos) {
      lines.push(`  • [${info.code}] ${info.message}`);
    }
  }

  return lines.join('\n');
}
