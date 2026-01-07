/**
 * sdd reverse 명령어
 *
 * 레거시 코드베이스에서 스펙을 추출하는 역추출 워크플로우입니다.
 * Serena MCP를 사용하여 30+ 언어를 지원합니다.
 */

import { Command } from 'commander';
import path from 'node:path';
import chalk from 'chalk';
import { findSddRoot, fileExists } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode, getErrorMessage } from '../../errors/index.js';
import { Result, success, failure } from '../../types/index.js';
import {
  ensureSerenaAvailable,
  createInstallGuide,
  getSerenaHint,
} from '../../integrations/serena/index.js';
import {
  scanProject,
  formatScanResult,
  formatScanResultJson,
  addScanToMeta,
  getLastScan,
  compareScanResults,
  formatScanDiff,
  extractSpecs,
  saveExtractedSpecs,
  updateExtractionStatus,
  loadReviewList,
  formatReviewList,
  formatSpecDetail,
  approveSpec,
  rejectSpec,
  finalizeAllApproved,
  finalizeDomain,
  finalizeById,
  formatFinalizeResult,
  type ScanResult,
  type FinalizeResult,
  type FinalizedSpec,
} from '../../core/reverse/index.js';
import { createDomainService } from '../../core/domain/service.js';
import { promises as fs } from 'node:fs';

/**
 * reverse 공통 옵션
 */
export interface ReverseCommonOptions {
  /** Serena 체크 건너뛰기 */
  skipSerenaCheck?: boolean;
  /** 조용한 모드 */
  quiet?: boolean;
  /** 출력 디렉토리 */
  output?: string;
}

/**
 * scan 옵션
 */
export interface ReverseScanOptions extends ReverseCommonOptions {
  /** 분석 깊이 */
  depth?: number;
  /** 포함 패턴 */
  include?: string;
  /** 제외 패턴 */
  exclude?: string;
  /** 특정 언어만 */
  language?: string;
  /** JSON 출력 */
  json?: boolean;
  /** 이전 스캔과 비교 */
  compare?: boolean;
  /** 도메인 자동 생성 (기본값: true) */
  createDomains?: boolean;
}

/**
 * extract 옵션
 */
export interface ReverseExtractOptions extends ReverseCommonOptions {
  /** 추출 깊이: shallow, medium, deep */
  depth?: 'shallow' | 'medium' | 'deep';
  /** AI 추론 활성화 */
  ai?: boolean;
  /** 도메인 지정 */
  domain?: string;
}

/**
 * review 옵션
 */
export interface ReverseReviewOptions extends ReverseCommonOptions {
  /** 스펙 승인 */
  approve?: boolean;
  /** 스펙 거부 */
  reject?: boolean;
  /** 거부 사유 */
  reason?: string;
  /** 모든 스펙 리뷰 */
  all?: boolean;
}

/**
 * finalize 옵션
 */
export interface ReverseFinalizeOptions extends ReverseCommonOptions {
  /** 모든 승인된 스펙 확정 */
  all?: boolean;
  /** 특정 도메인 확정 */
  domain?: string;
}

/**
 * finalize 실행 결과
 */
export interface FinalizeCommandResult {
  action: 'single' | 'domain' | 'all' | 'no_target';
  data?: FinalizeResult;
}

/**
 * check-serena 실행 결과
 */
export interface CheckSerenaResult {
  available: boolean;
}

/**
 * Serena 필수 검증 래퍼
 */
async function withSerenaCheck<T>(
  operation: string,
  options: ReverseCommonOptions,
  fn: () => Promise<T>
): Promise<T | null> {
  const result = await ensureSerenaAvailable(operation, {
    skipSerenaCheck: options.skipSerenaCheck,
    quiet: options.quiet,
  });

  if (!result.success) {
    return null;
  }

  return fn();
}

/**
 * scan 실행 결과
 */
export interface ScanCommandResult {
  result: ScanResult;
  sddRoot: string;
  sddPath: string;
  domainsCreated: number;
  domainsSkipped: number;
}

/**
 * sdd reverse scan 핵심 로직 (테스트 가능)
 */
export async function executeScanCommand(
  targetPath: string | undefined,
  options: ReverseScanOptions,
  projectRoot?: string
): Promise<Result<ScanCommandResult, Error>> {
  const sddRoot = projectRoot || await findSddRoot();

  if (!sddRoot) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.'));
  }

  const scanPath = targetPath ? path.resolve(targetPath) : sddRoot;

  // 스캔 실행
  const scanResult = await scanProject(scanPath, {
    depth: options.depth,
    include: options.include,
    exclude: options.exclude,
    language: options.language,
  });

  if (!scanResult.success) {
    return failure(scanResult.error);
  }

  const result = scanResult.data;
  const sddPath = path.join(sddRoot, '.sdd');

  // 메타데이터 저장
  await addScanToMeta(sddPath, result);

  // 도메인 자동 생성
  let domainsCreated = 0;
  let domainsSkipped = 0;

  const shouldCreateDomains = options.createDomains !== false;
  if (shouldCreateDomains && result.summary.suggestedDomains.length > 0) {
    const domainService = createDomainService(sddRoot);
    const existingDomainsResult = await domainService.list();
    const existingDomainIds = existingDomainsResult.success
      ? existingDomainsResult.data.map(d => d.id)
      : [];

    for (const suggested of result.summary.suggestedDomains) {
      if (existingDomainIds.includes(suggested.name)) {
        domainsSkipped++;
        continue;
      }

      const createResult = await domainService.create(suggested.name, {
        description: `${suggested.name} 도메인 (reverse scan으로 자동 생성)`,
        path: suggested.path,
      });

      if (createResult.success) {
        domainsCreated++;
      }
    }
  }

  return success({
    result,
    sddRoot,
    sddPath,
    domainsCreated,
    domainsSkipped,
  });
}

/**
 * sdd reverse scan 핸들러
 */
async function handleScan(
  targetPath: string,
  options: ReverseScanOptions
): Promise<void> {
  if (!options.quiet) {
    const scanPath = targetPath ? path.resolve(targetPath) : process.cwd();
    logger.info(`스캔 중: ${scanPath}`);
  }

  const commandResult = await executeScanCommand(targetPath, options);

  if (!commandResult.success) {
    logger.error(commandResult.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const { result, sddRoot, sddPath, domainsCreated, domainsSkipped } = commandResult.data;

  // 이전 스캔과 비교
  if (options.compare) {
    const lastScan = await getLastScan(sddPath);
    if (lastScan) {
      // 이전 스캔 결과 복원 (간략화된 비교)
      console.log(chalk.bold('\n📊 이전 스캔 대비 변경:'));
      console.log(`   이전 스캔: ${lastScan.scannedAt}`);
      console.log(`   파일: ${lastScan.summary.fileCount} → ${result.summary.fileCount}`);
      console.log(`   도메인: ${lastScan.summary.suggestedDomains.join(', ')}`);
      console.log('');
    }
  }

  // 출력
  if (options.json) {
    console.log(formatScanResultJson(result));
  } else {
    console.log(formatScanResult(result));
  }

  // 결과 파일 저장
  if (options.output) {
    try {
      await fs.writeFile(options.output, formatScanResultJson(result), 'utf-8');
      if (!options.quiet) {
        logger.success(`결과 저장: ${options.output}`);
      }
    } catch (error) {
      logger.error(`결과 저장 실패: ${error}`);
    }
  }

  // 도메인 자동 생성 결과 출력
  if (!options.quiet && (domainsCreated > 0 || domainsSkipped > 0)) {
    console.log('');
    console.log(chalk.bold('📁 도메인 자동 생성:'));
    if (domainsCreated > 0) {
      console.log(chalk.green(`   ✅ ${domainsCreated}개 도메인 생성됨`));
    }
    if (domainsSkipped > 0) {
      console.log(chalk.dim(`   ⏭️  ${domainsSkipped}개 도메인 이미 존재 (건너뜀)`));
    }
    console.log('');
  }

  // Serena 사용 가능 시 추가 분석 안내
  if (!options.skipSerenaCheck) {
    const serenaCheck = await ensureSerenaAvailable('scan', { skipSerenaCheck: true, quiet: true });
    if (!serenaCheck.success && !options.quiet) {
      console.log(chalk.dim('💡 Serena MCP를 연결하면 심볼 수준 분석이 가능합니다.'));
      console.log(chalk.dim('   docs/guide/serena-setup.md 참조\n'));
    }
  }

  // 다음 단계 안내
  if (!options.quiet && !options.json) {
    console.log(chalk.bold('💡 다음 단계:'));
    console.log('   sdd reverse extract    # 코드에서 스펙 추출');
    console.log('');
  }
}

/**
 * extract 실행 결과
 */
export interface ExtractCommandResult {
  specs: Array<{ id: string; confidence: { grade: string; score: number } }>;
  symbolCount: number;
  skippedCount: number;
  overallConfidence: { grade: string; score: number };
}

/**
 * sdd reverse extract 핵심 로직 (테스트 가능)
 */
export async function executeExtractCommand(
  targetPath: string | undefined,
  options: ReverseExtractOptions,
  onProgress?: (progress: { processedSymbols: number; totalSymbols: number; specsGenerated: number }) => void,
  projectRoot?: string
): Promise<Result<ExtractCommandResult, Error>> {
  const sddRoot = projectRoot || await findSddRoot();

  if (!sddRoot) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.'));
  }

  const extractPath = targetPath ? path.resolve(targetPath) : sddRoot;

  // 먼저 스캔 실행
  const scanResult = await scanProject(extractPath, { depth: 5 });

  if (!scanResult.success) {
    return failure(scanResult.error);
  }

  // 스펙 추출
  const extractResult = await extractSpecs(scanResult.data, {
    depth: options.depth || 'medium',
    ai: options.ai,
    domain: options.domain,
  }, onProgress);

  if (!extractResult.success) {
    return failure(extractResult.error);
  }

  const result = extractResult.data;

  if (result.specs.length === 0) {
    return success({
      specs: [],
      symbolCount: result.symbolCount,
      skippedCount: result.skippedCount,
      overallConfidence: result.overallConfidence,
    });
  }

  // 스펙 저장
  const sddPath = path.join(sddRoot, '.sdd');
  const saveResult = await saveExtractedSpecs(sddPath, result, 'json');

  if (!saveResult.success) {
    return failure(saveResult.error);
  }

  // 메타데이터 업데이트
  await updateExtractionStatus(sddPath, {
    extractedCount: result.specs.length,
    pendingReviewCount: result.specs.length,
  });

  return success({
    specs: result.specs.map(s => ({ id: s.id, confidence: s.confidence })),
    symbolCount: result.symbolCount,
    skippedCount: result.skippedCount,
    overallConfidence: result.overallConfidence,
  });
}

/**
 * sdd reverse extract 핸들러
 */
async function handleExtract(
  targetPath: string,
  options: ReverseExtractOptions
): Promise<void> {
  if (!options.quiet) {
    const extractPath = targetPath ? path.resolve(targetPath) : process.cwd();
    logger.info(`추출 중: ${extractPath}`);
    if (options.depth) {
      logger.info(`깊이: ${options.depth}`);
    }
    if (options.ai) {
      logger.info('AI 추론 활성화됨');
    }
  }

  const commandResult = await executeExtractCommand(targetPath, options, (progress) => {
    if (!options.quiet) {
      process.stdout.write(`\r   처리 중: ${progress.processedSymbols}/${progress.totalSymbols} 심볼, ${progress.specsGenerated} 스펙 생성됨`);
    }
  });

  if (!commandResult.success) {
    logger.error(commandResult.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  if (!options.quiet) {
    console.log(''); // 진행 줄 끝내기
  }

  const result = commandResult.data;

  if (result.specs.length === 0) {
    logger.warn('추출된 스펙이 없습니다. 프로젝트에 분석 가능한 심볼이 없거나 Serena MCP가 필요합니다.');
    console.log(chalk.dim('\n💡 Serena MCP를 연결하면 심볼 수준 분석이 가능합니다.'));
    return;
  }

  // 결과 출력
  console.log('');
  console.log(chalk.bold('📄 스펙 추출 완료'));
  console.log('─'.repeat(40));
  console.log(`   추출된 스펙: ${chalk.green(result.specs.length.toString())}개`);
  console.log(`   처리된 심볼: ${result.symbolCount}개`);
  console.log(`   건너뛴 심볼: ${result.skippedCount}개`);
  console.log(`   신뢰도: ${result.overallConfidence.grade} (${result.overallConfidence.score}%)`);
  console.log('');
  console.log(chalk.bold('추출된 스펙:'));
  for (const spec of result.specs.slice(0, 10)) {
    console.log(`   ${chalk.cyan(spec.id)} (${spec.confidence.grade})`);
  }
  if (result.specs.length > 10) {
    console.log(chalk.dim(`   ... 외 ${result.specs.length - 10}개`));
  }
  console.log('');
  console.log(chalk.bold('💡 다음 단계:'));
  console.log('   sdd reverse review    # 추출된 스펙 리뷰');
  console.log('');
}

/**
 * review 액션 결과
 */
export type ReviewAction = 'list' | 'detail' | 'approved' | 'rejected' | 'empty' | 'no_drafts';

/**
 * review 실행 결과
 */
export interface ReviewCommandResult {
  action: ReviewAction;
  specId?: string;
  sddPath?: string;
}

/**
 * sdd reverse review 핵심 로직 (테스트 가능)
 */
export async function executeReviewCommand(
  specId: string | undefined,
  options: ReverseReviewOptions,
  projectRoot?: string
): Promise<Result<ReviewCommandResult, Error>> {
  const sddRoot = projectRoot || await findSddRoot();

  if (!sddRoot) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  const sddPath = path.join(sddRoot, '.sdd');
  const draftsPath = path.join(sddPath, '.reverse-drafts');

  if (!await fileExists(draftsPath)) {
    return success({ action: 'no_drafts' });
  }

  // 리뷰 목록 로드
  const loadResult = await loadReviewList(sddPath);
  if (!loadResult.success) {
    return failure(loadResult.error);
  }

  const items = loadResult.data;

  if (items.length === 0) {
    return success({ action: 'empty' });
  }

  // 특정 스펙 처리
  if (specId) {
    const item = items.find(i => i.specId === specId || i.specId.endsWith(`/${specId}`));
    if (!item) {
      return failure(new Error(`스펙을 찾을 수 없습니다: ${specId}`));
    }

    // 승인 처리
    if (options.approve) {
      const result = await approveSpec(sddPath, item.specId);
      if (!result.success) {
        return failure(result.error);
      }
      return success({ action: 'approved', specId: item.specId });
    }

    // 거부 처리
    if (options.reject) {
      const result = await rejectSpec(sddPath, item.specId, options.reason || '사용자에 의해 거부됨');
      if (!result.success) {
        return failure(result.error);
      }
      return success({ action: 'rejected', specId: item.specId });
    }

    // 상세 보기
    return success({ action: 'detail', specId: item.specId, sddPath });
  }

  // 전체 목록 반환
  return success({ action: 'list', sddPath });
}

/**
 * sdd reverse review 핸들러
 */
async function handleReview(
  specId: string | undefined,
  options: ReverseReviewOptions
): Promise<void> {
  const commandResult = await executeReviewCommand(specId, options);

  if (!commandResult.success) {
    logger.error(commandResult.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const result = commandResult.data;

  switch (result.action) {
    case 'no_drafts':
      logger.warn('추출된 스펙이 없습니다. `sdd reverse extract`를 먼저 실행하세요.');
      return;
    
    case 'empty':
      logger.warn('리뷰할 스펙이 없습니다.');
      return;
    
    case 'approved':
      logger.success(`승인됨: ${result.specId}`);
      console.log('');
      console.log(chalk.bold('💡 다음 단계:'));
      console.log('   sdd reverse finalize --all    # 승인된 스펙 확정');
      return;
    
    case 'rejected':
      logger.success(`거부됨: ${result.specId}`);
      return;
    
    case 'detail':
      if (result.sddPath && result.specId) {
        const detailLoadResult = await loadReviewList(result.sddPath);
        if (detailLoadResult.success) {
          const detailItem = detailLoadResult.data.find(i => 
            i.specId === result.specId || i.specId.endsWith(`/${result.specId}`)
          );
          if (detailItem) {
            console.log(formatSpecDetail(detailItem));
            console.log(chalk.bold('💡 작업:'));
            console.log(`   sdd reverse review ${result.specId} --approve    # 승인`);
            console.log(`   sdd reverse review ${result.specId} --reject     # 거부`);
            console.log('');
          }
        }
      }
      return;
    
    case 'list':
      // fall through to existing list logic
      break;
  }

  // 기존 목록 로직을 위해 다시 로드
  const sddRoot = await findSddRoot();
  if (!sddRoot) return;
  
  const sddPath = path.join(sddRoot, '.sdd');
  const loadResult = await loadReviewList(sddPath);
  if (!loadResult.success) return;
  
  const items = loadResult.data;

  // 전체 목록 표시
  console.log(formatReviewList(items));

  // 대기 중인 스펙이 있으면 안내
  const pending = items.filter(i => i.status === 'pending');
  if (pending.length > 0) {
    console.log(chalk.bold('💡 리뷰 방법:'));
    console.log('   sdd reverse review <spec-id>    # 스펙 상세 보기');
    console.log('');
  }

  // 승인된 스펙이 있으면 확정 안내
  const approved = items.filter(i => i.status === 'approved');
  if (approved.length > 0) {
    console.log(chalk.bold('💡 다음 단계:'));
    console.log('   sdd reverse finalize --all    # 모든 승인 스펙 확정');
    console.log('');
  }
}

/**
 * sdd reverse finalize 핵심 로직 (테스트 가능)
 */
export async function executeFinalizeCommand(
  specId: string | undefined,
  options: ReverseFinalizeOptions,
  projectRoot?: string
): Promise<Result<FinalizeCommandResult, Error>> {
  const sddRoot = projectRoot || await findSddRoot();

  if (!sddRoot) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  // 특정 스펙 확정
  if (specId) {
    const finalizeResult = await finalizeById(sddRoot, specId);
    if (!finalizeResult.success) {
      return failure(finalizeResult.error);
    }
    return success({
      action: 'single',
      data: {
        finalized: [finalizeResult.data],
        skipped: [],
        errors: [],
      },
    });
  }

  // 특정 도메인 확정
  if (options.domain) {
    const finalizeResult = await finalizeDomain(sddRoot, options.domain);
    if (!finalizeResult.success) {
      return failure(finalizeResult.error);
    }
    return success({
      action: 'domain',
      data: finalizeResult.data,
    });
  }

  // 모든 승인된 스펙 확정
  if (options.all) {
    const finalizeResult = await finalizeAllApproved(sddRoot);
    if (!finalizeResult.success) {
      return failure(finalizeResult.error);
    }
    return success({
      action: 'all',
      data: finalizeResult.data,
    });
  }

  // 옵션 없이 실행
  return success({ action: 'no_target' });
}

/**
 * sdd reverse finalize 핸들러
 */
async function handleFinalize(
  specId: string | undefined,
  options: ReverseFinalizeOptions
): Promise<void> {
  if (!options.quiet) {
    if (specId) {
      logger.info(`확정 중: ${specId}`);
    } else if (options.all) {
      logger.info('승인된 모든 스펙 확정 중');
    } else if (options.domain) {
      logger.info(`도메인 확정 중: ${options.domain}`);
    }
  }

  const commandResult = await executeFinalizeCommand(specId, options);

  if (!commandResult.success) {
    logger.error(commandResult.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const result = commandResult.data;

  switch (result.action) {
    case 'single':
    case 'domain':
    case 'all':
      if (result.data) {
        console.log(formatFinalizeResult(result.data));
      }
      return;

    case 'no_target':
      logger.warn('확정할 대상을 지정하세요:');
      console.log('   sdd reverse finalize <spec-id>     # 특정 스펙');
      console.log('   sdd reverse finalize --all         # 모든 승인 스펙');
      console.log('   sdd reverse finalize -d <domain>   # 특정 도메인');
      return;
  }
}

/**
 * sdd reverse 도움말
 */
function showReverseHelp(): void {
  console.log(`
${chalk.bold('sdd reverse')} - 레거시 코드에서 스펙 추출

${chalk.bold('사용법:')}
  sdd reverse <command> [options]

${chalk.bold('명령어:')}
  scan [path]     프로젝트 구조 스캔 및 도메인 추정
  extract [path]  코드에서 스펙 초안 추출
  review [spec]   추출된 스펙 리뷰 및 수정
  finalize [spec] 승인된 스펙을 정식 스펙으로 변환

${chalk.bold('Serena MCP 필요:')}
  이 명령어는 Serena MCP가 필요합니다.
  설치 방법: docs/guide/serena-setup.md

${chalk.bold('예시:')}
  sdd reverse scan                 # 프로젝트 스캔
  sdd reverse scan src/ --depth 3  # 특정 경로 스캔
  sdd reverse extract src/auth/    # auth 모듈 추출
  sdd reverse extract --domain auth --ai  # AI 추론 포함
  sdd reverse review               # 리뷰 대기 목록
  sdd reverse review auth/login    # 특정 스펙 리뷰
  sdd reverse finalize --all       # 모든 승인 스펙 확정

${chalk.bold('워크플로우:')}
  1. scan   → 프로젝트 분석 및 도메인 추정
  2. extract → 코드에서 스펙 초안 생성
  3. review  → 초안 검토 및 수정
  4. finalize → 정식 스펙으로 변환
`);
}

/**
 * Serena 체크 핵심 로직 (테스트 가능)
 */
export async function executeCheckSerenaCommand(): Promise<Result<CheckSerenaResult, Error>> {
  const result = await ensureSerenaAvailable('check', { quiet: true });

  if (result.success) {
    return success({ available: true });
  }

  return success({ available: false });
}

/**
 * Serena 체크 옵션만 표시
 */
async function handleCheckSerena(): Promise<void> {
  const commandResult = await executeCheckSerenaCommand();

  // 타입 가드: executeCheckSerenaCommand는 항상 success를 반환
  if (!commandResult.success) {
    // 이론적으로 도달하지 않음
    console.log(createInstallGuide());
    process.exit(ExitCode.GENERAL_ERROR);
  }

  if (commandResult.data.available) {
    console.log(chalk.green('✅ Serena MCP 사용 가능'));
  } else {
    console.log(createInstallGuide());
    process.exit(ExitCode.GENERAL_ERROR);
  }
}

/**
 * reverse 명령어 등록
 */
export function registerReverseCommand(program: Command): void {
  const reverse = program
    .command('reverse')
    .description('레거시 코드에서 스펙 추출 (Serena MCP 필요)')
    .option('--check-serena', 'Serena MCP 연결 상태 확인')
    .action(async (options) => {
      if (options.checkSerena) {
        await handleCheckSerena();
      } else {
        showReverseHelp();
      }
    });

  // scan 서브커맨드
  reverse
    .command('scan [path]')
    .description('프로젝트 구조 스캔 및 도메인 자동 생성')
    .option('-d, --depth <n>', '분석 깊이', parseInt)
    .option('-i, --include <pattern>', '포함 패턴 (glob)')
    .option('-e, --exclude <pattern>', '제외 패턴 (glob)')
    .option('-l, --language <lang>', '특정 언어만')
    .option('-o, --output <file>', '결과 저장 파일')
    .option('-q, --quiet', '조용한 모드')
    .option('--json', 'JSON 형식 출력')
    .option('--compare', '이전 스캔과 비교')
    .option('--no-create-domains', '도메인 자동 생성 비활성화')
    .option('--skip-serena-check', 'Serena 체크 건너뛰기 (개발용)')
    .action(handleScan);

  // extract 서브커맨드
  reverse
    .command('extract [path]')
    .description('코드에서 스펙 추출')
    .option('--depth <level>', '추출 깊이: shallow, medium, deep', 'medium')
    .option('--ai', 'AI 기반 의도 추론 활성화')
    .option('-d, --domain <name>', '도메인 지정')
    .option('-o, --output <dir>', '출력 디렉토리')
    .option('-q, --quiet', '조용한 모드')
    .option('--skip-serena-check', 'Serena 체크 건너뛰기 (개발용)')
    .action(handleExtract);

  // review 서브커맨드
  reverse
    .command('review [spec]')
    .description('추출된 스펙 리뷰')
    .option('-a, --all', '모든 스펙 리뷰')
    .option('--approve', '스펙 승인')
    .option('--reject', '스펙 거부')
    .option('--reason <reason>', '거부 사유')
    .option('-q, --quiet', '조용한 모드')
    .action(handleReview);

  // finalize 서브커맨드
  reverse
    .command('finalize [spec]')
    .description('승인된 스펙 정식 변환')
    .option('-a, --all', '모든 승인 스펙 확정')
    .option('-d, --domain <name>', '특정 도메인 확정')
    .option('-q, --quiet', '조용한 모드')
    .action(handleFinalize);
}
