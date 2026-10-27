/**
 * cache 명령어
 *
 * 캐시 관리 기능 제공
 */
import { Command } from 'commander';
import * as logger from '../../utils/logger.js';
import { findSddRoot } from '../../utils/fs.js';
import { ExitCode } from '../../errors/index.js';
import { getGlobalCache, clearGlobalCache, setCacheOptions } from '../../core/cache/index.js';

export function registerCacheCommand(program: Command): void {
  const cache = program
    .command('cache')
    .description('캐시 관리 (clear, stats)');

  cache
    .command('clear')
    .description('캐시 초기화')
    .action(async () => {
      const sddRoot = await findSddRoot();
      if (!sddRoot) {
        logger.error('SDD 프로젝트를 찾을 수 없습니다.');
        process.exit(ExitCode.GENERAL_ERROR);
      }

      clearGlobalCache();
      logger.success('캐시가 초기화되었습니다.');
    });

  cache
    .command('stats')
    .description('캐시 통계 조회')
    .option('--json', 'JSON 형식으로 출력')
    .action(async (options: { json?: boolean }) => {
      const sddRoot = await findSddRoot();
      if (!sddRoot) {
        logger.error('SDD 프로젝트를 찾을 수 없습니다.');
        process.exit(ExitCode.GENERAL_ERROR);
      }

      const cache = getGlobalCache();
      const stats = cache.getStats();

      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        logger.info('📊 캐시 통계:');
        logger.info(`  히트: ${stats.hits}`);
        logger.info(`  미스: ${stats.misses}`);
        logger.info(`  엔트리: ${stats.entries}`);
        logger.info(`  히트율: ${(stats.hitRatio * 100).toFixed(1)}%`);
      }
    });

  cache
    .command('enable')
    .description('캐시 활성화')
    .action(() => {
      setCacheOptions({ enabled: true });
      logger.success('캐시가 활성화되었습니다.');
    });

  cache
    .command('disable')
    .description('캐시 비활성화')
    .action(() => {
      setCacheOptions({ enabled: false });
      logger.success('캐시가 비활성화되었습니다.');
    });
}
