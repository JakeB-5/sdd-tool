/**
 * 리포터 테스트
 */
import { describe, it, expect } from 'vitest';
import { SyncReporter } from '../../../../src/core/sync/reporter.js';
import type { SyncResult } from '../../../../src/core/sync/schemas.js';

describe('SyncReporter', () => {
  const sampleResult: SyncResult = {
    specs: [
      { id: 'auth', requirementCount: 3, implementedCount: 2, missingCount: 1, syncRate: 66.67 },
    ],
    requirements: [
      {
        id: 'REQ-001',
        specId: 'auth',
        title: '로그인',
        status: 'implemented',
        locations: [{ file: 'src/auth.ts', line: 10, type: 'code' }],
      },
      {
        id: 'REQ-002',
        specId: 'auth',
        title: '로그아웃',
        status: 'implemented',
        locations: [{ file: 'src/auth.ts', line: 20, type: 'code' }],
      },
      {
        id: 'REQ-003',
        specId: 'auth',
        title: '비밀번호 변경',
        status: 'missing',
        locations: [],
      },
    ],
    syncRate: 66.67,
    implemented: ['REQ-001', 'REQ-002'],
    missing: ['REQ-003'],
    orphans: [{ file: 'src/legacy.ts', line: 5, type: 'code', text: 'REQ-999: 고아 코드' }],
    totalRequirements: 3,
    totalImplemented: 2,
  };

  describe('formatTerminal', () => {
    it('터미널 출력을 생성한다', () => {
      const reporter = new SyncReporter({ colors: false });
      const output = reporter.formatTerminal(sampleResult);

      expect(output).toContain('SDD Sync');
      expect(output).toContain('스펙: 1개');
      expect(output).toContain('요구사항: 3개');
      expect(output).toContain('구현됨 (2/3)');
      expect(output).toContain('REQ-001');
      expect(output).toContain('미구현 (1/3)');
      expect(output).toContain('REQ-003');
      expect(output).toContain('66.67%');
    });

    it('고아 코드를 표시한다', () => {
      const reporter = new SyncReporter({ colors: false });
      const output = reporter.formatTerminal(sampleResult);

      expect(output).toContain('스펙 없는 코드');
      expect(output).toContain('src/legacy.ts');
    });

    it('컬러 출력을 지원한다', () => {
      const reporter = new SyncReporter({ colors: true });
      const output = reporter.formatTerminal(sampleResult);

      // ANSI 코드 포함 확인
      expect(output).toContain('\x1b[');
    });
  });

  describe('formatJson', () => {
    it('JSON 출력을 생성한다', () => {
      const reporter = new SyncReporter();
      const output = reporter.formatJson(sampleResult);
      const parsed = JSON.parse(output);

      expect(parsed.syncRate).toBe(66.67);
      expect(parsed.totalRequirements).toBe(3);
      expect(parsed.implemented).toContain('REQ-001');
      expect(parsed.missing).toContain('REQ-003');
    });
  });

  describe('formatMarkdown', () => {
    it('마크다운 출력을 생성한다', () => {
      const reporter = new SyncReporter();
      const output = reporter.formatMarkdown(sampleResult);

      expect(output).toContain('# SDD Sync 리포트');
      expect(output).toContain('## 요약');
      expect(output).toContain('| 스펙 수 | 1개 |');
      expect(output).toContain('| 동기화율 | 66.67% |');
      expect(output).toContain('## 스펙별 현황');
      expect(output).toContain('| auth |');
      expect(output).toContain('## 구현된 요구사항');
      expect(output).toContain('## 미구현 요구사항');
      expect(output).toContain('REQ-003');
    });

    it('고아 코드 섹션을 포함한다', () => {
      const reporter = new SyncReporter();
      const output = reporter.formatMarkdown(sampleResult);

      expect(output).toContain('## 스펙 없는 코드');
      expect(output).toContain('src/legacy.ts');
    });
  });

  describe('빈 결과 처리', () => {
    const emptyResult: SyncResult = {
      specs: [],
      requirements: [],
      syncRate: 100,
      implemented: [],
      missing: [],
      orphans: [],
      totalRequirements: 0,
      totalImplemented: 0,
    };

    it('터미널 출력에서 빈 결과를 처리한다', () => {
      const reporter = new SyncReporter({ colors: false });
      const output = reporter.formatTerminal(emptyResult);

      expect(output).toContain('스펙: 0개');
      expect(output).toContain('요구사항: 0개');
      expect(output).toContain('100%');
    });

    it('마크다운 출력에서 빈 결과를 처리한다', () => {
      const reporter = new SyncReporter();
      const output = reporter.formatMarkdown(emptyResult);

      expect(output).toContain('| 요구사항 수 | 0개 |');
      expect(output).toContain('| 동기화율 | 100% |');
    });
  });
});
