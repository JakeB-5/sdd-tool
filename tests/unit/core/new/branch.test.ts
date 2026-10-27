/**
 * 브랜치 관리 테스트
 *
 * 참고: Git 명령 주입 방지 테스트는 임시 Git 저장소를 생성하여 실행합니다.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  extractFeatureId,
  BranchError,
  createBranch,
  checkoutBranch,
  deleteBranch,
  branchExists,
} from '../../../../src/core/new/branch.js';

const execFileAsync = promisify(execFile);

describe('extractFeatureId', () => {
  it('feature/name 형식에서 기능 ID를 추출한다', () => {
    expect(extractFeatureId('feature/auth')).toBe('auth');
    expect(extractFeatureId('feature/user-management')).toBe('user-management');
    expect(extractFeatureId('feature/001-oauth')).toBe('001-oauth');
  });

  it('feature/ prefix가 없으면 null을 반환한다', () => {
    expect(extractFeatureId('main')).toBeNull();
    expect(extractFeatureId('develop')).toBeNull();
    expect(extractFeatureId('auth')).toBeNull();
  });

  it('빈 기능 ID는 null을 반환한다', () => {
    // 정규식 ^feature\/(.+)$는 최소 한 글자 이상 필요
    expect(extractFeatureId('feature/')).toBeNull();
  });
});

describe('BranchError', () => {
  it('올바른 에러 타입을 생성한다', () => {
    const error = new BranchError('테스트 에러');

    expect(error.name).toBe('BranchError');
    expect(error.message).toBe('테스트 에러');
    expect(error instanceof Error).toBe(true);
  });
});

describe('git 명령 주입 방지', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-branch-test-'));
    await execFileAsync('git', ['init'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.name', 'Test'], { cwd: tempDir });
    await fs.writeFile(path.join(tempDir, 'README.md'), '# test\n');
    await execFileAsync('git', ['add', '.'], { cwd: tempDir });
    await execFileAsync('git', ['commit', '-m', 'Initial'], { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기능 ID의 셸 메타문자를 실행하지 않는다', async () => {
    const featureId = 'x;touch${IFS}PWNED';
    const result = await createBranch(featureId, { checkout: false, cwd: tempDir });

    expect(result.success).toBe(true);
    expect(existsSync(path.join(tempDir, 'PWNED'))).toBe(false);
    expect(await branchExists(`feature/${featureId}`, tempDir)).toBe(true);
  });

  it('베이스 브랜치의 셸 메타문자를 실행하지 않는다', async () => {
    const result = await createBranch('auth', {
      baseBranch: 'main;touch PWNED',
      cwd: tempDir,
    });

    expect(result.success).toBe(false);
    expect(existsSync(path.join(tempDir, 'PWNED'))).toBe(false);
  });

  it("'-'로 시작하는 베이스 브랜치(옵션 주입)는 거부한다", async () => {
    const result = await createBranch('auth', { baseBranch: '--orphan', cwd: tempDir });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('잘못된 브랜치 이름');
    }
  });

  it("checkoutBranch/deleteBranch는 '-'로 시작하는 이름을 거부한다", async () => {
    const checkout = await checkoutBranch('--detach', tempDir);
    const del = await deleteBranch('--all', { cwd: tempDir });

    expect(checkout.success).toBe(false);
    expect(del.success).toBe(false);
  });
});
