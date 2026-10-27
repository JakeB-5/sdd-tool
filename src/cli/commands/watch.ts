/**
 * watch 명령어
 *
 * 스펙 파일 변경을 실시간으로 감시하고 자동 검증합니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import { createWatcher, FileEvent } from '../../core/watch/index.js';
import { validateSpecs } from '../../core/spec/index.js';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';

/**
 * watch 명령어 등록
 */
export function registerWatchCommand(program: Command): void {
  program
    .command('watch')
    .description('스펙 파일 변경을 실시간 감시하고 자동 검증합니다')
    .option('--no-validate', '자동 검증 비활성화')
    .option('--impact', '영향도 분석 포함')
    .option('-q, --quiet', '성공 시 출력 생략')
    .option('--debounce <ms>', '디바운스 시간 (기본: 500ms)', '500')
    .action(async (options: {
      validate?: boolean;
      impact?: boolean;
      quiet?: boolean;
      debounce?: string;
    }) => {
      try {
        await runWatch(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * watch 실행
 */
async function runWatch(options: {
  validate?: boolean;
  impact?: boolean;
  quiet?: boolean;
  debounce?: string;
}): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const specsPath = path.join(sddPath, 'specs');
  const debounceMs = parseInt(options.debounce || '500', 10);

  logger.info('👁️  Watch 모드 시작');
  logger.info(`   경로: ${specsPath}`);
  logger.info(`   디바운스: ${debounceMs}ms`);
  logger.info(`   검증: ${options.validate !== false ? '활성화' : '비활성화'}`);
  logger.newline();
  logger.info('파일 변경을 감시 중... (Ctrl+C로 종료)');
  logger.newline();

  const watcher = createWatcher({
    specsPath,
    debounceMs,
  });

  let validationCount = 0;
  let errorCount = 0;

  watcher.on('change', async (events: FileEvent[]) => {
    const timestamp = new Date().toLocaleTimeString();

    // 이벤트 요약
    const addCount = events.filter((e) => e.type === 'add').length;
    const changeCount = events.filter((e) => e.type === 'change').length;
    const unlinkCount = events.filter((e) => e.type === 'unlink').length;

    const parts: string[] = [];
    if (addCount > 0) parts.push(`추가 ${addCount}`);
    if (changeCount > 0) parts.push(`수정 ${changeCount}`);
    if (unlinkCount > 0) parts.push(`삭제 ${unlinkCount}`);

    logger.info(`[${timestamp}] 변경 감지: ${parts.join(', ')}`);

    // 변경된 파일 목록
    for (const event of events) {
      const icon = event.type === 'add' ? '➕' : event.type === 'change' ? '✏️' : '❌';
      logger.info(`  ${icon} ${event.relativePath}`);
    }

    // 자동 검증
    if (options.validate !== false) {
      logger.newline();
      logger.info('🔍 검증 실행 중...');

      // Validate spec.md files only (not constitution/templates under .sdd)
      const result = await validateSpecs(specsPath, { strict: false });

      validationCount++;

      if (result.success) {
        const data = result.data;
        const hasErrors = data.files.some((r: { errors: unknown[] }) => r.errors.length > 0);
        const hasWarnings = data.files.some((r: { warnings: unknown[] }) => r.warnings.length > 0);

        if (hasErrors) {
          errorCount++;
          logger.error(`❌ 검증 실패: ${data.failed}개 에러, ${data.warnings}개 경고`);

          // 에러 상세 표시
          for (const specResult of data.files) {
            if (specResult.errors.length > 0) {
              logger.error(`   ${specResult.file}:`);
              for (const err of specResult.errors) {
                logger.error(`     - ${err}`);
              }
            }
          }
        } else if (hasWarnings) {
          if (!options.quiet) {
            logger.warn(`⚠️  검증 완료: ${data.warnings}개 경고`);
          }
        } else {
          if (!options.quiet) {
            logger.success(`✅ 검증 통과 (${data.passed}개 스펙)`);
          }
        }
      } else {
        errorCount++;
        logger.error(`❌ 검증 오류: ${result.error.message}`);
      }

      logger.newline();
    }
  });

  watcher.on('error', (error: Error) => {
    logger.error(`감시 오류: ${error.message}`);
  });

  watcher.on('ready', () => {
    logger.success('✅ 감시 준비 완료');
    logger.newline();
  });

  // 종료 핸들러
  const cleanup = async () => {
    logger.newline();
    logger.info('Watch 모드 종료 중...');
    await watcher.stop();

    logger.newline();
    logger.info('📊 세션 요약:');
    logger.info(`   검증 실행: ${validationCount}회`);
    logger.info(`   에러 발생: ${errorCount}회`);

    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // 감시 시작
  watcher.start();

  // 무한 대기
  await new Promise(() => {});
}
