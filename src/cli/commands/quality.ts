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
} from '../../core/quality/index.js';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';

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
    .action(async (feature: string | undefined, options: {
      all?: boolean;
      json?: boolean;
      minScore?: string;
    }) => {
      try {
        await runQuality(feature, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * quality 실행
 */
async function runQuality(
  feature: string | undefined,
  options: { all?: boolean; json?: boolean; minScore?: string }
): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const minScore = parseInt(options.minScore || '0', 10);

  // 전체 프로젝트 분석
  if (options.all || !feature) {
    const result = await analyzeProjectQuality(sddPath);

    if (!result.success) {
      logger.error(result.error.message);
      process.exit(ExitCode.GENERAL_ERROR);
    }

    if (options.json) {
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log(formatProjectQualityResult(result.data));
    }

    // 최소 점수 체크
    if (result.data.averagePercentage < minScore) {
      logger.newline();
      logger.error(`품질 점수가 최소 기준(${minScore}%) 미달입니다.`);
      process.exit(ExitCode.VALIDATION_ERROR);
    }

    return;
  }

  // 개별 스펙 분석
  const specPath = path.join(sddPath, 'specs', feature, 'spec.md');
  const result = await analyzeSpecQuality(specPath, sddPath);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(formatQualityResult(result.data));
  }

  // 최소 점수 체크
  if (result.data.percentage < minScore) {
    logger.newline();
    logger.error(`품질 점수가 최소 기준(${minScore}%) 미달입니다.`);
    process.exit(ExitCode.VALIDATION_ERROR);
  }
}
