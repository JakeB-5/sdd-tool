/**
 * quality 명령어
 *
 * 스펙 품질을 분석하고 점수를 산출합니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import {
  analyzeSpecQuality,
  analyzeProjectQuality,
  formatQualityResult,
  formatProjectQualityResult,
  type QualityResult,
  type ProjectQualityResult,
} from '../../core/quality/index.js';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * quality 실행 옵션
 */
export interface QualityOptions {
  all?: boolean;
  json?: boolean;
  minScore?: string;
}

/**
 * quality 실행 결과
 */
export interface QualityCommandResult {
  type: 'project' | 'spec';
  data: ProjectQualityResult | QualityResult;
  formatted: string;
  passed: boolean;
}

/**
 * quality 핵심 로직 (테스트 가능)
 */
export async function executeQuality(
  feature: string | undefined,
  options: QualityOptions,
  projectRoot: string
): Promise<Result<QualityCommandResult, Error>> {
  const sddPath = path.join(projectRoot, '.sdd');
  const minScore = parseInt(options.minScore || '0', 10);

  // 전체 프로젝트 분석
  if (options.all || !feature) {
    const result = await analyzeProjectQuality(sddPath);

    if (!result.success) {
      return failure(result.error);
    }

    const formatted = options.json
      ? JSON.stringify(result.data, null, 2)
      : formatProjectQualityResult(result.data);

    return success({
      type: 'project',
      data: result.data,
      formatted,
      passed: result.data.averagePercentage >= minScore,
    });
  }

  // 개별 스펙 분석
  const specPath = path.join(sddPath, 'specs', feature, 'spec.md');
  const result = await analyzeSpecQuality(specPath, sddPath);

  if (!result.success) {
    return failure(result.error);
  }

  const formatted = options.json
    ? JSON.stringify(result.data, null, 2)
    : formatQualityResult(result.data);

  return success({
    type: 'spec',
    data: result.data,
    formatted,
    passed: result.data.percentage >= minScore,
  });
}

/**
 * quality 명령어 등록
 */
export function registerQualityCommand(program: Command): void {
  program
    .command('quality [feature]')
    .description('스펙 품질을 분석하고 점수를 산출합니다')
    .option('-a, --all', '전체 프로젝트 분석')
    .option('--json', 'JSON 형식 출력')
    .option('--min-score <score>', '최소 점수 기준 (이하 시 에러)', '0')
    .action(async (feature: string | undefined, options: QualityOptions) => {
      try {
        await runQuality(feature, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * quality CLI 실행 (출력 및 종료 처리)
 */
async function runQuality(
  feature: string | undefined,
  options: QualityOptions
): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const result = await executeQuality(feature, options, projectRoot);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  console.log(result.data.formatted);

  if (!result.data.passed) {
    const minScore = parseInt(options.minScore || '0', 10);
    logger.newline();
    logger.error(`품질 점수가 최소 기준(${minScore}%) 미달입니다.`);
    process.exit(ExitCode.VALIDATION_FAILED);
  }
}
