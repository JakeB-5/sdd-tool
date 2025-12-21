/**
 * sdd new 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd new', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-new-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('새 기능을 생성한다', async () => {
    const { stdout } = await execAsync(
      `node "${cliPath}" new auth-login --title "로그인 기능" --description "사용자 로그인" --no-branch`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('명세 생성');

    // spec.md 확인
    const specPath = path.join(tempDir, '.sdd', 'specs', 'auth-login', 'spec.md');
    const content = await fs.readFile(specPath, 'utf-8');

    expect(content).toContain('id: auth-login');
    expect(content).toContain('로그인 기능');
    expect(content).toContain('status: draft');
  });

  it('--all 옵션으로 모든 파일을 생성한다', async () => {
    await execAsync(
      `node "${cliPath}" new user-profile --all --no-branch`,
      { cwd: tempDir }
    );

    const featurePath = path.join(tempDir, '.sdd', 'specs', 'user-profile');

    // spec.md 확인
    const specExists = await fs.stat(path.join(featurePath, 'spec.md')).catch(() => false);
    expect(specExists).toBeTruthy();

    // plan.md 확인
    const planExists = await fs.stat(path.join(featurePath, 'plan.md')).catch(() => false);
    expect(planExists).toBeTruthy();

    // tasks.md 확인
    const tasksExists = await fs.stat(path.join(featurePath, 'tasks.md')).catch(() => false);
    expect(tasksExists).toBeTruthy();

    // checklist.md 확인
    const checklistExists = await fs.stat(path.join(featurePath, 'checklist.md')).catch(() => false);
    expect(checklistExists).toBeTruthy();
  });

  it('plan 서브커맨드로 계획을 생성한다', async () => {
    // 먼저 기능 생성
    await execAsync(
      `node "${cliPath}" new payment --no-branch`,
      { cwd: tempDir }
    );

    // plan 생성
    const { stdout } = await execAsync(
      `node "${cliPath}" new plan payment`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('계획 생성');

    // plan.md 확인
    const planPath = path.join(tempDir, '.sdd', 'specs', 'payment', 'plan.md');
    const content = await fs.readFile(planPath, 'utf-8');

    expect(content).toContain('feature: payment');
    expect(content).toContain('구현 계획');
  });

  it('tasks 서브커맨드로 작업 분해를 생성한다', async () => {
    // 먼저 기능 생성
    await execAsync(
      `node "${cliPath}" new cart --no-branch`,
      { cwd: tempDir }
    );

    // tasks 생성
    const { stdout } = await execAsync(
      `node "${cliPath}" new tasks cart`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('작업 분해 생성');

    // tasks.md 확인
    const tasksPath = path.join(tempDir, '.sdd', 'specs', 'cart', 'tasks.md');
    const content = await fs.readFile(tasksPath, 'utf-8');

    expect(content).toContain('feature: cart');
    expect(content).toContain('작업 목록');
  });
});
