/**
 * watch 명령어
 *
 * 스펙 파일 변경을 실시간으로 감시하고 자동 검증합니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import { createWatcher, FileEvent } from '../../core/watch/index.js';
import { validateSpecs } from '../../core/spec/index.js';
import { listSpecs } from '../../core/spec/locator.js';
import { analyzeImpact } from '../../core/impact/index.js';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';

/**
 * 변경 이벤트에서 영향받은 스펙 ID 추출 (삭제 이벤트 제외)
 */
export async function findChangedSpecIds(sddPath: string, events: FileEvent[]): Promise<string[]> {
  const changed = new Set(
    events.filter((e) => e.type !== 'unlink').map((e) => path.resolve(e.path))
  );
  if (changed.size === 0) {
    return [];
  }
  const specs = await listSpecs(sddPath);
  return specs.filter((s) => changed.has(path.resolve(s.specPath))).map((s) => s.id);
}

/**
 * 변경된 스펙의 영향도 요약 출력
 */
async function reportImpact(sddPath: string, events: FileEvent[]): Promise<void> {
  const specIds = await findChangedSpecIds(sddPath, events);
  if (specIds.length === 0) {
    return;
  }

  logger.info('📈 영향도 분석:');
  for (const specId of specIds) {
    const result = await analyzeImpact(sddPath, specId);
    if (!result.success) {
      logger.warn(`   ${specId}: 영향도 분석 실패 - ${result.error.message}`);
      continue;
    }
    const { riskScore, riskLevel, affectedBy, transitiveAffected } = result.data;
    logger.info(
      `   ${specId}: 위험도 ${riskScore}/10 (${riskLevel}), 직접 영향 ${affectedBy.length}개, 간접 영향 ${transitiveAffected.length}개`
    );
    for (const affected of affectedBy) {
      logger.info(`     - ${affected.id}`);
    }
  }
}

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
  if (options.impact) {
    logger.info('   영향도 분석: 활성화');
  }
  logger.newline();
  logger.info('파일 변경을 감시 중... (Ctrl+C로 종료)');
  logger.newline();

  const watcher = createWatcher({
    specsPath,
    debounceMs,
  });

  let validationCount = 0;
  let errorCount = 0;
  let impactRunning = false;

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
        const hasErrors = data.files.some((r) => r.errors.length > 0);
        const hasWarnings = data.files.some((r) => r.warnings.length > 0);

        if (hasErrors) {
          errorCount++;
          logger.error(`❌ 검증 실패: ${data.failed}개 스펙 실패, ${data.warnings}개 경고`);

          // 에러 상세 표시
          for (const specResult of data.files) {
            if (specResult.errors.length > 0) {
              logger.error(`   ${path.relative(specsPath, specResult.file)}:`);
              for (const err of specResult.errors) {
                const line = err.location?.line ? ` (${err.location.line}행)` : '';
                logger.error(`     - ${err.message}${line}`);
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

    if (options.impact) {
      // Skip when a previous analysis is still running; the next change re-triggers it
      if (impactRunning) {
        logger.warn('이전 영향도 분석이 진행 중이어서 이번 변경의 분석을 건너뜁니다.');
      } else {
        impactRunning = true;
        try {
          await reportImpact(sddPath, events);
        } catch (error) {
          logger.error(`영향도 분석 오류: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          impactRunning = false;
        }
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

    process.exit(ExitCode.SUCCESS);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // 감시 시작
  watcher.start();

  // 무한 대기
  await new Promise(() => {});
}
