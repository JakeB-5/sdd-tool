/**
 * 키워드 Diff 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  extractKeywords,
  getKeywordImpact,
  analyzeKeywordChanges,
  formatKeywordWarning,
  summarizeKeywordChanges,
} from '../../../../src/core/diff/keyword-diff.js';

describe('keyword-diff', () => {
  describe('extractKeywords', () => {
    it('RFC 2119 키워드를 추출한다', () => {
      const content = '시스템은 로그인을 지원해야 한다(SHALL).';
      const keywords = extractKeywords(content);

      expect(keywords).toContain('SHALL');
    });

    it('여러 키워드를 추출한다', () => {
      const content = `
        시스템은 로그인을 지원해야 한다(SHALL).
        시스템은 로그아웃을 지원해야 한다(SHOULD).
        시스템은 소셜 로그인을 지원할 수 있다(MAY).
      `;
      const keywords = extractKeywords(content);

      expect(keywords).toHaveLength(3);
      expect(keywords).toContain('SHALL');
      expect(keywords).toContain('SHOULD');
      expect(keywords).toContain('MAY');
    });

    it('대소문자를 구분하지 않고 추출한다', () => {
      const content = 'shall, Should, MAY';
      const keywords = extractKeywords(content);

      expect(keywords).toHaveLength(3);
      expect(keywords[0]).toBe('SHALL');
      expect(keywords[1]).toBe('SHOULD');
      expect(keywords[2]).toBe('MAY');
    });

    it('NOT 키워드를 처리한다', () => {
      const content = '시스템은 비밀번호를 평문으로 저장해서는 안 된다(SHALL NOT).';
      const keywords = extractKeywords(content);

      expect(keywords).toContain('SHALL NOT');
    });

    it('키워드가 없으면 빈 배열을 반환한다', () => {
      const content = '이것은 일반 텍스트입니다.';
      const keywords = extractKeywords(content);

      expect(keywords).toHaveLength(0);
    });
  });

  describe('getKeywordImpact', () => {
    it('SHOULD → SHALL 은 강화', () => {
      const impact = getKeywordImpact('SHOULD', 'SHALL');
      expect(impact).toBe('strengthened');
    });

    it('SHALL → SHOULD 는 약화', () => {
      const impact = getKeywordImpact('SHALL', 'SHOULD');
      expect(impact).toBe('weakened');
    });

    it('MAY → SHOULD 는 강화', () => {
      const impact = getKeywordImpact('MAY', 'SHOULD');
      expect(impact).toBe('strengthened');
    });

    it('SHOULD → MAY 는 약화', () => {
      const impact = getKeywordImpact('SHOULD', 'MAY');
      expect(impact).toBe('weakened');
    });

    it('같은 강도의 키워드 변경은 changed', () => {
      const impact = getKeywordImpact('SHALL', 'MUST');
      expect(impact).toBe('changed');
    });
  });

  describe('analyzeKeywordChanges', () => {
    it('키워드 변경을 감지한다', () => {
      const before = '시스템은 기능을 지원해야 한다(SHOULD).';
      const after = '시스템은 기능을 지원해야 한다(SHALL).';

      const changes = analyzeKeywordChanges('REQ-001', before, after);

      expect(changes).toHaveLength(1);
      expect(changes[0].reqId).toBe('REQ-001');
      expect(changes[0].before).toBe('SHOULD');
      expect(changes[0].after).toBe('SHALL');
      expect(changes[0].impact).toBe('strengthened');
    });

    it('변경이 없으면 빈 배열을 반환한다', () => {
      const before = '시스템은 기능을 지원해야 한다(SHALL).';
      const after = '시스템은 기능을 지원해야 한다(SHALL).';

      const changes = analyzeKeywordChanges('REQ-001', before, after);

      expect(changes).toHaveLength(0);
    });
  });

  describe('formatKeywordWarning', () => {
    it('강화 경고를 포맷한다', () => {
      const warning = formatKeywordWarning({
        reqId: 'REQ-001',
        before: 'SHOULD',
        after: 'SHALL',
        impact: 'strengthened',
      });

      expect(warning).toContain('REQ-001');
      expect(warning).toContain('SHOULD');
      expect(warning).toContain('SHALL');
      expect(warning).toContain('강화');
    });

    it('약화 경고를 포맷한다', () => {
      const warning = formatKeywordWarning({
        reqId: 'REQ-002',
        before: 'SHALL',
        after: 'MAY',
        impact: 'weakened',
      });

      expect(warning).toContain('약화');
    });
  });

  describe('summarizeKeywordChanges', () => {
    it('변경을 요약한다', () => {
      const changes = [
        { reqId: 'REQ-001', before: 'SHOULD' as const, after: 'SHALL' as const, impact: 'strengthened' as const },
        { reqId: 'REQ-002', before: 'SHALL' as const, after: 'MAY' as const, impact: 'weakened' as const },
        { reqId: 'REQ-003', before: 'SHOULD' as const, after: 'SHALL' as const, impact: 'strengthened' as const },
      ];

      const summary = summarizeKeywordChanges(changes);

      expect(summary.strengthened).toBe(2);
      expect(summary.weakened).toBe(1);
      expect(summary.changed).toBe(0);
    });
  });
});
