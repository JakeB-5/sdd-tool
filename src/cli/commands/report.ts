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
    .action(async (options: {
      format?: string;
      output?: string;
      title?: string;
      quality?: boolean;
      validation?: boolean;
    }) => {
      try {
        await runReport(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * report 실행
 */
async function runReport(options: {
  format?: string;
  output?: string;
  title?: string;
  quality?: boolean;
  validation?: boolean;
}): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const format = (options.format || 'html') as ReportFormat;

  // 형식 검증
  if (!['html', 'markdown', 'json'].includes(format)) {
    logger.error(`지원하지 않는 형식입니다: ${format}`);
    logger.info('지원 형식: html, markdown, json');
    process.exit(ExitCode.VALIDATION_ERROR);
  }

  // 기본 출력 경로 설정
  let outputPath = options.output;
  if (!outputPath) {
    const ext = format === 'markdown' ? 'md' : format;
    const timestamp = new Date().toISOString().slice(0, 10);
    outputPath = path.join(projectRoot, `sdd-report-${timestamp}.${ext}`);
  } else if (!path.isAbsolute(outputPath)) {
    outputPath = path.join(projectRoot, outputPath);
  }

  logger.info('📊 리포트 생성 중...');
  logger.info(`   형식: ${format}`);
  logger.info(`   품질 분석: ${options.quality !== false ? '포함' : '제외'}`);
  logger.info(`   검증 결과: ${options.validation !== false ? '포함' : '제외'}`);
  logger.newline();

  const result = await generateReport(sddPath, {
    format,
    outputPath,
    title: options.title,
    includeQuality: options.quality !== false,
    includeValidation: options.validation !== false,
  });

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
