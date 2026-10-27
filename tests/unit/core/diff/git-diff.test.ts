/**
 * GitDiff 보안/에러 처리 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GitDiff } from '../../../../src/core/diff/git-diff.js';
import { executeDiff } from '../../../../src/core/diff/index.js';

const execFileAsync = promisify(execFile);

describe('GitDiff', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-git-diff-test-'));
    specsDir = path.join(tempDir, '.sdd', 'specs');
    await fs.mkdir(path.join(specsDir, 'auth'), { recursive: true });
    await fs.writeFile(path.join(specsDir, 'auth', 'spec.md'), '# Auth\n');

    await execFileAsync('git', ['init'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
    await execFileAsync('git', ['add', '.'], { cwd: tempDir });
    await execFileAsync('git', ['commit', '-m', 'Initial'], { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('존재하지 않는 커밋 참조는 실패를 반환한다', async () => {
    const result = await new GitDiff(tempDir).getChangedSpecFiles({ commit1: 'badref' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('git diff 실행 실패');
    }
  });

  it('셸 메타문자가 포함된 커밋 참조를 셸로 실행하지 않는다', async () => {
    const result = await new GitDiff(tempDir).getChangedSpecFiles({
      commit1: 'HEAD;touch PWNED',
    });

    expect(result.success).toBe(false);
    expect(existsSync(path.join(tempDir, 'PWNED'))).toBe(false);
  });

  it('스펙 경로의 셸 메타문자를 실행하지 않는다', async () => {
    const result = await new GitDiff(tempDir).getChangedSpecFiles({
      specPath: 'auth"; touch PWNED; echo "',
    });

    expect(result.success).toBe(true);
    expect(existsSync(path.join(tempDir, 'PWNED'))).toBe(false);
  });

  it("'-'로 시작하는 커밋 참조(옵션 주입)는 거부한다", async () => {
    const outFile = path.join(tempDir, 'out.txt');
    const result = await new GitDiff(tempDir).getChangedSpecFiles({
      commit1: `--output=${outFile}`,
    });

    expect(result.success).toBe(false);
    expect(existsSync(outFile)).toBe(false);
  });

  it('비ASCII 파일 경로를 따옴표 없이 반환한다', async () => {
    const dir = path.join(specsDir, '인증');
    await fs.mkdir(dir);
    await fs.writeFile(path.join(dir, 'spec.md'), '# 인증\n');
    await execFileAsync('git', ['add', '.'], { cwd: tempDir });

    const result = await new GitDiff(tempDir).getChangedSpecFiles({ staged: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        { path: '.sdd/specs/인증/spec.md', status: 'added' },
      ]);
    }
  });

  it('executeDiff는 잘못된 커밋 참조에 대해 실패를 반환한다', async () => {
    const result = await executeDiff(tempDir, { commit1: 'badref' });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('GIT_DIFF_FAILED');
  });
});
