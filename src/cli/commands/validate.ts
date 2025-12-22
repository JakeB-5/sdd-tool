/**
 * sdd validate 명령어
 */
import { Command } from 'commander';
import path from 'node:path';
import chalk from 'chalk';
import { validateSpecs, type FileValidationResult } from '../../core/spec/validator.js';
import { ExitCode } from '../../errors/index.js';
import { findSddRoot, fileExists } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { formatViolationReport } from '../../core/constitution/index.js';

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
 * CLI 옵션
 */
interface ValidateOptions {
  strict?: boolean;
  quiet?: boolean;
  checkLinks?: boolean;
  constitution?: boolean;
}

/**
 * 검증 실행
 */
async function runValidate(
  targetPath: string,
  options: ValidateOptions
): Promise<void> {
  // 대상 경로 결정
  let resolvedPath: string;
  let specsRoot: string | undefined;

  const sddRoot = await findSddRoot();

  if (targetPath) {
    resolvedPath = path.resolve(targetPath);
  } else {
    // 기본값: .sdd/specs/
    if (!sddRoot) {
      logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
      process.exit(ExitCode.GENERAL_ERROR);
    }
    resolvedPath = path.join(sddRoot, '.sdd', 'specs');
  }

  // 링크 검증을 위한 스펙 루트 경로 설정
  if (options.checkLinks && sddRoot) {
    specsRoot = path.join(sddRoot, '.sdd', 'specs');
  }

  // Constitution 검증 여부 결정 (기본값: true, --no-constitution 시 false)
  const checkConstitution = options.constitution !== false;
  let hasConstitution = false;

  if (checkConstitution && sddRoot) {
    const constitutionPath = path.join(sddRoot, '.sdd', 'constitution.md');
    hasConstitution = await fileExists(constitutionPath);
  }

  if (!options.quiet) {
    logger.info(`검증 중: ${resolvedPath}`);
    if (options.checkLinks) {
      logger.info('(참조 링크 검증 포함)');
    }
    if (checkConstitution && hasConstitution) {
      logger.info('(Constitution 위반 검사 포함)');
    }
    logger.newline();
  }

  // 검증 실행
  const result = await validateSpecs(resolvedPath, {
    strict: options.strict,
    checkLinks: options.checkLinks,
    specsRoot,
    checkConstitution: checkConstitution && hasConstitution,
    sddRoot: sddRoot || undefined,
  });

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  const { passed, failed, warnings, files } = result.data;

  // 결과 출력
  if (!options.quiet) {
    for (const file of files) {
      printFileResult(file, resolvedPath);
    }
    logger.newline();
  }

  // 요약
  const passedText = chalk.green(`${passed} passed`);
  const failedText = failed > 0 ? chalk.red(`${failed} failed`) : `${failed} failed`;
  const warningsText = warnings > 0 ? chalk.yellow(`${warnings} warnings`) : '';

  const summary = [passedText, failedText, warningsText].filter(Boolean).join(', ');
  console.log(`Result: ${summary}`);

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
