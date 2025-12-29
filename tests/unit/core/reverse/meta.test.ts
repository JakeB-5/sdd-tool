/**
 * meta 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import {
  loadReverseMeta,
  saveReverseMeta,
  addScanToMeta,
  getLastScan,
  getScanHistory,
  updateExtractionStatus,
  getExtractionStatus,
  resetReverseMeta,
  hasReverseMeta,
  type ReverseMeta,
} from '../../../../src/core/reverse/meta.js';
import type { ScanResult } from '../../../../src/core/reverse/scan-formatter.js';

describe('meta', () => {
  let sddPath: string;

  beforeEach(async () => {
    // 임시 .sdd 디렉토리 생성
    sddPath = path.join(os.tmpdir(), `sdd-meta-test-${Date.now()}`);
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(sddPath, { recursive: true, force: true });
  });

  describe('loadReverseMeta', () => {
    it('메타데이터 파일이 없으면 기본값 반환', async () => {
      const result = await loadReverseMeta(sddPath);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.version).toBe('1.0');
      expect(result.data.scanHistory).toEqual([]);
      expect(result.data.extractionStatus.extractedCount).toBe(0);
    });

    it('기존 메타데이터 파일 로드', async () => {
      const meta: ReverseMeta = {
        version: '1.0',
        scanHistory: [],
        extractionStatus: {
          extractedCount: 5,
          pendingReviewCount: 3,
          approvedCount: 1,
          rejectedCount: 1,
          finalizedCount: 0,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      await fs.writeFile(
        path.join(sddPath, '.reverse-meta.json'),
        JSON.stringify(meta),
        'utf-8'
      );

      const result = await loadReverseMeta(sddPath);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.extractionStatus.extractedCount).toBe(5);
    });

    it('잘못된 JSON 파일은 에러 반환', async () => {
      await fs.writeFile(
        path.join(sddPath, '.reverse-meta.json'),
        'invalid json',
        'utf-8'
      );

      const result = await loadReverseMeta(sddPath);
      expect(result.success).toBe(false);
    });
  });

  describe('saveReverseMeta', () => {
    it('메타데이터 저장', async () => {
      const meta: ReverseMeta = {
        version: '1.0',
        scanHistory: [],
        extractionStatus: {
          extractedCount: 0,
          pendingReviewCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          finalizedCount: 0,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const result = await saveReverseMeta(sddPath, meta);
      expect(result.success).toBe(true);

      // 파일이 존재하는지 확인
      const content = await fs.readFile(
        path.join(sddPath, '.reverse-meta.json'),
        'utf-8'
      );
      const saved = JSON.parse(content);
      expect(saved.version).toBe('1.0');
    });

    it('저장 시 updatedAt 갱신', async () => {
      const meta: ReverseMeta = {
        version: '1.0',
        scanHistory: [],
        extractionStatus: {
          extractedCount: 0,
          pendingReviewCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          finalizedCount: 0,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      await saveReverseMeta(sddPath, meta);

      const content = await fs.readFile(
        path.join(sddPath, '.reverse-meta.json'),
        'utf-8'
      );
      const saved = JSON.parse(content);
      expect(saved.updatedAt).not.toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('addScanToMeta', () => {
    const mockScanResult: ScanResult = {
      path: '/project',
      scannedAt: new Date('2024-01-01T00:00:00Z'),
      options: { depth: 3 },
      summary: {
        fileCount: 100,
        symbolCount: 500,
        symbolsByKind: {},
        languageDistribution: {},
        suggestedDomains: [{ name: 'auth', path: 'src/auth', fileCount: 30, symbolCount: 100, confidence: 75 }],
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

    it('스캔 결과 추가', async () => {
      const result = await addScanToMeta(sddPath, mockScanResult);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBeDefined();
      expect(result.data.path).toBe('/project');
      expect(result.data.summary.fileCount).toBe(100);
    });

    it('스캔 히스토리에 추가', async () => {
      await addScanToMeta(sddPath, mockScanResult);
      await addScanToMeta(sddPath, mockScanResult);

      const loadResult = await loadReverseMeta(sddPath);
      expect(loadResult.success).toBe(true);
      if (!loadResult.success) return;

      expect(loadResult.data.scanHistory.length).toBe(2);
    });

    it('최대 10개 히스토리 유지', async () => {
      for (let i = 0; i < 15; i++) {
        await addScanToMeta(sddPath, mockScanResult);
      }

      const loadResult = await loadReverseMeta(sddPath);
      expect(loadResult.success).toBe(true);
      if (!loadResult.success) return;

      expect(loadResult.data.scanHistory.length).toBe(10);
    });

    it('lastScan 업데이트', async () => {
      await addScanToMeta(sddPath, mockScanResult);

      const loadResult = await loadReverseMeta(sddPath);
      expect(loadResult.success).toBe(true);
      if (!loadResult.success) return;

      expect(loadResult.data.lastScan).toBeDefined();
      expect(loadResult.data.lastScan?.path).toBe('/project');
    });
  });

  describe('getLastScan', () => {
    it('마지막 스캔이 없으면 null 반환', async () => {
      const result = await getLastScan(sddPath);
      expect(result).toBeNull();
    });

    it('마지막 스캔 반환', async () => {
      const mockScanResult: ScanResult = {
        path: '/project',
        scannedAt: new Date(),
        options: {},
        summary: {
          fileCount: 100,
          symbolCount: 500,
          symbolsByKind: {},
          languageDistribution: {},
          suggestedDomains: [],
          complexity: { estimatedLoc: 10000, avgFileSize: 100, dependencyCount: 50, grade: 'medium' },
        },
        files: [],
        symbols: [],
        directories: [],
      };

      await addScanToMeta(sddPath, mockScanResult);
      const result = await getLastScan(sddPath);
      expect(result).not.toBeNull();
      expect(result?.path).toBe('/project');
    });
  });

  describe('getScanHistory', () => {
    it('스캔 히스토리 반환', async () => {
      const mockScanResult: ScanResult = {
        path: '/project',
        scannedAt: new Date(),
        options: {},
        summary: {
          fileCount: 100,
          symbolCount: 500,
          symbolsByKind: {},
          languageDistribution: {},
          suggestedDomains: [],
          complexity: { estimatedLoc: 10000, avgFileSize: 100, dependencyCount: 50, grade: 'medium' },
        },
        files: [],
        symbols: [],
        directories: [],
      };

      await addScanToMeta(sddPath, mockScanResult);
      await addScanToMeta(sddPath, mockScanResult);

      const history = await getScanHistory(sddPath);
      expect(history.length).toBe(2);
    });

    it('limit 적용', async () => {
      const mockScanResult: ScanResult = {
        path: '/project',
        scannedAt: new Date(),
        options: {},
        summary: {
          fileCount: 100,
          symbolCount: 500,
          symbolsByKind: {},
          languageDistribution: {},
          suggestedDomains: [],
          complexity: { estimatedLoc: 10000, avgFileSize: 100, dependencyCount: 50, grade: 'medium' },
        },
        files: [],
        symbols: [],
        directories: [],
      };

      for (let i = 0; i < 5; i++) {
        await addScanToMeta(sddPath, mockScanResult);
      }

      const history = await getScanHistory(sddPath, 3);
      expect(history.length).toBe(3);
    });
  });

  describe('updateExtractionStatus', () => {
    it('추출 상태 업데이트', async () => {
      const result = await updateExtractionStatus(sddPath, {
        extractedCount: 5,
        pendingReviewCount: 3,
      });
      expect(result.success).toBe(true);

      const loadResult = await loadReverseMeta(sddPath);
      expect(loadResult.success).toBe(true);
      if (!loadResult.success) return;

      expect(loadResult.data.extractionStatus.extractedCount).toBe(5);
      expect(loadResult.data.extractionStatus.pendingReviewCount).toBe(3);
    });

    it('부분 업데이트 지원', async () => {
      await updateExtractionStatus(sddPath, { extractedCount: 10 });
      await updateExtractionStatus(sddPath, { approvedCount: 5 });

      const loadResult = await loadReverseMeta(sddPath);
      expect(loadResult.success).toBe(true);
      if (!loadResult.success) return;

      expect(loadResult.data.extractionStatus.extractedCount).toBe(10);
      expect(loadResult.data.extractionStatus.approvedCount).toBe(5);
    });
  });

  describe('getExtractionStatus', () => {
    it('추출 상태 조회', async () => {
      await updateExtractionStatus(sddPath, { extractedCount: 10 });

      const status = await getExtractionStatus(sddPath);
      expect(status.extractedCount).toBe(10);
    });

    it('초기 상태 반환', async () => {
      const status = await getExtractionStatus(sddPath);
      expect(status.extractedCount).toBe(0);
      expect(status.pendingReviewCount).toBe(0);
    });
  });

  describe('resetReverseMeta', () => {
    it('메타데이터 초기화', async () => {
      await updateExtractionStatus(sddPath, { extractedCount: 10 });
      await resetReverseMeta(sddPath);

      const loadResult = await loadReverseMeta(sddPath);
      expect(loadResult.success).toBe(true);
      if (!loadResult.success) return;

      expect(loadResult.data.extractionStatus.extractedCount).toBe(0);
      expect(loadResult.data.scanHistory.length).toBe(0);
    });
  });

  describe('hasReverseMeta', () => {
    it('메타데이터 파일이 없으면 false', async () => {
      const result = await hasReverseMeta(sddPath);
      expect(result).toBe(false);
    });

    it('메타데이터 파일이 있으면 true', async () => {
      await saveReverseMeta(sddPath, {
        version: '1.0',
        scanHistory: [],
        extractionStatus: {
          extractedCount: 0,
          pendingReviewCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          finalizedCount: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await hasReverseMeta(sddPath);
      expect(result).toBe(true);
    });
  });
});
