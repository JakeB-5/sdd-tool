/**
 * search 명령어 테스트
 */
import { describe, it, expect } from 'vitest';
import { parseSearchCliOptions } from '../../../../src/cli/commands/search.js';

describe('parseSearchCliOptions', () => {
  it('쿼리를 파싱한다', () => {
    const result = parseSearchCliOptions('테스트', {});
    expect(result.query).toBe('테스트');
  });

  it('상태 필터를 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { status: 'draft' });
    expect(result.status).toBe('draft');
  });

  it('여러 상태를 배열로 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { status: 'draft,review' });
    expect(result.status).toEqual(['draft', 'review']);
  });

  it('Phase 필터를 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { phase: 'phase1' });
    expect(result.phase).toBe('phase1');
  });

  it('여러 Phase를 배열로 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { phase: 'phase1,phase2' });
    expect(result.phase).toEqual(['phase1', 'phase2']);
  });

  it('작성자 필터를 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { author: 'John' });
    expect(result.author).toBe('John');
  });

  it('태그 필터를 배열로 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { tags: 'api,auth' });
    expect(result.tags).toEqual(['api', 'auth']);
  });

  it('날짜 필터를 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, {
      createdAfter: '2024-01-01',
      createdBefore: '2024-12-31',
      updatedAfter: '2024-06-01',
      updatedBefore: '2024-12-31',
    });
    expect(result.createdAfter).toBe('2024-01-01');
    expect(result.createdBefore).toBe('2024-12-31');
    expect(result.updatedAfter).toBe('2024-06-01');
    expect(result.updatedBefore).toBe('2024-12-31');
  });

  it('의존성 필터를 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { dependsOn: 'base-spec' });
    expect(result.dependsOn).toBe('base-spec');
  });

  it('limit을 숫자로 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { limit: '10' });
    expect(result.limit).toBe(10);
  });

  it('잘못된 limit은 무시한다', () => {
    const result = parseSearchCliOptions(undefined, { limit: 'abc' });
    expect(result.limit).toBeUndefined();
  });

  it('음수 limit은 무시한다', () => {
    const result = parseSearchCliOptions(undefined, { limit: '-5' });
    expect(result.limit).toBeUndefined();
  });

  it('정렬 기준을 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { sortBy: 'created' });
    expect(result.sortBy).toBe('created');
  });

  it('잘못된 정렬 기준은 무시한다', () => {
    const result = parseSearchCliOptions(undefined, { sortBy: 'invalid' });
    expect(result.sortBy).toBeUndefined();
  });

  it('정렬 방향을 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { sortOrder: 'asc' });
    expect(result.sortOrder).toBe('asc');
  });

  it('잘못된 정렬 방향은 무시한다', () => {
    const result = parseSearchCliOptions(undefined, { sortOrder: 'invalid' });
    expect(result.sortOrder).toBeUndefined();
  });

  it('정규식 옵션을 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { regex: true });
    expect(result.regex).toBe(true);
  });

  it('대소문자 구분 옵션을 파싱한다', () => {
    const result = parseSearchCliOptions(undefined, { caseSensitive: true });
    expect(result.caseSensitive).toBe(true);
  });

  it('여러 옵션을 동시에 파싱한다', () => {
    const result = parseSearchCliOptions('인증', {
      status: 'draft',
      phase: 'phase1',
      author: 'John',
      tags: 'api,auth',
      limit: '5',
      sortBy: 'relevance',
      sortOrder: 'desc',
      regex: false,
      caseSensitive: false,
    });

    expect(result.query).toBe('인증');
    expect(result.status).toBe('draft');
    expect(result.phase).toBe('phase1');
    expect(result.author).toBe('John');
    expect(result.tags).toEqual(['api', 'auth']);
    expect(result.limit).toBe(5);
    expect(result.sortBy).toBe('relevance');
    expect(result.sortOrder).toBe('desc');
  });
});
