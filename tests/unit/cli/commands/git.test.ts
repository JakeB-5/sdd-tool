/**
 * git 명령어 유닛 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
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

const execFileAsync = promisify(execFile);

async function gitInit(dir: string): Promise<void> {
  await execFileAsync('git', ['init'], { cwd: dir });
  await fs.mkdir(path.join(dir, '.git', 'hooks'), { recursive: true });
}

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

    it('validate에 존재하지 않는 --ci 옵션을 넘기지 않는다 (#2)', () => {
      expect(generatePreCommitHook()).not.toMatch(/sdd validate[^\n]*--ci/);
      expect(generatePrePushHook()).not.toMatch(/sdd validate[^\n]*--ci/);
    });
  });

  describe('POSIX sh 호환성', () => {
    const hooks = [generatePreCommitHook(), generateCommitMsgHook(), generatePrePushHook()];

    it('bash 전용 리다이렉션(&>)을 사용하지 않는다', () => {
      for (const hook of hooks) {
        expect(hook).not.toContain('&>');
      }
      expect(generatePreCommitHook()).toContain('command -v sdd >/dev/null 2>&1');
      expect(generatePrePushHook()).toContain('command -v sdd >/dev/null 2>&1');
    });

    it('sdd가 없으면 pre-push 훅이 검증을 건너뛰고 0으로 종료한다', () => {
      // Run with a PATH that lacks sdd; the hook must exit 0 instead of 127
      const output = execFileSync('/bin/sh', ['-c', generatePrePushHook()], {
        env: { PATH: '/usr/bin:/bin' },
        encoding: 'utf-8',
      });
      expect(output).toContain('sdd 명령어를 찾을 수 없습니다');
      // Colors must be real escape bytes, not the literal text "\033" that `echo` prints under some /bin/sh
      expect(output).not.toContain('\\033');
      expect(output).toContain('\u001b[1;33m');
    });

    it('색상 출력에 echo 대신 printf를 사용한다', () => {
      for (const hook of hooks) {
        expect(hook).not.toMatch(/echo\s+"\$\{(RED|GREEN|YELLOW)\}/);
      }
    });

    it('commit-msg 훅이 이스케이프 문자를 깨뜨리지 않고 존재하는 안내 링크를 출력한다', async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-commitmsg-test-'));
      try {
        const msgFile = path.join(dir, 'MSG');
        const run = async (message: string) => {
          await fs.writeFile(msgFile, message);
          try {
            const stdout = execFileSync('/bin/sh', ['-c', generateCommitMsgHook(), 'commit-msg', msgFile], {
              encoding: 'utf-8',
            });
            return { code: 0, stdout };
          } catch (error) {
            const e = error as { status: number; stdout: string };
            return { code: e.status, stdout: e.stdout };
          }
        };

        const ok = await run('feat(auth): add login\n');
        expect(ok.code).toBe(0);
        expect(ok.stdout).not.toContain('\\033');
        expect(ok.stdout).toContain('\u001b[0;32m');

        const bad = await run('wip stuff\n');
        expect(bad.code).toBe(1);
        expect(bad.stdout).not.toContain('\\033');
        expect(bad.stdout).not.toContain('docs/guide/commit-convention.md');
        expect(bad.stdout).toContain('https://jakeb-5.github.io/sdd-tool/ko/guide/commit-convention');
      } finally {
        await fs.rm(dir, { recursive: true, force: true });
      }
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
  const savedGitEnv = {
    GIT_CONFIG_GLOBAL: process.env.GIT_CONFIG_GLOBAL,
    GIT_CONFIG_NOSYSTEM: process.env.GIT_CONFIG_NOSYSTEM,
  };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-git-test-'));
    // Isolate from the developer's global/system git config (e.g. core.hooksPath)
    process.env.GIT_CONFIG_GLOBAL = path.join(tempDir, '.gitconfig-isolated');
    process.env.GIT_CONFIG_NOSYSTEM = '1';
  });

  afterEach(async () => {
    for (const [key, value] of Object.entries(savedGitEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
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
      await gitInit(tempDir);

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
      await gitInit(tempDir);
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
      await gitInit(tempDir);
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

    it('force 설치를 반복해도 사용자 원본 훅 백업을 덮어쓰지 않는다', async () => {
      await gitInit(tempDir);
      const hookPath = path.join(tempDir, '.git', 'hooks', 'pre-commit');
      await fs.writeFile(hookPath, '#!/bin/sh\necho user-original');

      const first = await installHooks(tempDir, { force: true });
      const second = await installHooks(tempDir, { force: true });

      expect(first.success && first.data.backedUp).toContain('pre-commit');
      expect(second.success && second.data.backedUp).not.toContain('pre-commit');

      const uninstall = await uninstallHooks(tempDir);
      expect(uninstall.success).toBe(true);
      expect(await fs.readFile(hookPath, 'utf-8')).toContain('user-original');
    });

    it('core.hooksPath가 저장소 밖을 가리키면 설치를 거부한다', async () => {
      await gitInit(tempDir);
      const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-global-hooks-'));
      try {
        await execFileAsync('git', ['config', 'core.hooksPath', outsideDir], { cwd: tempDir });

        const result = await installHooks(tempDir);
        const uninstall = await uninstallHooks(tempDir);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toContain('core.hooksPath');
        }
        expect(uninstall.success).toBe(false);
        expect(await fs.readdir(outsideDir)).toEqual([]);
      } finally {
        await fs.rm(outsideDir, { recursive: true, force: true });
      }
    });

    it('core.hooksPath가 저장소 내부 경로면 그곳에 설치한다', async () => {
      await gitInit(tempDir);
      await execFileAsync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: tempDir });

      const result = await installHooks(tempDir);

      expect(result.success).toBe(true);
      const content = await fs.readFile(path.join(tempDir, '.githooks', 'pre-commit'), 'utf-8');
      expect(content).toContain('# SDD pre-commit hook');
    });

    it('git worktree에서도 공통 hooks 디렉토리에 설치한다', async () => {
      await gitInit(tempDir);
      await execFileAsync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
      await execFileAsync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
      await execFileAsync('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: tempDir });
      const worktreeDir = path.join(tempDir, 'wt');
      await execFileAsync('git', ['worktree', 'add', worktreeDir, '-b', 'wt-branch'], {
        cwd: tempDir,
      });

      const result = await installHooks(worktreeDir);

      expect(result.success).toBe(true);
      const content = await fs.readFile(path.join(tempDir, '.git', 'hooks', 'pre-commit'), 'utf-8');
      expect(content).toContain('# SDD pre-commit hook');
    });
  });

  describe('uninstallHooks', () => {
    it('Git 저장소가 아니면 실패한다', async () => {
      const result = await uninstallHooks(tempDir);

      expect(result.success).toBe(false);
    });

    it('설치된 훅을 제거한다', async () => {
      await gitInit(tempDir);
      await fs.writeFile(
        path.join(tempDir, '.git', 'hooks', 'pre-commit'),
        generatePreCommitHook()
      );
      await fs.writeFile(
        path.join(tempDir, '.git', 'hooks', 'commit-msg'),
        generateCommitMsgHook()
      );

      const result = await uninstallHooks(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.removed).toContain('pre-commit');
        expect(result.data.removed).toContain('commit-msg');
      }

      // 파일이 삭제되었는지 확인
      await expect(
        fs.access(path.join(tempDir, '.git', 'hooks', 'pre-commit'))
      ).rejects.toThrow();
    });

    it('SDD 마커가 없는 훅은 삭제하지 않고 건너뛴다', async () => {
      await gitInit(tempDir);
      const hookPath = path.join(tempDir, '.git', 'hooks', 'pre-commit');
      await fs.writeFile(hookPath, '#!/bin/sh\necho user-hook');
      await fs.writeFile(
        path.join(tempDir, '.git', 'hooks', 'pre-commit.backup'),
        '#!/bin/sh\necho original'
      );

      const result = await uninstallHooks(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.removed).not.toContain('pre-commit');
        expect(result.data.skipped).toContain('pre-commit');
      }
      expect(await fs.readFile(hookPath, 'utf-8')).toContain('user-hook');
    });

    it('백업 파일이 있으면 복원한다', async () => {
      await gitInit(tempDir);
      await fs.writeFile(
        path.join(tempDir, '.git', 'hooks', 'pre-commit'),
        generatePreCommitHook()
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
      await gitInit(tempDir);

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
