/**
 * sdd export CLI 명령어
 */
import { Command } from 'commander';
import { executeExport, formatExportResult } from '../../core/export/index.js';
import { ThemeSchema, type ExportFormat, type Theme } from '../../core/export/schemas.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { findSddRoot } from '../../utils/fs.js';

export function registerExportCommand(program: Command): void {
  program
    .command('export [specId...]')
    .description('스펙을 HTML, JSON, Markdown 형식으로 내보내기')
    .option('-f, --format <format>', '출력 형식 (html, json, markdown)', 'html')
    .option('-o, --output <path>', '출력 파일 경로')
    .option('--theme <theme>', '테마 (light, dark)', 'light')
    .option('--all', '전체 스펙 내보내기', false)
    .option('--toc', '목차 포함', true)
    .option('--no-toc', '목차 제외')
    .option('--include-constitution', 'Constitution 포함', false)
    .option('--include-changes', '대기 중인 변경 제안 포함', false)
    .option('--json', 'JSON 형식 출력 (결과 메타정보)')
    .action(async (specIds: string[], options) => {
      const projectRoot = await findSddRoot();
      if (!projectRoot) {
        logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
        process.exit(ExitCode.GENERAL_ERROR);
      }

      if (!ThemeSchema.safeParse(options.theme).success) {
        logger.error(`지원하지 않는 테마: ${options.theme} (${ThemeSchema.options.join(', ')} 중 선택)`);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      const result = await executeExport(projectRoot, {
        format: options.format as ExportFormat,
        output: options.output,
        theme: options.theme as Theme,
        includeToc: options.toc,
        includeConstitution: options.includeConstitution,
        includeChanges: options.includeChanges,
        all: options.all,
        specIds: specIds.length > 0 ? specIds : undefined,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else if (result.success) {
        console.log(formatExportResult(result));
      } else {
        logger.error(`내보내기 실패: ${result.error}`);
      }

      if (!result.success) {
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}
