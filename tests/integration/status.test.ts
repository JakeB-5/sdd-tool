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

  it('초기화되지 않은 프로젝트를 감지한다', async () => {
    const { stdout } = await execAsync(
      `node "${cliPath}" status`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('초기화되지 않았습니다');
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
    expect(stdout).toContain('auth');
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
