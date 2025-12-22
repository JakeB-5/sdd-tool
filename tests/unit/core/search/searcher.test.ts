/**
 * 검색 모듈 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  searchSpecs,
  formatSearchResult,
  formatSearchResultJson,
} from '../../../../src/core/search/searcher.js';

describe('searchSpecs', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-search-test-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙 디렉토리가 없으면 에러를 반환한다', async () => {
    await fs.rm(specsDir, { recursive: true });
    const result = await searchSpecs(tempDir);

    expect(result.success).toBe(false);
  });

  it('쿼리 없이 모든 스펙을 반환한다', async () => {
    await createSpec(specsDir, 'spec-1', {
      title: '첫번째 스펙',
      status: 'draft',
    });
    await createSpec(specsDir, 'spec-2', {
      title: '두번째 스펙',
      status: 'approved',
    });

    const result = await searchSpecs(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(2);
      expect(result.data.items).toHaveLength(2);
    }
  });

  it('키워드로 검색한다', async () => {
    await createSpec(specsDir, 'auth-spec', {
      title: '인증 스펙',
      status: 'draft',
      content: '사용자 인증 기능',
    });
    await createSpec(specsDir, 'user-spec', {
      title: '사용자 스펙',
      status: 'draft',
      content: '사용자 관리 기능',
    });

    const result = await searchSpecs(tempDir, { query: '인증' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.items[0].id).toBe('auth-spec');
    }
  });

  it('정규식으로 검색한다', async () => {
    await createSpec(specsDir, 'spec-a', {
      title: 'API 스펙',
      status: 'draft',
    });
    await createSpec(specsDir, 'spec-b', {
      title: 'UI 스펙',
      status: 'draft',
    });

    const result = await searchSpecs(tempDir, {
      query: 'A.I',
      regex: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.items[0].id).toBe('spec-a');
    }
  });

  it('상태별로 필터링한다', async () => {
    await createSpec(specsDir, 'draft-spec', {
      title: '초안 스펙',
      status: 'draft',
    });
    await createSpec(specsDir, 'approved-spec', {
      title: '승인된 스펙',
      status: 'approved',
    });

    const result = await searchSpecs(tempDir, { status: 'draft' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.items[0].status).toBe('draft');
    }
  });

  it('여러 상태로 필터링한다', async () => {
    await createSpec(specsDir, 'draft-spec', {
      title: '초안 스펙',
      status: 'draft',
    });
    await createSpec(specsDir, 'review-spec', {
      title: '검토 스펙',
      status: 'review',
    });
    await createSpec(specsDir, 'approved-spec', {
      title: '승인된 스펙',
      status: 'approved',
    });

    const result = await searchSpecs(tempDir, { status: ['draft', 'review'] });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(2);
    }
  });

  it('Phase별로 필터링한다', async () => {
    await createSpec(specsDir, 'phase1-spec', {
      title: 'Phase 1 스펙',
      status: 'draft',
      phase: 'phase1',
    });
    await createSpec(specsDir, 'phase2-spec', {
      title: 'Phase 2 스펙',
      status: 'draft',
      phase: 'phase2',
    });

    const result = await searchSpecs(tempDir, { phase: 'phase1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.items[0].phase).toBe('phase1');
    }
  });

  it('작성자로 필터링한다', async () => {
    await createSpec(specsDir, 'john-spec', {
      title: 'John 스펙',
      status: 'draft',
      author: 'John Doe',
    });
    await createSpec(specsDir, 'jane-spec', {
      title: 'Jane 스펙',
      status: 'draft',
      author: 'Jane Smith',
    });

    const result = await searchSpecs(tempDir, { author: 'John' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.items[0].author).toBe('John Doe');
    }
  });

  it('태그로 필터링한다', async () => {
    await createSpec(specsDir, 'tagged-spec', {
      title: '태그된 스펙',
      status: 'draft',
      tags: 'api, auth',
    });
    await createSpec(specsDir, 'untagged-spec', {
      title: '태그 없는 스펙',
      status: 'draft',
    });

    const result = await searchSpecs(tempDir, { tags: ['api'] });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.items[0].id).toBe('tagged-spec');
    }
  });

  it('의존성으로 필터링한다', async () => {
    await createSpec(specsDir, 'base-spec', {
      title: '기본 스펙',
      status: 'draft',
    });
    await createSpec(specsDir, 'dependent-spec', {
      title: '의존 스펙',
      status: 'draft',
      depends: 'base-spec',
    });

    const result = await searchSpecs(tempDir, { dependsOn: 'base-spec' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.items[0].id).toBe('dependent-spec');
    }
  });

  it('결과 수를 제한한다', async () => {
    for (let i = 1; i <= 5; i++) {
      await createSpec(specsDir, `spec-${i}`, {
        title: `스펙 ${i}`,
        status: 'draft',
      });
    }

    const result = await searchSpecs(tempDir, { limit: 3 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(3);
    }
  });

  it('관련도순으로 정렬한다', async () => {
    await createSpec(specsDir, 'high-score', {
      title: '인증 인증 인증',
      status: 'draft',
      content: '인증 기능 인증',
    });
    await createSpec(specsDir, 'low-score', {
      title: '기타 스펙',
      status: 'draft',
      content: '인증 기능',
    });

    const result = await searchSpecs(tempDir, {
      query: '인증',
      sortBy: 'relevance',
      sortOrder: 'desc',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].id).toBe('high-score');
      expect(result.data.items[0].score).toBeGreaterThan(result.data.items[1].score);
    }
  });

  it('제목순으로 정렬한다', async () => {
    await createSpec(specsDir, 'z-spec', {
      title: 'Z 스펙',
      status: 'draft',
    });
    await createSpec(specsDir, 'a-spec', {
      title: 'A 스펙',
      status: 'draft',
    });

    const result = await searchSpecs(tempDir, {
      sortBy: 'title',
      sortOrder: 'asc',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].title).toBe('A 스펙');
    }
  });

  it('대소문자 구분 검색을 지원한다', async () => {
    await createSpec(specsDir, 'case-spec', {
      title: 'API Spec',
      status: 'draft',
      content: 'This is API content',
    });

    const caseInsensitive = await searchSpecs(tempDir, {
      query: 'api',
      caseSensitive: false,
    });

    const caseSensitive = await searchSpecs(tempDir, {
      query: 'api',
      caseSensitive: true,
    });

    expect(caseInsensitive.success).toBe(true);
    expect(caseSensitive.success).toBe(true);
    if (caseInsensitive.success && caseSensitive.success) {
      expect(caseInsensitive.data.totalCount).toBe(1);
      expect(caseSensitive.data.totalCount).toBe(0);
    }
  });

  it('생성일로 필터링한다', async () => {
    await createSpec(specsDir, 'old-spec', {
      title: '오래된 스펙',
      status: 'draft',
      created: '2024-01-01',
    });
    await createSpec(specsDir, 'new-spec', {
      title: '새로운 스펙',
      status: 'draft',
      created: '2024-12-01',
    });

    const result = await searchSpecs(tempDir, {
      createdAfter: '2024-06-01',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.items[0].id).toBe('new-spec');
    }
  });

  it('하위 디렉토리의 스펙도 검색한다', async () => {
    await fs.mkdir(path.join(specsDir, 'subdir'), { recursive: true });
    await createSpec(path.join(specsDir, 'subdir'), 'nested-spec', {
      title: '중첩된 스펙',
      status: 'draft',
    });

    const result = await searchSpecs(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
    }
  });

  it('잘못된 정규식은 리터럴 검색으로 폴백한다', async () => {
    await createSpec(specsDir, 'bracket-spec', {
      title: '괄호[테스트] 스펙',
      status: 'draft',
    });

    const result = await searchSpecs(tempDir, {
      query: '[테스트]',
      regex: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
    }
  });

  it('매칭 컨텍스트를 제공한다', async () => {
    await createSpec(specsDir, 'context-spec', {
      title: '컨텍스트 스펙',
      status: 'draft',
      content: '첫번째 줄\n키워드가 포함된 줄\n세번째 줄',
    });

    const result = await searchSpecs(tempDir, { query: '키워드' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].matches).toBeDefined();
      expect(result.data.items[0].matches!.length).toBeGreaterThan(0);
      expect(result.data.items[0].matches![0].content).toContain('**키워드**');
    }
  });

  it('검색 소요 시간을 반환한다', async () => {
    await createSpec(specsDir, 'time-spec', {
      title: '시간 스펙',
      status: 'draft',
    });

    const result = await searchSpecs(tempDir, { query: '시간' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('formatSearchResult', () => {
  it('검색 결과를 포맷팅한다', () => {
    const result = {
      query: '테스트',
      options: {},
      totalCount: 1,
      items: [
        {
          id: 'test-spec',
          path: 'test-spec/spec.md',
          title: '테스트 스펙',
          status: 'draft',
          phase: 'phase1',
          score: 75,
          matches: [
            {
              line: 5,
              content: '**테스트** 내용',
              original: '테스트 내용',
            },
          ],
        },
      ],
      duration: 50,
    };

    const formatted = formatSearchResult(result);

    expect(formatted).toContain('검색 결과: "테스트"');
    expect(formatted).toContain('1개 발견');
    expect(formatted).toContain('test-spec');
    expect(formatted).toContain('draft');
    expect(formatted).toContain('phase1');
  });

  it('검색 결과가 없을 때 메시지를 표시한다', () => {
    const result = {
      query: '없는쿼리',
      options: {},
      totalCount: 0,
      items: [],
      duration: 10,
    };

    const formatted = formatSearchResult(result);

    expect(formatted).toContain('검색 결과가 없습니다');
  });

  it('상태 아이콘을 표시한다', () => {
    const result = {
      query: '*',
      options: {},
      totalCount: 1,
      items: [
        {
          id: 'implemented-spec',
          path: 'implemented-spec/spec.md',
          status: 'implemented',
          phase: 'phase1',
          score: 100,
        },
      ],
      duration: 10,
    };

    const formatted = formatSearchResult(result);
    expect(formatted).toContain('🚀');
  });
});

describe('formatSearchResultJson', () => {
  it('JSON 형식으로 반환한다', () => {
    const result = {
      query: '테스트',
      options: {},
      totalCount: 1,
      items: [
        {
          id: 'test-spec',
          path: 'test-spec/spec.md',
          score: 50,
        },
      ],
      duration: 25,
    };

    const json = formatSearchResultJson(result);
    const parsed = JSON.parse(json);

    expect(parsed.query).toBe('테스트');
    expect(parsed.totalCount).toBe(1);
    expect(parsed.items[0].id).toBe('test-spec');
  });
});

/**
 * 테스트용 스펙 생성
 */
async function createSpec(
  basePath: string,
  id: string,
  options: {
    title?: string;
    status?: string;
    phase?: string;
    author?: string;
    created?: string;
    depends?: string;
    tags?: string;
    content?: string;
  }
): Promise<void> {
  const specDir = path.join(basePath, id);
  await fs.mkdir(specDir, { recursive: true });

  const frontmatter = [
    '---',
    `id: ${id}`,
    `title: "${options.title || id}"`,
    `status: ${options.status || 'draft'}`,
  ];

  if (options.phase) {
    frontmatter.push(`phase: ${options.phase}`);
  }

  if (options.author) {
    frontmatter.push(`author: "${options.author}"`);
  }

  if (options.created) {
    frontmatter.push(`created: ${options.created}`);
  }

  if (options.depends) {
    frontmatter.push(`depends: ${options.depends}`);
  }

  if (options.tags) {
    frontmatter.push(`tags: ${options.tags}`);
  }

  frontmatter.push('---', '');

  const content = options.content
    ? `# ${options.title || id}\n\n${options.content}`
    : `# ${options.title || id}\n\n시스템은 기능을 제공해야 한다(SHALL).`;

  await fs.writeFile(
    path.join(specDir, 'spec.md'),
    frontmatter.join('\n') + '\n' + content
  );
}
