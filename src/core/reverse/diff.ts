/**
 * 스캔 결과 비교
 *
 * 이전 스캔과 현재 스캔 결과를 비교하여 변경사항을 추적합니다.
 */

import chalk from 'chalk';
import type { SymbolInfo } from '../../integrations/serena/types.js';
import type { ScanResult } from './scan-formatter.js';

/**
 * 심볼 변경 타입
 */
export type SymbolChangeType = 'added' | 'removed' | 'modified';

/**
 * 심볼 변경 항목
 */
export interface SymbolChange {
  /** 변경 타입 */
  type: SymbolChangeType;
  /** 심볼 정보 */
  symbol: SymbolInfo;
  /** 이전 심볼 (modified인 경우) */
  previous?: SymbolInfo;
}

/**
 * 스캔 비교 결과
 */
export interface ScanDiff {
  /** 이전 스캔 ID */
  previousScanId: string;
  /** 현재 스캔 ID */
  currentScanId: string;
  /** 비교 시간 */
  comparedAt: Date;
  /** 파일 변경 */
  fileChanges: FileChanges;
  /** 심볼 변경 */
  symbolChanges: SymbolChange[];
  /** 도메인 변경 */
  domainChanges: DomainChanges;
  /** 요약 */
  summary: DiffSummary;
}

/**
 * 파일 변경
 */
export interface FileChanges {
  /** 추가된 파일 */
  added: string[];
  /** 삭제된 파일 */
  removed: string[];
  /** 수정된 파일 */
  modified: string[];
}

/**
 * 도메인 변경
 */
export interface DomainChanges {
  /** 새로 추정된 도메인 */
  added: string[];
  /** 제거된 도메인 */
  removed: string[];
  /** 변경 없음 */
  unchanged: string[];
}

/**
 * 비교 요약
 */
export interface DiffSummary {
  /** 파일 추가 수 */
  filesAdded: number;
  /** 파일 삭제 수 */
  filesRemoved: number;
  /** 심볼 추가 수 */
  symbolsAdded: number;
  /** 심볼 삭제 수 */
  symbolsRemoved: number;
  /** 심볼 수정 수 */
  symbolsModified: number;
  /** 변경 있음 */
  hasChanges: boolean;
}

/**
 * 심볼 키 생성 (비교용)
 */
function getSymbolKey(symbol: SymbolInfo): string {
  return `${symbol.location.relativePath}::${symbol.namePath}`;
}

/**
 * 심볼 내용 해시 생성 (수정 감지용)
 */
function getSymbolHash(symbol: SymbolInfo): string {
  return `${symbol.kind}|${symbol.signature || ''}|${symbol.location.startLine}-${symbol.location.endLine}`;
}

/**
 * 두 스캔 결과 비교
 */
export function compareScanResults(
  previous: ScanResult,
  current: ScanResult
): ScanDiff {
  const comparedAt = new Date();

  // 파일 비교
  const previousFiles = new Set(previous.files);
  const currentFiles = new Set(current.files);

  const fileChanges: FileChanges = {
    added: [...currentFiles].filter(f => !previousFiles.has(f)),
    removed: [...previousFiles].filter(f => !currentFiles.has(f)),
    modified: [], // 심볼 변경으로 추론
  };

  // 심볼 비교
  const previousSymbols = new Map<string, SymbolInfo>();
  for (const symbol of previous.symbols) {
    previousSymbols.set(getSymbolKey(symbol), symbol);
  }

  const currentSymbols = new Map<string, SymbolInfo>();
  for (const symbol of current.symbols) {
    currentSymbols.set(getSymbolKey(symbol), symbol);
  }

  const symbolChanges: SymbolChange[] = [];
  const modifiedFiles = new Set<string>();

  // 추가된 심볼
  for (const [key, symbol] of currentSymbols) {
    if (!previousSymbols.has(key)) {
      symbolChanges.push({ type: 'added', symbol });
    } else {
      // 수정된 심볼 (해시가 다른 경우)
      const prevSymbol = previousSymbols.get(key)!;
      if (getSymbolHash(symbol) !== getSymbolHash(prevSymbol)) {
        symbolChanges.push({ type: 'modified', symbol, previous: prevSymbol });
        modifiedFiles.add(symbol.location.relativePath);
      }
    }
  }

  // 삭제된 심볼
  for (const [key, symbol] of previousSymbols) {
    if (!currentSymbols.has(key)) {
      symbolChanges.push({ type: 'removed', symbol });
    }
  }

  // 수정된 파일 (심볼 변경이 있는 파일)
  fileChanges.modified = [...modifiedFiles];

  // 도메인 비교
  const previousDomains = new Set(previous.summary.suggestedDomains.map(d => d.name));
  const currentDomains = new Set(current.summary.suggestedDomains.map(d => d.name));

  const domainChanges: DomainChanges = {
    added: [...currentDomains].filter(d => !previousDomains.has(d)),
    removed: [...previousDomains].filter(d => !currentDomains.has(d)),
    unchanged: [...currentDomains].filter(d => previousDomains.has(d)),
  };

  // 요약
  const summary: DiffSummary = {
    filesAdded: fileChanges.added.length,
    filesRemoved: fileChanges.removed.length,
    symbolsAdded: symbolChanges.filter(c => c.type === 'added').length,
    symbolsRemoved: symbolChanges.filter(c => c.type === 'removed').length,
    symbolsModified: symbolChanges.filter(c => c.type === 'modified').length,
    hasChanges: false,
  };

  summary.hasChanges = summary.filesAdded > 0 ||
                       summary.filesRemoved > 0 ||
                       summary.symbolsAdded > 0 ||
                       summary.symbolsRemoved > 0 ||
                       summary.symbolsModified > 0;

  return {
    previousScanId: 'previous', // TODO: 실제 ID 사용
    currentScanId: 'current',
    comparedAt,
    fileChanges,
    symbolChanges,
    domainChanges,
    summary,
  };
}

/**
 * 비교 결과 포맷팅
 */
export function formatScanDiff(diff: ScanDiff): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('🔄 스캔 비교 결과'));
  lines.push('─'.repeat(40));
  lines.push('');

  if (!diff.summary.hasChanges) {
    lines.push(chalk.green('✓ 변경사항 없음'));
    lines.push('');
    return lines.join('\n');
  }

  // 파일 변경
  if (diff.fileChanges.added.length > 0 ||
      diff.fileChanges.removed.length > 0) {
    lines.push(chalk.bold('📁 파일 변경:'));

    if (diff.fileChanges.added.length > 0) {
      lines.push(chalk.green(`   + ${diff.fileChanges.added.length} 파일 추가`));
      for (const file of diff.fileChanges.added.slice(0, 5)) {
        lines.push(chalk.green(`     + ${file}`));
      }
      if (diff.fileChanges.added.length > 5) {
        lines.push(chalk.gray(`     ... 외 ${diff.fileChanges.added.length - 5}개`));
      }
    }

    if (diff.fileChanges.removed.length > 0) {
      lines.push(chalk.red(`   - ${diff.fileChanges.removed.length} 파일 삭제`));
      for (const file of diff.fileChanges.removed.slice(0, 5)) {
        lines.push(chalk.red(`     - ${file}`));
      }
      if (diff.fileChanges.removed.length > 5) {
        lines.push(chalk.gray(`     ... 외 ${diff.fileChanges.removed.length - 5}개`));
      }
    }

    lines.push('');
  }

  // 심볼 변경
  if (diff.summary.symbolsAdded > 0 ||
      diff.summary.symbolsRemoved > 0 ||
      diff.summary.symbolsModified > 0) {
    lines.push(chalk.bold('🔤 심볼 변경:'));
    lines.push(`   + ${chalk.green(diff.summary.symbolsAdded.toString())} 추가`);
    lines.push(`   - ${chalk.red(diff.summary.symbolsRemoved.toString())} 삭제`);
    lines.push(`   ~ ${chalk.yellow(diff.summary.symbolsModified.toString())} 수정`);
    lines.push('');
  }

  // 도메인 변경
  if (diff.domainChanges.added.length > 0 || diff.domainChanges.removed.length > 0) {
    lines.push(chalk.bold('🏷️  도메인 변경:'));
    if (diff.domainChanges.added.length > 0) {
      lines.push(chalk.green(`   + 새 도메인: ${diff.domainChanges.added.join(', ')}`));
    }
    if (diff.domainChanges.removed.length > 0) {
      lines.push(chalk.red(`   - 제거된 도메인: ${diff.domainChanges.removed.join(', ')}`));
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 간략한 비교 요약
 */
export function formatDiffSummaryShort(summary: DiffSummary): string {
  if (!summary.hasChanges) {
    return chalk.green('변경 없음');
  }

  const parts: string[] = [];
  if (summary.filesAdded > 0) parts.push(chalk.green(`+${summary.filesAdded} files`));
  if (summary.filesRemoved > 0) parts.push(chalk.red(`-${summary.filesRemoved} files`));
  if (summary.symbolsAdded > 0) parts.push(chalk.green(`+${summary.symbolsAdded} symbols`));
  if (summary.symbolsRemoved > 0) parts.push(chalk.red(`-${summary.symbolsRemoved} symbols`));
  if (summary.symbolsModified > 0) parts.push(chalk.yellow(`~${summary.symbolsModified} symbols`));

  return parts.join(', ');
}
