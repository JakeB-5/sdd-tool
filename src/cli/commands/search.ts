/**
 * sdd search 명령어 - 스펙 검색
 */
import { Command } from 'commander';
import path from 'node:path';
import { logger } from '../../utils/index.js';
import { findSddRoot } from '../../utils/fs.js';
import { ExitCode } from '../../errors/index.js';
import { SPEC_STATUSES, normalizeSpecStatus } from '../../core/spec/status.js';
import {
  searchSpecs,
  formatSearchResult,
  formatSearchResultJson,
  SearchOptions,
} from '../../core/search/index.js';

/**
 * CLI 검색 옵션
 */
export interface SearchCliOptions {
  status?: string;
  phase?: string;
  author?: string;
  tags?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  dependsOn?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  regex?: boolean;
  caseSensitive?: boolean;
  json?: boolean;
}

const SORT_FIELDS = ['relevance', 'created', 'updated', 'title', 'status'] as const;

/**
 * 잘못된 검색 옵션 에러
 */
export class SearchOptionError extends Error {}

/**
 * YYYY-MM-DD 형식의 유효한 날짜인지 확인
 */
function assertDateOption(flag: string, value: string): void {
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
  if (!valid) {
    throw new SearchOptionError(`${flag} 값이 올바른 날짜(YYYY-MM-DD)가 아닙니다: ${value}`);
  }
}

/**
 * CLI 옵션을 SearchOptions로 변환
 *
 * @throws SearchOptionError when an option value is invalid
 */
export function parseSearchCliOptions(
  query: string | undefined,
  options: SearchCliOptions
): SearchOptions {
  const searchOptions: SearchOptions = {};

  if (query) {
    searchOptions.query = query;
  }

  if (options.status) {
    const statuses = options.status.split(',').map((s) => s.trim()).filter(Boolean);
    const invalid = statuses.filter((s) => !normalizeSpecStatus(s));
    if (invalid.length > 0) {
      throw new SearchOptionError(
        `알 수 없는 상태: ${invalid.join(', ')} (사용 가능: ${SPEC_STATUSES.join(', ')})`
      );
    }
    searchOptions.status = statuses.length > 1 ? statuses : statuses[0];
  }

  if (options.phase) {
    searchOptions.phase = options.phase.includes(',')
      ? options.phase.split(',').map((p) => p.trim())
      : options.phase;
  }

  if (options.author) {
    searchOptions.author = options.author;
  }

  if (options.tags) {
    searchOptions.tags = options.tags.split(',').map((t) => t.trim());
  }

  if (options.createdAfter) {
    assertDateOption('--created-after', options.createdAfter);
    searchOptions.createdAfter = options.createdAfter;
  }

  if (options.createdBefore) {
    assertDateOption('--created-before', options.createdBefore);
    searchOptions.createdBefore = options.createdBefore;
  }

  if (options.updatedAfter) {
    assertDateOption('--updated-after', options.updatedAfter);
    searchOptions.updatedAfter = options.updatedAfter;
  }

  if (options.updatedBefore) {
    assertDateOption('--updated-before', options.updatedBefore);
    searchOptions.updatedBefore = options.updatedBefore;
  }

  if (options.dependsOn) {
    searchOptions.dependsOn = options.dependsOn;
  }

  if (options.limit !== undefined) {
    const limit = Number(options.limit);
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new SearchOptionError(`--limit 값은 양의 정수여야 합니다: ${options.limit}`);
    }
    searchOptions.limit = limit;
  }

  if (options.sortBy) {
    if (!(SORT_FIELDS as readonly string[]).includes(options.sortBy)) {
      throw new SearchOptionError(
        `알 수 없는 정렬 기준: ${options.sortBy} (사용 가능: ${SORT_FIELDS.join(', ')})`
      );
    }
    searchOptions.sortBy = options.sortBy as SearchOptions['sortBy'];
  }

  if (options.sortOrder) {
    if (options.sortOrder !== 'asc' && options.sortOrder !== 'desc') {
      throw new SearchOptionError(`알 수 없는 정렬 방향: ${options.sortOrder} (asc, desc 중 선택)`);
    }
    searchOptions.sortOrder = options.sortOrder;
  }

  if (options.regex) {
    searchOptions.regex = true;
  }

  if (options.caseSensitive) {
    searchOptions.caseSensitive = true;
  }

  return searchOptions;
}

/**
 * search 명령어 등록
 */
export function registerSearchCommand(program: Command): void {
  program
    .command('search [query]')
    .description('스펙 검색')
    .option('--status <status>', `상태 필터 (콤마로 구분: ${SPEC_STATUSES.join(', ')})`)
    .option('--phase <phase>', 'Phase 필터 (콤마로 구분)')
    .option('--author <author>', '작성자 필터')
    .option('--tags <tags>', '태그 필터 (콤마로 구분)')
    .option('--created-after <date>', '생성일 이후 (YYYY-MM-DD)')
    .option('--created-before <date>', '생성일 이전 (YYYY-MM-DD)')
    .option('--updated-after <date>', '수정일 이후 (YYYY-MM-DD)')
    .option('--updated-before <date>', '수정일 이전 (YYYY-MM-DD)')
    .option('--depends-on <specId>', '의존성 필터')
    .option('--limit <n>', '결과 제한 수')
    .option('--sort-by <field>', '정렬 기준 (relevance, created, updated, title, status)')
    .option('--sort-order <order>', '정렬 방향 (asc, desc)')
    .option('-r, --regex', '정규식 검색')
    .option('-c, --case-sensitive', '대소문자 구분')
    .option('--json', 'JSON 형식으로 출력')
    .action(async (query: string | undefined, options: SearchCliOptions) => {
      await executeSearch(query, options);
    });
}

/**
 * 검색 실행 (CLI 래퍼)
 */
export async function executeSearch(
  query: string | undefined,
  options: SearchCliOptions
): Promise<void> {
  const projectRoot = await findSddRoot();

  if (!projectRoot) {
    logger.error('.sdd 디렉토리가 없습니다. sdd init을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');

  let searchOptions: SearchOptions;
  try {
    searchOptions = parseSearchCliOptions(query, options);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const result = await searchSpecs(sddPath, searchOptions);

  if (!result.success) {
    logger.error(`검색 실패: ${result.error.message}`);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  if (options.json) {
    console.log(formatSearchResultJson(result.data));
  } else {
    console.log('');
    console.log(formatSearchResult(result.data));
  }
}
