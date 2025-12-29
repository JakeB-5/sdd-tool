/**
 * 역추출 정리 모듈
 *
 * 역추출 과정에서 생성된 임시 파일을 정리합니다.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import { Result, success, failure } from '../../types/index.js';
import { fileExists, directoryExists } from '../../utils/fs.js';

/**
 * 정리 대상 디렉토리 목록
 */
const CLEANUP_TARGETS = [
  '.reverse-drafts',
  '.reverse-review',
  '.reverse-reports',
] as const;

/**
 * 정리 결과
 */
export interface CleanupResult {
  /** 삭제된 파일 수 */
  deletedFiles: number;
  /** 삭제된 디렉토리 수 */
  deletedDirs: number;
  /** 아카이브된 항목 */
  archived: string[];
  /** 건너뛴 항목 */
  skipped: string[];
  /** 오류 */
  errors: Array<{ path: string; error: string }>;
  /** 해제된 공간 (bytes) */
  freedSpace: number;
}

/**
 * 정리 옵션
 */
export interface CleanupOptions {
  /** 아카이브 생성 여부 */
  archive?: boolean;
  /** 강제 삭제 (확인 없이) */
  force?: boolean;
  /** 메타데이터만 정리 */
  metaOnly?: boolean;
  /** 특정 도메인만 정리 */
  domain?: string;
  /** 드라이런 (실제 삭제 안 함) */
  dryRun?: boolean;
}

/**
 * 정리 대상 정보
 */
export interface CleanupTarget {
  path: string;
  type: 'file' | 'directory';
  size: number;
  lastModified: Date;
}

/**
 * 역추출 임시 파일 정리
 */
export async function cleanupReverseFiles(
  sddPath: string,
  options: CleanupOptions = {}
): Promise<Result<CleanupResult, Error>> {
  const { archive = false, metaOnly = false, domain, dryRun = false } = options;

  const result: CleanupResult = {
    deletedFiles: 0,
    deletedDirs: 0,
    archived: [],
    skipped: [],
    errors: [],
    freedSpace: 0,
  };

  try {
    // 아카이브 생성
    if (archive && !dryRun) {
      const archiveResult = await archiveReverseData(sddPath);
      if (archiveResult.success) {
        result.archived.push(archiveResult.data);
      } else {
        result.errors.push({
          path: 'archive',
          error: archiveResult.error.message,
        });
      }
    }

    // 정리 대상 수집
    const targets = await collectCleanupTargets(sddPath, { metaOnly, domain });

    // 삭제 실행
    for (const target of targets) {
      if (dryRun) {
        result.freedSpace += target.size;
        if (target.type === 'file') {
          result.deletedFiles++;
        } else {
          result.deletedDirs++;
        }
        continue;
      }

      try {
        if (target.type === 'file') {
          await fs.unlink(target.path);
          result.deletedFiles++;
        } else {
          await fs.rm(target.path, { recursive: true, force: true });
          result.deletedDirs++;
        }
        result.freedSpace += target.size;
      } catch (error) {
        result.errors.push({
          path: target.path,
          error: String(error),
        });
      }
    }

    // 빈 디렉토리 정리
    if (!dryRun) {
      await cleanupEmptyDirs(sddPath, CLEANUP_TARGETS);
    }

    return success(result);
  } catch (error) {
    return failure(new Error(`정리 실패: ${error}`));
  }
}

/**
 * 정리 대상 수집
 */
async function collectCleanupTargets(
  sddPath: string,
  options: { metaOnly?: boolean; domain?: string }
): Promise<CleanupTarget[]> {
  const targets: CleanupTarget[] = [];
  const { metaOnly = false, domain } = options;

  for (const targetDir of CLEANUP_TARGETS) {
    const dirPath = path.join(sddPath, targetDir);

    if (!await directoryExists(dirPath)) {
      continue;
    }

    // 메타데이터만 정리하는 경우
    if (metaOnly && targetDir !== '.reverse-review') {
      const metaFile = path.join(sddPath, '.reverse-meta.json');
      if (await fileExists(metaFile)) {
        const stat = await fs.stat(metaFile);
        targets.push({
          path: metaFile,
          type: 'file',
          size: stat.size,
          lastModified: stat.mtime,
        });
      }
      continue;
    }

    // 특정 도메인만 정리하는 경우
    if (domain && targetDir === '.reverse-drafts') {
      const domainPath = path.join(dirPath, domain);
      if (await directoryExists(domainPath)) {
        const size = await getDirSize(domainPath);
        targets.push({
          path: domainPath,
          type: 'directory',
          size,
          lastModified: (await fs.stat(domainPath)).mtime,
        });
      }
      continue;
    }

    // 전체 디렉토리 정리
    const size = await getDirSize(dirPath);
    targets.push({
      path: dirPath,
      type: 'directory',
      size,
      lastModified: (await fs.stat(dirPath)).mtime,
    });
  }

  // 메타 파일
  const metaFile = path.join(sddPath, '.reverse-meta.json');
  if (await fileExists(metaFile)) {
    const stat = await fs.stat(metaFile);
    targets.push({
      path: metaFile,
      type: 'file',
      size: stat.size,
      lastModified: stat.mtime,
    });
  }

  return targets;
}

/**
 * 디렉토리 크기 계산
 */
async function getDirSize(dirPath: string): Promise<number> {
  let size = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        size += await getDirSize(entryPath);
      } else {
        const stat = await fs.stat(entryPath);
        size += stat.size;
      }
    }
  } catch {
    // 무시
  }

  return size;
}

/**
 * 빈 디렉토리 정리
 */
async function cleanupEmptyDirs(
  sddPath: string,
  targets: readonly string[]
): Promise<void> {
  for (const target of targets) {
    const dirPath = path.join(sddPath, target);

    if (!await directoryExists(dirPath)) {
      continue;
    }

    try {
      const entries = await fs.readdir(dirPath);
      if (entries.length === 0) {
        await fs.rmdir(dirPath);
      }
    } catch {
      // 무시
    }
  }
}

/**
 * 역추출 데이터 아카이브
 */
export async function archiveReverseData(
  sddPath: string
): Promise<Result<string, Error>> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveName = `reverse-archive-${timestamp}`;
  const archiveDir = path.join(sddPath, '.reverse-archives', archiveName);

  try {
    await fs.mkdir(archiveDir, { recursive: true });

    // 각 대상 디렉토리 복사
    for (const target of CLEANUP_TARGETS) {
      const sourcePath = path.join(sddPath, target);
      if (await directoryExists(sourcePath)) {
        const destPath = path.join(archiveDir, target);
        await copyDir(sourcePath, destPath);
      }
    }

    // 메타 파일 복사
    const metaFile = path.join(sddPath, '.reverse-meta.json');
    if (await fileExists(metaFile)) {
      await fs.copyFile(metaFile, path.join(archiveDir, '.reverse-meta.json'));
    }

    return success(archiveDir);
  } catch (error) {
    return failure(new Error(`아카이브 생성 실패: ${error}`));
  }
}

/**
 * 디렉토리 복사
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Git 커밋 제안 메시지 생성
 */
export function generateCommitMessage(result: CleanupResult): string {
  const lines: string[] = [];

  lines.push('chore: 역추출 임시 파일 정리');
  lines.push('');
  lines.push('역추출 작업 완료 후 임시 파일을 정리했습니다.');
  lines.push('');

  if (result.deletedFiles > 0 || result.deletedDirs > 0) {
    lines.push(`삭제: ${result.deletedFiles}개 파일, ${result.deletedDirs}개 디렉토리`);
  }

  if (result.archived.length > 0) {
    lines.push(`아카이브: ${result.archived.join(', ')}`);
  }

  const freedMB = (result.freedSpace / 1024 / 1024).toFixed(2);
  lines.push(`해제 공간: ${freedMB} MB`);

  return lines.join('\n');
}

/**
 * 정리 결과 포맷팅
 */
export function formatCleanupResult(result: CleanupResult, dryRun = false): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold(dryRun ? '🔍 정리 미리보기' : '🧹 정리 완료'));
  lines.push('═'.repeat(50));
  lines.push('');

  // 삭제 통계
  if (result.deletedFiles > 0 || result.deletedDirs > 0) {
    lines.push(chalk.green(`${dryRun ? '삭제 예정' : '삭제됨'}:`));
    lines.push(`  파일: ${result.deletedFiles}개`);
    lines.push(`  디렉토리: ${result.deletedDirs}개`);
    lines.push('');
  }

  // 해제 공간
  const freedKB = result.freedSpace / 1024;
  const freedMB = freedKB / 1024;
  const spaceStr = freedMB >= 1
    ? `${freedMB.toFixed(2)} MB`
    : `${freedKB.toFixed(2)} KB`;
  lines.push(`${dryRun ? '해제 예상' : '해제'} 공간: ${spaceStr}`);
  lines.push('');

  // 아카이브
  if (result.archived.length > 0) {
    lines.push(chalk.blue('📁 아카이브:'));
    for (const archive of result.archived) {
      lines.push(`  ${archive}`);
    }
    lines.push('');
  }

  // 오류
  if (result.errors.length > 0) {
    lines.push(chalk.red(`❌ ${result.errors.length}개 오류:`));
    for (const error of result.errors) {
      lines.push(`  ${error.path}: ${error.error}`);
    }
    lines.push('');
  }

  // Git 커밋 제안
  if (!dryRun && (result.deletedFiles > 0 || result.deletedDirs > 0)) {
    lines.push(chalk.bold('💡 Git 커밋 제안:'));
    lines.push('─'.repeat(40));
    lines.push(chalk.dim(generateCommitMessage(result)));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 정리 상태 확인
 */
export async function getCleanupStatus(
  sddPath: string
): Promise<Result<{ targets: CleanupTarget[]; totalSize: number }, Error>> {
  try {
    const targets = await collectCleanupTargets(sddPath, {});
    const totalSize = targets.reduce((sum, t) => sum + t.size, 0);

    return success({ targets, totalSize });
  } catch (error) {
    return failure(new Error(`상태 확인 실패: ${error}`));
  }
}

/**
 * 특정 스펙의 초안 삭제
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

    // 빈 디렉토리 정리
    if (await directoryExists(draftsPath)) {
      const entries = await fs.readdir(draftsPath);
      if (entries.length === 0) {
        await fs.rmdir(draftsPath);
      }
    }

    return success(undefined);
  } catch (error) {
    return failure(new Error(`초안 삭제 실패: ${error}`));
  }
}

/**
 * 모든 역추출 데이터 리셋
 */
export async function resetReverseData(
  sddPath: string,
  options: { archive?: boolean } = {}
): Promise<Result<CleanupResult, Error>> {
  return cleanupReverseFiles(sddPath, {
    archive: options.archive,
    force: true,
  });
}
