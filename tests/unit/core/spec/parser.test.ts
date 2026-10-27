/**
 * 스펙 파서 테스트
 */
import { describe, it, expect } from 'vitest';
import { parseSpec, validateSpecFormat, findTemplatePlaceholders } from '../../../../src/core/spec/parser.js';

const VALID_SPEC = `---
status: draft
created: 2025-12-21
depends: null
---

# 테스트 스펙

> 테스트를 위한 스펙 문서

---

## Requirement: 기본 요구사항

시스템은 사용자 인증을 지원해야 한다(SHALL).

### Scenario: 로그인 성공

- **GIVEN** 사용자가 로그인 페이지에 있을 때
- **WHEN** 올바른 자격증명을 입력하면
- **THEN** 홈페이지로 이동한다
`;

const SPEC_WITHOUT_RFC = `---
status: draft
---

# 테스트 스펙

> 설명

## Requirement: 요구사항

일반적인 요구사항 설명입니다.

### Scenario: 시나리오

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;

const SPEC_WITHOUT_GWT = `---
status: draft
---

# 테스트 스펙

> 설명

## Requirement: 요구사항

시스템은 기능을 제공해야 한다(SHALL).
`;

describe('parseSpec', () => {
  it('유효한 스펙을 파싱한다', () => {
    const result = parseSpec(VALID_SPEC);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('테스트 스펙');
      expect(result.data.description).toBe('테스트를 위한 스펙 문서');
      expect(result.data.metadata.status).toBe('draft');
      expect(result.data.metadata.created).toBe('2025-12-21');
    }
  });

  it('요구사항을 추출한다', () => {
    const result = parseSpec(VALID_SPEC);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requirements.length).toBeGreaterThan(0);
      expect(result.data.requirements[0].level).toBe('SHALL');
      expect(result.data.requirements[0].description).toContain('사용자 인증');
    }
  });

  it('시나리오를 추출한다', () => {
    const result = parseSpec(VALID_SPEC);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scenarios.length).toBe(1);
      expect(result.data.scenarios[0].name).toBe('로그인 성공');
      expect(result.data.scenarios[0].given[0]).toContain('로그인 페이지');
      expect(result.data.scenarios[0].when).toContain('자격증명');
      expect(result.data.scenarios[0].then[0]).toContain('홈페이지');
    }
  });

  it('제목이 없으면 에러를 반환한다', () => {
    const noTitle = `---
status: draft
---

내용만 있는 스펙
`;
    const result = parseSpec(noTitle);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('제목');
    }
  });

  it('잘못된 메타데이터를 거부한다', () => {
    const badMeta = `---
status: invalid_status
---

# 테스트
`;
    const result = parseSpec(badMeta);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('메타데이터');
    }
  });
});

describe('validateSpecFormat', () => {
  it('유효한 스펙에 대해 성공을 반환한다', () => {
    const result = validateSpecFormat(VALID_SPEC);

    expect(result.success).toBe(true);
  });

  it('RFC 2119 키워드가 없으면 실패한다', () => {
    const result = validateSpecFormat(SPEC_WITHOUT_RFC);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('E204');
      expect(result.error.message).toContain('RFC 2119');
    }
  });

  it('GIVEN-WHEN-THEN 시나리오가 없으면 실패한다', () => {
    const result = validateSpecFormat(SPEC_WITHOUT_GWT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('E205');
      expect(result.error.message).toContain('GIVEN-WHEN-THEN');
    }
  });
});

describe('다양한 마크다운 형식', () => {
  it('굵은 키워드를 인식한다', () => {
    const spec = `---
status: draft
---

# 테스트

## Requirement: 기능

시스템은 기능을 지원해야 한다(SHALL).

### Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;
    const result = parseSpec(spec);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scenarios.length).toBe(1);
    }
  });

  it('하이픈 목록을 인식한다', () => {
    const spec = `---
status: draft
---

# 테스트

## Requirement: 기능

시스템 MUST 동작한다.

### Scenario: 테스트

- GIVEN 조건
- WHEN 행동
- THEN 결과
`;
    const result = parseSpec(spec);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scenarios.length).toBe(1);
      expect(result.data.requirements[0].level).toBe('MUST');
    }
  });

  it('여러 시나리오를 파싱한다', () => {
    const spec = `---
status: draft
---

# 테스트

## Requirement: 기능

시스템 SHALL 동작한다.

### Scenario: 첫 번째

- GIVEN A
- WHEN B
- THEN C

### Scenario: 두 번째

- GIVEN X
- WHEN Y
- THEN Z
`;
    const result = parseSpec(spec);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scenarios.length).toBe(2);
      expect(result.data.scenarios[0].name).toBe('첫 번째');
      expect(result.data.scenarios[1].name).toBe('두 번째');
    }
  });
});

describe('parseSpec - 키워드/시나리오 정밀도', () => {
  const wrap = (body: string): string => `---\nstatus: draft\ncreated: 2025-12-21\n---\n\n# 스펙\n\n${body}`;

  it('SHALL NOT 요구사항은 SHALL(부정) 레벨로 분류한다', () => {
    const result = parseSpec(wrap('## 요구사항\n\n- 평문 비밀번호를 저장해서는 안 된다(SHALL NOT).\n- 로그를 남기면 안 된다(MUST NOT).\n'));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requirements.map((r) => [r.level, r.negated])).toEqual([
        ['SHALL', true],
        ['MUST', true],
      ]);
    }
  });

  it('소문자 may/must는 요구사항으로 세지 않는다', () => {
    const result = parseSpec(wrap('## 요구사항\n\nThis may be fine.\nYou must relax.\n- 로그인해야 한다(SHALL).\n'));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requirements).toHaveLength(1);
      expect(result.data.requirements[0].level).toBe('SHALL');
    }
  });

  it('HTML 주석과 코드 블록 안의 키워드는 무시한다', () => {
    const body = [
      '## 요구사항',
      '',
      '<!-- RFC 2119 키워드(MUST, SHOULD, MAY)를 사용하세요 -->',
      '<!--',
      'multi-line SHALL comment',
      '-->',
      '```',
      'MUST inside code',
      '```',
      '',
    ].join('\n');
    const result = parseSpec(wrap(body));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requirements).toHaveLength(0);
    }
  });

  it('마지막 줄바꿈이 없어도 마지막 시나리오를 파싱한다', () => {
    const body = '## 요구사항\n\n- 동작해야 한다(SHALL).\n\n## 시나리오\n\n### Scenario 1: 첫째\n\n- **GIVEN** A\n- **WHEN** B\n- **THEN** C\n\n### Scenario 2: 마지막\n\n- **GIVEN** X\n- **WHEN** Y\n- **THEN** Z';
    const result = parseSpec(wrap(body));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scenarios.map((s) => s.name)).toEqual(['첫째', '마지막']);
    }
  });

  it('번호 뒤 구분자가 없으면 시나리오 이름의 숫자를 지우지 않는다', () => {
    const body = '## 요구사항\n\n- 동작해야 한다(SHALL).\n\n### Scenario 2FA login\n\n- **GIVEN** A\n- **WHEN** B\n- **THEN** C\n\n### Scenario 3) 복구\n\n- **GIVEN** A\n- **WHEN** B\n- **THEN** C\n';
    const result = parseSpec(wrap(body));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scenarios.map((s) => s.name)).toEqual(['2FA login', '복구']);
    }
  });

  it('닫는 구분자가 없는 frontmatter는 명확한 에러로 실패한다', () => {
    const result = parseSpec('---\nstatus: draft\ncreated: 2025-01-01\n\n# Title\n## Section\n');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('닫는 구분자');
    }
  });

  it('CRLF 스펙을 파싱한다', () => {
    const body = '## 요구사항\n\n- 동작해야 한다(SHALL).\n\n### Scenario: 확인\n\n- **GIVEN** A\n- **WHEN** B\n- **THEN** C\n';
    const result = parseSpec(wrap(body).replace(/\n/g, '\r\n'));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('스펙');
      expect(result.data.requirements).toHaveLength(1);
      expect(result.data.scenarios[0].then).toEqual(['C']);
    }
  });

  it('레거시 상태 별칭을 정규화하고 원래 값을 legacyStatus로 보존한다', () => {
    const result = parseSpec('---\nstatus: completed\n---\n\n# 스펙\n');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.status).toBe('implemented');
      expect(result.data.legacyStatus).toBe('completed');
    }
  });
});

describe('findTemplatePlaceholders', () => {
  it('sdd new 템플릿의 플레이스홀더를 찾는다', () => {
    const content = '---\ntitle: "[제목]"\n---\n\n# X\n\n[요구사항 상세 설명]\n- **GIVEN** [전제 조건]\n- 응답 시간: [N]ms\n';
    expect(findTemplatePlaceholders(content)).toEqual(['[요구사항 상세 설명]', '[전제 조건]', '[N]']);
  });

  it('templates/spec.md 스타일 {{PLACEHOLDER}}를 찾는다', () => {
    expect(findTemplatePlaceholders('# {{FEATURE_NAME}}\n')).toEqual(['{{FEATURE_NAME}}']);
  });

  it('frontmatter 값에 남은 {{PLACEHOLDER}}도 찾는다', () => {
    const content = '---\nid: "{{FEATURE_ID}}"\ntitle: "{{FEATURE_NAME}}"\nstatus: draft\nconstitution_version: "{{CONSTITUTION_VERSION}}"\n---\n\n# {{FEATURE_NAME}}\n';
    expect(findTemplatePlaceholders(content)).toEqual([
      '{{FEATURE_ID}}',
      '{{FEATURE_NAME}}',
      '{{CONSTITUTION_VERSION}}',
    ]);
  });

  it('따옴표 없는 frontmatter {{DATE}}와 CRLF frontmatter도 찾는다', () => {
    const content = '---\r\nstatus: draft\r\ncreated: {{DATE}}\r\n---\r\n\r\n# 제목\r\n';
    expect(findTemplatePlaceholders(content)).toEqual(['{{DATE}}']);
  });

  it('채워진 frontmatter와 frontmatter 주석은 플레이스홀더로 보지 않는다', () => {
    const content = '---\n# id: "{{FEATURE_ID}}"\nid: login\ntitle: 로그인\ndepends: [auth, "[a]"]\n---\n\n# 로그인\n';
    expect(findTemplatePlaceholders(content)).toEqual([]);
  });

  it('참조 스타일 링크와 링크 정의는 플레이스홀더로 보지 않는다', () => {
    const content = '# X\n\n[기능][1] 과 [기능][] 참고, [N] 참조\n\n[1]: https://example.com\n[N]: https://example.com/n\n[기능]: ./a.md\n';
    expect(findTemplatePlaceholders(content)).toEqual([]);
  });

  it('링크·배열 인덱스·주석·코드 블록은 플레이스홀더로 보지 않는다', () => {
    const content = '# X\n\n[기능](./a.md) arr[N] [[기능]]\n<!-- [전제 조건] -->\n```\n[예상 결과]\n```\n';
    expect(findTemplatePlaceholders(content)).toEqual([]);
  });
});
