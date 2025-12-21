/**
 * sdd validate 명령어
 */
import { Command } from 'commander';
import path from 'node:path';
import chalk from 'chalk';
import { validateSpecs, type FileValidationResult } from '../../core/spec/validator.js';
import { ExitCode } from '../../errors/index.js';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';

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
    .action(async (targetPath: string, options: { strict?: boolean; quiet?: boolean }) => {
      try {
        await runValidate(targetPath, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 검증 실행
 */
async function runValidate(
  targetPath: string,
  options: { strict?: boolean; quiet?: boolean }
): Promise<void> {
  // 대상 경로 결정
  let resolvedPath: string;

  if (targetPath) {
    resolvedPath = path.resolve(targetPath);
  } else {
    // 기본값: .sdd/specs/
    const sddRoot = await findSddRoot();
    if (!sddRoot) {
      logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
      process.exit(ExitCode.GENERAL_ERROR);
    }
    resolvedPath = path.join(sddRoot, '.sdd', 'specs');
  }

  if (!options.quiet) {
    logger.info(`검증 중: ${resolvedPath}`);
    logger.newline();
  }

  // 검증 실행
  const result = await validateSpecs(resolvedPath, { strict: options.strict });

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
}
