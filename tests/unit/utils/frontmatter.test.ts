/**
 * 안전한 frontmatter 파서 테스트
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  parseFrontmatter,
  readFrontmatter,
  updateFrontmatter,
  detectFrontmatter,
} from '../../../src/utils/frontmatter.js';
import { parseSpec } from '../../../src/core/spec/parser.js';
import { updateSpecStatus } from '../../../src/core/new/spec-generator.js';
import { updatePlanStatus } from '../../../src/core/new/plan-generator.js';

const UNCLOSED = '---\nstatus: draft\ncreated: 2025-01-01\n\n# Title\n## Section\n';

describe('frontmatter 블록 감지와 안전한 재작성', () => {
  it('닫는 구분자가 없으면 frontmatter로 취급하지 않는다', () => {
    expect(detectFrontmatter(UNCLOSED)).toBe('unclosed');
    const doc = readFrontmatter(UNCLOSED);
    expect(doc.hasFrontmatter).toBe(false);
    expect(doc.malformed).toBe(true);
    expect(doc.data).toEqual({});
    expect(doc.body).toBe(UNCLOSED);
  });

  it('빈 frontmatter와 파일 끝의 닫는 구분자를 인식한다', () => {
    expect(detectFrontmatter('---\n---\n# T\n')).toBe('closed');
    expect(detectFrontmatter('---\na: 1\n---')).toBe('closed');
    expect(detectFrontmatter('# T\n')).toBe('none');
  });

  it('재작성 함수는 닫히지 않은 frontmatter의 본문을 지우지 않고 실패한다', () => {
    expect(() => updateFrontmatter(UNCLOSED, { status: 'review' })).toThrow(/닫는 구분자/);
    expect(() => updateSpecStatus(UNCLOSED, 'review')).toThrow(/닫는 구분자/);
    expect(() => updatePlanStatus(UNCLOSED, 'approved')).toThrow(/닫는 구분자/);
  });

  it('재작성 시 version 스칼라·주석·따옴표·본문을 그대로 보존한다', () => {
    const content = '---\nid: a # comment\nversion: 1.0\nconstitution_version: 1.10\ntitle: "Q: x"\nstatus: draft\n---\n\n# T\n본문\n';
    const updated = updateSpecStatus(content, 'implemented');
    expect(updated).toContain('version: 1.0\n');
    expect(updated).toContain('constitution_version: 1.10\n');
    expect(updated).toContain('id: a # comment');
    expect(updated).toContain('title: "Q: x"');
    expect(updated).toContain('status: implemented');
    expect(updated).toMatch(/\n---\n\n# T\n본문\n$/);
  });

  it('재작성 시 flow 시퀀스·맵 서식에 공백을 추가하지 않는다', () => {
    const content =
      '---\nid: cart\nstatus: draft\ndepends: [pricing/cart, pricing/coupon]\nempty: []\nmeta: {owner: a}\nblock:\n  - x\n---\n# T\n';
    const updated = updateFrontmatter(content, { status: 'review' });
    expect(updated).toBe(
      '---\nid: cart\nstatus: review\ndepends: [pricing/cart, pricing/coupon]\nempty: []\nmeta: {owner: a}\nblock:\n  - x\n---\n# T\n'
    );
  });

  it('빈 frontmatter 블록에도 필드를 추가한다', () => {
    expect(updateFrontmatter('---\n---\n# T\n', { status: 'draft' })).toBe('---\nstatus: draft\n---\n# T\n');
  });
});

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
