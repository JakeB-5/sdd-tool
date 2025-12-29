/**
 * 도메인 자동 생성 모듈
 *
 * 역추출된 모듈 구조에서 도메인을 자동 생성합니다.
 */

import path from 'node:path';
import { Result, success, failure } from '../../types/index.js';
import { DomainService } from '../domain/service.js';
import type { SuggestedDomain } from './scan-formatter.js';
import type { FinalizedSpec } from './finalizer.js';

/**
 * 도메인 생성 결과
 */
export interface DomainGenerationResult {
  /** 생성된 도메인 */
  created: GeneratedDomain[];
  /** 업데이트된 도메인 */
  updated: string[];
  /** 건너뛴 도메인 */
  skipped: Array<{ domain: string; reason: string }>;
  /** 오류 */
  errors: Array<{ domain: string; error: string }>;
}

/**
 * 생성된 도메인 정보
 */
export interface GeneratedDomain {
  /** 도메인 ID */
  id: string;
  /** 설명 */
  description: string;
  /** 소스 경로 */
  path: string;
  /** 연결된 스펙 수 */
  specCount: number;
  /** 의존성 */
  dependencies: string[];
}

/**
 * 도메인 생성 옵션
 */
export interface DomainGenerationOptions {
  /** 기존 도메인 덮어쓰기 */
  overwrite?: boolean;
  /** 비어있는 도메인도 생성 */
  includeEmpty?: boolean;
  /** 의존성 자동 추론 */
  inferDependencies?: boolean;
  /** 최소 신뢰도 (이 값 이상인 제안만 생성) */
  minConfidence?: number;
}

/**
 * 제안된 도메인에서 도메인 자동 생성
 */
export async function generateDomainsFromSuggestions(
  projectPath: string,
  suggestions: SuggestedDomain[],
  options: DomainGenerationOptions = {}
): Promise<Result<DomainGenerationResult, Error>> {
  const {
    overwrite = false,
    includeEmpty = false,
    inferDependencies = true,
    minConfidence = 0.5,
  } = options;

  const domainService = new DomainService(projectPath);
  const result: DomainGenerationResult = {
    created: [],
    updated: [],
    skipped: [],
    errors: [],
  };

  // 기존 도메인 로드
  const existingResult = await domainService.list();
  const existingDomains = existingResult.success
    ? new Set(existingResult.data.map(d => d.id))
    : new Set<string>();

  // 필터링: 최소 신뢰도 이상
  const filteredSuggestions = suggestions.filter(s => s.confidence >= minConfidence);

  for (const suggestion of filteredSuggestions) {
    const domainId = suggestion.name;

    // 비어있는 도메인 건너뛰기
    if (!includeEmpty && suggestion.files.length === 0) {
      result.skipped.push({
        domain: domainId,
        reason: '스펙이 없는 도메인',
      });
      continue;
    }

    // 기존 도메인 처리
    if (existingDomains.has(domainId)) {
      if (!overwrite) {
        result.skipped.push({
          domain: domainId,
          reason: '이미 존재하는 도메인',
        });
        continue;
      }
      // 덮어쓰기 모드면 삭제 후 재생성
      await domainService.delete(domainId, { unlinkSpecs: true });
      result.updated.push(domainId);
    }

    // 의존성 추론
    const dependencies: string[] = [];
    if (inferDependencies) {
      // 다른 제안된 도메인 중에서 import 관계가 있는 것 추론
      for (const other of filteredSuggestions) {
        if (other.name !== domainId && hasPathDependency(suggestion.path, other.path)) {
          dependencies.push(other.name);
        }
      }
    }

    // 도메인 생성
    const createResult = await domainService.create(domainId, {
      description: suggestion.description || `${domainId} 도메인 (역추출)`,
      path: suggestion.path,
      uses: dependencies,
    });

    if (createResult.success) {
      result.created.push({
        id: domainId,
        description: suggestion.description || `${domainId} 도메인`,
        path: suggestion.path,
        specCount: suggestion.files.length,
        dependencies,
      });
    } else {
      result.errors.push({
        domain: domainId,
        error: createResult.error.message,
      });
    }
  }

  return success(result);
}

/**
 * 확정된 스펙에서 도메인 자동 생성
 */
export async function generateDomainsFromSpecs(
  projectPath: string,
  specs: FinalizedSpec[],
  options: DomainGenerationOptions = {}
): Promise<Result<DomainGenerationResult, Error>> {
  const { overwrite = false, inferDependencies = true } = options;

  const domainService = new DomainService(projectPath);
  const result: DomainGenerationResult = {
    created: [],
    updated: [],
    skipped: [],
    errors: [],
  };

  // 기존 도메인 로드
  const existingResult = await domainService.list();
  const existingDomains = existingResult.success
    ? new Set(existingResult.data.map(d => d.id))
    : new Set<string>();

  // 스펙을 도메인별로 그룹화
  const domainGroups = new Map<string, FinalizedSpec[]>();
  for (const spec of specs) {
    const domain = spec.domain;
    if (!domainGroups.has(domain)) {
      domainGroups.set(domain, []);
    }
    domainGroups.get(domain)!.push(spec);
  }

  // 각 도메인 처리
  for (const [domainId, domainSpecs] of domainGroups) {
    // 기존 도메인 처리
    if (existingDomains.has(domainId)) {
      if (!overwrite) {
        // 기존 도메인에 스펙만 연결
        for (const spec of domainSpecs) {
          await domainService.linkSpec(domainId, spec.id);
        }
        result.skipped.push({
          domain: domainId,
          reason: '기존 도메인에 스펙 연결',
        });
        continue;
      }
      await domainService.delete(domainId, { unlinkSpecs: true });
      result.updated.push(domainId);
    }

    // 도메인 경로 추론
    const domainPath = inferDomainPath(domainSpecs);

    // 의존성 추론
    const dependencies: string[] = [];
    if (inferDependencies) {
      const relatedDomains = new Set<string>();
      for (const spec of domainSpecs) {
        if (spec.original.relatedSpecs) {
          for (const related of spec.original.relatedSpecs) {
            const relatedDomain = related.split('/')[0];
            if (relatedDomain && relatedDomain !== domainId) {
              relatedDomains.add(relatedDomain);
            }
          }
        }
      }
      dependencies.push(...relatedDomains);
    }

    // 도메인 생성
    const createResult = await domainService.create(domainId, {
      description: `${domainId} 도메인 (역추출, ${domainSpecs.length}개 스펙)`,
      path: domainPath,
      uses: dependencies,
    });

    if (createResult.success) {
      // 스펙 연결
      for (const spec of domainSpecs) {
        await domainService.linkSpec(domainId, spec.id);
      }

      result.created.push({
        id: domainId,
        description: `${domainId} 도메인`,
        path: domainPath,
        specCount: domainSpecs.length,
        dependencies,
      });
    } else {
      result.errors.push({
        domain: domainId,
        error: createResult.error.message,
      });
    }
  }

  return success(result);
}

/**
 * 경로 기반 의존성 추론
 */
function hasPathDependency(sourcePath: string, targetPath: string): boolean {
  // 간단한 휴리스틱: 상위 디렉토리는 하위 디렉토리의 의존성
  if (targetPath.startsWith(sourcePath)) {
    return false; // 자기 자신 또는 하위
  }

  // 공통 조상에서 가까울수록 의존 가능성 높음
  const sourceparts = sourcePath.split('/').filter(Boolean);
  const targetParts = targetPath.split('/').filter(Boolean);

  // core, common, shared 등은 다른 도메인의 의존성일 가능성 높음
  const commonPatterns = ['core', 'common', 'shared', 'utils', 'lib'];
  if (commonPatterns.some(p => targetParts.includes(p))) {
    return true;
  }

  return false;
}

/**
 * 스펙에서 도메인 경로 추론
 */
function inferDomainPath(specs: FinalizedSpec[]): string {
  if (specs.length === 0) {
    return '';
  }

  // 소스 파일에서 공통 경로 추출
  const sourcePaths: string[] = [];
  for (const spec of specs) {
    if (spec.original.metadata?.sourceFiles) {
      sourcePaths.push(...spec.original.metadata.sourceFiles);
    }
  }

  if (sourcePaths.length === 0) {
    return `src/${specs[0].domain}`;
  }

  // 공통 접두사 찾기
  const commonPrefix = findCommonPathPrefix(sourcePaths);
  return commonPrefix || `src/${specs[0].domain}`;
}

/**
 * 공통 경로 접두사 찾기
 */
function findCommonPathPrefix(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) return path.dirname(paths[0]);

  const parts = paths.map(p => p.split(/[/\\]/));
  const minLength = Math.min(...parts.map(p => p.length));
  const commonParts: string[] = [];

  for (let i = 0; i < minLength - 1; i++) {
    const current = parts[0][i];
    if (parts.every(p => p[i] === current)) {
      commonParts.push(current);
    } else {
      break;
    }
  }

  return commonParts.join('/');
}

/**
 * 도메인 생성 결과 포맷팅
 */
export function formatDomainGenerationResult(result: DomainGenerationResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('📁 도메인 생성 결과');
  lines.push('═'.repeat(50));
  lines.push('');

  // 생성된 도메인
  if (result.created.length > 0) {
    lines.push(`✅ ${result.created.length}개 도메인 생성:`);
    for (const domain of result.created) {
      lines.push(`   ${domain.id}`);
      lines.push(`     경로: ${domain.path}`);
      lines.push(`     스펙: ${domain.specCount}개`);
      if (domain.dependencies.length > 0) {
        lines.push(`     의존: [${domain.dependencies.join(', ')}]`);
      }
    }
    lines.push('');
  }

  // 업데이트된 도메인
  if (result.updated.length > 0) {
    lines.push(`🔄 ${result.updated.length}개 도메인 업데이트:`);
    for (const domain of result.updated) {
      lines.push(`   ${domain}`);
    }
    lines.push('');
  }

  // 건너뛴 도메인
  if (result.skipped.length > 0) {
    lines.push(`⏭️  ${result.skipped.length}개 도메인 건너뜀:`);
    for (const item of result.skipped) {
      lines.push(`   ${item.domain}: ${item.reason}`);
    }
    lines.push('');
  }

  // 오류
  if (result.errors.length > 0) {
    lines.push(`❌ ${result.errors.length}개 오류:`);
    for (const error of result.errors) {
      lines.push(`   ${error.domain}: ${error.error}`);
    }
    lines.push('');
  }

  // 통계
  const total = result.created.length + result.updated.length + result.skipped.length + result.errors.length;
  lines.push('─'.repeat(50));
  lines.push(`총 ${total}개 처리: ${result.created.length} 생성, ${result.updated.length} 업데이트, ${result.skipped.length} 건너뜀, ${result.errors.length} 오류`);
  lines.push('');

  return lines.join('\n');
}
