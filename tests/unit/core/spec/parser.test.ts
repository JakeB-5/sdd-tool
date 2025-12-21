/**
 * 스펙 파서 테스트
 */
import { describe, it, expect } from 'vitest';
import { parseSpec, validateSpecFormat } from '../../../../src/core/spec/parser.js';

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
