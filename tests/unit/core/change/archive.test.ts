/**
 * 변경 아카이브 기능 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  archiveChange,
  listArchives,
  listPendingChanges,
} from '../../../../src/core/change/archive.js';

describe('archiveChange', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-archive-'));
    sddPath = tempDir;
    await fs.mkdir(path.join(sddPath, 'changes'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('변경을 아카이브한다', async () => {
    // 변경 디렉토리 생성
    const changeId = 'CHG-001';
    const changeDir = path.join(sddPath, 'changes', changeId);
    await fs.mkdir(changeDir);
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      `---
id: ${changeId}
status: approved
created: 2025-01-01
---

# 변경 제안: 테스트
`
    );

    const result = await archiveChange(sddPath, changeId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changeId).toBe(changeId);
      expect(result.data.archiveDir).toContain('archive');
      // 원본 디렉토리는 삭제됨
      const exists = await fs
        .access(changeDir)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    }
  });

  it('존재하지 않는 변경은 에러를 반환한다', async () => {
    const result = await archiveChange(sddPath, 'nonexistent');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('찾을 수 없습니다');
    }
  });

  it('아카이브에 proposal 상태를 업데이트한다', async () => {
    const changeId = 'CHG-002';
    const changeDir = path.join(sddPath, 'changes', changeId);
    await fs.mkdir(changeDir);
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      `---
id: ${changeId}
status: approved
created: 2025-01-01
---

# 변경 제안: 테스트
`
    );

    const result = await archiveChange(sddPath, changeId);

    expect(result.success).toBe(true);
    if (result.success) {
      const archivedProposal = await fs.readFile(
        path.join(result.data.archiveDir, 'proposal.md'),
        'utf-8'
      );
      expect(archivedProposal).toContain('status: archived');
    }
  });
});

describe('listArchives', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-list-archive-'));
    sddPath = tempDir;
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('아카이브 디렉토리가 없으면 빈 배열을 반환한다', async () => {
    const result = await listArchives(sddPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it('아카이브 목록을 반환한다', async () => {
    // 아카이브 디렉토리 구조 생성
    const archivePath = path.join(sddPath, 'archive', '2025-01');
    await fs.mkdir(archivePath, { recursive: true });

    const changeDir = path.join(archivePath, '2025-01-15-CHG-001');
    await fs.mkdir(changeDir);
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      `---
id: CHG-001
status: archived
created: 2025-01-15
---

# 변경 제안: 테스트 기능
`
    );

    const result = await listArchives(sddPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].id).toBe('CHG-001');
      expect(result.data[0].title).toBe('테스트 기능');
    }
  });

  it('여러 아카이브를 날짜 역순으로 정렬한다', async () => {
    // 두 개의 아카이브 생성
    const archivePath = path.join(sddPath, 'archive', '2025-01');
    await fs.mkdir(archivePath, { recursive: true });

    const changeDir1 = path.join(archivePath, '2025-01-10-CHG-001');
    await fs.mkdir(changeDir1);
    await fs.writeFile(path.join(changeDir1, 'proposal.md'), '---\nid: CHG-001\nstatus: archived\n---\n# 변경 제안: 첫번째');

    const changeDir2 = path.join(archivePath, '2025-01-20-CHG-002');
    await fs.mkdir(changeDir2);
    await fs.writeFile(path.join(changeDir2, 'proposal.md'), '---\nid: CHG-002\nstatus: archived\n---\n# 변경 제안: 두번째');

    const result = await listArchives(sddPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
      // 날짜 역순이므로 2025-01-20이 먼저
      expect(result.data[0].archivedAt).toBe('2025-01-20');
    }
  });
});

describe('listPendingChanges', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-pending-'));
    sddPath = tempDir;
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('changes 디렉토리가 없으면 빈 배열을 반환한다', async () => {
    const result = await listPendingChanges(sddPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it('진행 중인 변경 목록을 반환한다', async () => {
    const changesPath = path.join(sddPath, 'changes');
    await fs.mkdir(changesPath, { recursive: true });

    const changeDir = path.join(changesPath, 'CHG-001');
    await fs.mkdir(changeDir);
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      `---
id: CHG-001
status: draft
created: 2025-01-15
---

# 변경 제안: 진행 중인 변경
`
    );

    const result = await listPendingChanges(sddPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].id).toBe('CHG-001');
      expect(result.data[0].status).toBe('draft');
      expect(result.data[0].title).toBe('진행 중인 변경');
    }
  });

  it('proposal.md가 없어도 기본값으로 처리한다', async () => {
    const changesPath = path.join(sddPath, 'changes');
    await fs.mkdir(changesPath, { recursive: true });

    const changeDir = path.join(changesPath, 'CHG-002');
    await fs.mkdir(changeDir);
    // proposal.md 없이 디렉토리만 생성

    const result = await listPendingChanges(sddPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('CHG-002');
      expect(result.data[0].status).toBe('draft'); // 기본값
    }
  });

  it('생성일 역순으로 정렬한다', async () => {
    const changesPath = path.join(sddPath, 'changes');
    await fs.mkdir(changesPath, { recursive: true });

    const changeDir1 = path.join(changesPath, 'CHG-001');
    await fs.mkdir(changeDir1);
    await fs.writeFile(path.join(changeDir1, 'proposal.md'), '---\nid: CHG-001\nstatus: draft\ncreated: 2025-01-10\n---\n# 변경 제안: 첫번째');

    const changeDir2 = path.join(changesPath, 'CHG-002');
    await fs.mkdir(changeDir2);
    await fs.writeFile(path.join(changeDir2, 'proposal.md'), '---\nid: CHG-002\nstatus: draft\ncreated: 2025-01-20\n---\n# 변경 제안: 두번째');

    const result = await listPendingChanges(sddPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
      // 생성일 역순이므로 2025-01-20이 먼저
      expect(result.data[0].createdAt).toBe('2025-01-20');
    }
  });
});
