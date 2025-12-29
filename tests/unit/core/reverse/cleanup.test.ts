/**
 * cleanup 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import {
  cleanupReverseFiles,
  archiveReverseData,
  formatCleanupResult,
  generateCommitMessage,
  getCleanupStatus,
  deleteDraftSpec,
  resetReverseData,
  type CleanupResult,
} from '../../../../src/core/reverse/cleanup.js';

describe('cleanup', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-cleanup-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('cleanupReverseFiles', () => {
    it('역추출 임시 파일을 정리한다', async () => {
      // 테스트 파일 생성
      const draftsPath = path.join(sddPath, '.reverse-drafts', 'auth');
      await fs.mkdir(draftsPath, { recursive: true });
      await fs.writeFile(path.join(draftsPath, 'login.md'), 'test content');
      await fs.writeFile(path.join(draftsPath, 'login.json'), '{}');

      const reviewPath = path.join(sddPath, '.reverse-review');
      await fs.mkdir(reviewPath, { recursive: true });
      await fs.writeFile(path.join(reviewPath, 'state.json'), '{}');

      const metaPath = path.join(sddPath, '.reverse-meta.json');
      await fs.writeFile(metaPath, '{}');

      const result = await cleanupReverseFiles(sddPath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deletedDirs).toBeGreaterThan(0);
        expect(result.data.deletedFiles).toBeGreaterThan(0);
      }
    });

    it('dryRun 옵션으로 실제 삭제 없이 미리보기한다', async () => {
      const draftsPath = path.join(sddPath, '.reverse-drafts', 'auth');
      await fs.mkdir(draftsPath, { recursive: true });
      await fs.writeFile(path.join(draftsPath, 'login.md'), 'test content');

      const result = await cleanupReverseFiles(sddPath, { dryRun: true });

      expect(result.success).toBe(true);

      // 파일이 여전히 존재해야 함
      const exists = await fs.access(path.join(draftsPath, 'login.md'))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('특정 도메인만 정리한다', async () => {
      // auth 도메인 파일
      const authPath = path.join(sddPath, '.reverse-drafts', 'auth');
      await fs.mkdir(authPath, { recursive: true });
      await fs.writeFile(path.join(authPath, 'login.md'), 'auth content');

      // core 도메인 파일
      const corePath = path.join(sddPath, '.reverse-drafts', 'core');
      await fs.mkdir(corePath, { recursive: true });
      await fs.writeFile(path.join(corePath, 'utils.md'), 'core content');

      const result = await cleanupReverseFiles(sddPath, { domain: 'auth' });

      expect(result.success).toBe(true);

      // auth는 삭제됨
      const authExists = await fs.access(authPath)
        .then(() => true)
        .catch(() => false);
      expect(authExists).toBe(false);

      // core는 남아있음
      const coreExists = await fs.access(corePath)
        .then(() => true)
        .catch(() => false);
      expect(coreExists).toBe(true);
    });

    it('archive 옵션으로 아카이브를 생성한다', async () => {
      const draftsPath = path.join(sddPath, '.reverse-drafts', 'auth');
      await fs.mkdir(draftsPath, { recursive: true });
      await fs.writeFile(path.join(draftsPath, 'login.md'), 'test content');

      const result = await cleanupReverseFiles(sddPath, { archive: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.archived.length).toBe(1);
      }
    });
  });

  describe('archiveReverseData', () => {
    it('역추출 데이터를 아카이브한다', async () => {
      const draftsPath = path.join(sddPath, '.reverse-drafts', 'auth');
      await fs.mkdir(draftsPath, { recursive: true });
      await fs.writeFile(path.join(draftsPath, 'login.md'), 'test content');

      const metaPath = path.join(sddPath, '.reverse-meta.json');
      await fs.writeFile(metaPath, '{"version": "1.0"}');

      const result = await archiveReverseData(sddPath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('.reverse-archives');

        // 아카이브 디렉토리 확인
        const archiveExists = await fs.access(result.data)
          .then(() => true)
          .catch(() => false);
        expect(archiveExists).toBe(true);
      }
    });
  });

  describe('getCleanupStatus', () => {
    it('정리 대상 상태를 반환한다', async () => {
      const draftsPath = path.join(sddPath, '.reverse-drafts', 'auth');
      await fs.mkdir(draftsPath, { recursive: true });
      await fs.writeFile(path.join(draftsPath, 'login.md'), 'test content');

      const result = await getCleanupStatus(sddPath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targets.length).toBeGreaterThan(0);
        expect(result.data.totalSize).toBeGreaterThan(0);
      }
    });

    it('빈 디렉토리에서 빈 상태를 반환한다', async () => {
      const result = await getCleanupStatus(sddPath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targets.length).toBe(0);
        expect(result.data.totalSize).toBe(0);
      }
    });
  });

  describe('deleteDraftSpec', () => {
    it('특정 스펙의 초안을 삭제한다', async () => {
      const draftsPath = path.join(sddPath, '.reverse-drafts', 'auth');
      await fs.mkdir(draftsPath, { recursive: true });
      await fs.writeFile(path.join(draftsPath, 'login.md'), 'test');
      await fs.writeFile(path.join(draftsPath, 'login.json'), '{}');
      await fs.writeFile(path.join(draftsPath, 'logout.md'), 'other');

      const result = await deleteDraftSpec(sddPath, 'auth/login');

      expect(result.success).toBe(true);

      // login 파일들은 삭제됨
      const loginMdExists = await fs.access(path.join(draftsPath, 'login.md'))
        .then(() => true)
        .catch(() => false);
      expect(loginMdExists).toBe(false);

      // logout은 남아있음
      const logoutExists = await fs.access(path.join(draftsPath, 'logout.md'))
        .then(() => true)
        .catch(() => false);
      expect(logoutExists).toBe(true);
    });
  });

  describe('formatCleanupResult', () => {
    it('정리 결과를 포맷팅한다', () => {
      const result: CleanupResult = {
        deletedFiles: 5,
        deletedDirs: 2,
        archived: ['/path/to/archive'],
        skipped: ['some-file'],
        errors: [],
        freedSpace: 10240, // 10 KB
      };

      const formatted = formatCleanupResult(result);

      expect(formatted).toContain('정리 완료');
      expect(formatted).toContain('파일: 5개');
      expect(formatted).toContain('디렉토리: 2개');
      expect(formatted).toContain('10.00 KB');
    });

    it('dryRun 미리보기를 포맷팅한다', () => {
      const result: CleanupResult = {
        deletedFiles: 3,
        deletedDirs: 1,
        archived: [],
        skipped: [],
        errors: [],
        freedSpace: 5120,
      };

      const formatted = formatCleanupResult(result, true);

      expect(formatted).toContain('정리 미리보기');
      expect(formatted).toContain('삭제 예정');
    });
  });

  describe('generateCommitMessage', () => {
    it('Git 커밋 메시지를 생성한다', () => {
      const result: CleanupResult = {
        deletedFiles: 10,
        deletedDirs: 3,
        archived: [],
        skipped: [],
        errors: [],
        freedSpace: 1048576, // 1 MB
      };

      const message = generateCommitMessage(result);

      expect(message).toContain('역추출 임시 파일 정리');
      expect(message).toContain('10개 파일');
      expect(message).toContain('3개 디렉토리');
      expect(message).toContain('1.00 MB');
    });
  });

  describe('resetReverseData', () => {
    it('모든 역추출 데이터를 리셋한다', async () => {
      const draftsPath = path.join(sddPath, '.reverse-drafts', 'auth');
      await fs.mkdir(draftsPath, { recursive: true });
      await fs.writeFile(path.join(draftsPath, 'login.md'), 'test');

      const reviewPath = path.join(sddPath, '.reverse-review');
      await fs.mkdir(reviewPath, { recursive: true });
      await fs.writeFile(path.join(reviewPath, 'state.json'), '{}');

      const result = await resetReverseData(sddPath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deletedDirs + result.data.deletedFiles).toBeGreaterThan(0);
      }
    });
  });
});
