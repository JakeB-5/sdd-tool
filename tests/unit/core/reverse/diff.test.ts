/**
 * diff 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  compareScanResults,
  formatScanDiff,
  formatDiffSummaryShort,
  type ScanDiff,
} from '../../../../src/core/reverse/diff.js';
import type { ScanResult, ScanSummary } from '../../../../src/core/reverse/scan-formatter.js';
import { SymbolKind, type SymbolInfo } from '../../../../src/integrations/serena/types.js';

describe('diff', () => {
  const createMockScanResult = (overrides: Partial<ScanResult> = {}): ScanResult => ({
    path: '/project',
    scannedAt: new Date('2024-01-01T00:00:00Z'),
    options: {},
    summary: {
      fileCount: 10,
      symbolCount: 20,
      symbolsByKind: {},
      languageDistribution: {},
      suggestedDomains: [],
      complexity: {
        estimatedLoc: 1000,
        avgFileSize: 100,
        dependencyCount: 10,
        grade: 'low',
      },
    },
    files: [],
    symbols: [],
    directories: [],
    ...overrides,
  });

  const createMockSymbol = (overrides: Partial<SymbolInfo> = {}): SymbolInfo => ({
    name: 'testSymbol',
    namePath: 'TestClass/testSymbol',
    kind: SymbolKind.Method,
    location: {
      relativePath: 'src/test.ts',
      startLine: 1,
      endLine: 10,
    },
    ...overrides,
  });

  describe('compareScanResults', () => {
    it('변경 없는 경우 hasChanges false', () => {
      const previous = createMockScanResult({
        files: ['src/a.ts', 'src/b.ts'],
        symbols: [],
      });
      const current = createMockScanResult({
        files: ['src/a.ts', 'src/b.ts'],
        symbols: [],
      });

      const diff = compareScanResults(previous, current);
      expect(diff.summary.hasChanges).toBe(false);
    });

    it('파일 추가 감지', () => {
      const previous = createMockScanResult({ files: ['src/a.ts'] });
      const current = createMockScanResult({ files: ['src/a.ts', 'src/b.ts'] });

      const diff = compareScanResults(previous, current);
      expect(diff.summary.filesAdded).toBe(1);
      expect(diff.fileChanges.added).toContain('src/b.ts');
    });

    it('파일 삭제 감지', () => {
      const previous = createMockScanResult({ files: ['src/a.ts', 'src/b.ts'] });
      const current = createMockScanResult({ files: ['src/a.ts'] });

      const diff = compareScanResults(previous, current);
      expect(diff.summary.filesRemoved).toBe(1);
      expect(diff.fileChanges.removed).toContain('src/b.ts');
    });

    it('심볼 추가 감지', () => {
      const previous = createMockScanResult({ symbols: [] });
      const newSymbol = createMockSymbol({ name: 'newMethod' });
      const current = createMockScanResult({ symbols: [newSymbol] });

      const diff = compareScanResults(previous, current);
      expect(diff.summary.symbolsAdded).toBe(1);
      expect(diff.symbolChanges.some(c => c.type === 'added')).toBe(true);
    });

    it('심볼 삭제 감지', () => {
      const oldSymbol = createMockSymbol({ name: 'oldMethod' });
      const previous = createMockScanResult({ symbols: [oldSymbol] });
      const current = createMockScanResult({ symbols: [] });

      const diff = compareScanResults(previous, current);
      expect(diff.summary.symbolsRemoved).toBe(1);
      expect(diff.symbolChanges.some(c => c.type === 'removed')).toBe(true);
    });

    it('심볼 수정 감지', () => {
      const oldSymbol = createMockSymbol({
        name: 'method',
        location: { relativePath: 'src/test.ts', startLine: 1, endLine: 10 },
      });
      const newSymbol = createMockSymbol({
        name: 'method',
        location: { relativePath: 'src/test.ts', startLine: 1, endLine: 20 }, // 길이 변경
      });

      const previous = createMockScanResult({ symbols: [oldSymbol] });
      const current = createMockScanResult({ symbols: [newSymbol] });

      const diff = compareScanResults(previous, current);
      expect(diff.summary.symbolsModified).toBe(1);
      expect(diff.symbolChanges.some(c => c.type === 'modified')).toBe(true);
    });

    it('도메인 추가 감지', () => {
      const previous = createMockScanResult({
        summary: {
          ...createMockScanResult().summary,
          suggestedDomains: [{ name: 'auth', path: 'src/auth', fileCount: 10, symbolCount: 20, confidence: 80 }],
        },
      });
      const current = createMockScanResult({
        summary: {
          ...createMockScanResult().summary,
          suggestedDomains: [
            { name: 'auth', path: 'src/auth', fileCount: 10, symbolCount: 20, confidence: 80 },
            { name: 'user', path: 'src/user', fileCount: 5, symbolCount: 10, confidence: 60 },
          ],
        },
      });

      const diff = compareScanResults(previous, current);
      expect(diff.domainChanges.added).toContain('user');
    });

    it('도메인 삭제 감지', () => {
      const previous = createMockScanResult({
        summary: {
          ...createMockScanResult().summary,
          suggestedDomains: [
            { name: 'auth', path: 'src/auth', fileCount: 10, symbolCount: 20, confidence: 80 },
            { name: 'user', path: 'src/user', fileCount: 5, symbolCount: 10, confidence: 60 },
          ],
        },
      });
      const current = createMockScanResult({
        summary: {
          ...createMockScanResult().summary,
          suggestedDomains: [{ name: 'auth', path: 'src/auth', fileCount: 10, symbolCount: 20, confidence: 80 }],
        },
      });

      const diff = compareScanResults(previous, current);
      expect(diff.domainChanges.removed).toContain('user');
    });

    it('comparedAt 타임스탬프 설정', () => {
      const previous = createMockScanResult();
      const current = createMockScanResult();

      const diff = compareScanResults(previous, current);
      expect(diff.comparedAt).toBeInstanceOf(Date);
    });
  });

  describe('formatScanDiff', () => {
    it('변경 없으면 안내 메시지 표시', () => {
      const diff: ScanDiff = {
        previousScanId: 'prev',
        currentScanId: 'curr',
        comparedAt: new Date(),
        fileChanges: { added: [], removed: [], modified: [] },
        symbolChanges: [],
        domainChanges: { added: [], removed: [], unchanged: [] },
        summary: {
          filesAdded: 0,
          filesRemoved: 0,
          symbolsAdded: 0,
          symbolsRemoved: 0,
          symbolsModified: 0,
          hasChanges: false,
        },
      };

      const output = formatScanDiff(diff);
      expect(output).toContain('변경사항 없음');
    });

    it('파일 추가 표시', () => {
      const diff: ScanDiff = {
        previousScanId: 'prev',
        currentScanId: 'curr',
        comparedAt: new Date(),
        fileChanges: { added: ['src/new.ts'], removed: [], modified: [] },
        symbolChanges: [],
        domainChanges: { added: [], removed: [], unchanged: [] },
        summary: {
          filesAdded: 1,
          filesRemoved: 0,
          symbolsAdded: 0,
          symbolsRemoved: 0,
          symbolsModified: 0,
          hasChanges: true,
        },
      };

      const output = formatScanDiff(diff);
      expect(output).toContain('파일 추가');
      expect(output).toContain('src/new.ts');
    });

    it('파일 삭제 표시', () => {
      const diff: ScanDiff = {
        previousScanId: 'prev',
        currentScanId: 'curr',
        comparedAt: new Date(),
        fileChanges: { added: [], removed: ['src/old.ts'], modified: [] },
        symbolChanges: [],
        domainChanges: { added: [], removed: [], unchanged: [] },
        summary: {
          filesAdded: 0,
          filesRemoved: 1,
          symbolsAdded: 0,
          symbolsRemoved: 0,
          symbolsModified: 0,
          hasChanges: true,
        },
      };

      const output = formatScanDiff(diff);
      expect(output).toContain('파일 삭제');
      expect(output).toContain('src/old.ts');
    });

    it('5개 초과 파일은 요약 표시', () => {
      const diff: ScanDiff = {
        previousScanId: 'prev',
        currentScanId: 'curr',
        comparedAt: new Date(),
        fileChanges: {
          added: ['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts', 'f.ts', 'g.ts'],
          removed: [],
          modified: [],
        },
        symbolChanges: [],
        domainChanges: { added: [], removed: [], unchanged: [] },
        summary: {
          filesAdded: 7,
          filesRemoved: 0,
          symbolsAdded: 0,
          symbolsRemoved: 0,
          symbolsModified: 0,
          hasChanges: true,
        },
      };

      const output = formatScanDiff(diff);
      expect(output).toContain('외 2개');
    });

    it('심볼 변경 요약 표시', () => {
      const diff: ScanDiff = {
        previousScanId: 'prev',
        currentScanId: 'curr',
        comparedAt: new Date(),
        fileChanges: { added: [], removed: [], modified: [] },
        symbolChanges: [],
        domainChanges: { added: [], removed: [], unchanged: [] },
        summary: {
          filesAdded: 0,
          filesRemoved: 0,
          symbolsAdded: 5,
          symbolsRemoved: 2,
          symbolsModified: 3,
          hasChanges: true,
        },
      };

      const output = formatScanDiff(diff);
      expect(output).toContain('심볼 변경');
      expect(output).toContain('5');
      expect(output).toContain('2');
      expect(output).toContain('3');
    });

    it('도메인 변경 표시', () => {
      const diff: ScanDiff = {
        previousScanId: 'prev',
        currentScanId: 'curr',
        comparedAt: new Date(),
        fileChanges: { added: [], removed: [], modified: [] },
        symbolChanges: [],
        domainChanges: { added: ['user'], removed: ['legacy'], unchanged: ['auth'] },
        summary: {
          filesAdded: 0,
          filesRemoved: 0,
          symbolsAdded: 0,
          symbolsRemoved: 0,
          symbolsModified: 0,
          hasChanges: true,
        },
      };

      const output = formatScanDiff(diff);
      expect(output).toContain('도메인 변경');
      expect(output).toContain('user');
      expect(output).toContain('legacy');
    });
  });

  describe('formatDiffSummaryShort', () => {
    it('변경 없으면 간단한 메시지', () => {
      const summary = {
        filesAdded: 0,
        filesRemoved: 0,
        symbolsAdded: 0,
        symbolsRemoved: 0,
        symbolsModified: 0,
        hasChanges: false,
      };

      const output = formatDiffSummaryShort(summary);
      expect(output).toContain('변경 없음');
    });

    it('파일 변경 수 표시', () => {
      const summary = {
        filesAdded: 3,
        filesRemoved: 1,
        symbolsAdded: 0,
        symbolsRemoved: 0,
        symbolsModified: 0,
        hasChanges: true,
      };

      const output = formatDiffSummaryShort(summary);
      expect(output).toContain('+3 files');
      expect(output).toContain('-1 files');
    });

    it('심볼 변경 수 표시', () => {
      const summary = {
        filesAdded: 0,
        filesRemoved: 0,
        symbolsAdded: 10,
        symbolsRemoved: 5,
        symbolsModified: 3,
        hasChanges: true,
      };

      const output = formatDiffSummaryShort(summary);
      expect(output).toContain('+10 symbols');
      expect(output).toContain('-5 symbols');
      expect(output).toContain('~3 symbols');
    });
  });
});
