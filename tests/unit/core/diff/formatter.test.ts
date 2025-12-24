/**
 * Diff 포매터 테스트
 */
import { describe, it, expect } from 'vitest';
import { DiffFormatter } from '../../../../src/core/diff/formatter.js';
import type { DiffResult } from '../../../../src/core/diff/schemas.js';

describe('DiffFormatter', () => {
  const sampleResult: DiffResult = {
    files: [
      {
        file: '.sdd/specs/auth/spec.md',
        requirements: [
          { id: 'REQ-001', type: 'modified', title: '로그인', before: 'SHOULD', after: 'SHALL' },
          { id: 'REQ-002', type: 'added', title: '로그아웃', after: '새 내용' },
        ],
        scenarios: [
          { name: '소셜 로그인', type: 'added', after: 'GIVEN...' },
        ],
        keywordChanges: [
          { reqId: 'REQ-001', before: 'SHOULD', after: 'SHALL', impact: 'strengthened' },
        ],
      },
    ],
    summary: {
      totalFiles: 1,
      addedRequirements: 1,
      modifiedRequirements: 1,
      removedRequirements: 0,
      addedScenarios: 1,
      modifiedScenarios: 0,
      removedScenarios: 0,
      keywordChanges: 1,
    },
  };

  describe('formatTerminal', () => {
    it('전체 diff를 출력한다', () => {
      const formatter = new DiffFormatter({ colors: false });
      const output = formatter.formatTerminal(sampleResult);

      expect(output).toContain('SDD Diff');
      expect(output).toContain('.sdd/specs/auth/spec.md');
      expect(output).toContain('REQ-001');
      expect(output).toContain('REQ-002');
      expect(output).toContain('소셜 로그인');
    });

    it('변경이 없으면 메시지를 출력한다', () => {
      const formatter = new DiffFormatter({ colors: false });
      const emptyResult: DiffResult = {
        files: [],
        summary: {
          totalFiles: 0,
          addedRequirements: 0,
          modifiedRequirements: 0,
          removedRequirements: 0,
          addedScenarios: 0,
          modifiedScenarios: 0,
          removedScenarios: 0,
          keywordChanges: 0,
        },
      };
      const output = formatter.formatTerminal(emptyResult);

      expect(output).toContain('변경된 스펙 파일이 없습니다');
    });

    it('컬러 출력을 지원한다', () => {
      const formatter = new DiffFormatter({ colors: true });
      const output = formatter.formatTerminal(sampleResult);

      expect(output).toContain('\x1b[');
    });

    it('컬러 없는 출력을 지원한다', () => {
      const formatter = new DiffFormatter({ colors: false });
      const output = formatter.formatTerminal(sampleResult);

      expect(output).not.toContain('\x1b[');
    });
  });

  describe('formatTerminal --stat', () => {
    it('통계 요약을 출력한다', () => {
      const formatter = new DiffFormatter({ colors: false, stat: true });
      const output = formatter.formatTerminal(sampleResult);

      expect(output).toContain('SDD Diff --stat');
      expect(output).toContain('요구사항:');
      expect(output).toContain('시나리오:');
      expect(output).toContain('총 변경:');
    });
  });

  describe('formatTerminal --name-only', () => {
    it('파일명만 출력한다', () => {
      const formatter = new DiffFormatter({ colors: false, nameOnly: true });
      const output = formatter.formatTerminal(sampleResult);

      expect(output).toBe('.sdd/specs/auth/spec.md');
      expect(output).not.toContain('REQ-001');
    });
  });

  describe('formatJson', () => {
    it('JSON을 출력한다', () => {
      const formatter = new DiffFormatter();
      const output = formatter.formatJson(sampleResult);
      const parsed = JSON.parse(output);

      expect(parsed.files).toHaveLength(1);
      expect(parsed.summary.totalFiles).toBe(1);
      expect(parsed.summary.addedRequirements).toBe(1);
    });
  });

  describe('formatMarkdown', () => {
    it('마크다운을 출력한다', () => {
      const formatter = new DiffFormatter();
      const output = formatter.formatMarkdown(sampleResult);

      expect(output).toContain('# SDD Diff 리포트');
      expect(output).toContain('## 요약');
      expect(output).toContain('| 변경된 파일 | 1개 |');
      expect(output).toContain('### 요구사항 변경');
      expect(output).toContain('REQ-001');
      expect(output).toContain('### 키워드 변경');
    });

    it('빈 결과를 처리한다', () => {
      const formatter = new DiffFormatter();
      const emptyResult: DiffResult = {
        files: [],
        summary: {
          totalFiles: 0,
          addedRequirements: 0,
          modifiedRequirements: 0,
          removedRequirements: 0,
          addedScenarios: 0,
          modifiedScenarios: 0,
          removedScenarios: 0,
          keywordChanges: 0,
        },
      };
      const output = formatter.formatMarkdown(emptyResult);

      expect(output).toContain('# SDD Diff 리포트');
      expect(output).toContain('| 변경된 파일 | 0개 |');
    });
  });
});
