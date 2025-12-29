/**
 * scan-formatter 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  calculateComplexityGrade,
  calculateDomainConfidence,
  formatScanResult,
  formatScanResultJson,
  formatScanSummaryShort,
  formatDomainSuggestions,
  type ScanResult,
  type ScanSummary,
  type SuggestedDomain,
} from '../../../../src/core/reverse/scan-formatter.js';
import { SymbolKind } from '../../../../src/integrations/serena/types.js';

describe('scan-formatter', () => {
  describe('calculateComplexityGrade', () => {
    it('작은 프로젝트는 low 등급 반환', () => {
      const grade = calculateComplexityGrade({
        estimatedLoc: 1000,
        avgFileSize: 50,
        dependencyCount: 10,
      });
      expect(grade).toBe('low');
    });

    it('중간 규모 프로젝트는 medium 등급 반환', () => {
      const grade = calculateComplexityGrade({
        estimatedLoc: 15000,
        avgFileSize: 150,
        dependencyCount: 50,
      });
      expect(grade).toBe('medium');
    });

    it('큰 프로젝트는 high 등급 반환', () => {
      const grade = calculateComplexityGrade({
        estimatedLoc: 50000,
        avgFileSize: 300,
        dependencyCount: 150,
      });
      expect(grade).toBe('high');
    });

    it('매우 큰 프로젝트는 very-high 등급 반환', () => {
      const grade = calculateComplexityGrade({
        estimatedLoc: 100000,
        avgFileSize: 500,
        dependencyCount: 300,
      });
      expect(grade).toBe('very-high');
    });
  });

  describe('calculateDomainConfidence', () => {
    it('src/ 경로와 많은 파일/심볼로 높은 신뢰도 반환', () => {
      const confidence = calculateDomainConfidence(
        {
          name: 'auth',
          path: 'src/auth',
          fileCount: 50,
          symbolCount: 200,
        },
        100
      );
      expect(confidence).toBeGreaterThanOrEqual(70);
    });

    it('적은 파일 수는 낮은 신뢰도 반환', () => {
      const confidence = calculateDomainConfidence(
        {
          name: 'utils',
          path: 'lib/utils',
          fileCount: 5,
          symbolCount: 10,
        },
        100
      );
      expect(confidence).toBeLessThan(50);
    });

    it('신뢰도는 100을 초과하지 않음', () => {
      const confidence = calculateDomainConfidence(
        {
          name: 'core',
          path: 'src/core',
          fileCount: 1000,
          symbolCount: 5000,
        },
        100
      );
      expect(confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('formatScanResult', () => {
    const mockResult: ScanResult = {
      path: '/project',
      scannedAt: new Date('2024-01-01T00:00:00Z'),
      options: {},
      summary: {
        fileCount: 100,
        symbolCount: 500,
        symbolsByKind: {
          [SymbolKind.Class]: 20,
          [SymbolKind.Function]: 150,
          [SymbolKind.Method]: 100,
        },
        languageDistribution: {
          typescript: 80,
          javascript: 20,
        },
        suggestedDomains: [
          {
            name: 'auth',
            path: 'src/auth',
            fileCount: 30,
            symbolCount: 100,
            confidence: 75,
          },
        ],
        complexity: {
          estimatedLoc: 10000,
          avgFileSize: 100,
          dependencyCount: 50,
          grade: 'medium',
        },
      },
      files: [],
      symbols: [],
      directories: [],
    };

    it('헤더 포함', () => {
      const output = formatScanResult(mockResult);
      expect(output).toContain('프로젝트 스캔 결과');
    });

    it('파일 수와 심볼 수 표시', () => {
      const output = formatScanResult(mockResult);
      expect(output).toContain('파일 수: 100');
      expect(output).toContain('심볼 수: 500');
    });

    it('언어 분포 표시', () => {
      const output = formatScanResult(mockResult);
      expect(output).toContain('TypeScript');
      expect(output).toContain('80 파일');
    });

    it('추정 도메인 표시', () => {
      const output = formatScanResult(mockResult);
      expect(output).toContain('auth');
      expect(output).toContain('src/auth');
    });

    it('복잡도 등급 표시', () => {
      const output = formatScanResult(mockResult);
      expect(output).toContain('MEDIUM');
    });

    it('다음 단계 안내 포함', () => {
      const output = formatScanResult(mockResult);
      expect(output).toContain('다음 단계');
      expect(output).toContain('sdd domain create');
    });
  });

  describe('formatScanResultJson', () => {
    const mockResult: ScanResult = {
      path: '/project',
      scannedAt: new Date('2024-01-01T00:00:00Z'),
      options: { depth: 3 },
      summary: {
        fileCount: 50,
        symbolCount: 100,
        symbolsByKind: {},
        languageDistribution: { typescript: 50 },
        suggestedDomains: [],
        complexity: {
          estimatedLoc: 5000,
          avgFileSize: 100,
          dependencyCount: 20,
          grade: 'low',
        },
      },
      files: ['src/index.ts'],
      symbols: [],
      directories: ['src'],
    };

    it('유효한 JSON 반환', () => {
      const json = formatScanResultJson(mockResult);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('필수 필드 포함', () => {
      const json = formatScanResultJson(mockResult);
      const parsed = JSON.parse(json);
      expect(parsed.path).toBe('/project');
      expect(parsed.scannedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(parsed.summary.fileCount).toBe(50);
    });

    it('옵션 포함', () => {
      const json = formatScanResultJson(mockResult);
      const parsed = JSON.parse(json);
      expect(parsed.options.depth).toBe(3);
    });

    it('디렉토리 목록 포함', () => {
      const json = formatScanResultJson(mockResult);
      const parsed = JSON.parse(json);
      expect(parsed.directories).toContain('src');
    });
  });

  describe('formatScanSummaryShort', () => {
    it('간략한 요약 반환', () => {
      const summary: ScanSummary = {
        fileCount: 100,
        symbolCount: 500,
        symbolsByKind: {},
        languageDistribution: {},
        suggestedDomains: [{} as SuggestedDomain, {} as SuggestedDomain],
        complexity: {
          estimatedLoc: 10000,
          avgFileSize: 100,
          dependencyCount: 50,
          grade: 'medium',
        },
      };

      const output = formatScanSummaryShort(summary);
      expect(output).toContain('100 files');
      expect(output).toContain('500 symbols');
      expect(output).toContain('2 domains');
      expect(output).toContain('complexity: medium');
    });
  });

  describe('formatDomainSuggestions', () => {
    it('도메인이 없으면 안내 메시지 반환', () => {
      const output = formatDomainSuggestions([]);
      expect(output).toContain('도메인을 추정할 수 없습니다');
    });

    it('높은 신뢰도 도메인에 별표 표시', () => {
      const domains: SuggestedDomain[] = [
        {
          name: 'auth',
          path: 'src/auth',
          fileCount: 30,
          symbolCount: 100,
          confidence: 80,
        },
      ];
      const output = formatDomainSuggestions(domains);
      expect(output).toContain('auth');
      expect(output).toContain('src/auth');
    });

    it('복수 도메인 번호 매기기', () => {
      const domains: SuggestedDomain[] = [
        { name: 'auth', path: 'src/auth', fileCount: 30, symbolCount: 100, confidence: 80 },
        { name: 'user', path: 'src/user', fileCount: 20, symbolCount: 50, confidence: 60 },
      ];
      const output = formatDomainSuggestions(domains);
      expect(output).toContain('1. ');
      expect(output).toContain('2. ');
    });
  });
});
