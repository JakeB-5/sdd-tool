/**
 * 스캔 결과 포매터
 *
 * reverse scan 결과를 다양한 형식으로 출력합니다.
 */

import chalk from 'chalk';
import type { SymbolInfo, SymbolKind, ProjectStructure } from '../../integrations/serena/types.js';
import { SymbolKindNames } from '../../integrations/serena/types.js';
import { getLanguageDisplayName } from '../../utils/language-detector.js';

/**
 * 스캔 요약 정보
 */
export interface ScanSummary {
  /** 총 파일 수 */
  fileCount: number;
  /** 총 심볼 수 */
  symbolCount: number;
  /** 종류별 심볼 수 */
  symbolsByKind: Partial<Record<SymbolKind, number>>;
  /** 언어별 파일 수 */
  languageDistribution: Record<string, number>;
  /** 추정 도메인 */
  suggestedDomains: SuggestedDomain[];
  /** 복잡도 지표 */
  complexity: ComplexityMetrics;
}

/**
 * 추정 도메인
 */
export interface SuggestedDomain {
  /** 도메인 이름 */
  name: string;
  /** 소스 경로 */
  path: string;
  /** 파일 수 */
  fileCount: number;
  /** 심볼 수 */
  symbolCount: number;
  /** 신뢰도 (0-100) */
  confidence: number;
  /** 설명 */
  description?: string;
  /** 포함된 파일 목록 */
  files?: string[];
}

/**
 * 복잡도 지표
 */
export interface ComplexityMetrics {
  /** 총 코드 라인 수 (추정) */
  estimatedLoc: number;
  /** 평균 파일 크기 */
  avgFileSize: number;
  /** 의존성 수 */
  dependencyCount: number;
  /** 복잡도 등급 */
  grade: 'low' | 'medium' | 'high' | 'very-high';
}

/**
 * 스캔 결과
 */
export interface ScanResult {
  /** 스캔 경로 */
  path: string;
  /** 스캔 시간 */
  scannedAt: Date;
  /** 스캔 옵션 */
  options: ScanOptions;
  /** 요약 */
  summary: ScanSummary;
  /** 파일 목록 */
  files: string[];
  /** 심볼 목록 */
  symbols: SymbolInfo[];
  /** 디렉토리 구조 */
  directories: string[];
}

/**
 * 스캔 옵션
 */
export interface ScanOptions {
  /** 분석 깊이 */
  depth?: number;
  /** 포함 패턴 */
  include?: string;
  /** 제외 패턴 */
  exclude?: string;
  /** 특정 언어만 */
  language?: string;
}

/**
 * 복잡도 등급 계산
 */
export function calculateComplexityGrade(metrics: Omit<ComplexityMetrics, 'grade'>): ComplexityMetrics['grade'] {
  const score =
    (metrics.estimatedLoc / 10000) * 0.4 +
    (metrics.dependencyCount / 100) * 0.4 +
    (metrics.avgFileSize / 500) * 0.2;

  if (score < 0.5) return 'low';
  if (score < 1.5) return 'medium';
  if (score < 3) return 'high';
  return 'very-high';
}

/**
 * 도메인 신뢰도 계산
 */
export function calculateDomainConfidence(
  domain: Omit<SuggestedDomain, 'confidence'>,
  totalFiles: number
): number {
  // 파일 비율 (최대 50점)
  const fileRatio = Math.min((domain.fileCount / totalFiles) * 100, 50);

  // 심볼 수 (최대 30점)
  const symbolScore = Math.min(domain.symbolCount / 10, 30);

  // 경로 명확성 (최대 20점)
  const pathScore = domain.path.includes('src/') ? 20 : 10;

  return Math.round(fileRatio + symbolScore + pathScore);
}

/**
 * 스캔 결과를 콘솔 출력용으로 포맷팅
 */
export function formatScanResult(result: ScanResult): string {
  const lines: string[] = [];
  const { summary } = result;

  // 헤더
  lines.push('');
  lines.push(chalk.bold('📁 프로젝트 스캔 결과'));
  lines.push('═'.repeat(50));
  lines.push('');

  // 기본 통계
  lines.push(chalk.bold('📊 기본 통계:'));
  lines.push(`   파일 수: ${summary.fileCount}`);
  lines.push(`   심볼 수: ${summary.symbolCount}`);
  lines.push('');

  // 심볼 분포
  if (Object.keys(summary.symbolsByKind).length > 0) {
    lines.push(chalk.bold('🔤 심볼 분포:'));
    const sortedKinds = Object.entries(summary.symbolsByKind)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 6);

    for (const [kind, count] of sortedKinds) {
      const kindNum = parseInt(kind) as SymbolKind;
      const name = SymbolKindNames[kindNum] || kind;
      lines.push(`   ${name}: ${count}`);
    }
    lines.push('');
  }

  // 언어 분포
  if (Object.keys(summary.languageDistribution).length > 0) {
    lines.push(chalk.bold('💻 언어 분포:'));
    const sortedLangs = Object.entries(summary.languageDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    for (const [lang, count] of sortedLangs) {
      lines.push(`   ${getLanguageDisplayName(lang)}: ${count} 파일`);
    }
    lines.push('');
  }

  // 추정 도메인
  if (summary.suggestedDomains.length > 0) {
    lines.push(chalk.bold('🏷️  추정 도메인:'));
    for (const domain of summary.suggestedDomains) {
      const confidenceColor = domain.confidence >= 70 ? chalk.green :
                              domain.confidence >= 40 ? chalk.yellow : chalk.gray;
      lines.push(`   ${chalk.cyan(domain.name)} (${domain.path})`);
      lines.push(`      파일: ${domain.fileCount}, 심볼: ${domain.symbolCount}, ` +
                 `신뢰도: ${confidenceColor(domain.confidence + '%')}`);
    }
    lines.push('');
  }

  // 복잡도
  lines.push(chalk.bold('📈 복잡도:'));
  const gradeColors: Record<string, typeof chalk.green> = {
    'low': chalk.green,
    'medium': chalk.yellow,
    'high': chalk.red,
    'very-high': chalk.bgRed,
  };
  const gradeColor = gradeColors[summary.complexity.grade] || chalk.white;
  lines.push(`   LOC (추정): ${summary.complexity.estimatedLoc.toLocaleString()}`);
  lines.push(`   평균 파일 크기: ${summary.complexity.avgFileSize} 줄`);
  lines.push(`   의존성 수: ${summary.complexity.dependencyCount}`);
  lines.push(`   등급: ${gradeColor(summary.complexity.grade.toUpperCase())}`);
  lines.push('');

  // 다음 단계 안내
  lines.push(chalk.bold('💡 다음 단계:'));
  lines.push(`   1. 도메인 생성: sdd domain create <name>`);
  lines.push(`   2. 스펙 추출: sdd reverse extract <path>`);
  lines.push('');

  return lines.join('\n');
}

/**
 * 스캔 결과를 JSON으로 포맷팅
 */
export function formatScanResultJson(result: ScanResult): string {
  return JSON.stringify({
    path: result.path,
    scannedAt: result.scannedAt.toISOString(),
    options: result.options,
    summary: {
      fileCount: result.summary.fileCount,
      symbolCount: result.summary.symbolCount,
      symbolsByKind: result.summary.symbolsByKind,
      languageDistribution: result.summary.languageDistribution,
      suggestedDomains: result.summary.suggestedDomains,
      complexity: result.summary.complexity,
    },
    directories: result.directories,
  }, null, 2);
}

/**
 * 간략한 스캔 요약
 */
export function formatScanSummaryShort(summary: ScanSummary): string {
  const parts: string[] = [];
  parts.push(`${summary.fileCount} files`);
  parts.push(`${summary.symbolCount} symbols`);
  parts.push(`${summary.suggestedDomains.length} domains`);
  parts.push(`complexity: ${summary.complexity.grade}`);
  return parts.join(', ');
}

/**
 * 도메인 제안 목록 포맷팅
 */
export function formatDomainSuggestions(domains: SuggestedDomain[]): string {
  if (domains.length === 0) {
    return chalk.yellow('도메인을 추정할 수 없습니다. 디렉토리 구조를 확인하세요.');
  }

  const lines: string[] = [];
  lines.push(chalk.bold('추천 도메인:'));
  lines.push('');

  for (let i = 0; i < domains.length; i++) {
    const d = domains[i];
    const marker = d.confidence >= 70 ? chalk.green('★') :
                   d.confidence >= 40 ? chalk.yellow('☆') : chalk.gray('○');
    lines.push(`${marker} ${i + 1}. ${chalk.cyan(d.name)}`);
    lines.push(`   경로: ${d.path}`);
    lines.push(`   파일: ${d.fileCount}, 심볼: ${d.symbolCount}`);
    lines.push('');
  }

  return lines.join('\n');
}
