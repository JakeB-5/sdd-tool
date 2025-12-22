/**
 * 스펙 검증기
 */
import path from 'node:path';
import { parseSpec, validateSpecFormat } from './parser.js';
import { readFile, listFiles, directoryExists, fileExists } from '../../utils/fs.js';
import { ValidationError, ErrorCode } from '../../errors/index.js';
import { Result, success, failure, type ValidationResult, type SpecValidationError, type SpecValidationWarning } from '../../types/index.js';
import {
  parseConstitution,
  checkConstitutionViolations,
  type ConstitutionCheckResult,
  type Violation,
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

      if (constParseResult.success) {
        const constitution = constParseResult.data;
        const specConstitutionVersion = spec.metadata.constitution_version as string | undefined;

        const checkResult = checkConstitutionViolations(
          content,
          specConstitutionVersion,
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

        // 버전 불일치 경고/에러
        if (checkResult.versionMismatch) {
          const vm = checkResult.versionMismatch;
          if (vm.severity === 'critical') {
            result.valid = false;
            result.errors.push({
              code: ErrorCode.CONSTITUTION_VERSION_MISMATCH,
              message: vm.message,
              location: { file: filePath },
            });
          } else {
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

      // 스펙 디렉토리 확인
      const specPath = path.join(specsRoot, specId);
      const specFilePath = path.join(specPath, 'spec.md');
      if (!(await directoryExists(specPath)) && !(await fileExists(specFilePath))) {
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
    for (const dep of spec.metadata.dependencies) {
      const depPath = path.join(specsRoot, dep);
      const depFilePath = path.join(depPath, 'spec.md');
      if (!(await directoryExists(depPath)) && !(await fileExists(depFilePath))) {
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
    // 디렉토리 내 모든 .md 파일 찾기
    const filesResult = await findSpecFiles(targetPath);
    if (!filesResult.success) {
      return failure(new ValidationError(ErrorCode.DIRECTORY_NOT_FOUND, targetPath));
    }

    for (const file of filesResult.data) {
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
 * 디렉토리 내 스펙 파일 재귀 검색
 */
async function findSpecFiles(dirPath: string): Promise<Result<string[], ValidationError>> {
  const files: string[] = [];

  async function scanDir(dir: string): Promise<void> {
    const { promises: fs } = await import('node:fs');

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // 보조 파일 및 시스템 파일 제외 (spec.md만 검증)
          const excludeFiles = [
            'index.md',
            'readme.md',
            'plan.md',
            'tasks.md',
            'checklist.md',
          ];
          if (!excludeFiles.includes(entry.name.toLowerCase())) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // 디렉토리 읽기 실패 시 무시
    }
  }

  await scanDir(dirPath);
  return success(files);
}
