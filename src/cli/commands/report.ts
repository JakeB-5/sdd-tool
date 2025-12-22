/**
 * report 명령어
 *
 * 스펙 리포트를 HTML, Markdown, JSON 형식으로 내보냅니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import {
  generateReport,
  ReportFormat,
} from '../../core/report/index.js';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * report 실행 옵션
 */
export interface ReportOptions {
  format?: string;
  output?: string;
  title?: string;
  quality?: boolean;
  validation?: boolean;
}

/**
 * report 명령어 결과
 */
export interface ReportCommandResult {
  format: ReportFormat;
  outputPath: string;
  content: string;
}

/**
 * 형식 유효성 검사
 */
export function isValidReportFormat(format: string): format is ReportFormat {
  return ['html', 'markdown', 'json'].includes(format);
}

/**
 * 출력 경로 결정
 */
export function resolveOutputPath(
  format: ReportFormat,
  output: string | undefined,
  projectRoot: string
): string {
  if (!output) {
    const ext = format === 'markdown' ? 'md' : format;
    const timestamp = new Date().toISOString().slice(0, 10);
    return path.join(projectRoot, `sdd-report-${timestamp}.${ext}`);
  }
  return path.isAbsolute(output) ? output : path.join(projectRoot, output);
}

/**
 * report 핵심 로직 (테스트 가능)
 */
export async function executeReport(
  options: ReportOptions,
  projectRoot: string
): Promise<Result<ReportCommandResult, Error>> {
  const sddPath = path.join(projectRoot, '.sdd');
  const format = (options.format || 'html') as ReportFormat;

  // 형식 검증
  if (!isValidReportFormat(format)) {
    return failure(new Error(`지원하지 않는 형식입니다: ${format}. 지원 형식: html, markdown, json`));
  }

  const outputPath = resolveOutputPath(format, options.output, projectRoot);

  const result = await generateReport(sddPath, {
    format,
    outputPath,
    title: options.title,
    includeQuality: options.quality !== false,
    includeValidation: options.validation !== false,
  });

  if (!result.success) {
    return failure(result.error);
  }

  return success({
    format,
    outputPath: result.data.outputPath || outputPath,
    content: result.data.content,
  });
}

/**
 * report 명령어 등록
 */
export function registerReportCommand(program: Command): void {
  program
    .command('report')
    .description('스펙 리포트를 생성합니다')
    .option('-f, --format <format>', '출력 형식 (html, markdown, json)', 'html')
    .option('-o, --output <path>', '출력 파일 경로')
    .option('--title <title>', '리포트 제목')
    .option('--no-quality', '품질 분석 제외')
    .option('--no-validation', '검증 결과 제외')
    .action(async (options: ReportOptions) => {
      try {
        await runReport(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * report CLI 실행 (출력 및 종료 처리)
 */
async function runReport(options: ReportOptions): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const format = (options.format || 'html') as ReportFormat;

  logger.info('📊 리포트 생성 중...');
  logger.info(`   형식: ${format}`);
  logger.info(`   품질 분석: ${options.quality !== false ? '포함' : '제외'}`);
  logger.info(`   검증 결과: ${options.validation !== false ? '포함' : '제외'}`);
  logger.newline();

  const result = await executeReport(options, projectRoot);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  logger.success(`✅ 리포트가 생성되었습니다.`);
  logger.info(`   경로: ${result.data.outputPath}`);

  // 출력 없이 콘솔에 표시
  if (!options.output && format === 'json') {
    logger.newline();
    console.log(result.data.content);
  }
}
