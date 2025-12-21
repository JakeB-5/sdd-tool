/**
 * 스펙 검증기
 */
import path from 'node:path';
import { parseSpec, validateSpecFormat } from './parser.js';
import { readFile, listFiles, directoryExists } from '../../utils/fs.js';
import { ValidationError, ErrorCode } from '../../errors/index.js';
import { Result, success, failure, type ValidationResult, type SpecValidationError, type SpecValidationWarning } from '../../types/index.js';

/**
 * 검증 옵션
 */
export interface ValidateOptions {
  /** 경고도 에러로 처리 */
  strict?: boolean;
}

/**
 * 파일 검증 결과
 */
export interface FileValidationResult {
  file: string;
  valid: boolean;
  errors: SpecValidationError[];
  warnings: SpecValidationWarning[];
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
          // index.md나 README.md는 제외
          if (!['index.md', 'readme.md'].includes(entry.name.toLowerCase())) {
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
