/**
 * sdd search 명령어 - 스펙 검색
 */
import { Command } from 'commander';
import path from 'node:path';
import { logger } from '../../utils/index.js';
import { fileExists } from '../../utils/fs.js';
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

/**
 * CLI 옵션을 SearchOptions로 변환
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
    searchOptions.status = options.status.includes(',')
      ? options.status.split(',').map((s) => s.trim())
      : options.status;
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
    searchOptions.createdAfter = options.createdAfter;
  }

  if (options.createdBefore) {
    searchOptions.createdBefore = options.createdBefore;
  }

  if (options.updatedAfter) {
    searchOptions.updatedAfter = options.updatedAfter;
  }

  if (options.updatedBefore) {
    searchOptions.updatedBefore = options.updatedBefore;
  }

  if (options.dependsOn) {
    searchOptions.dependsOn = options.dependsOn;
  }

  if (options.limit) {
    const limit = parseInt(options.limit, 10);
    if (!isNaN(limit) && limit > 0) {
      searchOptions.limit = limit;
    }
  }

  if (options.sortBy) {
    const validSortBy = ['relevance', 'created', 'updated', 'title', 'status'];
    if (validSortBy.includes(options.sortBy)) {
      searchOptions.sortBy = options.sortBy as SearchOptions['sortBy'];
    }
  }

  if (options.sortOrder) {
    if (options.sortOrder === 'asc' || options.sortOrder === 'desc') {
      searchOptions.sortOrder = options.sortOrder;
    }
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
    .option('--status <status>', '상태 필터 (콤마로 구분)')
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
  const sddPath = path.join(process.cwd(), '.sdd');

  if (!(await fileExists(sddPath))) {
    logger.error('.sdd 디렉토리가 없습니다. sdd init을 먼저 실행하세요.');
    return;
  }

  const searchOptions = parseSearchCliOptions(query, options);
  const result = await searchSpecs(sddPath, searchOptions);

  if (!result.success) {
    logger.error(`검색 실패: ${result.error.message}`);
    return;
  }

  if (options.json) {
    console.log(formatSearchResultJson(result.data));
  } else {
    console.log('');
    console.log(formatSearchResult(result.data));
  }
}
