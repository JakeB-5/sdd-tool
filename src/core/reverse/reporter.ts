/**
 * 역추출 보고서 생성 모듈
 *
 * 역추출 결과를 종합하여 보고서를 생성합니다.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import { Result, success, failure } from '../../types/index.js';
import { ensureDir } from '../../utils/fs.js';
import type { ScanResult, ScanSummary } from './scan-formatter.js';
import type { ExtractionResult } from './extractor.js';
import type { ReviewSummary } from './review.js';
import type { FinalizeResult } from './finalizer.js';
import type { DomainGenerationResult } from './domain-generator.js';

/**
 * 역추출 전체 보고서
 */
export interface ReverseExtractionReport {
  /** 보고서 생성 시간 */
  generatedAt: Date;
  /** 프로젝트 경로 */
  projectPath: string;
  /** 스캔 요약 */
  scan?: ScanReportSection;
  /** 추출 요약 */
  extraction?: ExtractionReportSection;
  /** 리뷰 요약 */
  review?: ReviewReportSection;
  /** 확정 요약 */
  finalization?: FinalizationReportSection;
  /** 도메인 요약 */
  domains?: DomainReportSection;
  /** 전체 통계 */
  statistics: ReportStatistics;
  /** 다음 단계 권장 */
  recommendations: string[];
}

/**
 * 스캔 보고서 섹션
 */
export interface ScanReportSection {
  totalFiles: number;
  totalSymbols: number;
  byLanguage: Record<string, number>;
  suggestedDomains: string[];
  complexityGrade: string;
}

/**
 * 추출 보고서 섹션
 */
export interface ExtractionReportSection {
  totalExtracted: number;
  byConfidence: {
    high: number;
    medium: number;
    low: number;
  };
  byDomain: Record<string, number>;
  averageConfidence: number;
}

/**
 * 리뷰 보고서 섹션
 */
export interface ReviewReportSection {
  totalReviewed: number;
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: number;
}

/**
 * 확정 보고서 섹션
 */
export interface FinalizationReportSection {
  totalFinalized: number;
  byDomain: Record<string, number>;
  errors: number;
}

/**
 * 도메인 보고서 섹션
 */
export interface DomainReportSection {
  totalDomains: number;
  created: number;
  updated: number;
  totalSpecs: number;
}

/**
 * 전체 통계
 */
export interface ReportStatistics {
  /** 총 처리 시간 (ms) */
  processingTime?: number;
  /** 성공률 */
  successRate: number;
  /** 수동 검토 필요 항목 수 */
  manualReviewNeeded: number;
  /** 자동화 비율 */
  automationRate: number;
}

/**
 * 보고서 생성기 클래스
 */
export class ReverseExtractionReporter {
  private projectPath: string;
  private report: Partial<ReverseExtractionReport>;
  private startTime?: Date;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.report = {
      projectPath,
      recommendations: [],
    };
  }

  /**
   * 보고서 시작
   */
  start(): void {
    this.startTime = new Date();
  }

  /**
   * 스캔 결과 추가
   */
  addScanResult(_result: ScanResult, summary: ScanSummary): void {
    // 복잡도 등급을 문자 등급으로 변환
    const gradeMap: Record<string, string> = {
      'low': 'A',
      'medium': 'B',
      'high': 'C',
      'very-high': 'D',
    };
    const complexityGrade = gradeMap[summary.complexity.grade] || 'C';

    this.report.scan = {
      totalFiles: summary.fileCount,
      totalSymbols: summary.symbolCount,
      byLanguage: summary.languageDistribution,
      suggestedDomains: summary.suggestedDomains.map(d => d.name),
      complexityGrade,
    };

    // 권장사항 추가
    if (complexityGrade === 'A' || complexityGrade === 'B') {
      this.report.recommendations?.push('코드베이스 구조가 양호합니다. 자동 추출을 진행하세요.');
    } else if (complexityGrade === 'D') {
      this.report.recommendations?.push('복잡한 코드베이스입니다. 단계적 추출을 권장합니다.');
    }
  }

  /**
   * 추출 결과 추가
   */
  addExtractionResult(result: ExtractionResult): void {
    const byConfidence = { high: 0, medium: 0, low: 0 };
    const byDomain: Record<string, number> = {};
    let totalConfidence = 0;

    for (const spec of result.specs) {
      // 신뢰도별 분류
      const score = spec.confidence.score;
      if (score >= 0.8) {
        byConfidence.high++;
      } else if (score >= 0.5) {
        byConfidence.medium++;
      } else {
        byConfidence.low++;
      }

      // 도메인별 분류
      byDomain[spec.domain] = (byDomain[spec.domain] || 0) + 1;
      totalConfidence += score;
    }

    this.report.extraction = {
      totalExtracted: result.specs.length,
      byConfidence,
      byDomain,
      averageConfidence: result.specs.length > 0
        ? Math.round((totalConfidence / result.specs.length) * 100) / 100
        : 0,
    };

    // 권장사항 추가
    if (byConfidence.low > byConfidence.high) {
      this.report.recommendations?.push('낮은 신뢰도 스펙이 많습니다. 수동 검토를 권장합니다.');
    }
  }

  /**
   * 리뷰 결과 추가
   */
  addReviewSummary(summary: ReviewSummary): void {
    const total = summary.approved + summary.rejected + summary.pending + summary.needsRevision;
    this.report.review = {
      totalReviewed: total,
      approved: summary.approved,
      rejected: summary.rejected,
      pending: summary.pending + summary.needsRevision,
      approvalRate: total > 0
        ? Math.round((summary.approved / total) * 100)
        : 0,
    };

    // 권장사항 추가
    if (summary.pending > 0) {
      this.report.recommendations?.push(`${summary.pending}개 스펙이 리뷰 대기 중입니다.`);
    }
  }

  /**
   * 확정 결과 추가
   */
  addFinalizeResult(result: FinalizeResult): void {
    const byDomain: Record<string, number> = {};
    for (const spec of result.finalized) {
      byDomain[spec.domain] = (byDomain[spec.domain] || 0) + 1;
    }

    this.report.finalization = {
      totalFinalized: result.finalized.length,
      byDomain,
      errors: result.errors.length,
    };

    if (result.errors.length > 0) {
      this.report.recommendations?.push(`${result.errors.length}개 확정 오류를 확인하세요.`);
    }
  }

  /**
   * 도메인 생성 결과 추가
   */
  addDomainResult(result: DomainGenerationResult): void {
    let totalSpecs = 0;
    for (const domain of result.created) {
      totalSpecs += domain.specCount;
    }

    this.report.domains = {
      totalDomains: result.created.length + result.updated.length,
      created: result.created.length,
      updated: result.updated.length,
      totalSpecs,
    };
  }

  /**
   * 보고서 완성
   */
  finalize(): ReverseExtractionReport {
    const endTime = new Date();
    const processingTime = this.startTime
      ? endTime.getTime() - this.startTime.getTime()
      : undefined;

    // 통계 계산
    const extraction = this.report.extraction;
    const review = this.report.review;
    const finalization = this.report.finalization;

    const totalProcessed = extraction?.totalExtracted || 0;
    const successful = finalization?.totalFinalized || 0;
    const manualReviewNeeded = review?.pending || 0;

    const statistics: ReportStatistics = {
      processingTime,
      successRate: totalProcessed > 0
        ? Math.round((successful / totalProcessed) * 100)
        : 0,
      manualReviewNeeded,
      automationRate: totalProcessed > 0
        ? Math.round(((totalProcessed - manualReviewNeeded) / totalProcessed) * 100)
        : 0,
    };

    // 최종 권장사항
    if (successful > 0) {
      this.report.recommendations?.push('sdd validate로 확정된 스펙을 검증하세요.');
      this.report.recommendations?.push('sdd implement로 구현을 시작하세요.');
    }

    return {
      generatedAt: endTime,
      projectPath: this.projectPath,
      scan: this.report.scan,
      extraction: this.report.extraction,
      review: this.report.review,
      finalization: this.report.finalization,
      domains: this.report.domains,
      statistics,
      recommendations: [...new Set(this.report.recommendations)], // 중복 제거
    };
  }
}

/**
 * 보고서를 텍스트로 포맷팅
 */
export function formatReport(report: ReverseExtractionReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('📊 역추출 보고서'));
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`생성 시간: ${report.generatedAt.toLocaleString()}`);
  lines.push(`프로젝트: ${report.projectPath}`);
  lines.push('');

  // 스캔 섹션
  if (report.scan) {
    lines.push(chalk.bold('🔍 스캔 결과'));
    lines.push('─'.repeat(40));
    lines.push(`  파일 수: ${report.scan.totalFiles}`);
    lines.push(`  심볼 수: ${report.scan.totalSymbols}`);
    lines.push(`  복잡도: ${report.scan.complexityGrade}`);
    if (report.scan.suggestedDomains.length > 0) {
      lines.push(`  추천 도메인: ${report.scan.suggestedDomains.join(', ')}`);
    }
    lines.push('');
  }

  // 추출 섹션
  if (report.extraction) {
    lines.push(chalk.bold('📝 추출 결과'));
    lines.push('─'.repeat(40));
    lines.push(`  총 추출: ${report.extraction.totalExtracted}개 스펙`);
    lines.push(`  평균 신뢰도: ${(report.extraction.averageConfidence * 100).toFixed(0)}%`);
    lines.push(`  신뢰도 분포:`);
    lines.push(`    HIGH  : ${report.extraction.byConfidence.high}`);
    lines.push(`    MEDIUM: ${report.extraction.byConfidence.medium}`);
    lines.push(`    LOW   : ${report.extraction.byConfidence.low}`);
    lines.push('');
  }

  // 리뷰 섹션
  if (report.review) {
    lines.push(chalk.bold('✅ 리뷰 결과'));
    lines.push('─'.repeat(40));
    lines.push(`  총 리뷰: ${report.review.totalReviewed}개`);
    lines.push(`  승인: ${report.review.approved}`);
    lines.push(`  거부: ${report.review.rejected}`);
    lines.push(`  대기: ${report.review.pending}`);
    lines.push(`  승인율: ${report.review.approvalRate}%`);
    lines.push('');
  }

  // 확정 섹션
  if (report.finalization) {
    lines.push(chalk.bold('📦 확정 결과'));
    lines.push('─'.repeat(40));
    lines.push(`  총 확정: ${report.finalization.totalFinalized}개 스펙`);
    if (Object.keys(report.finalization.byDomain).length > 0) {
      lines.push(`  도메인별:`);
      for (const [domain, count] of Object.entries(report.finalization.byDomain)) {
        lines.push(`    ${domain}: ${count}개`);
      }
    }
    if (report.finalization.errors > 0) {
      lines.push(chalk.red(`  오류: ${report.finalization.errors}`));
    }
    lines.push('');
  }

  // 도메인 섹션
  if (report.domains) {
    lines.push(chalk.bold('📁 도메인 결과'));
    lines.push('─'.repeat(40));
    lines.push(`  총 도메인: ${report.domains.totalDomains}`);
    lines.push(`  생성: ${report.domains.created}`);
    lines.push(`  업데이트: ${report.domains.updated}`);
    lines.push(`  총 스펙: ${report.domains.totalSpecs}`);
    lines.push('');
  }

  // 통계
  lines.push(chalk.bold('📈 통계'));
  lines.push('─'.repeat(40));
  lines.push(`  성공률: ${report.statistics.successRate}%`);
  lines.push(`  자동화율: ${report.statistics.automationRate}%`);
  lines.push(`  수동 검토 필요: ${report.statistics.manualReviewNeeded}개`);
  if (report.statistics.processingTime) {
    const seconds = Math.round(report.statistics.processingTime / 1000);
    lines.push(`  처리 시간: ${seconds}초`);
  }
  lines.push('');

  // 권장사항
  if (report.recommendations.length > 0) {
    lines.push(chalk.bold('💡 다음 단계'));
    lines.push('─'.repeat(40));
    for (const rec of report.recommendations) {
      lines.push(`  • ${rec}`);
    }
    lines.push('');
  }

  lines.push('═'.repeat(60));
  lines.push('');

  return lines.join('\n');
}

/**
 * 보고서를 JSON으로 변환
 */
export function formatReportJson(report: ReverseExtractionReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * 보고서를 Markdown으로 변환
 */
export function formatReportMarkdown(report: ReverseExtractionReport): string {
  const lines: string[] = [];

  lines.push('# 역추출 보고서');
  lines.push('');
  lines.push(`> 생성 시간: ${report.generatedAt.toISOString()}`);
  lines.push(`> 프로젝트: \`${report.projectPath}\``);
  lines.push('');

  // 스캔 섹션
  if (report.scan) {
    lines.push('## 🔍 스캔 결과');
    lines.push('');
    lines.push(`| 항목 | 값 |`);
    lines.push(`|------|-----|`);
    lines.push(`| 파일 수 | ${report.scan.totalFiles} |`);
    lines.push(`| 심볼 수 | ${report.scan.totalSymbols} |`);
    lines.push(`| 복잡도 | ${report.scan.complexityGrade} |`);
    lines.push('');
  }

  // 추출 섹션
  if (report.extraction) {
    lines.push('## 📝 추출 결과');
    lines.push('');
    lines.push(`- **총 추출**: ${report.extraction.totalExtracted}개 스펙`);
    lines.push(`- **평균 신뢰도**: ${(report.extraction.averageConfidence * 100).toFixed(0)}%`);
    lines.push('');
    lines.push('### 신뢰도 분포');
    lines.push('');
    lines.push(`| 레벨 | 개수 |`);
    lines.push(`|------|------|`);
    lines.push(`| HIGH | ${report.extraction.byConfidence.high} |`);
    lines.push(`| MEDIUM | ${report.extraction.byConfidence.medium} |`);
    lines.push(`| LOW | ${report.extraction.byConfidence.low} |`);
    lines.push('');
  }

  // 리뷰 섹션
  if (report.review) {
    lines.push('## ✅ 리뷰 결과');
    lines.push('');
    lines.push(`| 상태 | 개수 |`);
    lines.push(`|------|------|`);
    lines.push(`| 승인 | ${report.review.approved} |`);
    lines.push(`| 거부 | ${report.review.rejected} |`);
    lines.push(`| 대기 | ${report.review.pending} |`);
    lines.push('');
    lines.push(`**승인율**: ${report.review.approvalRate}%`);
    lines.push('');
  }

  // 통계
  lines.push('## 📈 통계');
  lines.push('');
  lines.push(`- **성공률**: ${report.statistics.successRate}%`);
  lines.push(`- **자동화율**: ${report.statistics.automationRate}%`);
  lines.push(`- **수동 검토 필요**: ${report.statistics.manualReviewNeeded}개`);
  lines.push('');

  // 권장사항
  if (report.recommendations.length > 0) {
    lines.push('## 💡 다음 단계');
    lines.push('');
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 보고서를 파일로 저장
 */
export async function saveReport(
  sddPath: string,
  report: ReverseExtractionReport,
  format: 'json' | 'md' | 'txt' = 'json'
): Promise<Result<string, Error>> {
  try {
    const reportsDir = path.join(sddPath, '.reverse-reports');
    await ensureDir(reportsDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === 'md' ? 'md' : format === 'txt' ? 'txt' : 'json';
    const fileName = `report-${timestamp}.${extension}`;
    const filePath = path.join(reportsDir, fileName);

    let content: string;
    switch (format) {
      case 'md':
        content = formatReportMarkdown(report);
        break;
      case 'txt':
        // eslint-disable-next-line no-control-regex
        content = formatReport(report).replace(/\x1b\[[0-9;]*m/g, ''); // ANSI 제거
        break;
      default:
        content = formatReportJson(report);
    }

    await fs.writeFile(filePath, content, 'utf-8');
    return success(filePath);
  } catch (error) {
    return failure(new Error(`보고서 저장 실패: ${error}`));
  }
}

/**
 * 간단한 요약 보고서 생성
 */
export function formatQuickSummary(report: ReverseExtractionReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('📊 역추출 요약'));
  lines.push('');

  const extracted = report.extraction?.totalExtracted || 0;
  const finalized = report.finalization?.totalFinalized || 0;
  const pending = report.review?.pending || 0;

  lines.push(`추출: ${extracted}개 → 확정: ${finalized}개 (대기: ${pending}개)`);
  lines.push(`성공률: ${report.statistics.successRate}%`);

  if (report.recommendations.length > 0) {
    lines.push('');
    lines.push(chalk.dim('다음: ' + report.recommendations[0]));
  }

  lines.push('');
  return lines.join('\n');
}
