/**
 * sync 명령어
 *
 * 스펙-코드 동기화 상태를 검증합니다.
 */
import { Command } from 'commander';
import { executeSync, SyncOptions, SyncResult } from '../../core/sync/index.js';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * sync 실행 결과
 */
export interface SyncCommandResult {
  result: SyncResult;
  output: string;
}

/**
 * sync 핵심 로직 (테스트 가능)
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

  if (!syncResult.success) {
    return failure(syncResult.error || new Error('동기화 검증 실패'));
  }

  return success({
    result: syncResult.data!.result,
    output: syncResult.data!.output,
  });
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
    .option('--ci', 'CI 모드 (동기화율 임계값 검사)')
    .option('--threshold <percent>', '동기화율 임계값 (기본: 100)', parseInt)
    .option('--src <dir>', '소스 디렉토리 (기본: ./src)')
    .option('--include <patterns>', '포함 패턴 (콤마 구분)', parsePatterns)
    .option('--exclude <patterns>', '제외 패턴 (콤마 구분)', parsePatterns)
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
          threshold: opts.threshold as number,
          srcDir: opts.src as string,
          include: opts.include as string[],
          exclude: opts.exclude as string[],
        };

        const result = await executeSyncCommand(specId, options, projectRoot);

        if (!result.success) {
          logger.error(result.error.message);
          process.exit(ExitCode.VALIDATION_ERROR);
        }

        // 출력
        console.log(result.data.output);

        // CI 모드에서 동기화율 미달 시 실패
        if (options.ci) {
          const threshold = options.threshold ?? 100;
          if (result.data.result.syncRate < threshold) {
            process.exit(ExitCode.VALIDATION_ERROR);
          }
        }

        // 미구현 요구사항이 있으면 종료 코드 1
        if (result.data.result.missing.length > 0 && !options.json) {
          process.exit(1);
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
