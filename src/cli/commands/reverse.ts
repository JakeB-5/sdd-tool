/**
 * sdd reverse 명령어
 *
 * 기존 코드베이스에서 스펙을 역추출하는 워크플로우입니다.
 * CLI는 결정적인 부분(구조 스캔, 초안 검증/리뷰, 확정)만 담당하고,
 * 코드를 읽고 초안(spec.md)을 작성하는 일은 AI(sdd-reverse 스킬)가 담당합니다.
 */

import { Command } from 'commander';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import { findSddRoot } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { Result, success, failure } from '../../types/index.js';
import {
  scanProject,
  formatScanResult,
  DRAFTS_DIR,
  listDrafts,
  resolveDraft,
  approveDraft,
  rejectDraft,
  formatDraftList,
  formatDraftDetail,
  finalizeDrafts,
  formatFinalizeResult,
  type ScanResult,
  type DraftInfo,
  type FinalizeResult,
} from '../../core/reverse/index.js';

const NO_PROJECT_MESSAGE = 'SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.';

/**
 * scan 옵션
 */
export interface ReverseScanOptions {
  include?: string[];
  exclude?: string[];
  language?: string;
  depth?: number;
  json?: boolean;
  output?: string;
}

/**
 * review 옵션
 */
export interface ReverseReviewOptions {
  approve?: boolean;
  reject?: boolean;
  reason?: string;
  list?: boolean;
}

/**
 * finalize 옵션
 */
export interface ReverseFinalizeOptions {
  all?: boolean;
  force?: boolean;
}

export type ReviewCommandResult =
  | { action: 'list'; drafts: DraftInfo[] }
  | { action: 'detail'; draft: DraftInfo }
  | { action: 'approved'; draft: DraftInfo }
  | { action: 'rejected'; draft: DraftInfo };

/**
 * sdd reverse scan 핵심 로직 (테스트 가능)
 *
 * 결과 경로는 프로젝트 루트 기준 상대 경로입니다.
 */
export async function executeScanCommand(
  targetPath: string | undefined,
  options: ReverseScanOptions,
  projectRoot?: string
): Promise<Result<ScanResult, Error>> {
  const sddRoot = projectRoot ?? (await findSddRoot());
  if (!sddRoot) {
    return failure(new Error(NO_PROJECT_MESSAGE));
  }

  // Relative target paths are resolved against the current working directory
  const scanRoot = targetPath ? path.resolve(targetPath) : sddRoot;
  return scanProject(
    scanRoot,
    {
      include: options.include,
      exclude: options.exclude,
      language: options.language,
      depth: options.depth,
    },
    sddRoot
  );
}

/**
 * sdd reverse review 핵심 로직 (테스트 가능)
 */
export async function executeReviewCommand(
  ref: string | undefined,
  options: ReverseReviewOptions,
  projectRoot?: string
): Promise<Result<ReviewCommandResult, Error>> {
  if (options.approve && options.reject) {
    return failure(new Error('--approve와 --reject는 함께 사용할 수 없습니다.'));
  }
  if ((options.approve || options.reject) && !ref) {
    return failure(new Error('승인/거부할 초안을 지정하세요: sdd reverse review <domain>/<feature> --approve'));
  }
  if (options.reason && !options.reject) {
    return failure(new Error('--reason은 --reject와 함께 사용하세요.'));
  }

  const sddRoot = projectRoot ?? (await findSddRoot());
  if (!sddRoot) {
    return failure(new Error(NO_PROJECT_MESSAGE));
  }
  const sddPath = path.join(sddRoot, '.sdd');

  if (ref && options.approve) {
    const result = await approveDraft(sddPath, ref);
    return result.success ? success({ action: 'approved', draft: result.data }) : result;
  }
  if (ref && options.reject) {
    const result = await rejectDraft(sddPath, ref, options.reason);
    return result.success ? success({ action: 'rejected', draft: result.data }) : result;
  }

  const listResult = await listDrafts(sddPath);
  if (!listResult.success) return listResult;

  if (!ref || options.list) {
    return success({ action: 'list', drafts: listResult.data });
  }

  const draftResult = resolveDraft(listResult.data, ref);
  return draftResult.success ? success({ action: 'detail', draft: draftResult.data }) : draftResult;
}

/**
 * sdd reverse finalize 핵심 로직 (테스트 가능)
 */
export async function executeFinalizeCommand(
  ref: string | undefined,
  options: ReverseFinalizeOptions,
  projectRoot?: string
): Promise<Result<FinalizeResult, Error>> {
  if (ref && options.all) {
    return failure(new Error('초안 지정과 --all은 함께 사용할 수 없습니다.'));
  }

  const sddRoot = projectRoot ?? (await findSddRoot());
  if (!sddRoot) {
    return failure(new Error(NO_PROJECT_MESSAGE));
  }

  return finalizeDrafts(sddRoot, { ref, force: options.force });
}

function exitWithError(message: string): never {
  logger.error(message);
  process.exit(ExitCode.GENERAL_ERROR);
}

async function handleScan(targetPath: string | undefined, options: ReverseScanOptions): Promise<void> {
  const result = await executeScanCommand(targetPath, options);
  if (!result.success) {
    exitWithError(result.error.message);
  }

  const json = JSON.stringify(result.data, null, 2);

  if (options.output) {
    try {
      await fs.writeFile(options.output, json + '\n', 'utf-8');
    } catch (error) {
      exitWithError(`결과 저장 실패: ${(error as Error).message}`);
    }
  }

  // --json emits pure JSON on stdout (no log lines)
  if (options.json) {
    console.log(json);
    return;
  }

  console.log(formatScanResult(result.data));
  if (options.output) {
    logger.success(`결과 저장: ${options.output}`);
  }
  console.log(chalk.bold('💡 다음 단계:'));
  console.log(`   AI(sdd-reverse 스킬)가 도메인별 코드를 읽고 .sdd/${DRAFTS_DIR}/<domain>/<feature>/spec.md 초안을 작성합니다.`);
  console.log('   sdd reverse scan --json      # 도메인별 파일 목록 (AI 입력용)');
  console.log('   sdd reverse review --list    # 초안 목록 및 검증 결과');
  console.log('');
}

async function handleReview(ref: string | undefined, options: ReverseReviewOptions): Promise<void> {
  const result = await executeReviewCommand(ref, options);
  if (!result.success) {
    exitWithError(result.error.message);
  }

  const data = result.data;
  switch (data.action) {
    case 'list':
      if (data.drafts.length === 0) {
        logger.warn(`초안이 없습니다. .sdd/${DRAFTS_DIR}/<domain>/<feature>/spec.md에 초안을 작성하세요.`);
        return;
      }
      console.log(formatDraftList(data.drafts));
      console.log(chalk.bold('💡 작업:'));
      console.log('   sdd reverse review <domain>/<feature>              # 초안 상세 보기');
      console.log('   sdd reverse review <domain>/<feature> --approve    # 승인');
      console.log('   sdd reverse review <domain>/<feature> --reject --reason "<사유>"  # 거부');
      console.log('   sdd reverse finalize                               # 승인된 초안 확정');
      console.log('');
      return;

    case 'detail':
      console.log(await formatDraftDetail(data.draft));
      return;

    case 'approved':
      logger.success(`승인됨: ${data.draft.id}`);
      console.log(chalk.dim('   다음 단계: sdd reverse finalize'));
      return;

    case 'rejected':
      logger.success(`거부됨: ${data.draft.id}${data.draft.reason ? ` (사유: ${data.draft.reason})` : ''}`);
      return;
  }
}

async function handleFinalize(ref: string | undefined, options: ReverseFinalizeOptions): Promise<void> {
  const sddRoot = await findSddRoot();
  if (!sddRoot) {
    exitWithError(NO_PROJECT_MESSAGE);
  }

  const result = await executeFinalizeCommand(ref, options, sddRoot);
  if (!result.success) {
    exitWithError(result.error.message);
  }

  console.log(formatFinalizeResult(result.data, sddRoot));

  if (result.data.skipped.length > 0 || result.data.errors.length > 0) {
    process.exit(ExitCode.GENERAL_ERROR);
  }
  if (result.data.finalized.length > 0) {
    console.log(chalk.dim('   다음 단계: sdd validate'));
  }
}

function collect(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

function parseDepth(value: string): number {
  const depth = Number(value);
  if (!Number.isInteger(depth) || depth < 0) {
    exitWithError(`--depth는 0 이상의 정수여야 합니다: ${value}`);
  }
  return depth;
}

/**
 * reverse 명령어 등록
 */
export function registerReverseCommand(program: Command): void {
  const reverse = program
    .command('reverse')
    .description('기존 코드에서 스펙 역추출 (AI가 초안 작성, CLI가 스캔/리뷰/확정)')
    .addHelpText(
      'after',
      `
워크플로우:
  1. sdd reverse scan --json                  구조 스캔 + 도메인 후보
  2. AI가 코드를 읽고 초안 작성               .sdd/${DRAFTS_DIR}/<domain>/<feature>/spec.md
  3. sdd validate .sdd/${DRAFTS_DIR}        초안 형식 검증
  4. sdd reverse review --list                초안 목록 + 검증 결과
  5. sdd reverse review <ref> --approve       사용자 확인 후 승인
  6. sdd reverse finalize                     승인된 초안을 .sdd/specs/로 이동`
    )
    .action(() => {
      reverse.outputHelp();
    });

  reverse
    .command('scan [path]')
    .description('프로젝트 구조 스캔 (파일/언어/라인 수, 디렉토리 기반 도메인 후보)')
    .option('-i, --include <glob>', '포함할 파일 glob (반복 가능)', collect)
    .option('-e, --exclude <glob>', '제외할 파일 glob (반복 가능)', collect)
    .option('-l, --language <lang>', '특정 언어만 (예: typescript, ts)')
    .option('-d, --depth <n>', '스캔할 최대 디렉토리 깊이 (0 = 루트 파일만)', parseDepth)
    .option('-o, --output <file>', '결과를 JSON 파일로 저장')
    .option('--json', 'JSON 형식 출력')
    .action(handleScan);

  reverse
    .command('review [ref]')
    .description('초안 목록/상세 보기, 승인 또는 거부')
    .option('--list', '초안 목록 (모든 상태, 검증 결과 포함)')
    .option('--approve', '초안 승인 (검증 에러가 없어야 함)')
    .option('--reject', '초안 거부')
    .option('--reason <reason>', '거부 사유')
    .action(handleReview);

  reverse
    .command('finalize [ref]')
    .description('승인된 초안을 .sdd/specs/<domain>/<feature>/spec.md로 확정')
    .option('-a, --all', '모든 승인 초안 확정 (기본 동작)')
    .option('-f, --force', '기존 스펙 덮어쓰기')
    .action(handleFinalize);
}
