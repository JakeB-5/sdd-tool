/**
 * 역추출 초안 확정
 *
 * 승인된 초안을 `.sdd/specs/<domain>/<feature>/spec.md`로 이동하고
 * 도메인을 `sdd new --domain`과 같은 방식(domains.yml 등록 + 스펙 연결)으로 등록합니다.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import { Result, success, failure } from '../../types/index.js';
import { createDomainService } from '../domain/service.js';
import {
  DRAFTS_DIR,
  getDraftsDir,
  isPathInside,
  listDrafts,
  loadReviewState,
  resolveDraft,
  saveReviewState,
  type DraftInfo,
} from './drafts.js';

export interface FinalizeOptions {
  /** Draft reference; all approved drafts when omitted */
  ref?: string;
  /** Overwrite an existing spec */
  force?: boolean;
}

export interface FinalizedDraft {
  id: string;
  /** Spec path relative to the project root */
  specPath: string;
  domainCreated: boolean;
  overwritten: boolean;
}

export interface FinalizeResult {
  finalized: FinalizedDraft[];
  skipped: Array<{ id: string; reason: string }>;
  errors: Array<{ id: string; error: string }>;
  /** Non-fatal problems after a spec was written (domain link, draft cleanup) */
  warnings: Array<{ id: string; message: string }>;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * 도메인 등록 확인 (없으면 생성) 후 스펙 연결
 */
async function registerDomain(
  projectRoot: string,
  domain: string,
  feature: string
): Promise<Result<boolean, Error>> {
  const service = createDomainService(projectRoot);
  const existing = await service.get(domain);
  if (!existing.success) return existing;

  let created = false;
  if (!existing.data) {
    const createResult = await service.create(domain, {
      description: `${domain} 도메인 (reverse finalize로 등록)`,
    });
    if (!createResult.success) return createResult;
    created = true;
  }

  const linkResult = await service.linkSpec(domain, feature);
  if (!linkResult.success) return linkResult;
  return success(created);
}

/**
 * Real path of p, resolving symlinks of the nearest existing ancestor
 */
async function realpathOfPossiblyMissing(p: string): Promise<string> {
  const missing: string[] = [];
  let current = path.resolve(p);
  for (;;) {
    try {
      return path.join(await fs.realpath(current), ...missing);
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return path.resolve(p);
      missing.unshift(path.basename(current));
      current = parent;
    }
  }
}

/**
 * Refuse to finalize when source and target overlap through symlinks
 * (e.g. a drafts directory linked into .sdd/specs).
 */
async function checkPathsDisjoint(
  draftsDir: string,
  sourcePath: string,
  targetDir: string
): Promise<string | null> {
  const [realDrafts, realSource, realTargetDir] = await Promise.all([
    fs.realpath(draftsDir),
    fs.realpath(sourcePath),
    realpathOfPossiblyMissing(targetDir),
  ]);
  if (!isPathInside(realSource, realDrafts)) {
    return `초안이 ${DRAFTS_DIR} 밖의 파일을 가리킵니다 (심볼릭 링크)`;
  }
  if (realTargetDir === realDrafts || isPathInside(realTargetDir, realDrafts) || isPathInside(realDrafts, realTargetDir)) {
    return `확정 대상 경로가 ${DRAFTS_DIR}와 겹칩니다 (심볼릭 링크): ${realTargetDir}`;
  }
  return null;
}

/**
 * Remove a finalized draft: unlink spec.md, then remove now-empty directories.
 * Never removes recursively. Returns warning messages.
 */
async function removeDraft(specPath: string): Promise<string[]> {
  const warnings: string[] = [];
  try {
    await fs.unlink(specPath);
  } catch (error) {
    return [`초안 파일 삭제 실패: ${(error as Error).message}`];
  }

  const draftDir = path.dirname(specPath);
  for (const dir of [draftDir, path.dirname(draftDir)]) {
    try {
      await fs.rmdir(dir);
    } catch (error) {
      if (dir === draftDir) {
        const code = (error as NodeJS.ErrnoException).code;
        warnings.push(
          code === 'ENOTEMPTY' || code === 'EEXIST'
            ? `초안 디렉토리에 다른 파일이 남아 있어 유지합니다: ${draftDir}`
            : `초안 디렉토리 삭제 실패: ${(error as Error).message}`
        );
      }
      break;
    }
  }
  return warnings;
}

async function finalizeOne(
  projectRoot: string,
  draft: DraftInfo,
  force: boolean,
  result: FinalizeResult
): Promise<boolean> {
  // Domain is non-null for valid drafts (validated at approval time)
  const domain = draft.domain as string;
  const draftsDir = getDraftsDir(path.join(projectRoot, '.sdd'));
  const targetDir = path.join(projectRoot, '.sdd', 'specs', domain, draft.feature);
  const targetPath = path.join(targetDir, 'spec.md');
  const exists = await pathExists(targetPath);

  if (exists && !force) {
    result.skipped.push({
      id: draft.id,
      reason: `이미 스펙이 존재합니다: ${path.relative(projectRoot, targetPath)} (덮어쓰려면 --force)`,
    });
    return false;
  }

  // 1. Copy (nothing else is touched when this fails)
  try {
    const overlap = await checkPathsDisjoint(draftsDir, draft.specPath, targetDir);
    if (overlap) {
      result.errors.push({ id: draft.id, error: overlap });
      return false;
    }
    await fs.mkdir(targetDir, { recursive: true });
    await fs.copyFile(draft.specPath, targetPath);
  } catch (error) {
    result.errors.push({ id: draft.id, error: `스펙 복사 실패: ${(error as Error).message}` });
    return false;
  }

  // 2. Register domain and link spec (the spec already exists, so failures are warnings)
  let domainCreated = false;
  try {
    const domainResult = await registerDomain(projectRoot, domain, draft.feature);
    if (domainResult.success) {
      domainCreated = domainResult.data;
    } else {
      result.warnings.push({
        id: draft.id,
        message: `도메인 등록/연결 실패: ${domainResult.error.message} (sdd domain으로 직접 등록하세요)`,
      });
    }
  } catch (error) {
    result.warnings.push({ id: draft.id, message: `도메인 등록/연결 실패: ${(error as Error).message}` });
  }

  // 3. Remove the draft
  for (const message of await removeDraft(draft.specPath)) {
    result.warnings.push({ id: draft.id, message });
  }

  result.finalized.push({
    id: draft.id,
    specPath: path.relative(projectRoot, targetPath),
    domainCreated,
    overwritten: exists,
  });
  return true;
}

/**
 * 승인된 초안 확정
 */
export async function finalizeDrafts(
  projectRoot: string,
  options: FinalizeOptions = {}
): Promise<Result<FinalizeResult, Error>> {
  const sddPath = path.join(projectRoot, '.sdd');
  const listResult = await listDrafts(sddPath);
  if (!listResult.success) return listResult;

  let targets: DraftInfo[];
  if (options.ref) {
    const draftResult = resolveDraft(listResult.data, options.ref);
    if (!draftResult.success) return draftResult;
    const draft = draftResult.data;
    if (draft.status !== 'approved') {
      const hint = draft.modifiedSinceReview ? ' (리뷰 이후 수정됨)' : '';
      return failure(
        new Error(`승인되지 않은 초안입니다: ${draft.id}${hint}. \`sdd reverse review ${draft.id} --approve\`로 먼저 승인하세요.`)
      );
    }
    targets = [draft];
  } else {
    targets = listResult.data.filter((d) => d.status === 'approved');
  }

  const result: FinalizeResult = { finalized: [], skipped: [], errors: [], warnings: [] };
  for (const draft of targets) {
    if (!draft.valid) {
      result.errors.push({ id: draft.id, error: '초안 검증 실패' });
      continue;
    }
    await finalizeOne(projectRoot, draft, options.force === true, result);
  }

  // Drop review entries of finalized drafts
  if (result.finalized.length > 0) {
    const stateResult = await loadReviewState(sddPath);
    if (stateResult.success) {
      for (const item of result.finalized) {
        delete stateResult.data.drafts[item.id];
      }
      await saveReviewState(sddPath, stateResult.data);
    }
  }

  return success(result);
}

/**
 * 확정 결과 텍스트 포맷
 */
export function formatFinalizeResult(result: FinalizeResult, projectRoot: string): string {
  const lines: string[] = ['', chalk.bold('📦 역추출 확정 결과'), '─'.repeat(50)];

  for (const item of result.finalized) {
    const notes = [item.domainCreated ? '도메인 생성' : '', item.overwritten ? '덮어씀' : '']
      .filter(Boolean)
      .join(', ');
    lines.push(chalk.green(`   ✓ ${item.id} → ${item.specPath}`) + (notes ? chalk.dim(` (${notes})`) : ''));
  }
  for (const item of result.skipped) {
    lines.push(chalk.yellow(`   ⏭  ${item.id}: ${item.reason}`));
  }
  for (const item of result.errors) {
    lines.push(chalk.red(`   ✗ ${item.id}: ${item.error}`));
  }
  for (const item of result.warnings) {
    lines.push(chalk.yellow(`   ⚠ ${item.id}: ${item.message}`));
  }

  lines.push('');
  lines.push(
    `   확정 ${result.finalized.length} · 건너뜀 ${result.skipped.length} · 실패 ${result.errors.length}`
  );
  if (result.finalized.length === 0 && result.skipped.length === 0 && result.errors.length === 0) {
    lines.push(chalk.dim(`   확정할 승인된 초안이 없습니다 (${path.relative(projectRoot, getDraftsDir(path.join(projectRoot, '.sdd')))})`));
  }
  lines.push('');
  return lines.join('\n');
}
