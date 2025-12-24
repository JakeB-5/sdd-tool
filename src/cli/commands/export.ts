/**
 * sdd export CLI 명령어
 */
import { Command } from 'commander';
import { executeExport, formatExportResult } from '../../core/export/index.js';
import type { ExportFormat, Theme } from '../../core/export/schemas.js';

export function registerExportCommand(program: Command): void {
  program
    .command('export [specId...]')
    .description('스펙을 HTML, JSON 등 다양한 형식으로 내보내기')
    .option('-f, --format <format>', '출력 형식 (html, json, markdown, pdf)', 'html')
    .option('-o, --output <path>', '출력 파일 경로')
    .option('--theme <theme>', '테마 (light, dark)', 'light')
    .option('--all', '전체 스펙 내보내기', false)
    .option('--toc', '목차 포함', true)
    .option('--no-toc', '목차 제외')
    .option('--include-constitution', 'Constitution 포함', false)
    .option('--include-changes', '변경 제안 포함', false)
    .option('--json', 'JSON 형식 출력 (결과 메타정보)')
    .action(async (specIds: string[], options) => {
      const projectRoot = process.cwd();

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
      } else {
        console.log(formatExportResult(result));
      }

      if (!result.success) {
        process.exit(1);
      }
    });
}
