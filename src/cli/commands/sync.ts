/**
 * sync 명령어
 *
 * 스펙-코드 동기화 상태를 검증합니다.
 */
import { Command, InvalidArgumentError } from 'commander';
import { executeSync, SyncOptions, SyncResult } from '../../core/sync/index.js';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * 기본 동기화율 임계값 (%)
 */
export const DEFAULT_SYNC_THRESHOLD = 100;

/**
 * sync 실행 결과
 */
export interface SyncCommandResult {
  result: SyncResult;
  output: string;
}

/**
 * sync 핵심 로직 (테스트 가능)
 *
 * The threshold gate is evaluated by the caller (see evaluateSyncGate), so a
 * below-threshold run still returns the report instead of an error.
 */
export async function executeSyncCommand(
  specId: string | undefined,
  options: SyncOptions,
  projectRoot: string
): Promise<Result<SyncCommandResult, Error>> {
  const syncResult = await executeSync(projectRoot, {
    ...options,
    specId,
  });

  // executeSync reports a CI threshold miss as a failure but still returns the data
  if (!syncResult.data) {
    return failure(syncResult.error || new Error('동기화 검증 실패'));
  }

  return success({
    result: syncResult.data.result,
    output: syncResult.data.output,
  });
}

/**
 * 임계값 게이트 판정 (테스트 가능)
 *
 * The gate is active with --ci or an explicit --threshold; without either, sync only reports.
 */
export function evaluateSyncGate(
  syncRate: number,
  options: { ci?: boolean; threshold?: number }
): { active: boolean; passed: boolean; threshold: number } {
  const threshold = options.threshold ?? DEFAULT_SYNC_THRESHOLD;
  const active = Boolean(options.ci) || options.threshold !== undefined;
  return { active, passed: !active || syncRate >= threshold, threshold };
}

/**
 * --threshold 값 파싱 (0~100 숫자만 허용)
 */
export function parseThreshold(value: string): number {
  const trimmed = value.trim();
  const parsed = Number(trimmed);
  if (trimmed === '' || !Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new InvalidArgumentError('0~100 사이의 숫자여야 합니다.');
  }
  return parsed;
}

/**
 * sync 명령어 등록
 */
export function registerSyncCommand(program: Command): void {
  program
    .command('sync [specId]')
    .description('스펙-코드 동기화 상태를 검증합니다')
    .option('--json', 'JSON 형식으로 출력')
    .option('--markdown', '마크다운 형식으로 출력')
    .option('--ci', 'CI 모드 (동기화율이 임계값 미만이면 실패 종료)')
    .option(
      '--threshold <percent>',
      `동기화율 임계값 0~100 (기본: ${DEFAULT_SYNC_THRESHOLD}, 지정 시 게이트 활성화)`,
      parseThreshold
    )
    .option('--src <dir>', '소스 디렉토리 (기본: ./src)')
    .option('--include <patterns>', '포함 패턴 (콤마 구분)', parsePatterns)
    .option('--exclude <patterns>', '제외 패턴 (콤마 구분)', parsePatterns)
    .addHelpText(
      'after',
      [
        '',
        '참조 형식:',
        '  코드:   // @spec REQ-01  또는  // @spec auth/login#REQ-01',
        "  테스트: it('auth/login#REQ-01: 설명', ...)",
        '  REQ ID가 여러 스펙에 있으면 bare REQ-01 참조는 경고 후 무시됩니다.',
        '  <domain>/<feature>#REQ-xx (또는 유일한 <feature>#REQ-xx)로 스펙을 지정하세요.',
        '  코드 또는 테스트 중 하나에서 참조되면 구현된 것으로 집계합니다.',
      ].join('\n')
    )
    .action(async (specId: string | undefined, opts: Record<string, unknown>) => {
      try {
        const projectRoot = await findSddRoot(process.cwd());
        if (!projectRoot) {
          logger.error('SDD 프로젝트가 아닙니다. sdd init을 먼저 실행하세요.');
          process.exit(ExitCode.INIT_ERROR);
        }

        const options: SyncOptions = {
          specId,
          json: opts.json as boolean,
          markdown: opts.markdown as boolean,
          ci: opts.ci as boolean,
          threshold: opts.threshold as number | undefined,
          srcDir: opts.src as string,
          include: opts.include as string[],
          exclude: opts.exclude as string[],
        };

        const result = await executeSyncCommand(specId, options, projectRoot);

        if (!result.success) {
          logger.error(result.error.message);
          process.exit(ExitCode.GENERAL_ERROR);
        }

        // 리포트는 게이트 결과와 무관하게 항상 출력
        console.log(result.data.output);

        const gate = evaluateSyncGate(result.data.result.syncRate, options);
        if (!gate.passed) {
          logger.error(
            `동기화율 ${result.data.result.syncRate}%가 임계값 ${gate.threshold}% 미만입니다.`
          );
          process.exit(ExitCode.VALIDATION_FAILED);
        }

        process.exit(ExitCode.SUCCESS);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 콤마 구분 패턴 파싱
 */
function parsePatterns(value: string): string[] {
  return value.split(',').map(p => p.trim());
}
