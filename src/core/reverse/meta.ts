/**
 * 역추출 메타데이터 관리
 *
 * 스캔 및 추출 결과를 .sdd/.reverse-meta.json에 저장합니다.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { Result, success, failure } from '../../types/index.js';
import { fileExists } from '../../utils/fs.js';
import type { ScanResult, ScanSummary, ScanOptions } from './scan-formatter.js';

/**
 * 역추출 메타데이터
 */
export interface ReverseMeta {
  /** 메타데이터 버전 */
  version: string;
  /** 마지막 스캔 정보 */
  lastScan?: ScanMetaEntry;
  /** 스캔 히스토리 */
  scanHistory: ScanMetaEntry[];
  /** 추출 상태 */
  extractionStatus: ExtractionStatus;
  /** 생성 시간 */
  createdAt: string;
  /** 수정 시간 */
  updatedAt: string;
}

/**
 * 스캔 메타 항목
 */
export interface ScanMetaEntry {
  /** 스캔 ID */
  id: string;
  /** 스캔 경로 */
  path: string;
  /** 스캔 시간 */
  scannedAt: string;
  /** 스캔 옵션 */
  options: ScanOptions;
  /** 요약 (간략) */
  summary: {
    fileCount: number;
    symbolCount: number;
    suggestedDomains: string[];
    complexityGrade: string;
  };
}

/**
 * 추출 상태
 */
export interface ExtractionStatus {
  /** 추출된 스펙 수 */
  extractedCount: number;
  /** 리뷰 대기 수 */
  pendingReviewCount: number;
  /** 승인된 수 */
  approvedCount: number;
  /** 거부된 수 */
  rejectedCount: number;
  /** 확정된 수 */
  finalizedCount: number;
}

/**
 * 메타데이터 파일 경로
 */
const META_FILE = '.reverse-meta.json';

/**
 * 기본 메타데이터
 */
function createDefaultMeta(): ReverseMeta {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    scanHistory: [],
    extractionStatus: {
      extractedCount: 0,
      pendingReviewCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      finalizedCount: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 메타데이터 로드
 */
export async function loadReverseMeta(sddPath: string): Promise<Result<ReverseMeta, Error>> {
  const metaPath = path.join(sddPath, META_FILE);

  if (!await fileExists(metaPath)) {
    return success(createDefaultMeta());
  }

  try {
    const content = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(content) as ReverseMeta;
    return success(meta);
  } catch (error) {
    return failure(new Error(`메타데이터 로드 실패: ${error}`));
  }
}

/**
 * 메타데이터 저장
 */
export async function saveReverseMeta(
  sddPath: string,
  meta: ReverseMeta
): Promise<Result<void, Error>> {
  const metaPath = path.join(sddPath, META_FILE);

  try {
    meta.updatedAt = new Date().toISOString();
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
    return success(undefined);
  } catch (error) {
    return failure(new Error(`메타데이터 저장 실패: ${error}`));
  }
}

/**
 * 스캔 ID 생성
 */
function generateScanId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `scan-${timestamp}-${random}`;
}

/**
 * 스캔 결과를 메타데이터에 추가
 */
export async function addScanToMeta(
  sddPath: string,
  scanResult: ScanResult
): Promise<Result<ScanMetaEntry, Error>> {
  const loadResult = await loadReverseMeta(sddPath);
  if (!loadResult.success) {
    return failure(loadResult.error);
  }

  const meta = loadResult.data;

  const entry: ScanMetaEntry = {
    id: generateScanId(),
    path: scanResult.path,
    scannedAt: scanResult.scannedAt.toISOString(),
    options: scanResult.options,
    summary: {
      fileCount: scanResult.summary.fileCount,
      symbolCount: scanResult.summary.symbolCount,
      suggestedDomains: scanResult.summary.suggestedDomains.map(d => d.name),
      complexityGrade: scanResult.summary.complexity.grade,
    },
  };

  // 히스토리에 추가 (최대 10개 유지)
  meta.scanHistory.unshift(entry);
  if (meta.scanHistory.length > 10) {
    meta.scanHistory = meta.scanHistory.slice(0, 10);
  }

  // 마지막 스캔 업데이트
  meta.lastScan = entry;

  const saveResult = await saveReverseMeta(sddPath, meta);
  if (!saveResult.success) {
    return failure(saveResult.error);
  }

  return success(entry);
}

/**
 * 마지막 스캔 정보 조회
 */
export async function getLastScan(sddPath: string): Promise<ScanMetaEntry | null> {
  const loadResult = await loadReverseMeta(sddPath);
  if (!loadResult.success) {
    return null;
  }

  return loadResult.data.lastScan || null;
}

/**
 * 스캔 히스토리 조회
 */
export async function getScanHistory(
  sddPath: string,
  limit: number = 10
): Promise<ScanMetaEntry[]> {
  const loadResult = await loadReverseMeta(sddPath);
  if (!loadResult.success) {
    return [];
  }

  return loadResult.data.scanHistory.slice(0, limit);
}

/**
 * 추출 상태 업데이트
 */
export async function updateExtractionStatus(
  sddPath: string,
  update: Partial<ExtractionStatus>
): Promise<Result<void, Error>> {
  const loadResult = await loadReverseMeta(sddPath);
  if (!loadResult.success) {
    return failure(loadResult.error);
  }

  const meta = loadResult.data;
  meta.extractionStatus = { ...meta.extractionStatus, ...update };

  return saveReverseMeta(sddPath, meta);
}

/**
 * 추출 상태 조회
 */
export async function getExtractionStatus(sddPath: string): Promise<ExtractionStatus> {
  const loadResult = await loadReverseMeta(sddPath);
  if (!loadResult.success) {
    return createDefaultMeta().extractionStatus;
  }

  return loadResult.data.extractionStatus;
}

/**
 * 메타데이터 초기화
 */
export async function resetReverseMeta(sddPath: string): Promise<Result<void, Error>> {
  return saveReverseMeta(sddPath, createDefaultMeta());
}

/**
 * 메타데이터 존재 여부 확인
 */
export async function hasReverseMeta(sddPath: string): Promise<boolean> {
  const metaPath = path.join(sddPath, META_FILE);
  return fileExists(metaPath);
}
