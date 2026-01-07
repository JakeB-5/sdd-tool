/**
 * git 명령어 유닛 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  generatePreCommitHook,
  generateCommitMsgHook,
  generatePrePushHook,
  generateGitMessageTemplate,
  installHooks,
  uninstallHooks,
  installTemplate,
  setupGit,
} from '../../../../src/cli/commands/git.js';

describe('Git Hook Generators', () => {
  describe('generatePreCommitHook', () => {
    it('pre-commit 훅 스크립트를 생성한다', () => {
      const hook = generatePreCommitHook();

      expect(hook).toContain('#!/bin/sh');
      expect(hook).toContain('pre-commit');
      expect(hook).toContain('sdd validate');
      expect(hook).toContain('.sdd/specs/');
    });
  });

  describe('generateCommitMsgHook', () => {
    it('commit-msg 훅 스크립트를 생성한다', () => {
      const hook = generateCommitMsgHook();

      expect(hook).toContain('#!/bin/sh');
      expect(hook).toContain('commit-msg');
      expect(hook).toContain('Conventional Commit');
      expect(hook).toContain('spec');
      expect(hook).toContain('feat');
    });
  });

  describe('generatePrePushHook', () => {
    it('pre-push 훅 스크립트를 생성한다', () => {
      const hook = generatePrePushHook();

      expect(hook).toContain('#!/bin/sh');
      expect(hook).toContain('pre-push');
      expect(hook).toContain('sdd validate');
    });
  });

  describe('generateGitMessageTemplate', () => {
    it('커밋 메시지 템플릿을 생성한다', () => {
      const template = generateGitMessageTemplate();

      expect(template).toContain('<type>(<scope>): <subject>');
      expect(template).toContain('spec');
      expect(template).toContain('feat');
      expect(template).toContain('Refs:');
    });
  });
});

describe('Git Hook Installation', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-git-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('installHooks', () => {
    it('Git 저장소가 아니면 실패한다', async () => {
      const result = await installHooks(tempDir);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Git 저장소가 아닙니다');
      }
    });

    it('hooks 디렉토리에 훅을 설치한다', async () => {
      // .git 디렉토리 생성
      await fs.mkdir(path.join(tempDir, '.git'), { recursive: true });

      const result = await installHooks(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installed).toContain('pre-commit');
        expect(result.data.installed).toContain('commit-msg');
        expect(result.data.installed).toContain('pre-push');
      }

      // 훅 파일 확인
      const preCommitPath = path.join(tempDir, '.git', 'hooks', 'pre-commit');
      const content = await fs.readFile(preCommitPath, 'utf-8');
      expect(content).toContain('#!/bin/sh');
    });

    it('기존 훅이 있으면 건너뛴다', async () => {
      await fs.mkdir(path.join(tempDir, '.git', 'hooks'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.git', 'hooks', 'pre-commit'),
        '#!/bin/sh\necho existing'
      );

      const result = await installHooks(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skipped).toContain('pre-commit');
        expect(result.data.installed).not.toContain('pre-commit');
      }
    });

    it('force 옵션으로 기존 훅을 덮어쓴다', async () => {
      await fs.mkdir(path.join(tempDir, '.git', 'hooks'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.git', 'hooks', 'pre-commit'),
        '#!/bin/sh\necho existing'
      );

      const result = await installHooks(tempDir, { force: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installed).toContain('pre-commit');
        expect(result.data.backedUp).toContain('pre-commit');
      }

      // 백업 파일 확인
      const backupPath = path.join(tempDir, '.git', 'hooks', 'pre-commit.backup');
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      expect(backupContent).toContain('existing');
    });
  });

  describe('uninstallHooks', () => {
    it('Git 저장소가 아니면 실패한다', async () => {
      const result = await uninstallHooks(tempDir);

      expect(result.success).toBe(false);
    });

    it('설치된 훅을 제거한다', async () => {
      await fs.mkdir(path.join(tempDir, '.git', 'hooks'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.git', 'hooks', 'pre-commit'),
        '#!/bin/sh\necho hook'
      );
      await fs.writeFile(
        path.join(tempDir, '.git', 'hooks', 'commit-msg'),
        '#!/bin/sh\necho hook'
      );

      const result = await uninstallHooks(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('pre-commit');
        expect(result.data).toContain('commit-msg');
      }

      // 파일이 삭제되었는지 확인
      await expect(
        fs.access(path.join(tempDir, '.git', 'hooks', 'pre-commit'))
      ).rejects.toThrow();
    });

    it('백업 파일이 있으면 복원한다', async () => {
      await fs.mkdir(path.join(tempDir, '.git', 'hooks'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.git', 'hooks', 'pre-commit'),
        '#!/bin/sh\necho new'
      );
      await fs.writeFile(
        path.join(tempDir, '.git', 'hooks', 'pre-commit.backup'),
        '#!/bin/sh\necho original'
      );

      await uninstallHooks(tempDir);

      // 복원 확인
      const content = await fs.readFile(
        path.join(tempDir, '.git', 'hooks', 'pre-commit'),
        'utf-8'
      );
      expect(content).toContain('original');
    });
  });

  describe('installTemplate', () => {
    it('.gitmessage 템플릿을 생성한다', async () => {
      const result = await installTemplate(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installed).toContain('.gitmessage');
      }

      // 파일 확인
      const content = await fs.readFile(path.join(tempDir, '.gitmessage'), 'utf-8');
      expect(content).toContain('<type>');
    });
  });

  describe('setupGit', () => {
    it('hooks와 template을 모두 설치한다', async () => {
      await fs.mkdir(path.join(tempDir, '.git'), { recursive: true });

      const result = await setupGit(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hooks.installed.length).toBeGreaterThan(0);
        expect(result.data.template.installed).toContain('.gitmessage');
      }
    });

    it('Git 저장소가 아니면 실패한다', async () => {
      const result = await setupGit(tempDir);

      expect(result.success).toBe(false);
    });
  });
});
