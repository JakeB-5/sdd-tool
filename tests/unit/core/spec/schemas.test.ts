/**
 * 스펙 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  SpecMetadataSchema,
  RequirementLevelSchema,
  ScenarioSchema,
  RFC2119_KEYWORDS,
  isRfc2119Keyword,
  extractRfc2119Keywords,
} from '../../../../src/core/spec/schemas.js';

describe('RFC2119 키워드', () => {
  it('모든 RFC 2119 키워드를 정의한다', () => {
    expect(RFC2119_KEYWORDS).toContain('SHALL');
    expect(RFC2119_KEYWORDS).toContain('MUST');
    expect(RFC2119_KEYWORDS).toContain('SHOULD');
    expect(RFC2119_KEYWORDS).toContain('MAY');
    expect(RFC2119_KEYWORDS).toContain('SHALL NOT');
    expect(RFC2119_KEYWORDS).toContain('MUST NOT');
  });

  describe('isRfc2119Keyword', () => {
    it('유효한 키워드에 대해 true를 반환한다', () => {
      expect(isRfc2119Keyword('SHALL')).toBe(true);
      expect(isRfc2119Keyword('MUST')).toBe(true);
      expect(isRfc2119Keyword('SHOULD')).toBe(true);
      expect(isRfc2119Keyword('MAY')).toBe(true);
      expect(isRfc2119Keyword('SHALL NOT')).toBe(true);
    });

    it('무효한 키워드에 대해 false를 반환한다', () => {
      expect(isRfc2119Keyword('WILL')).toBe(false);
      expect(isRfc2119Keyword('CAN')).toBe(false);
      expect(isRfc2119Keyword('shall')).toBe(false);
    });
  });

  describe('extractRfc2119Keywords', () => {
    it('문장에서 단일 키워드를 추출한다', () => {
      expect(extractRfc2119Keywords('시스템은 로그인을 지원해야 한다(SHALL).')).toContain('SHALL');
      expect(extractRfc2119Keywords('The system MUST validate input')).toContain('MUST');
    });

    it('SHALL NOT을 추출한다', () => {
      const keywords = extractRfc2119Keywords('시스템은 비밀번호를 평문으로 저장해서는 안 된다(SHALL NOT).');
      expect(keywords).toContain('SHALL NOT');
      expect(keywords).not.toContain('SHALL');
    });

    it('여러 키워드를 추출한다', () => {
      const keywords = extractRfc2119Keywords('SHALL support X and MAY support Y');
      expect(keywords).toContain('SHALL');
      expect(keywords).toContain('MAY');
    });

    it('키워드가 없으면 빈 배열을 반환한다', () => {
      expect(extractRfc2119Keywords('일반적인 문장입니다.')).toEqual([]);
    });
  });
});

describe('SpecMetadataSchema', () => {
  it('유효한 메타데이터를 파싱한다', () => {
    const result = SpecMetadataSchema.safeParse({
      status: 'draft',
      created: '2025-12-21',
      depends: 'phase-1',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
      expect(result.data.created).toBe('2025-12-21');
    }
  });

  it('빈 객체에 기본값을 적용한다', () => {
    const result = SpecMetadataSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
    }
  });

  it('잘못된 날짜 형식을 거부한다', () => {
    const result = SpecMetadataSchema.safeParse({
      created: '21-12-2025',
    });

    expect(result.success).toBe(false);
  });

  it('잘못된 status를 거부한다', () => {
    const result = SpecMetadataSchema.safeParse({
      status: 'invalid',
    });

    expect(result.success).toBe(false);
  });
});

describe('RequirementLevelSchema', () => {
  it('유효한 레벨을 파싱한다', () => {
    expect(RequirementLevelSchema.safeParse('SHALL').success).toBe(true);
    expect(RequirementLevelSchema.safeParse('MUST').success).toBe(true);
    expect(RequirementLevelSchema.safeParse('SHOULD').success).toBe(true);
    expect(RequirementLevelSchema.safeParse('MAY').success).toBe(true);
  });

  it('잘못된 레벨을 거부한다', () => {
    expect(RequirementLevelSchema.safeParse('WILL').success).toBe(false);
    expect(RequirementLevelSchema.safeParse('shall').success).toBe(false);
  });
});

describe('ScenarioSchema', () => {
  it('유효한 시나리오를 파싱한다', () => {
    const result = ScenarioSchema.safeParse({
      name: '로그인 성공',
      given: ['사용자가 로그인 페이지에 있을 때'],
      when: '올바른 자격증명을 입력하면',
      then: ['홈페이지로 이동한다'],
    });

    expect(result.success).toBe(true);
  });

  it('빈 given 배열을 거부한다', () => {
    const result = ScenarioSchema.safeParse({
      name: '테스트',
      given: [],
      when: '행동',
      then: ['결과'],
    });

    expect(result.success).toBe(false);
  });

  it('빈 when을 거부한다', () => {
    const result = ScenarioSchema.safeParse({
      name: '테스트',
      given: ['조건'],
      when: '',
      then: ['결과'],
    });

    expect(result.success).toBe(false);
  });

  it('빈 then 배열을 거부한다', () => {
    const result = ScenarioSchema.safeParse({
      name: '테스트',
      given: ['조건'],
      when: '행동',
      then: [],
    });

    expect(result.success).toBe(false);
  });
});
