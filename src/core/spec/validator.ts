/**
 * 스펙 검증기
 */
import path from 'node:path';
import { parseSpec, findTemplatePlaceholders, findLowercaseRfc2119Keywords } from './parser.js';
import { readFile, directoryExists, fileExists } from '../../utils/fs.js';
import { listSpecsUnder, resolveSpecRef, type SpecLocation } from './locator.js';
import { ValidationError, ErrorCode } from '../../errors/index.js';
import { Result, success, type SpecValidationError, type SpecValidationWarning } from '../../types/index.js';
import {
  parseConstitution,
  checkConstitutionViolations,
  type ConstitutionCheckResult,
} from '../constitution/index.js';

/**
 * 검증 옵션
 */
export interface ValidateOptions {
  /** 경고도 에러로 처리 */
  strict?: boolean;
  /** 참조 링크 검증 */
  checkLinks?: boolean;
  /** 스펙 루트 경로 (링크 검증 시 사용) */
  specsRoot?: string;
  /** Constitution 위반 검증 */
  checkConstitution?: boolean;
  /** SDD 루트 경로 (Constitution 검증 시 사용) */
  sddRoot?: string;
}

/**
 * 깨진 링크 정보
 */
export interface BrokenLink {
  /** 링크 텍스트 */
  text: string;
  /** 링크 대상 */
  target: string;
  /** 발견된 줄 번호 */
  line?: number;
  /** 링크 유형 */
  type: 'internal' | 'spec-reference' | 'dependency';
}

/**
 * 파일 검증 결과
 */
export interface FileValidationResult {
  file: string;
  valid: boolean;
  errors: SpecValidationError[];
  warnings: SpecValidationWarning[];
  /** 깨진 링크 목록 */
  brokenLinks?: BrokenLink[];
  /** Constitution 위반 검사 결과 */
  constitutionCheck?: ConstitutionCheckResult;
}

/**
 * 전체 검증 결과
 */
export interface ValidateResult {
  passed: number;
  failed: number;
  warnings: number;
  files: FileValidationResult[];
}

/**
 * 단일 스펙 파일 검증
 */
export async function validateSpecFile(
  filePath: string,
  options: ValidateOptions = {}
): Promise<FileValidationResult> {
  const result: FileValidationResult = {
    file: filePath,
    valid: true,
    errors: [],
    warnings: [],
  };

  // 파일 읽기
  const readResult = await readFile(filePath);
  if (!readResult.success) {
    result.valid = false;
    result.errors.push({
      code: ErrorCode.FILE_READ_ERROR,
      message: `파일을 읽을 수 없습니다: ${filePath}`,
      location: { file: filePath },
    });
    return result;
  }

  const content = readResult.data;

  // 스펙 파싱 및 검증
  const parseResult = parseSpec(content);
  if (!parseResult.success) {
    result.valid = false;
    result.errors.push({
      code: parseResult.error.code,
      message: parseResult.error.message,
      location: { file: filePath },
    });
    return result;
  }

  const spec = parseResult.data;

  // RFC 2119 키워드 검증
  if (spec.requirements.length === 0) {
    result.valid = false;
    result.errors.push({
      code: ErrorCode.RFC2119_VIOLATION,
      message: 'Requirement에 RFC 2119 키워드(SHALL, MUST, SHOULD, MAY)가 없습니다',
      location: { file: filePath },
    });

    // Keywords are matched in uppercase only; explain why lowercase ones were ignored
    const lowercase = findLowercaseRfc2119Keywords(content);
    if (lowercase.length > 0) {
      result.warnings.push({
        code: 'W008',
        message: `RFC 2119 키워드는 대문자로 작성하세요 (소문자 발견: ${lowercase.join(', ')} → ${lowercase.map((k) => k.toUpperCase()).join(', ')})`,
        location: { file: filePath },
      });
    }
  }

  // GIVEN-WHEN-THEN 형식 검증
  if (spec.scenarios.length === 0) {
    result.valid = false;
    result.errors.push({
      code: ErrorCode.GWT_INVALID_FORMAT,
      message: 'Scenario에 GIVEN-WHEN-THEN 형식이 없습니다',
      location: { file: filePath },
    });
  }

  // Frontmatter 경고
  if (!spec.metadata.created) {
    result.warnings.push({
      code: 'W001',
      message: 'YAML frontmatter에 created 날짜가 없습니다',
      location: { file: filePath },
    });
  }

  // 레거시 상태 별칭 (허용하되 표준 상태로 안내)
  if (spec.legacyStatus) {
    result.warnings.push({
      code: 'W006',
      message: `status '${spec.legacyStatus}'는 더 이상 사용되지 않습니다. '${spec.metadata.status}'를 사용하세요`,
      location: { file: filePath },
    });
  }

  // 템플릿 플레이스홀더 잔존 경고
  const placeholders = findTemplatePlaceholders(content);
  if (placeholders.length > 0) {
    const shown = placeholders.slice(0, 5).join(', ');
    const more = placeholders.length > 5 ? ` 외 ${placeholders.length - 5}개` : '';
    result.warnings.push({
      code: 'W005',
      message: `템플릿 플레이스홀더가 남아 있습니다: ${shown}${more}`,
      location: { file: filePath },
    });
  }

  // 참조 링크 검증
  if (options.checkLinks && options.specsRoot) {
    const brokenLinks = await validateLinks(content, filePath, options.specsRoot);
    if (brokenLinks.length > 0) {
      result.brokenLinks = brokenLinks;
      for (const link of brokenLinks) {
        result.warnings.push({
          code: 'W002',
          message: `깨진 ${link.type} 링크: ${link.target}`,
          location: { file: filePath, line: link.line },
        });
      }
    }
  }

  // Constitution 위반 검증
  if (options.checkConstitution && options.sddRoot) {
    const constitutionPath = path.join(options.sddRoot, '.sdd', 'constitution.md');
    const constReadResult = await readFile(constitutionPath);

    if (constReadResult.success) {
      const constParseResult = parseConstitution(constReadResult.data);

      if (!constParseResult.success) {
        result.warnings.push({
          code: 'W007',
          message: `Constitution 파싱 실패로 Constitution 검사를 건너뜁니다: ${constParseResult.error.message}`,
          location: { file: constitutionPath },
        });
      } else {
        const constitution = constParseResult.data;

        const checkResult = checkConstitutionViolations(
          content,
          spec.metadata.constitution_version,
          constitution
        );

        result.constitutionCheck = checkResult;

        // 위반 사항을 에러/경고로 변환
        for (const violation of checkResult.violations) {
          if (violation.severity === 'critical') {
            result.valid = false;
            result.errors.push({
              code: ErrorCode.CONSTITUTION_VIOLATION,
              message: `[${violation.ruleId}] ${violation.message}`,
              location: { file: filePath, line: violation.line },
            });
          } else {
            result.warnings.push({
              code: 'W003',
              message: `[Constitution] ${violation.message}`,
              location: { file: filePath, line: violation.line },
            });
          }
        }

        // 버전 불일치: major → 에러, minor → 경고, patch → 정보 (constitutionCheck에만 기록)
        if (checkResult.versionMismatch) {
          const vm = checkResult.versionMismatch;
          if (vm.severity === 'critical') {
            result.valid = false;
            result.errors.push({
              code: ErrorCode.CONSTITUTION_VERSION_MISMATCH,
              message: vm.message,
              location: { file: filePath },
            });
          } else if (vm.severity === 'warning') {
            result.warnings.push({
              code: 'W004',
              message: vm.message,
              location: { file: filePath },
            });
          }
        }
      }
    }
  }

  // strict 모드: 경고도 에러로 처리
  if (options.strict && result.warnings.length > 0) {
    result.valid = false;
    result.errors.push(...result.warnings.map((w) => ({
      code: w.code,
      message: `[STRICT] ${w.message}`,
      location: w.location,
    })));
  }

  return result;
}

/**
 * 스펙 파일 내 링크 검증
 */
async function validateLinks(
  content: string,
  filePath: string,
  specsRoot: string
): Promise<BrokenLink[]> {
  const brokenLinks: BrokenLink[] = [];
  const lines = content.split('\n');
  const fileDir = path.dirname(filePath);
  let allSpecs: SpecLocation[] | undefined;

  // 마크다운 링크 패턴: [text](url)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

  // 스펙 참조 패턴: `spec-id` 또는 [[spec-id]]
  const specRefPattern = /(?:`([a-z0-9-]+)`|\[\[([a-z0-9-]+)\]\])/g;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    // 마크다운 링크 검증
    let match;
    while ((match = linkPattern.exec(line)) !== null) {
      const [, text, target] = match;

      // 외부 링크 (http/https) 또는 앵커 링크 (#) 무시
      if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('#')) {
        continue;
      }

      // 내부 파일 링크 검증
      const targetPath = path.resolve(fileDir, target);
      if (!(await fileExists(targetPath))) {
        brokenLinks.push({
          text,
          target,
          line: lineNum + 1,
          type: 'internal',
        });
      }
    }

    // 스펙 참조 검증 (backtick 또는 wiki-style 링크)
    while ((match = specRefPattern.exec(line)) !== null) {
      const specId = match[1] || match[2];

      // 일반적인 코드 키워드 제외
      const codeKeywords = ['true', 'false', 'null', 'undefined', 'string', 'number', 'boolean', 'object', 'array'];
      if (codeKeywords.includes(specId)) {
        continue;
      }

      // 스펙 ID 형식인지 확인 (하이픈 포함, 영소문자+숫자)
      if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(specId)) {
        continue;
      }

      // 스펙 위치 확인 (도메인/평면 레이아웃 모두, 도메인 이름 참조도 허용)
      allSpecs ??= await listSpecsUnder(specsRoot);
      const fromDomain = findOwnDomain(allSpecs, filePath);
      const isDomainRef = allSpecs.some((s) => s.domain === specId);
      if (!isDomainRef && !resolveSpecRef(allSpecs, specId, fromDomain)) {
        brokenLinks.push({
          text: specId,
          target: specId,
          line: lineNum + 1,
          type: 'spec-reference',
        });
      }
    }
  }

  return brokenLinks;
}

/**
 * 스펙의 의존성 검증
 */
export async function validateDependencies(
  filePath: string,
  specsRoot: string
): Promise<BrokenLink[]> {
  const brokenLinks: BrokenLink[] = [];

  const readResult = await readFile(filePath);
  if (!readResult.success) {
    return brokenLinks;
  }

  const parseResult = parseSpec(readResult.data);
  if (!parseResult.success) {
    return brokenLinks;
  }

  const spec = parseResult.data;

  // dependencies 필드 검증
  if (spec.metadata.dependencies && Array.isArray(spec.metadata.dependencies)) {
    const allSpecs = await listSpecsUnder(specsRoot);
    const fromDomain = findOwnDomain(allSpecs, filePath);
    for (const dep of spec.metadata.dependencies) {
      if (!resolveSpecRef(allSpecs, dep, fromDomain)) {
        brokenLinks.push({
          text: dep,
          target: dep,
          type: 'dependency',
        });
      }
    }
  }

  return brokenLinks;
}

/**
 * 디렉토리 내 모든 스펙 파일 검증
 */
export async function validateSpecs(
  targetPath: string,
  options: ValidateOptions = {}
): Promise<Result<ValidateResult, ValidationError>> {
  const results: FileValidationResult[] = [];
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // 디렉토리인지 파일인지 확인
  if (await directoryExists(targetPath)) {
    // 디렉토리 내 spec.md 파일만 검증 (plan/tasks/prepare 등 보조 문서 제외)
    for (const file of await findSpecFiles(targetPath)) {
      const result = await validateSpecFile(file, options);
      results.push(result);

      if (result.valid) {
        passed++;
      } else {
        failed++;
      }
      warnings += result.warnings.length;
    }
  } else {
    // 단일 파일 검증
    const result = await validateSpecFile(targetPath, options);
    results.push(result);

    if (result.valid) {
      passed++;
    } else {
      failed++;
    }
    warnings += result.warnings.length;
  }

  return success({
    passed,
    failed,
    warnings,
    files: results,
  });
}

/**
 * 디렉토리 내 검증 대상 spec.md 파일 목록 (spec locator 기반)
 *
 * - 스펙 디렉토리 자체: 해당 spec.md (+ 하위에 중첩된 스펙)
 * - 프로젝트 루트 또는 .sdd: .sdd/specs 아래 모든 스펙
 * - 그 외(.sdd/specs, 도메인 디렉토리 등): 해당 디렉토리를 스펙 루트로 보고 탐색
 */
async function findSpecFiles(dirPath: string): Promise<string[]> {
  const resolved = path.resolve(dirPath);

  const ownSpec = path.join(resolved, 'spec.md');
  if (await fileExists(ownSpec)) {
    const nested = await listSpecsUnder(resolved);
    return [ownSpec, ...nested.map((l) => l.specPath)];
  }

  let specsDir = resolved;
  if (path.basename(resolved) === '.sdd') {
    specsDir = path.join(resolved, 'specs');
  } else if (await directoryExists(path.join(resolved, '.sdd'))) {
    specsDir = path.join(resolved, '.sdd', 'specs');
  }

  const locations = await listSpecsUnder(specsDir);
  return locations.map((l) => l.specPath);
}

/**
 * 파일이 속한 스펙의 도메인 (의존성 해석 시 같은 도메인 우선)
 */
function findOwnDomain(all: SpecLocation[], filePath: string): string | null | undefined {
  const resolved = path.resolve(filePath);
  return all.find((s) => s.specPath === resolved)?.domain;
}
