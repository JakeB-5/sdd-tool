/**
 * 스펙 추출기
 *
 * 프로젝트에서 심볼을 분석하고 스펙을 추출합니다.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { Result, success, failure } from '../../types/index.js';
import { fileExists, ensureDir } from '../../utils/fs.js';
import type { SymbolInfo, SymbolKind } from '../../integrations/serena/types.js';
import { calculateAverageConfidence, type ConfidenceResult } from './confidence.js';
import {
  generateSpec,
  formatSpecAsMarkdown,
  formatSpecAsJson,
  type ExtractedSpec,
} from './spec-generator.js';
import type { ScanResult } from './scan-formatter.js';

/**
 * 추출 옵션
 */
export interface ExtractOptions {
  /** 추출 깊이 */
  depth?: 'shallow' | 'medium' | 'deep';
  /** AI 추론 활성화 */
  ai?: boolean;
  /** 대상 도메인 */
  domain?: string;
  /** 최소 신뢰도 */
  minConfidence?: number;
  /** 포함할 심볼 종류 */
  includeKinds?: SymbolKind[];
  /** 제외할 심볼 종류 */
  excludeKinds?: SymbolKind[];
}

/**
 * 추출 결과
 */
export interface ExtractionResult {
  /** 추출된 스펙 */
  specs: ExtractedSpec[];
  /** 전체 신뢰도 */
  overallConfidence: ConfidenceResult;
  /** 처리된 심볼 수 */
  symbolCount: number;
  /** 건너뛴 심볼 수 */
  skippedCount: number;
  /** 추출 시간 */
  extractedAt: Date;
  /** 저장 경로 */
  savedPath?: string;
}

/**
 * 추출 진행 콜백
 */
export type ExtractionProgressCallback = (progress: ExtractionProgress) => void;

/**
 * 추출 진행 상태
 */
export interface ExtractionProgress {
  /** 현재 단계 */
  phase: 'analyzing' | 'grouping' | 'generating' | 'saving';
  /** 처리된 심볼 수 */
  processedSymbols: number;
  /** 총 심볼 수 */
  totalSymbols: number;
  /** 생성된 스펙 수 */
  specsGenerated: number;
}

/**
 * 심볼을 도메인별로 그룹화
 */
export function groupSymbolsByDomain(
  symbols: SymbolInfo[],
  suggestedDomains: string[]
): Map<string, SymbolInfo[]> {
  const groups = new Map<string, SymbolInfo[]>();

  for (const symbol of symbols) {
    const filePath = symbol.location.relativePath;

    // 파일 경로에서 도메인 추론
    let domain = 'unknown';

    for (const suggested of suggestedDomains) {
      if (filePath.includes(suggested) || filePath.includes(`/${suggested}/`) || filePath.includes(`\\${suggested}\\`)) {
        domain = suggested;
        break;
      }
    }

    // 도메인을 찾지 못했으면 디렉토리 이름 사용
    if (domain === 'unknown') {
      const parts = filePath.replace(/\\/g, '/').split('/');
      if (parts.length > 1) {
        // src/ 다음 디렉토리를 도메인으로
        const srcIndex = parts.indexOf('src');
        if (srcIndex >= 0 && srcIndex < parts.length - 1) {
          domain = parts[srcIndex + 1];
        } else {
          domain = parts[0];
        }
      }
    }

    if (!groups.has(domain)) {
      groups.set(domain, []);
    }
    groups.get(domain)?.push(symbol);
  }

  return groups;
}

/**
 * 심볼을 기능 단위로 그룹화
 */
export function groupSymbolsByFunction(
  symbols: SymbolInfo[]
): Map<string, SymbolInfo[]> {
  const groups = new Map<string, SymbolInfo[]>();

  // 클래스별 그룹화
  const classes = symbols.filter(s => s.kind === 5); // Class
  for (const cls of classes) {
    const groupKey = cls.namePath || cls.name;
    const classSymbols = symbols.filter(s =>
      s.namePath?.startsWith(groupKey + '/') || s === cls
    );
    groups.set(groupKey, classSymbols);
  }

  // 독립 함수 그룹화 (파일별)
  const standaloneFunctions = symbols.filter(s =>
    (s.kind === 12 || s.kind === 6) && // Function, Method
    !s.namePath?.includes('/')
  );

  const functionsByFile = new Map<string, SymbolInfo[]>();
  for (const fn of standaloneFunctions) {
    const fileKey = fn.location.relativePath;
    if (!functionsByFile.has(fileKey)) {
      functionsByFile.set(fileKey, []);
    }
    functionsByFile.get(fileKey)?.push(fn);
  }

  for (const [file, fns] of functionsByFile) {
    const baseName = path.basename(file, path.extname(file));
    groups.set(`functions/${baseName}`, fns);
  }

  return groups;
}

/**
 * 심볼 필터링
 */
export function filterSymbols(
  symbols: SymbolInfo[],
  options: ExtractOptions
): SymbolInfo[] {
  let filtered = [...symbols];

  // 심볼 종류 필터
  if (options.includeKinds && options.includeKinds.length > 0) {
    filtered = filtered.filter(s => options.includeKinds!.includes(s.kind));
  }

  if (options.excludeKinds && options.excludeKinds.length > 0) {
    filtered = filtered.filter(s => !options.excludeKinds!.includes(s.kind));
  }

  // 깊이에 따른 필터링
  if (options.depth === 'shallow') {
    // 최상위 심볼만 (클래스, 함수)
    filtered = filtered.filter(s =>
      s.kind === 5 || s.kind === 12 || s.kind === 11 // Class, Function, Interface
    );
  } else if (options.depth === 'medium') {
    // 메서드까지
    filtered = filtered.filter(s =>
      s.kind === 5 || s.kind === 6 || s.kind === 12 || s.kind === 11 // +Method
    );
  }
  // deep: 모든 심볼 포함

  return filtered;
}

/**
 * 스캔 결과에서 스펙 추출
 */
export async function extractSpecs(
  scanResult: ScanResult,
  options: ExtractOptions = {},
  onProgress?: ExtractionProgressCallback
): Promise<Result<ExtractionResult, Error>> {
  const startTime = new Date();
  const specs: ExtractedSpec[] = [];
  let skippedCount = 0;

  // 진행 상태 업데이트
  const updateProgress = (update: Partial<ExtractionProgress>) => {
    if (onProgress) {
      onProgress({
        phase: 'analyzing',
        processedSymbols: 0,
        totalSymbols: scanResult.symbols.length,
        specsGenerated: 0,
        ...update,
      });
    }
  };

  updateProgress({ phase: 'analyzing' });

  // 심볼 필터링
  const filteredSymbols = filterSymbols(scanResult.symbols, options);

  updateProgress({ phase: 'grouping' });

  // 도메인별 그룹화
  const domainNames = scanResult.summary.suggestedDomains.map(d => d.name);

  // 특정 도메인만 필터
  let domainGroups = groupSymbolsByDomain(filteredSymbols, domainNames);
  if (options.domain) {
    const targetSymbols = domainGroups.get(options.domain);
    domainGroups = new Map();
    if (targetSymbols) {
      domainGroups.set(options.domain, targetSymbols);
    }
  }

  updateProgress({ phase: 'generating' });

  // 각 도메인에서 스펙 생성
  let processedCount = 0;

  for (const [domain, symbols] of domainGroups) {
    if (symbols.length === 0) continue;

    // 기능 단위로 그룹화
    const functionGroups = groupSymbolsByFunction(symbols);

    for (const [_groupName, groupSymbols] of functionGroups) {
      if (groupSymbols.length === 0) continue;

      // 신뢰도 계산
      const confidence = calculateAverageConfidence(groupSymbols, scanResult.symbols);

      // 최소 신뢰도 확인
      if (options.minConfidence && confidence.score < options.minConfidence) {
        skippedCount += groupSymbols.length;
        continue;
      }

      // 스펙 생성
      const spec = generateSpec(domain, groupSymbols, confidence, domainNames);
      specs.push(spec);

      processedCount += groupSymbols.length;
      updateProgress({
        phase: 'generating',
        processedSymbols: processedCount,
        specsGenerated: specs.length,
      });
    }
  }

  // 전체 신뢰도 계산
  const overallConfidence = specs.length > 0
    ? {
        score: Math.round(specs.reduce((sum, s) => sum + s.confidence.score, 0) / specs.length),
        grade: specs.every(s => s.confidence.grade === 'A') ? 'A' as const :
               specs.every(s => ['A', 'B'].includes(s.confidence.grade)) ? 'B' as const :
               specs.every(s => ['A', 'B', 'C'].includes(s.confidence.grade)) ? 'C' as const :
               specs.some(s => s.confidence.grade === 'F') ? 'F' as const : 'D' as const,
        factors: {
          documentation: average(specs.map(s => s.confidence.factors.documentation)),
          naming: average(specs.map(s => s.confidence.factors.naming)),
          structure: average(specs.map(s => s.confidence.factors.structure)),
          testCoverage: average(specs.map(s => s.confidence.factors.testCoverage)),
          typing: average(specs.map(s => s.confidence.factors.typing)),
        },
        suggestions: [...new Set(specs.flatMap(s => s.confidence.suggestions))],
      }
    : calculateAverageConfidence([], []);

  return success({
    specs,
    overallConfidence,
    symbolCount: processedCount,
    skippedCount,
    extractedAt: startTime,
  });
}

/**
 * 추출된 스펙을 파일로 저장
 */
export async function saveExtractedSpecs(
  sddPath: string,
  result: ExtractionResult,
  format: 'markdown' | 'json' = 'markdown'
): Promise<Result<string, Error>> {
  const draftsPath = path.join(sddPath, '.reverse-drafts');

  try {
    await ensureDir(draftsPath);

    for (const spec of result.specs) {
      const specDir = path.join(draftsPath, spec.domain);
      await ensureDir(specDir);

      const fileName = spec.id.split('/').pop()!;
      const ext = format === 'markdown' ? 'md' : 'json';
      const filePath = path.join(specDir, `${fileName}.${ext}`);

      const content = format === 'markdown'
        ? formatSpecAsMarkdown(spec)
        : formatSpecAsJson(spec);

      await fs.writeFile(filePath, content, 'utf-8');
    }

    return success(draftsPath);
  } catch (error) {
    return failure(new Error(`스펙 저장 실패: ${error}`));
  }
}

/**
 * 저장된 스펙 초안 로드
 */
export async function loadDraftSpecs(
  sddPath: string
): Promise<Result<ExtractedSpec[], Error>> {
  const draftsPath = path.join(sddPath, '.reverse-drafts');

  if (!await fileExists(draftsPath)) {
    return success([]);
  }

  const specs: ExtractedSpec[] = [];

  try {
    const domains = await fs.readdir(draftsPath);

    for (const domain of domains) {
      const domainPath = path.join(draftsPath, domain);
      const stat = await fs.stat(domainPath);
      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(domainPath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(domainPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const spec = JSON.parse(content) as ExtractedSpec;

        // 날짜 필드 복원
        spec.metadata.extractedAt = new Date(spec.metadata.extractedAt);

        specs.push(spec);
      }
    }

    return success(specs);
  } catch (error) {
    return failure(new Error(`스펙 로드 실패: ${error}`));
  }
}

/**
 * 스펙 초안 삭제
 */
export async function deleteDraftSpec(
  sddPath: string,
  specId: string
): Promise<Result<void, Error>> {
  const [domain, name] = specId.split('/');
  const draftsPath = path.join(sddPath, '.reverse-drafts', domain);

  try {
    const mdPath = path.join(draftsPath, `${name}.md`);
    const jsonPath = path.join(draftsPath, `${name}.json`);

    if (await fileExists(mdPath)) {
      await fs.unlink(mdPath);
    }
    if (await fileExists(jsonPath)) {
      await fs.unlink(jsonPath);
    }

    return success(undefined);
  } catch (error) {
    return failure(new Error(`스펙 삭제 실패: ${error}`));
  }
}

/**
 * 평균 계산
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}
