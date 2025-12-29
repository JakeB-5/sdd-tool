/**
 * reporter 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import {
  ReverseExtractionReporter,
  formatReport,
  formatReportJson,
  formatReportMarkdown,
  formatQuickSummary,
  saveReport,
  type ReverseExtractionReport,
} from '../../../../src/core/reverse/reporter.js';
import type { ScanResult, ScanSummary } from '../../../../src/core/reverse/scan-formatter.js';
import type { ExtractionResult } from '../../../../src/core/reverse/extractor.js';
import type { ReviewSummary } from '../../../../src/core/reverse/review.js';
import type { FinalizeResult } from '../../../../src/core/reverse/finalizer.js';

describe('reporter', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-reporter-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('ReverseExtractionReporter', () => {
    it('보고서를 생성한다', () => {
      const reporter = new ReverseExtractionReporter(tempDir);
      reporter.start();

      const report = reporter.finalize();

      expect(report).toBeDefined();
      expect(report.projectPath).toBe(tempDir);
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('스캔 결과를 추가한다', () => {
      const reporter = new ReverseExtractionReporter(tempDir);
      reporter.start();

      const scanResult: ScanResult = {
        files: [
          { path: 'src/auth/login.ts', symbolCount: 5 },
          { path: 'src/core/utils.ts', symbolCount: 10 },
        ],
        suggestedDomains: [
          { name: 'auth', description: '인증', path: 'src/auth', confidence: 0.8, files: [] },
        ],
        dependencies: [],
        totalSymbols: 15,
      };

      const summary: ScanSummary = {
        fileCount: 2,
        symbolCount: 15,
        domainCount: 1,
        complexityGrade: 'B',
      };

      reporter.addScanResult(scanResult, summary);
      const report = reporter.finalize();

      expect(report.scan).toBeDefined();
      expect(report.scan?.totalFiles).toBe(2);
      expect(report.scan?.totalSymbols).toBe(15);
      expect(report.scan?.complexityGrade).toBe('B');
    });

    it('추출 결과를 추가한다', () => {
      const reporter = new ReverseExtractionReporter(tempDir);
      reporter.start();

      const extractionResult: ExtractionResult = {
        specs: [
          {
            id: 'auth/login',
            name: 'Login',
            domain: 'auth',
            description: 'Login',
            sourceSymbols: [],
            confidence: { score: 0.85, grade: 'B', factors: {} as any, suggestions: [] },
            scenarios: [],
            contracts: [],
            relatedSpecs: [],
            metadata: { version: '1.0.0', extractedAt: new Date(), sourceFiles: [] },
          },
          {
            id: 'core/utils',
            name: 'Utils',
            domain: 'core',
            description: 'Utils',
            sourceSymbols: [],
            confidence: { score: 0.45, grade: 'D', factors: {} as any, suggestions: [] },
            scenarios: [],
            contracts: [],
            relatedSpecs: [],
            metadata: { version: '1.0.0', extractedAt: new Date(), sourceFiles: [] },
          },
        ],
        errors: [],
        warnings: [],
      };

      reporter.addExtractionResult(extractionResult);
      const report = reporter.finalize();

      expect(report.extraction).toBeDefined();
      expect(report.extraction?.totalExtracted).toBe(2);
      expect(report.extraction?.byConfidence.high).toBe(1);
      expect(report.extraction?.byConfidence.low).toBe(1);
    });

    it('리뷰 요약을 추가한다', () => {
      const reporter = new ReverseExtractionReporter(tempDir);
      reporter.start();

      const reviewSummary: ReviewSummary = {
        total: 5,
        approved: 3,
        rejected: 1,
        pending: 1,
        revision: 0,
      };

      reporter.addReviewSummary(reviewSummary);
      const report = reporter.finalize();

      expect(report.review).toBeDefined();
      expect(report.review?.approved).toBe(3);
      expect(report.review?.rejected).toBe(1);
      expect(report.review?.approvalRate).toBe(60);
    });

    it('확정 결과를 추가한다', () => {
      const reporter = new ReverseExtractionReporter(tempDir);
      reporter.start();

      const finalizeResult: FinalizeResult = {
        finalized: [
          { id: 'auth/login', domain: 'auth', specPath: '.sdd/specs/auth/login.md', original: {} as any, finalizedAt: new Date() },
          { id: 'auth/logout', domain: 'auth', specPath: '.sdd/specs/auth/logout.md', original: {} as any, finalizedAt: new Date() },
        ],
        skipped: [],
        errors: [],
      };

      reporter.addFinalizeResult(finalizeResult);
      const report = reporter.finalize();

      expect(report.finalization).toBeDefined();
      expect(report.finalization?.totalFinalized).toBe(2);
      expect(report.finalization?.byDomain['auth']).toBe(2);
    });
  });

  describe('formatReport', () => {
    it('보고서를 텍스트로 포맷팅한다', () => {
      const report: ReverseExtractionReport = {
        generatedAt: new Date(),
        projectPath: tempDir,
        scan: {
          totalFiles: 10,
          totalSymbols: 100,
          byLanguage: { ts: 80, js: 20 },
          suggestedDomains: ['auth', 'core'],
          complexityGrade: 'B',
        },
        statistics: {
          successRate: 80,
          manualReviewNeeded: 2,
          automationRate: 90,
        },
        recommendations: ['다음 단계를 진행하세요'],
      };

      const formatted = formatReport(report);

      expect(formatted).toContain('역추출 보고서');
      expect(formatted).toContain('스캔 결과');
      expect(formatted).toContain('10');
      expect(formatted).toContain('통계');
    });
  });

  describe('formatReportJson', () => {
    it('보고서를 JSON으로 변환한다', () => {
      const report: ReverseExtractionReport = {
        generatedAt: new Date(),
        projectPath: tempDir,
        statistics: {
          successRate: 80,
          manualReviewNeeded: 0,
          automationRate: 100,
        },
        recommendations: [],
      };

      const json = formatReportJson(report);
      const parsed = JSON.parse(json);

      expect(parsed.projectPath).toBe(tempDir);
      expect(parsed.statistics.successRate).toBe(80);
    });
  });

  describe('formatReportMarkdown', () => {
    it('보고서를 Markdown으로 변환한다', () => {
      const report: ReverseExtractionReport = {
        generatedAt: new Date(),
        projectPath: tempDir,
        scan: {
          totalFiles: 10,
          totalSymbols: 100,
          byLanguage: {},
          suggestedDomains: [],
          complexityGrade: 'A',
        },
        statistics: {
          successRate: 100,
          manualReviewNeeded: 0,
          automationRate: 100,
        },
        recommendations: ['테스트 실행'],
      };

      const md = formatReportMarkdown(report);

      expect(md).toContain('# 역추출 보고서');
      expect(md).toContain('## 🔍 스캔 결과');
      expect(md).toContain('## 📈 통계');
      expect(md).toContain('| 항목 | 값 |');
    });
  });

  describe('formatQuickSummary', () => {
    it('간단한 요약을 생성한다', () => {
      const report: ReverseExtractionReport = {
        generatedAt: new Date(),
        projectPath: tempDir,
        extraction: {
          totalExtracted: 10,
          byConfidence: { high: 5, medium: 3, low: 2 },
          byDomain: {},
          averageConfidence: 0.7,
        },
        finalization: {
          totalFinalized: 8,
          byDomain: {},
          errors: 0,
        },
        review: {
          totalReviewed: 10,
          approved: 8,
          rejected: 1,
          pending: 1,
          approvalRate: 80,
        },
        statistics: {
          successRate: 80,
          manualReviewNeeded: 1,
          automationRate: 90,
        },
        recommendations: [],
      };

      const summary = formatQuickSummary(report);

      expect(summary).toContain('역추출 요약');
      expect(summary).toContain('추출: 10개');
      expect(summary).toContain('확정: 8개');
    });
  });

  describe('saveReport', () => {
    it('JSON 형식으로 보고서를 저장한다', async () => {
      const report: ReverseExtractionReport = {
        generatedAt: new Date(),
        projectPath: tempDir,
        statistics: {
          successRate: 100,
          manualReviewNeeded: 0,
          automationRate: 100,
        },
        recommendations: [],
      };

      const result = await saveReport(sddPath, report, 'json');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('.json');
        const content = await fs.readFile(result.data, 'utf-8');
        expect(content).toContain('projectPath');
      }
    });

    it('Markdown 형식으로 보고서를 저장한다', async () => {
      const report: ReverseExtractionReport = {
        generatedAt: new Date(),
        projectPath: tempDir,
        statistics: {
          successRate: 100,
          manualReviewNeeded: 0,
          automationRate: 100,
        },
        recommendations: [],
      };

      const result = await saveReport(sddPath, report, 'md');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('.md');
        const content = await fs.readFile(result.data, 'utf-8');
        expect(content).toContain('# 역추출 보고서');
      }
    });
  });
});
