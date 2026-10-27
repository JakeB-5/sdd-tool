/**
 * 역추출 초안 관리
 *
 * 초안은 `sdd new`와 같은 형식의 spec.md로 `.sdd/.reverse-drafts/<domain>/<feature>/spec.md`에 위치합니다.
 * 리뷰 결과(승인/거부)는 `.sdd/.reverse-drafts/review.json`에 기록됩니다.
 */

import path from 'node:path';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import { z } from 'zod';
import { Result, success, failure } from '../../types/index.js';
import type { SpecValidationError, SpecValidationWarning } from '../../types/index.js';
import { listSpecsUnder, resolveSpecIn, type SpecLocation } from '../spec/locator.js';
import { validateSpecFile } from '../spec/validator.js';
import { readFrontmatter } from '../../utils/frontmatter.js';
import { isValidDomainId } from '../../schemas/domains.schema.js';
import { isSafePathSegment } from '../../utils/path.js';
import { generateFeatureId } from '../new/schemas.js';

/** Drafts directory name under `.sdd` */
export const DRAFTS_DIR = '.reverse-drafts';
/** Review state file name under the drafts directory */
export const REVIEW_FILE = 'review.json';

export type DraftStatus = 'pending' | 'approved' | 'rejected';

const ReviewEntrySchema = z.object({
  status: z.enum(['approved', 'rejected']),
  /** sha256 of the draft content at review time */
  hash: z.string(),
  reviewedAt: z.string(),
  reason: z.string().optional(),
});

const ReviewStateSchema = z.object({
  version: z.literal(1),
  drafts: z.record(ReviewEntrySchema),
});

export type ReviewEntry = z.infer<typeof ReviewEntrySchema>;
export type ReviewState = z.infer<typeof ReviewStateSchema>;

/**
 * 초안 정보
 */
export interface DraftInfo {
  /** "<domain>/<feature>" */
  id: string;
  domain: string | null;
  feature: string;
  /** Absolute path to the draft spec.md */
  specPath: string;
  title?: string;
  /** Effective review status (an approval is void once the draft changes) */
  status: DraftStatus;
  /** True when the draft changed after it was reviewed */
  modifiedSinceReview: boolean;
  reason?: string;
  valid: boolean;
  errors: SpecValidationError[];
  warnings: SpecValidationWarning[];
  hash: string;
}

export function getDraftsDir(sddPath: string): string {
  return path.join(sddPath, DRAFTS_DIR);
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * review.json 로드 (없으면 빈 상태, 손상 시 에러)
 */
export async function loadReviewState(sddPath: string): Promise<Result<ReviewState, Error>> {
  const filePath = path.join(getDraftsDir(sddPath), REVIEW_FILE);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return success({ version: 1, drafts: {} });
    }
    return failure(new Error(`${filePath}를 읽을 수 없습니다: ${(error as Error).message}`));
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    return failure(
      new Error(`${filePath}가 손상되었습니다 (JSON 파싱 실패: ${(error as Error).message}). 파일을 수정하거나 삭제하세요.`)
    );
  }

  const parsed = ReviewStateSchema.safeParse(data);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
    return failure(new Error(`${filePath} 형식이 올바르지 않습니다 (${detail}). 파일을 수정하거나 삭제하세요.`));
  }

  return success(parsed.data);
}

/**
 * review.json 저장
 */
export async function saveReviewState(sddPath: string, state: ReviewState): Promise<void> {
  const dir = getDraftsDir(sddPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, REVIEW_FILE), JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

/**
 * True when childPath is strictly inside parentPath
 */
export function isPathInside(childPath: string, parentPath: string): boolean {
  const relative = path.relative(parentPath, childPath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * True when the draft directory, its domain directory or spec.md is a symlink,
 * or spec.md does not physically live inside the drafts directory.
 */
async function isLinkedDraft(location: SpecLocation, draftsDir: string): Promise<boolean> {
  try {
    for (const entry of [path.dirname(location.dir), location.dir, location.specPath]) {
      if ((await fs.lstat(entry)).isSymbolicLink()) return true;
    }
    const [realSpec, realDrafts] = await Promise.all([fs.realpath(location.specPath), fs.realpath(draftsDir)]);
    return !isPathInside(realSpec, realDrafts);
  } catch {
    return true;
  }
}

/**
 * 초안 위치(도메인/기능 ID, 심볼릭 링크)와 frontmatter 일관성 검증 에러
 */
async function validateDraftLocation(
  location: SpecLocation,
  draftsDir: string,
  frontmatter: Record<string, unknown>
): Promise<SpecValidationError[]> {
  const at = { file: location.specPath };
  if (location.domain === null) {
    return [{ code: 'R001', message: `초안은 ${DRAFTS_DIR}/<domain>/<feature>/spec.md 위치에 있어야 합니다`, location: at }];
  }

  const errors: SpecValidationError[] = [];
  if (await isLinkedDraft(location, draftsDir)) {
    errors.push({
      code: 'R004',
      message: `심볼릭 링크를 통한 초안은 허용되지 않습니다: ${location.id} (${DRAFTS_DIR} 안의 실제 파일이어야 합니다)`,
      location: at,
    });
  }
  if (!isValidDomainId(location.domain)) {
    errors.push({
      code: 'R002',
      message: `유효하지 않은 도메인 ID입니다: ${location.domain} (영문 소문자로 시작하고, 소문자/숫자/하이픈만 사용할 수 있습니다)`,
      location: at,
    });
  }
  if (!isSafePathSegment(location.feature) || generateFeatureId(location.feature) !== location.feature) {
    errors.push({
      code: 'R003',
      message: `유효하지 않은 기능 ID입니다: ${location.feature} (소문자/숫자/하이픈 형식, 예: ${generateFeatureId(location.feature) || 'my-feature'})`,
      location: at,
    });
  }
  // YAML may parse numeric-looking ids as numbers
  if (frontmatter.id === undefined || frontmatter.id === null || String(frontmatter.id) !== location.feature) {
    errors.push({
      code: 'R005',
      message: `frontmatter id(${String(frontmatter.id ?? '없음')})가 초안 디렉토리 이름(${location.feature})과 일치해야 합니다`,
      location: at,
    });
  }
  if (frontmatter.domain !== undefined && frontmatter.domain !== null && frontmatter.domain !== location.domain) {
    errors.push({
      code: 'R006',
      message: `frontmatter domain(${String(frontmatter.domain)})이 초안 도메인 디렉토리(${location.domain})와 일치해야 합니다`,
      location: at,
    });
  }
  return errors;
}

async function toDraftInfo(location: SpecLocation, state: ReviewState, draftsDir: string): Promise<DraftInfo> {
  const content = await fs.readFile(location.specPath, 'utf-8');
  const hash = hashContent(content);
  const frontmatter = readFrontmatter(content).data;
  const validation = await validateSpecFile(location.specPath);
  const errors = [...(await validateDraftLocation(location, draftsDir, frontmatter)), ...validation.errors];

  const rawTitle = frontmatter.title;
  const title = typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle.trim() : undefined;

  const entry = state.drafts[location.id];
  const modifiedSinceReview = entry !== undefined && entry.hash !== hash;
  const status: DraftStatus = entry && !modifiedSinceReview ? entry.status : 'pending';

  return {
    id: location.id,
    domain: location.domain,
    feature: location.feature,
    specPath: location.specPath,
    title,
    status,
    modifiedSinceReview,
    reason: status === 'rejected' ? entry?.reason : undefined,
    valid: errors.length === 0,
    errors,
    warnings: validation.warnings,
    hash,
  };
}

/**
 * 모든 초안 조회 (모든 상태 포함, 검증 결과 포함)
 */
export async function listDrafts(sddPath: string): Promise<Result<DraftInfo[], Error>> {
  const stateResult = await loadReviewState(sddPath);
  if (!stateResult.success) return stateResult;

  const draftsDir = getDraftsDir(sddPath);
  const locations = await listSpecsUnder(draftsDir);
  const drafts: DraftInfo[] = [];
  for (const location of locations) {
    drafts.push(await toDraftInfo(location, stateResult.data, draftsDir));
  }
  return success(drafts);
}

/**
 * 초안 참조 해석 ("<domain>/<feature>" 또는 유일한 "<feature>")
 */
export function resolveDraft(drafts: DraftInfo[], ref: string): Result<DraftInfo, Error> {
  const locations: SpecLocation[] = drafts.map((d) => ({
    id: d.id,
    domain: d.domain,
    feature: d.feature,
    dir: path.dirname(d.specPath),
    specPath: d.specPath,
  }));
  const resolved = resolveSpecIn(locations, ref);
  if (!resolved.success) {
    const message = resolved.error.message.replace('스펙', '초안');
    return failure(new Error(message));
  }
  const draft = drafts.find((d) => d.id === resolved.data.id);
  return draft ? success(draft) : failure(new Error(`초안을 찾을 수 없습니다: ${ref}`));
}

async function setReview(
  sddPath: string,
  draft: DraftInfo,
  status: 'approved' | 'rejected',
  reason?: string
): Promise<Result<DraftInfo, Error>> {
  const stateResult = await loadReviewState(sddPath);
  if (!stateResult.success) return stateResult;

  const state = stateResult.data;
  state.drafts[draft.id] = {
    status,
    hash: draft.hash,
    reviewedAt: new Date().toISOString(),
    ...(reason ? { reason } : {}),
  };
  await saveReviewState(sddPath, state);

  return success({ ...draft, status, modifiedSinceReview: false, reason: status === 'rejected' ? reason : undefined });
}

/**
 * 초안 승인 (검증 에러가 있으면 거부)
 */
export async function approveDraft(sddPath: string, ref: string): Promise<Result<DraftInfo, Error>> {
  const listResult = await listDrafts(sddPath);
  if (!listResult.success) return listResult;

  const draftResult = resolveDraft(listResult.data, ref);
  if (!draftResult.success) return draftResult;

  const draft = draftResult.data;
  if (!draft.valid) {
    const details = draft.errors.map((e) => `  - ${e.message}`).join('\n');
    return failure(new Error(`검증에 실패한 초안은 승인할 수 없습니다: ${draft.id}\n${details}`));
  }

  return setReview(sddPath, draft, 'approved');
}

/**
 * 초안 거부 (초안 파일은 수정을 위해 유지)
 */
export async function rejectDraft(
  sddPath: string,
  ref: string,
  reason?: string
): Promise<Result<DraftInfo, Error>> {
  const listResult = await listDrafts(sddPath);
  if (!listResult.success) return listResult;

  const draftResult = resolveDraft(listResult.data, ref);
  if (!draftResult.success) return draftResult;

  return setReview(sddPath, draftResult.data, 'rejected', reason);
}

const STATUS_LABEL: Record<DraftStatus, string> = {
  pending: chalk.yellow('대기'),
  approved: chalk.green('승인'),
  rejected: chalk.red('거부'),
};

/**
 * 초안 목록 텍스트 포맷
 */
export function formatDraftList(drafts: DraftInfo[]): string {
  const lines: string[] = ['', chalk.bold(`📋 역추출 초안 (${drafts.length}개)`), '─'.repeat(50)];

  for (const draft of drafts) {
    const validity = draft.valid
      ? chalk.green('✓ 유효')
      : chalk.red(`✗ 에러 ${draft.errors.length}개`);
    const warnings = draft.warnings.length > 0 ? chalk.yellow(` · 경고 ${draft.warnings.length}개`) : '';
    const title = draft.title ? chalk.dim(` - ${draft.title}`) : '';
    lines.push(`   [${STATUS_LABEL[draft.status]}] ${chalk.cyan(draft.id)}${title}  ${validity}${warnings}`);
    if (draft.modifiedSinceReview) {
      lines.push(chalk.dim('          리뷰 이후 수정됨 → 다시 리뷰가 필요합니다'));
    }
    if (draft.reason) {
      lines.push(chalk.dim(`          거부 사유: ${draft.reason}`));
    }
    for (const error of draft.errors) {
      lines.push(chalk.red(`          - ${error.message}`));
    }
  }

  const count = (s: DraftStatus) => drafts.filter((d) => d.status === s).length;
  lines.push('');
  lines.push(`   대기 ${count('pending')} · 승인 ${count('approved')} · 거부 ${count('rejected')}`);
  lines.push('');
  return lines.join('\n');
}

/**
 * 초안 상세 텍스트 포맷 (검증 결과 + 본문)
 */
export async function formatDraftDetail(draft: DraftInfo): Promise<string> {
  const content = await fs.readFile(draft.specPath, 'utf-8');
  const lines: string[] = [
    '',
    chalk.bold(`📄 ${draft.id}`) + (draft.title ? ` - ${draft.title}` : ''),
    '─'.repeat(50),
    `   상태: ${STATUS_LABEL[draft.status]}${draft.modifiedSinceReview ? chalk.dim(' (리뷰 이후 수정됨)') : ''}`,
    `   파일: ${draft.specPath}`,
    `   검증: ${draft.valid ? chalk.green('통과') : chalk.red('실패')}`,
  ];
  if (draft.reason) lines.push(`   거부 사유: ${draft.reason}`);
  for (const error of draft.errors) lines.push(chalk.red(`   ✗ ${error.message}`));
  for (const warning of draft.warnings) lines.push(chalk.yellow(`   ⚠ ${warning.message}`));
  lines.push('─'.repeat(50), '', content.trimEnd(), '');
  return lines.join('\n');
}
