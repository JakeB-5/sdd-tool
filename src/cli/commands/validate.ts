/**
 * sdd validate 명령어
 */
import { Command } from 'commander';
import path from 'node:path';
import chalk from 'chalk';
import { validateSpecs, type FileValidationResult, type ValidateResult } from '../../core/spec/validator.js';
import { ExitCode } from '../../errors/index.js';
import { findSddRoot, fileExists } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * CLI 옵션
 */
export interface ValidateOptions {
  strict?: boolean;
  quiet?: boolean;
  checkLinks?: boolean;
  constitution?: boolean;
}

/**
 * 검증 컨텍스트
 */
export interface ValidateContext {
  resolvedPath: string;
  specsRoot?: string;
  checkConstitution: boolean;
  hasConstitution: boolean;
  sddRoot?: string;
}

/**
 * 검증 명령어 결과
 */
export interface ValidateCommandResult {
  context: ValidateContext;
  data: ValidateResult;
}

/**
 * 검증 컨텍스트 생성
 */
export async function createValidateContext(
  targetPath: string,
  options: ValidateOptions,
  sddRoot: string | null
): Promise<Result<ValidateContext, Error>> {
  let resolvedPath: string;
  let specsRoot: string | undefined;

  if (targetPath) {
    resolvedPath = path.resolve(targetPath);
  } else {
    if (!sddRoot) {
      return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.'));
    }
    resolvedPath = path.join(sddRoot, '.sdd', 'specs');
  }

  if (options.checkLinks && sddRoot) {
    specsRoot = path.join(sddRoot, '.sdd', 'specs');
  }

  const checkConstitution = options.constitution !== false;
  let hasConstitution = false;

  if (checkConstitution && sddRoot) {
    const constitutionPath = path.join(sddRoot, '.sdd', 'constitution.md');
    hasConstitution = await fileExists(constitutionPath);
  }

  return success({
    resolvedPath,
    specsRoot,
    checkConstitution,
    hasConstitution,
    sddRoot: sddRoot || undefined,
  });
}

/**
 * 검증 핵심 로직 (테스트 가능)
 */
export async function executeValidate(
  options: ValidateOptions,
  context: ValidateContext
): Promise<Result<ValidateResult, Error>> {
  const result = await validateSpecs(context.resolvedPath, {
    strict: options.strict,
    checkLinks: options.checkLinks,
    specsRoot: context.specsRoot,
    checkConstitution: context.checkConstitution && context.hasConstitution,
    sddRoot: context.sddRoot,
  });

  if (!result.success) {
    return failure(result.error);
  }

  return success(result.data);
}

/**
 * 결과 요약 문자열 생성
 */
export function formatValidateSummary(result: ValidateResult, useColors = true): string {
  const { passed, failed, warnings } = result;

  const passedText = useColors ? chalk.green(`${passed} passed`) : `${passed} passed`;
  const failedText = failed > 0
    ? (useColors ? chalk.red(`${failed} failed`) : `${failed} failed`)
    : `${failed} failed`;
  const warningsText = warnings > 0
    ? (useColors ? chalk.yellow(`${warnings} warnings`) : `${warnings} warnings`)
    : '';

  return [passedText, failedText, warningsText].filter(Boolean).join(', ');
}

/**
 * validate 명령어 등록
 */
export function registerValidateCommand(program: Command): void {
  program
    .command('validate')
    .description('스펙 파일 형식을 검증합니다')
    .argument('[path]', '검증할 파일 또는 디렉토리', '')
    .option('-s, --strict', '경고도 에러로 처리')
    .option('-q, --quiet', '요약만 출력')
    .option('-l, --check-links', '참조 링크 유효성 검사')
    .option('-c, --constitution', 'Constitution 위반 검사 (기본값)')
    .option('--no-constitution', 'Constitution 검사 건너뛰기')
    .action(async (targetPath: string, options: ValidateOptions) => {
      try {
        await runValidate(targetPath, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 검증 CLI 실행 (출력 및 종료 처리)
 */
async function runValidate(
  targetPath: string,
  options: ValidateOptions
): Promise<void> {
  const sddRoot = await findSddRoot();

  const contextResult = await createValidateContext(targetPath, options, sddRoot);
  if (!contextResult.success) {
    logger.error(contextResult.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const context = contextResult.data;

  if (!options.quiet) {
    logger.info(`검증 중: ${context.resolvedPath}`);
    if (options.checkLinks) {
      logger.info('(참조 링크 검증 포함)');
    }
    if (context.checkConstitution && context.hasConstitution) {
      logger.info('(Constitution 위반 검사 포함)');
    }
    logger.newline();
  }

  const result = await executeValidate(options, context);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  const { failed, files } = result.data;

  // 결과 출력
  if (!options.quiet) {
    for (const file of files) {
      printFileResult(file, context.resolvedPath);
    }
    logger.newline();
  }

  // 요약
  console.log(`Result: ${formatValidateSummary(result.data)}`);

  // 종료 코드
  if (failed > 0) {
    process.exit(ExitCode.VALIDATION_FAILED);
  }
}

/**
 * 파일 검증 결과 출력
 */
function printFileResult(result: FileValidationResult, basePath: string): void {
  const relativePath = path.relative(basePath, result.file);

  if (result.valid) {
    console.log(chalk.green('✓') + ' ' + relativePath);
  } else {
    console.log(chalk.red('✗') + ' ' + relativePath);

    for (const error of result.errors) {
      const line = error.location?.line ? `:${error.location.line}` : '';
      console.log(chalk.red(`  - ${error.message}${line}`));
    }
  }

  // 경고 출력
  for (const warning of result.warnings) {
    console.log(chalk.yellow(`  ⚠ ${warning.message}`));
  }

  // Constitution 검사 결과 요약
  if (result.constitutionCheck) {
    const cc = result.constitutionCheck;
    if (cc.passed) {
      console.log(chalk.green(`  ✓ Constitution 검사 통과 (${cc.rulesChecked}개 규칙)`));
    } else {
      console.log(chalk.red(`  ✗ Constitution 위반 발견 (${cc.violations.length}건)`));
    }
  }
}
