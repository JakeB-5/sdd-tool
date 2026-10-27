/**
 * sdd status 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd status', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-status-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('초기화되지 않은 프로젝트를 감지하고 0이 아닌 코드로 종료한다', async () => {
    const error = await execAsync(`node "${cliPath}" status`, { cwd: tempDir }).then(
      () => null,
      (err: { code?: number; stdout?: string; stderr?: string }) => err
    );

    expect(error).not.toBeNull();
    expect(error?.code).not.toBe(0);
    expect(`${error?.stdout}${error?.stderr}`).toContain('초기화되지 않았습니다');
  });

  it('초기화된 프로젝트 상태를 표시한다', async () => {
    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });

    const { stdout } = await execAsync(
      `node "${cliPath}" status`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('SDD 프로젝트 상태');
    expect(stdout).toContain('constitution.md');
    expect(stdout).toContain('AGENTS.md');
  });

  it('--json 옵션으로 JSON 출력한다', async () => {
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });

    const { stdout } = await execAsync(
      `node "${cliPath}" status --json`,
      { cwd: tempDir }
    );

    const status = JSON.parse(stdout);

    expect(status.initialized).toBe(true);
    expect(status.hasConstitution).toBe(true);
    expect(status.hasAgents).toBe(true);
    expect(status.features).toBeInstanceOf(Array);
  });

  it('기능이 있으면 목록에 표시한다', async () => {
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
    await execAsync(`node "${cliPath}" new auth --no-branch`, { cwd: tempDir });

    const { stdout } = await execAsync(
      `node "${cliPath}" status --verbose`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('기능 목록');
    // 도메인 기반 구조에서 feature ID는 common/auth 형식
    expect(stdout).toContain('common/auth');
  });

  it('다음 단계를 기능 단계별로 안내하고 완료 시 완료를 명시한다', async () => {
    const run = async (args: string) => (await execAsync(`node "${cliPath}" ${args}`, { cwd: tempDir })).stdout;
    await run('init');
    await run('new auth --no-branch');

    let stdout = await run('status');
    expect(stdout).toContain('sdd new plan common/auth');
    expect(stdout).toContain('/sdd-plan');
    expect(stdout).not.toContain('/sdd:');

    await run('new plan auth');
    await run('new tasks auth');
    stdout = await run('status');
    expect(stdout).toContain('(common/auth) — 작업 0/3');
    expect(stdout).toContain('구현 진행 중 (0/3)');

    for (const n of [1, 2, 3]) {
      await run(`new task auth ${n} completed`);
    }
    stdout = await run('status');
    expect(stdout).toContain('— 작업 3/3');
    expect(stdout).toContain('sdd new status common/auth implemented');

    await run('new status auth implemented');
    stdout = await run('status');
    const nextSteps = stdout.slice(stdout.indexOf('다음 단계'));
    expect(nextSteps).toContain('모든 기능(1개)이 구현 완료되었습니다');
  });
});

describe('sdd list', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-list-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('프로젝트 요약을 표시한다', async () => {
    const { stdout } = await execAsync(
      `node "${cliPath}" list`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('SDD 프로젝트 요약');
  });

  it('기능 목록을 표시한다', async () => {
    await execAsync(`node "${cliPath}" new auth --no-branch`, { cwd: tempDir });

    const { stdout } = await execAsync(
      `node "${cliPath}" list features`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('기능 목록');
    expect(stdout).toContain('auth');
  });

  it('템플릿 목록을 표시한다', async () => {
    const { stdout } = await execAsync(
      `node "${cliPath}" list templates`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('템플릿 목록');
  });
});
