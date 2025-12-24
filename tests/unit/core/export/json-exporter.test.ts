/**
 * JSON 내보내기 테스트
 */
import { describe, it, expect } from 'vitest';
import { generateJson, generateSummaryJson } from '../../../../src/core/export/json-exporter.js';
import type { ParsedSpec } from '../../../../src/core/export/schemas.js';

describe('json-exporter', () => {
  const sampleSpec: ParsedSpec = {
    id: 'auth',
    title: '사용자 인증',
    status: 'draft',
    version: '1.0.0',
    created: '2025-12-24',
    author: 'developer',
    description: 'JWT 기반 인증 시스템',
    requirements: [
      {
        id: 'REQ-001',
        title: '로그인',
        description: '시스템은 이메일/비밀번호 로그인을 지원해야 한다',
        keyword: 'SHALL',
        priority: 'high',
      },
    ],
    scenarios: [
      {
        id: 'scenario-1',
        title: '성공적인 로그인',
        given: ['유효한 사용자 계정이 있을 때'],
        when: ['올바른 이메일과 비밀번호로 로그인하면'],
        then: ['JWT 토큰이 반환된다'],
      },
    ],
    dependencies: ['database'],
    metadata: { id: 'auth' },
    rawContent: '# 사용자 인증',
  };

  describe('generateJson', () => {
    it('유효한 JSON을 생성한다', () => {
      const json = generateJson([sampleSpec]);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe('auth');
      expect(parsed.title).toBe('사용자 인증');
    });

    it('요구사항을 포함한다', () => {
      const json = generateJson([sampleSpec]);
      const parsed = JSON.parse(json);

      expect(parsed.requirements).toHaveLength(1);
      expect(parsed.requirements[0].id).toBe('REQ-001');
      expect(parsed.requirements[0].keyword).toBe('SHALL');
    });

    it('시나리오를 포함한다', () => {
      const json = generateJson([sampleSpec]);
      const parsed = JSON.parse(json);

      expect(parsed.scenarios).toHaveLength(1);
      expect(parsed.scenarios[0].given).toContain('유효한 사용자 계정이 있을 때');
    });

    it('pretty 옵션으로 포맷팅한다', () => {
      const prettyJson = generateJson([sampleSpec], { pretty: true });
      const compactJson = generateJson([sampleSpec], { pretty: false });

      expect(prettyJson.length).toBeGreaterThan(compactJson.length);
      expect(prettyJson).toContain('\n');
    });

    it('rawContent를 제외한다', () => {
      const json = generateJson([sampleSpec], { includeRawContent: false });
      const parsed = JSON.parse(json);

      expect(parsed.rawContent).toBeUndefined();
    });

    it('rawContent를 포함할 수 있다', () => {
      const json = generateJson([sampleSpec], { includeRawContent: true });
      const parsed = JSON.parse(json);

      expect(parsed.rawContent).toBe('# 사용자 인증');
    });

    it('여러 스펙을 배열로 반환한다', () => {
      const spec2: ParsedSpec = { ...sampleSpec, id: 'profile', title: '프로필' };
      const json = generateJson([sampleSpec, spec2]);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('단일 스펙은 객체로 반환한다', () => {
      const json = generateJson([sampleSpec]);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(false);
      expect(parsed.id).toBe('auth');
    });
  });

  describe('generateSummaryJson', () => {
    it('요약 정보를 생성한다', () => {
      const json = generateSummaryJson([sampleSpec]);
      const parsed = JSON.parse(json);

      expect(parsed.totalSpecs).toBe(1);
      expect(parsed.totalRequirements).toBe(1);
      expect(parsed.totalScenarios).toBe(1);
    });

    it('스펙 목록을 포함한다', () => {
      const json = generateSummaryJson([sampleSpec]);
      const parsed = JSON.parse(json);

      expect(parsed.specs).toHaveLength(1);
      expect(parsed.specs[0].id).toBe('auth');
      expect(parsed.specs[0].requirementCount).toBe(1);
    });

    it('생성 시간을 포함한다', () => {
      const json = generateSummaryJson([sampleSpec]);
      const parsed = JSON.parse(json);

      expect(parsed.generatedAt).toBeDefined();
    });
  });
});
