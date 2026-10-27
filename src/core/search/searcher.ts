/**
 * 스펙 검색 모듈
 */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { Result, success, failure } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { directoryExists } from '../../utils/fs.js';
import { listSpecs } from '../spec/locator.js';
import { getSpecStatusIcon, normalizeSpecStatus } from '../spec/status.js';
import { normalizeLineEndings, readFrontmatter } from '../../utils/frontmatter.js';
import {
  SearchOptions,
  SearchResult,
  SearchResultItem,
  SearchMatch,
  SearchIndexItem,
} from './schemas.js';

/**
 * 스펙 검색 실행
 */
export async function searchSpecs(
  sddPath: string,
  options: SearchOptions = {}
): Promise<Result<SearchResult, ChangeError>> {
  const startTime = Date.now();

  try {
    const specsPath = path.join(sddPath, 'specs');

    if (!(await directoryExists(specsPath))) {
      return failure(new ChangeError('스펙 디렉토리를 찾을 수 없습니다.'));
    }

    // 스펙 인덱스 구축
    const indexResult = await buildSearchIndex(sddPath);
    if (!indexResult.success) {
      return failure(indexResult.error);
    }

    const index = indexResult.data;

    // 검색 실행
    const filtered = filterByOptions(index, options);

    // 전문 검색
    let results: SearchResultItem[];
    if (options.query) {
      results = searchByQuery(filtered, options.query, options);
    } else {
      // 쿼리가 없으면 기본 점수 부여
      results = filtered.map((item) => ({ ...item, score: 100, matches: [] }));
    }

    // 정렬
    results = sortResults(results, options);

    // 제한
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    const duration = Date.now() - startTime;

    return success({
      query: options.query || '*',
      options,
      totalCount: results.length,
      items: results,
      duration,
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `검색 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * 검색 인덱스 구축
 */
async function buildSearchIndex(
  sddPath: string
): Promise<Result<SearchIndexItem[], ChangeError>> {
  try {
    const index: SearchIndexItem[] = [];
    await collectSpecs(sddPath, index);
    return success(index);
  } catch (error) {
    return failure(
      new ChangeError(
        `인덱스 구축 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * 스펙 파일 수집 (spec locator 기반, 도메인/평면 레이아웃 모두)
 */
async function collectSpecs(
  sddPath: string,
  index: SearchIndexItem[]
): Promise<void> {
  const specsPath = path.join(sddPath, 'specs');

  for (const location of await listSpecs(sddPath)) {
    const fullPath = location.specPath;
    const content = normalizeLineEndings(await fs.readFile(fullPath, 'utf-8'));
    const metadata = readFrontmatter(content).data;
    const stat = await fs.stat(fullPath);

    index.push({
      id: location.id,
      path: path.relative(specsPath, fullPath),
      title: String(metadata.title || location.id),
      content,
      status: normalizeSpecStatus(metadata.status) ?? String(metadata.status || 'unknown'),
      phase: String(metadata.phase || 'unknown'),
      author: String(metadata.author || ''),
      created: String(metadata.created || ''),
      updated: String(metadata.updated || stat.mtime.toISOString().split('T')[0]),
      depends: parseDependencies(metadata.depends),
      tags: parseTags(metadata.tags),
    });
  }
}

/**
 * 의존성 파싱
 */
function parseDependencies(depends: unknown): string[] {
  if (!depends) return [];
  if (Array.isArray(depends)) return depends.filter(Boolean).map(String);
  if (typeof depends === 'string' && depends !== 'null') {
    return depends.split(',').map((d) => d.trim()).filter(Boolean);
  }
  return [];
}

/**
 * 태그 파싱
 */
function parseTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean).map(String);
  if (typeof tags === 'string') {
    return tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

/**
 * 옵션으로 필터링
 */
function filterByOptions(
  index: SearchIndexItem[],
  options: SearchOptions
): SearchIndexItem[] {
  return index.filter((item) => {
    // 상태 필터
    if (options.status) {
      const statuses = (Array.isArray(options.status)
        ? options.status
        : [options.status]
      ).map((s) => normalizeSpecStatus(s) ?? s);
      if (!statuses.includes(item.status)) return false;
    }

    // Phase 필터
    if (options.phase) {
      const phases = Array.isArray(options.phase)
        ? options.phase
        : [options.phase];
      if (!phases.includes(item.phase)) return false;
    }

    // 작성자 필터
    if (options.author) {
      if (
        !item.author.toLowerCase().includes(options.author.toLowerCase())
      ) {
        return false;
      }
    }

    // 생성일 필터 (생성일이 없는 스펙은 날짜 필터와 일치하지 않음)
    if (options.createdAfter || options.createdBefore) {
      if (!item.created) return false;
      if (options.createdAfter && item.created < options.createdAfter) return false;
      if (options.createdBefore && item.created > options.createdBefore) return false;
    }

    // 수정일 필터
    if (options.updatedAfter && item.updated) {
      if (item.updated < options.updatedAfter) return false;
    }
    if (options.updatedBefore && item.updated) {
      if (item.updated > options.updatedBefore) return false;
    }

    // 의존성 필터
    if (options.dependsOn) {
      if (!item.depends.includes(options.dependsOn)) return false;
    }

    // 태그 필터
    if (options.tags && options.tags.length > 0) {
      const hasTag = options.tags.some((tag) =>
        item.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
      if (!hasTag) return false;
    }

    return true;
  });
}

/**
 * 전문 검색 실행
 */
function searchByQuery(
  items: SearchIndexItem[],
  query: string,
  options: SearchOptions
): SearchResultItem[] {
  const results: SearchResultItem[] = [];

  let pattern: RegExp;
  try {
    if (options.regex) {
      pattern = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
    } else {
      // 일반 검색: 특수문자 이스케이프
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(escaped, options.caseSensitive ? 'g' : 'gi');
    }
  } catch {
    // 잘못된 정규식: 리터럴 검색으로 폴백
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pattern = new RegExp(escaped, 'gi');
  }

  for (const item of items) {
    const matches: SearchMatch[] = [];
    let score = 0;

    // 제목 매칭 (높은 점수)
    if (pattern.test(item.title)) {
      score += 50;
      pattern.lastIndex = 0;
    }

    // ID 매칭
    if (pattern.test(item.id)) {
      score += 30;
      pattern.lastIndex = 0;
    }

    // 내용 매칭
    const lines = item.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      pattern.lastIndex = 0;

      if (pattern.test(line)) {
        score += 10;
        const highlighted = line.replace(
          pattern,
          (match) => `**${match}**`
        );
        matches.push({
          line: i + 1,
          content: highlighted.trim(),
          original: line.trim(),
        });
      }
    }

    // 점수가 있으면 결과에 추가
    if (score > 0) {
      results.push({
        id: item.id,
        path: item.path,
        title: item.title,
        status: item.status,
        phase: item.phase,
        author: item.author || undefined,
        created: item.created || undefined,
        updated: item.updated || undefined,
        depends: item.depends.length > 0 ? item.depends : undefined,
        tags: item.tags.length > 0 ? item.tags : undefined,
        score: Math.min(100, score),
        matches: matches.slice(0, 5), // 최대 5개 매칭 컨텍스트
      });
    }
  }

  return results;
}

/**
 * 결과 정렬
 */
function sortResults(
  results: SearchResultItem[],
  options: SearchOptions
): SearchResultItem[] {
  const sortBy = options.sortBy || 'relevance';
  const sortOrder = options.sortOrder || 'desc';

  return [...results].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'relevance':
        comparison = a.score - b.score;
        break;
      case 'created':
        comparison = (a.created || '').localeCompare(b.created || '');
        break;
      case 'updated':
        comparison = (a.updated || '').localeCompare(b.updated || '');
        break;
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      default:
        comparison = a.score - b.score;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

/**
 * 검색 결과 포맷팅
 */
export function formatSearchResult(result: SearchResult): string {
  const lines: string[] = [];

  lines.push(`🔍 검색 결과: "${result.query}"`);
  lines.push(`   ${result.totalCount}개 발견 (${result.duration}ms)`);
  lines.push('');

  if (result.items.length === 0) {
    lines.push('   검색 결과가 없습니다.');
    return lines.join('\n');
  }

  for (const item of result.items) {
    const statusIcon = getStatusIcon(item.status);
    const scoreBar = getScoreBar(item.score);

    lines.push(`${statusIcon} ${item.id}`);
    if (item.title && item.title !== item.id) {
      lines.push(`   제목: ${item.title}`);
    }
    lines.push(`   상태: ${item.status || 'unknown'} | Phase: ${item.phase || 'unknown'} | 점수: ${scoreBar}`);

    if (item.matches && item.matches.length > 0) {
      lines.push('   매칭:');
      for (const match of item.matches.slice(0, 3)) {
        const truncated =
          match.content.length > 60
            ? match.content.slice(0, 60) + '...'
            : match.content;
        lines.push(`     L${match.line}: ${truncated}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 상태 아이콘
 */
function getStatusIcon(status?: string): string {
  return getSpecStatusIcon(status);
}

/**
 * 점수 바
 */
function getScoreBar(score: number): string {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${score}%`;
}

/**
 * JSON 형식 출력
 */
export function formatSearchResultJson(result: SearchResult): string {
  return JSON.stringify(result, null, 2);
}
