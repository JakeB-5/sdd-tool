/**
 * 스펙 리뷰 모듈
 *
 * 추출된 스펙 초안을 리뷰하고 승인/거부 처리합니다.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import { Result, success, failure } from '../../types/index.js';
import { fileExists, ensureDir } from '../../utils/fs.js';
import type { ExtractedSpec } from './spec-generator.js';
import { formatSpecAsMarkdown, formatSpecAsJson } from './spec-generator.js';

/**
 * 리뷰 상태
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

/**
 * 리뷰 항목
 */
export interface ReviewItem {
  /** 스펙 ID */
  specId: string;
  /** 스펙 정보 */
  spec: ExtractedSpec;
  /** 리뷰 상태 */
  status: ReviewStatus;
  /** 리뷰 코멘트 */
  comments: ReviewComment[];
  /** 수정 제안 */
  suggestions: string[];
  /** 리뷰 시간 */
  reviewedAt?: Date;
  /** 리뷰어 */
  reviewer?: string;
}

/**
 * 리뷰 코멘트
 */
export interface ReviewComment {
  /** 코멘트 유형 */
  type: 'info' | 'warning' | 'error' | 'suggestion';
  /** 메시지 */
  message: string;
  /** 관련 필드 */
  field?: string;
  /** 작성 시간 */
  createdAt: Date;
}

/**
 * 리뷰 요약
 */
export interface ReviewSummary {
  /** 총 스펙 수 */
  total: number;
  /** 대기 중 */
  pending: number;
  /** 승인됨 */
  approved: number;
  /** 거부됨 */
  rejected: number;
  /** 수정 필요 */
  needsRevision: number;
}

/**
 * 리뷰 목록 로드
 */
export async function loadReviewList(
  sddPath: string
): Promise<Result<ReviewItem[], Error>> {
  const draftsPath = path.join(sddPath, '.reverse-drafts');

  if (!await fileExists(draftsPath)) {
    return success([]);
  }

  const items: ReviewItem[] = [];

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

        // 날짜 복원
        spec.metadata.extractedAt = new Date(spec.metadata.extractedAt);

        items.push({
          specId: spec.id,
          spec,
          status: (spec.metadata.status as ReviewStatus) || 'pending',
          comments: [],
          suggestions: spec.confidence.suggestions,
        });
      }
    }

    return success(items);
  } catch (error) {
    return failure(new Error(`리뷰 목록 로드 실패: ${error}`));
  }
}

/**
 * 스펙 승인
 */
export async function approveSpec(
  sddPath: string,
  specId: string,
  comment?: string
): Promise<Result<ReviewItem, Error>> {
  const loadResult = await loadReviewList(sddPath);
  if (!loadResult.success) {
    return failure(loadResult.error);
  }

  const item = loadResult.data.find(i => i.specId === specId);
  if (!item) {
    return failure(new Error(`스펙을 찾을 수 없습니다: ${specId}`));
  }

  item.status = 'approved';
  item.spec.metadata.status = 'approved';
  item.reviewedAt = new Date();

  if (comment) {
    item.comments.push({
      type: 'info',
      message: comment,
      createdAt: new Date(),
    });
  }

  // 저장
  const saveResult = await saveReviewItem(sddPath, item);
  if (!saveResult.success) {
    return failure(saveResult.error);
  }

  return success(item);
}

/**
 * 스펙 거부
 */
export async function rejectSpec(
  sddPath: string,
  specId: string,
  reason: string
): Promise<Result<ReviewItem, Error>> {
  const loadResult = await loadReviewList(sddPath);
  if (!loadResult.success) {
    return failure(loadResult.error);
  }

  const item = loadResult.data.find(i => i.specId === specId);
  if (!item) {
    return failure(new Error(`스펙을 찾을 수 없습니다: ${specId}`));
  }

  item.status = 'rejected';
  item.spec.metadata.status = 'rejected';
  item.reviewedAt = new Date();
  item.comments.push({
    type: 'error',
    message: reason,
    createdAt: new Date(),
  });

  // 저장
  const saveResult = await saveReviewItem(sddPath, item);
  if (!saveResult.success) {
    return failure(saveResult.error);
  }

  return success(item);
}

/**
 * 수정 요청
 */
export async function requestRevision(
  sddPath: string,
  specId: string,
  suggestions: string[]
): Promise<Result<ReviewItem, Error>> {
  const loadResult = await loadReviewList(sddPath);
  if (!loadResult.success) {
    return failure(loadResult.error);
  }

  const item = loadResult.data.find(i => i.specId === specId);
  if (!item) {
    return failure(new Error(`스펙을 찾을 수 없습니다: ${specId}`));
  }

  item.status = 'needs_revision';
  item.reviewedAt = new Date();
  item.suggestions = [...item.suggestions, ...suggestions];

  for (const suggestion of suggestions) {
    item.comments.push({
      type: 'suggestion',
      message: suggestion,
      createdAt: new Date(),
    });
  }

  // 저장
  const saveResult = await saveReviewItem(sddPath, item);
  if (!saveResult.success) {
    return failure(saveResult.error);
  }

  return success(item);
}

/**
 * 리뷰 항목 저장
 */
async function saveReviewItem(
  sddPath: string,
  item: ReviewItem
): Promise<Result<void, Error>> {
  const [domain, name] = item.specId.split('/');
  const specDir = path.join(sddPath, '.reverse-drafts', domain);

  try {
    await ensureDir(specDir);

    // JSON 저장
    const jsonPath = path.join(specDir, `${name}.json`);
    await fs.writeFile(jsonPath, formatSpecAsJson(item.spec), 'utf-8');

    // 마크다운 저장
    const mdPath = path.join(specDir, `${name}.md`);
    await fs.writeFile(mdPath, formatSpecAsMarkdown(item.spec), 'utf-8');

    return success(undefined);
  } catch (error) {
    return failure(new Error(`리뷰 항목 저장 실패: ${error}`));
  }
}

/**
 * 리뷰 요약 계산
 */
export function calculateReviewSummary(items: ReviewItem[]): ReviewSummary {
  return {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
    needsRevision: items.filter(i => i.status === 'needs_revision').length,
  };
}

/**
 * 리뷰 목록 포맷팅
 */
export function formatReviewList(items: ReviewItem[]): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('📋 스펙 리뷰 목록'));
  lines.push('═'.repeat(50));
  lines.push('');

  if (items.length === 0) {
    lines.push(chalk.yellow('리뷰할 스펙이 없습니다.'));
    lines.push('');
    return lines.join('\n');
  }

  // 상태별 그룹화
  const grouped = {
    pending: items.filter(i => i.status === 'pending'),
    needs_revision: items.filter(i => i.status === 'needs_revision'),
    approved: items.filter(i => i.status === 'approved'),
    rejected: items.filter(i => i.status === 'rejected'),
  };

  // 대기 중
  if (grouped.pending.length > 0) {
    lines.push(chalk.yellow('⏳ 대기 중:'));
    for (const item of grouped.pending) {
      lines.push(`   ${item.specId} (신뢰도: ${item.spec.confidence.grade})`);
    }
    lines.push('');
  }

  // 수정 필요
  if (grouped.needs_revision.length > 0) {
    lines.push(chalk.magenta('🔄 수정 필요:'));
    for (const item of grouped.needs_revision) {
      lines.push(`   ${item.specId}`);
    }
    lines.push('');
  }

  // 승인됨
  if (grouped.approved.length > 0) {
    lines.push(chalk.green('✅ 승인됨:'));
    for (const item of grouped.approved) {
      lines.push(`   ${item.specId}`);
    }
    lines.push('');
  }

  // 거부됨
  if (grouped.rejected.length > 0) {
    lines.push(chalk.red('❌ 거부됨:'));
    for (const item of grouped.rejected) {
      lines.push(`   ${item.specId}`);
    }
    lines.push('');
  }

  // 요약
  const summary = calculateReviewSummary(items);
  lines.push(chalk.bold('📊 요약:'));
  lines.push(`   총 ${summary.total}개: ` +
    `대기 ${chalk.yellow(summary.pending.toString())}, ` +
    `승인 ${chalk.green(summary.approved.toString())}, ` +
    `거부 ${chalk.red(summary.rejected.toString())}, ` +
    `수정필요 ${chalk.magenta(summary.needsRevision.toString())}`
  );
  lines.push('');

  return lines.join('\n');
}

/**
 * 단일 스펙 상세 포맷팅
 */
export function formatSpecDetail(item: ReviewItem): string {
  const lines: string[] = [];
  const { spec } = item;

  lines.push('');
  lines.push(chalk.bold(`📄 ${spec.name}`));
  lines.push('═'.repeat(50));
  lines.push('');

  // 상태
  const statusColors: Record<ReviewStatus, typeof chalk.green> = {
    pending: chalk.yellow,
    approved: chalk.green,
    rejected: chalk.red,
    needs_revision: chalk.magenta,
  };
  lines.push(`상태: ${statusColors[item.status](item.status.toUpperCase())}`);
  lines.push(`도메인: ${spec.domain}`);
  lines.push(`신뢰도: ${spec.confidence.grade} (${spec.confidence.score}%)`);
  lines.push('');

  // 설명
  lines.push(chalk.bold('설명:'));
  lines.push(`  ${spec.description}`);
  lines.push('');

  // 시나리오
  lines.push(chalk.bold('시나리오:'));
  for (const scenario of spec.scenarios) {
    lines.push(`  • ${scenario.name}${scenario.inferred ? ' (추론됨)' : ''}`);
  }
  lines.push('');

  // 개선 제안
  if (item.suggestions.length > 0) {
    lines.push(chalk.bold('개선 제안:'));
    for (const suggestion of item.suggestions) {
      lines.push(`  ⚡ ${suggestion}`);
    }
    lines.push('');
  }

  // 코멘트
  if (item.comments.length > 0) {
    lines.push(chalk.bold('코멘트:'));
    for (const comment of item.comments) {
      const icon = comment.type === 'error' ? '❌' :
                   comment.type === 'warning' ? '⚠️' :
                   comment.type === 'suggestion' ? '💡' : 'ℹ️';
      lines.push(`  ${icon} ${comment.message}`);
    }
    lines.push('');
  }

  // 메타데이터
  lines.push(chalk.dim('─'.repeat(50)));
  lines.push(chalk.dim(`추출: ${spec.metadata.extractedAt.toISOString()}`));
  lines.push(chalk.dim(`파일: ${spec.metadata.sourceFiles.join(', ')}`));
  lines.push('');

  return lines.join('\n');
}

/**
 * 승인된 스펙 목록 조회
 */
export async function getApprovedSpecs(
  sddPath: string
): Promise<Result<ExtractedSpec[], Error>> {
  const loadResult = await loadReviewList(sddPath);
  if (!loadResult.success) {
    return failure(loadResult.error);
  }

  const approved = loadResult.data
    .filter(i => i.status === 'approved')
    .map(i => i.spec);

  return success(approved);
}
