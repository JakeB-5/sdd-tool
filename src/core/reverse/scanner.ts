/**
 * 프로젝트 스캐너
 *
 * Serena MCP를 사용하여 프로젝트 구조를 분석합니다.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { Result, success, failure } from '../../types/index.js';
import { fileExists, readDir } from '../../utils/fs.js';
import {
  analyzeLanguageDistribution,
} from '../../utils/language-detector.js';
import type { SymbolInfo, SymbolKind } from '../../integrations/serena/types.js';
import {
  type ScanResult,
  type ScanSummary,
  type ScanOptions,
  type SuggestedDomain,
  type ComplexityMetrics,
  calculateComplexityGrade,
  calculateDomainConfidence,
} from './scan-formatter.js';

/**
 * 스캔 진행 콜백
 */
export type ScanProgressCallback = (progress: ScanProgress) => void;

/**
 * 스캔 진행 상태
 */
export interface ScanProgress {
  /** 현재 단계 */
  phase: 'listing' | 'analyzing' | 'summarizing';
  /** 현재 파일 */
  currentFile?: string;
  /** 처리된 파일 수 */
  processedFiles: number;
  /** 총 파일 수 */
  totalFiles: number;
  /** 발견된 심볼 수 */
  symbolCount: number;
}

/**
 * 디렉토리 구조 분석
 */
async function analyzeDirectoryStructure(
  basePath: string,
  depth: number = 3
): Promise<{ directories: string[]; files: string[] }> {
  const directories: string[] = [];
  const files: string[] = [];

  async function scan(currentPath: string, currentDepth: number): Promise<void> {
    if (currentDepth > depth) return;

    const dirResult = await readDir(currentPath);
    if (!dirResult.success) return;

    for (const entry of dirResult.data) {
      const fullPath = path.join(currentPath, entry);
      const relativePath = path.relative(basePath, fullPath);

      // 숨김 파일/디렉토리 및 node_modules 제외
      if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === 'build') {
        continue;
      }

      try {
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          directories.push(relativePath.replace(/\\/g, '/'));
          await scan(fullPath, currentDepth + 1);
        } else if (stat.isFile()) {
          files.push(relativePath.replace(/\\/g, '/'));
        }
      } catch {
        // 접근 불가 파일 무시
      }
    }
  }

  await scan(basePath, 0);

  return { directories, files };
}

/**
 * 디렉토리에서 도메인 추정
 */
function inferDomainsFromDirectories(
  directories: string[],
  files: string[]
): SuggestedDomain[] {
  const domains: Map<string, { path: string; files: string[] }> = new Map();

  // src/, lib/, packages/ 하위 디렉토리를 도메인 후보로
  const domainPatterns = [
    /^src\/([^/]+)/,
    /^lib\/([^/]+)/,
    /^packages\/([^/]+)/,
    /^modules\/([^/]+)/,
    /^apps\/([^/]+)/,
  ];

  for (const file of files) {
    for (const pattern of domainPatterns) {
      const match = file.match(pattern);
      if (match) {
        const domainName = match[1];
        const domainPath = match[0];

        if (!domains.has(domainName)) {
          domains.set(domainName, { path: domainPath, files: [] });
        }
        domains.get(domainName)?.files.push(file);
        break;
      }
    }
  }

  // 도메인 후보 정렬 (파일 수 기준)
  const sortedDomains = [...domains.entries()]
    .filter(([name]) => {
      // 일반적인 도메인이 아닌 것 제외
      return !['utils', 'helpers', 'types', 'config', 'test', 'tests', '__tests__'].includes(name);
    })
    .sort(([, a], [, b]) => b.files.length - a.files.length)
    .slice(0, 10);

  const totalFiles = files.length;

  return sortedDomains.map(([name, info]) => {
    // 파일 수 기반 심볼 수 추정 (파일당 평균 5개 심볼)
    const estimatedSymbolCount = info.files.length * 5;
    
    const domain: Omit<SuggestedDomain, 'confidence'> = {
      name,
      path: info.path,
      fileCount: info.files.length,
      symbolCount: estimatedSymbolCount,
    };

    return {
      ...domain,
      confidence: calculateDomainConfidence(domain, totalFiles),
    };
  });
}

/**
 * 복잡도 계산
 */
function calculateComplexity(
  files: string[],
  _symbols: SymbolInfo[]
): ComplexityMetrics {
  // 추정 LOC (파일당 평균 100줄)
  const estimatedLoc = files.length * 100;

  // 평균 파일 크기 (추정)
  const avgFileSize = 100;

  // 의존성 수 (추정: 파일 수의 2배)
  const dependencyCount = Math.floor(files.length * 2);

  const grade = calculateComplexityGrade({
    estimatedLoc,
    avgFileSize,
    dependencyCount,
  });

  return {
    estimatedLoc,
    avgFileSize,
    dependencyCount,
    grade,
  };
}

/**
 * 심볼 통계 계산
 */
function calculateSymbolStats(symbols: SymbolInfo[]): Partial<Record<SymbolKind, number>> {
  const stats: Partial<Record<SymbolKind, number>> = {};

  for (const symbol of symbols) {
    stats[symbol.kind] = (stats[symbol.kind] || 0) + 1;
  }

  return stats;
}

/**
 * 프로젝트 스캔 실행
 */
export async function scanProject(
  projectPath: string,
  options: ScanOptions = {},
  onProgress?: ScanProgressCallback
): Promise<Result<ScanResult, Error>> {
  if (!await fileExists(projectPath)) {
    return failure(new Error(`경로를 찾을 수 없습니다: ${projectPath}`));
  }

  const startTime = new Date();

  // 진행 상태 업데이트
  const updateProgress = (update: Partial<ScanProgress>) => {
    if (onProgress) {
      onProgress({
        phase: 'listing',
        processedFiles: 0,
        totalFiles: 0,
        symbolCount: 0,
        ...update,
      });
    }
  };

  updateProgress({ phase: 'listing' });

  // 1. 디렉토리 구조 분석
  const { directories, files } = await analyzeDirectoryStructure(
    projectPath,
    options.depth || 5
  );

  // 필터 적용
  let filteredFiles = files;

  if (options.include) {
    const pattern = new RegExp(options.include.replace(/\*/g, '.*'));
    filteredFiles = filteredFiles.filter(f => pattern.test(f));
  }

  if (options.exclude) {
    const pattern = new RegExp(options.exclude.replace(/\*/g, '.*'));
    filteredFiles = filteredFiles.filter(f => !pattern.test(f));
  }

  updateProgress({ phase: 'analyzing', totalFiles: filteredFiles.length });

  // 2. 언어 분석
  const languageDistribution = analyzeLanguageDistribution(filteredFiles);

  // 언어 필터
  if (options.language) {
    filteredFiles = filteredFiles.filter(f => {
      const ext = path.extname(f).toLowerCase();
      // 간단한 확장자 매칭
      return f.includes(options.language!) || ext.includes(options.language!);
    });
  }

  // 3. 도메인 추정
  const suggestedDomains = inferDomainsFromDirectories(directories, filteredFiles);

  // 4. 심볼 분석 (Serena가 없는 경우 빈 배열)
  // TODO: Serena 연결 시 실제 심볼 분석
  const symbols: SymbolInfo[] = [];

  updateProgress({
    phase: 'summarizing',
    processedFiles: filteredFiles.length,
    totalFiles: filteredFiles.length,
    symbolCount: symbols.length,
  });

  // 5. 요약 생성
  const summary: ScanSummary = {
    fileCount: filteredFiles.length,
    symbolCount: symbols.length,
    symbolsByKind: calculateSymbolStats(symbols),
    languageDistribution,
    suggestedDomains,
    complexity: calculateComplexity(filteredFiles, symbols),
  };

  const result: ScanResult = {
    path: projectPath,
    scannedAt: startTime,
    options,
    summary,
    files: filteredFiles,
    symbols,
    directories,
  };

  return success(result);
}

/**
 * 빠른 스캔 (디렉토리 구조만)
 */
export async function quickScan(
  projectPath: string
): Promise<Result<Pick<ScanResult, 'files' | 'directories' | 'summary'>, Error>> {
  const result = await scanProject(projectPath, { depth: 2 });

  if (!result.success) {
    return failure(result.error);
  }

  return success({
    files: result.data.files,
    directories: result.data.directories,
    summary: result.data.summary,
  });
}

/**
 * 특정 경로의 심볼만 스캔
 */
export async function scanPath(
  projectPath: string,
  targetPath: string,
  options: ScanOptions = {}
): Promise<Result<ScanResult, Error>> {
  const fullPath = path.resolve(projectPath, targetPath);

  if (!await fileExists(fullPath)) {
    return failure(new Error(`경로를 찾을 수 없습니다: ${targetPath}`));
  }

  return scanProject(fullPath, options);
}
