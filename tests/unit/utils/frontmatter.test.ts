/**
 * 안전한 frontmatter 파서 테스트
 */
import { describe, it, expect, afterEach } from 'vitest';
import { parseFrontmatter } from '../../../src/utils/frontmatter.js';
import { parseSpec } from '../../../src/core/spec/parser.js';

const g = globalThis as Record<string, unknown>;

function jsPayload(lang: string): string {
  return `---${lang}
{ title: (globalThis.__SDD_PWNED__ = true, "t") }
---

# Evil
`;
}

describe('parseFrontmatter', () => {
  afterEach(() => {
    delete g.__SDD_PWNED__;
  });

  it('YAML frontmatter를 정상 파싱한다', () => {
    const result = parseFrontmatter('---\ntitle: hello\nversion: 2\n---\n\n# Body\n');
    expect(result.data).toEqual({ title: 'hello', version: 2 });
    expect(result.content.trim()).toBe('# Body');
  });

  it('JSON frontmatter는 허용한다', () => {
    const result = parseFrontmatter('---json\n{ "title": "hi" }\n---\nbody');
    expect(result.data).toEqual({ title: 'hi' });
  });

  it.each(['js', 'javascript', 'JS', 'coffee', 'coffeescript', 'cson'])(
    '---%s frontmatter는 실행하지 않고 거부한다',
    (lang) => {
      expect(() => parseFrontmatter(jsPayload(lang))).toThrow(/지원하지 않는 frontmatter/);
      expect(g.__SDD_PWNED__).toBeUndefined();
    }
  );

  it('parseSpec은 ---js frontmatter를 실행하지 않고 실패를 반환한다', () => {
    const result = parseSpec(jsPayload('js'));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/지원하지 않는 frontmatter/);
    }
    expect(g.__SDD_PWNED__).toBeUndefined();
  });
});
