/**
 * 변경 아카이브 기능
 */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { success, failure, Result } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { directoryExists, ensureDir, copyDir, removeDir } from '../../utils/fs.js';
import { parseProposal, updateProposalStatus } from './proposal.js';

/**
 * 아카이브 결과
 */
export interface ArchiveResult {
  sourceDir: string;
  archiveDir: string;
  archivedAt: string;
  changeId: string;
}

/**
 * 변경 아카이브
 */
export async function archiveChange(
  sddPath: string,
  changeId: string
): Promise<Result<ArchiveResult, ChangeError>> {
  try {
    const changesPath = path.join(sddPath, 'changes');
    const archivePath = path.join(sddPath, 'archive');

    // 변경 디렉토리 확인
    const sourceDir = path.join(changesPath, changeId);
    if (!(await directoryExists(sourceDir))) {
      return failure(new ChangeError(`변경 디렉토리를 찾을 수 없습니다: ${changeId}`));
    }

    // 아카이브 디렉토리 생성
    const today = new Date();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const archiveMonthDir = path.join(archivePath, yearMonth);
    await ensureDir(archiveMonthDir);

    // 날짜 프리픽스로 아카이브
    const datePrefix = today.toISOString().split('T')[0];
    const archiveDir = path.join(archiveMonthDir, `${datePrefix}-${changeId}`);

    // 디렉토리 복사
    const copyResult = await copyDir(sourceDir, archiveDir);
    if (!copyResult.success) {
      return failure(new ChangeError(`아카이브 복사 실패: ${copyResult.error?.message}`));
    }

    // proposal.md 상태 업데이트
    const proposalPath = path.join(archiveDir, 'proposal.md');
    try {
      const proposalContent = await fs.readFile(proposalPath, 'utf-8');
      const updateResult = updateProposalStatus(proposalContent, 'archived');
      if (updateResult.success) {
        await fs.writeFile(proposalPath, updateResult.data);
      }
    } catch {
      // proposal.md가 없을 수 있음
    }

    // 원본 디렉토리 삭제
    const removeResult = await removeDir(sourceDir);
    if (!removeResult.success) {
      return failure(new ChangeError(`원본 디렉토리 삭제 실패: ${removeResult.error?.message}`));
    }

    return success({
      sourceDir,
      archiveDir,
      archivedAt: today.toISOString(),
      changeId,
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `아카이브 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * 아카이브 목록 조회
 */
export interface ArchivedChange {
  id: string;
  path: string;
  archivedAt: string;
  title?: string;
}

export async function listArchives(
  sddPath: string
): Promise<Result<ArchivedChange[], ChangeError>> {
  try {
    const archivePath = path.join(sddPath, 'archive');

    if (!(await directoryExists(archivePath))) {
      return success([]);
    }

    const archives: ArchivedChange[] = [];

    // 월별 디렉토리 순회
    const months = await fs.readdir(archivePath);
    for (const month of months) {
      const monthPath = path.join(archivePath, month);
      const stat = await fs.stat(monthPath);
      if (!stat.isDirectory()) continue;

      // 변경 디렉토리 순회
      const changes = await fs.readdir(monthPath);
      for (const change of changes) {
        const changePath = path.join(monthPath, change);
        const changeStat = await fs.stat(changePath);
        if (!changeStat.isDirectory()) continue;

        // ID 추출 (YYYY-MM-DD-CHG-XXX 형식)
        const idMatch = change.match(/\d{4}-\d{2}-\d{2}-(CHG-\d+)/);
        const id = idMatch ? idMatch[1] : change;

        // 날짜 추출
        const dateMatch = change.match(/^(\d{4}-\d{2}-\d{2})/);
        const archivedAt = dateMatch ? dateMatch[1] : month;

        // 제목 추출 (proposal.md에서)
        let title: string | undefined;
        try {
          const proposalPath = path.join(changePath, 'proposal.md');
          const proposalContent = await fs.readFile(proposalPath, 'utf-8');
          const parseResult = parseProposal(proposalContent);
          if (parseResult.success) {
            title = parseResult.data.title;
          }
        } catch {
          // proposal.md가 없을 수 있음
        }

        archives.push({
          id,
          path: changePath,
          archivedAt,
          title,
        });
      }
    }

    // 날짜 역순 정렬
    archives.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));

    return success(archives);
  } catch (error) {
    return failure(
      new ChangeError(
        `아카이브 목록 조회 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * 진행 중인 변경 목록 조회
 */
export interface PendingChange {
  id: string;
  path: string;
  status: string;
  title?: string;
  createdAt?: string;
}

export async function listPendingChanges(
  sddPath: string
): Promise<Result<PendingChange[], ChangeError>> {
  try {
    const changesPath = path.join(sddPath, 'changes');

    if (!(await directoryExists(changesPath))) {
      return success([]);
    }

    const changes: PendingChange[] = [];

    const dirs = await fs.readdir(changesPath);
    for (const dir of dirs) {
      const changePath = path.join(changesPath, dir);
      const stat = await fs.stat(changePath);
      if (!stat.isDirectory()) continue;

      // proposal.md에서 정보 추출
      let status = 'draft';
      let title: string | undefined;
      let createdAt: string | undefined;

      try {
        const proposalPath = path.join(changePath, 'proposal.md');
        const proposalContent = await fs.readFile(proposalPath, 'utf-8');
        const parseResult = parseProposal(proposalContent);
        if (parseResult.success) {
          status = parseResult.data.metadata.status;
          title = parseResult.data.title;
          createdAt = parseResult.data.metadata.created;
        }
      } catch {
        // proposal.md가 없을 수 있음
      }

      changes.push({
        id: dir,
        path: changePath,
        status,
        title,
        createdAt,
      });
    }

    // 생성일 역순 정렬
    changes.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return success(changes);
  } catch (error) {
    return failure(
      new ChangeError(
        `변경 목록 조회 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}
