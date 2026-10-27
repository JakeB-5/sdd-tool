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

    expect(stdout).toContain('spec.md 생성');

    // spec.md 확인 (도메인 미지정 시 common 폴더에 생성)
    const specPath = path.join(tempDir, '.sdd', 'specs', 'common', 'auth-login', 'spec.md');
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

    // 도메인 미지정 시 common 폴더에 생성
    const featurePath = path.join(tempDir, '.sdd', 'specs', 'common', 'user-profile');

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

    // plan 생성 (common/payment 형식으로 경로 지정)
    const { stdout } = await execAsync(
      `node "${cliPath}" new plan common/payment`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('계획 생성');

    // plan.md 확인 (common 폴더에 생성됨)
    const planPath = path.join(tempDir, '.sdd', 'specs', 'common', 'payment', 'plan.md');
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

    // tasks 생성 (common/cart 형식으로 경로 지정)
    const { stdout } = await execAsync(
      `node "${cliPath}" new tasks common/cart`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('작업 분해 생성');

    // tasks.md 확인 (common 폴더에 생성됨)
    const tasksPath = path.join(tempDir, '.sdd', 'specs', 'common', 'cart', 'tasks.md');
    const content = await fs.readFile(tasksPath, 'utf-8');

    expect(content).toContain('feature: cart');
    expect(content).toContain('작업 목록');
  });

  it('도메인 지정 시 해당 폴더에 생성한다', async () => {
    // 먼저 도메인 생성
    await execAsync(
      `node "${cliPath}" domain create auth --description "인증 도메인"`,
      { cwd: tempDir }
    );

    const { stdout } = await execAsync(
      `node "${cliPath}" new auth/login --title "로그인" --no-branch`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('spec.md 생성');

    // auth 도메인 폴더에 생성됨
    const specPath = path.join(tempDir, '.sdd', 'specs', 'auth', 'login', 'spec.md');
    const content = await fs.readFile(specPath, 'utf-8');

    expect(content).toContain('id: login');
    expect(content).toContain('domain: auth');
  });

  it('없는 도메인은 자동 생성하고 안내한다', async () => {
    const { stdout } = await execAsync(
      `node "${cliPath}" new pricing/discount --no-branch`,
      { cwd: tempDir }
    );

    expect(stdout).toContain("도메인 'pricing'이(가) 없어 새로 생성했습니다 (sdd domain create pricing)");
    const spec = await fs.readFile(
      path.join(tempDir, '.sdd', 'specs', 'pricing', 'discount', 'spec.md'),
      'utf-8'
    );
    expect(spec).toContain('domain: pricing');

    const { stdout: list } = await execAsync(`node "${cliPath}" domain list`, { cwd: tempDir });
    expect(list).toContain('pricing');
    const domainsYml = await fs.readFile(path.join(tempDir, '.sdd', 'domains.yml'), 'utf-8');
    expect(domainsYml).toContain('discount');
  });

  it('plan/tasks/checklist는 기존 파일을 덮어쓰지 않고 --force로만 덮어쓴다', async () => {
    await execAsync(`node "${cliPath}" new cart --all --no-branch`, { cwd: tempDir });
    const featurePath = path.join(tempDir, '.sdd', 'specs', 'common', 'cart');

    for (const [sub, file] of [
      ['plan common/cart', path.join(featurePath, 'plan.md')],
      ['tasks common/cart', path.join(featurePath, 'tasks.md')],
      ['checklist', path.join(tempDir, '.sdd', 'checklist.md')],
    ] as const) {
      await fs.writeFile(file, 'edited');

      const refused = await execAsync(`node "${cliPath}" new ${sub}`, { cwd: tempDir }).then(
        () => ({ code: 0, stderr: '' }),
        (err: { code: number; stderr: string; stdout: string }) => ({
          code: err.code,
          stderr: err.stderr + err.stdout,
        })
      );
      expect(refused.code).toBe(1);
      expect(refused.stderr).toContain(file);
      expect(refused.stderr).toContain('--force');
      expect(await fs.readFile(file, 'utf-8')).toBe('edited');

      await execAsync(`node "${cliPath}" new ${sub} --force`, { cwd: tempDir });
      expect(await fs.readFile(file, 'utf-8')).not.toBe('edited');
    }
  });

  it('new <name> --all은 기존 파일이 있으면 실패한다', async () => {
    await execAsync(`node "${cliPath}" new cart --no-branch`, { cwd: tempDir });
    const specPath = path.join(tempDir, '.sdd', 'specs', 'common', 'cart', 'spec.md');
    await fs.writeFile(specPath, 'edited');

    const refused = await execAsync(`node "${cliPath}" new cart --all --no-branch`, {
      cwd: tempDir,
    }).then(
      () => 0,
      (err: { code: number }) => err.code
    );

    expect(refused).toBe(1);
    expect(await fs.readFile(specPath, 'utf-8')).toBe('edited');
    const planExists = await fs
      .stat(path.join(tempDir, '.sdd', 'specs', 'common', 'cart', 'plan.md'))
      .catch(() => false);
    expect(planExists).toBe(false);
  });

  it('--all 도움말은 checklist도 명시한다', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" new --help`, { cwd: tempDir });
    expect(stdout).toContain('spec, plan, tasks, checklist');
    expect(stdout).toContain('--force');
  });

  it('--numbered는 feature/001-<name> 브랜치를 만든다 (feature/feature/ 중복 없음)', async () => {
    await execAsync(
      'git init -q && git -c user.email=t@t -c user.name=t commit -q --allow-empty -m init',
      { cwd: tempDir }
    );

    const { stdout } = await execAsync(`node "${cliPath}" new search --numbered`, { cwd: tempDir });

    expect(stdout).toContain('feature/001-search');
    expect(stdout).not.toContain('feature/feature/');
    const { stdout: branch } = await execAsync('git branch --show-current', { cwd: tempDir });
    expect(branch.trim()).toBe('feature/001-search');
  });

  it('new plan <f> --title은 서브커맨드 제목으로 계획을 만든다', async () => {
    await execAsync(`node "${cliPath}" new billing --title "청구" --no-branch`, { cwd: tempDir });
    await execAsync(`node "${cliPath}" new plan common/billing --title "청구 계획 v2"`, { cwd: tempDir });

    const plan = await fs.readFile(
      path.join(tempDir, '.sdd', 'specs', 'common', 'billing', 'plan.md'),
      'utf-8'
    );
    expect(plan).toContain('청구 계획 v2');
  });

  it('--plan 사용 시 다음 단계 번호가 연속된다', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" new orders --plan --no-branch`, { cwd: tempDir });

    expect(stdout).toContain('1. ');
    expect(stdout).toContain('2. sdd new tasks orders');
    expect(stdout).toContain('3. sdd validate');
    expect(stdout).not.toContain('4. ');
  });

  const runFailing = (args: string) =>
    execAsync(`node "${cliPath}" ${args}`, { cwd: tempDir }).then(
      () => ({ code: 0, output: '' }),
      (err: { code: number; stderr: string; stdout: string }) => ({
        code: err.code,
        output: err.stderr + err.stdout,
      })
    );

  it('new status는 스펙 상태를 바꾸고 이전 → 새 상태를 출력한다', async () => {
    await execAsync(`node "${cliPath}" new pricing/cart --no-branch`, { cwd: tempDir });
    const specPath = path.join(tempDir, '.sdd', 'specs', 'pricing', 'cart', 'spec.md');

    const { stdout } = await execAsync(`node "${cliPath}" new status cart approved`, { cwd: tempDir });
    expect(stdout).toContain('pricing/cart 스펙 상태: draft → approved');
    expect(await fs.readFile(specPath, 'utf-8')).toContain('status: approved');

    const json = await execAsync(`node "${cliPath}" new status pricing/cart implemented --json`, { cwd: tempDir });
    expect(JSON.parse(json.stdout)).toMatchObject({ from: 'approved', to: 'implemented', changed: true });

    const invalid = await runFailing('new status cart done');
    expect(invalid.code).toBe(1);
    expect(invalid.output).toContain('draft, review, approved');

    const unknown = await runFailing('new status nope implemented');
    expect(unknown.code).toBe(1);
    expect(unknown.output).toContain('pricing/cart');
  });

  it('new task는 작업 상태를 바꾸고 진행률을 출력한다', async () => {
    await execAsync(`node "${cliPath}" new pricing/cart --tasks --no-branch`, { cwd: tempDir });
    const tasksPath = path.join(tempDir, '.sdd', 'specs', 'pricing', 'cart', 'tasks.md');

    const { stdout } = await execAsync(`node "${cliPath}" new task cart cart-task-001 in-progress`, { cwd: tempDir });
    expect(stdout).toContain('cart-task-001: pending → in_progress (작업 0/3 완료)');
    expect(await fs.readFile(tasksPath, 'utf-8')).toContain('- 진행 중: 1');

    const json = await execAsync(`node "${cliPath}" new task cart 1 완료 --json`, { cwd: tempDir });
    expect(JSON.parse(json.stdout)).toMatchObject({
      taskId: 'cart-task-001',
      to: 'completed',
      progress: { completed: 1, total: 3 },
    });

    const unknown = await runFailing('new task cart cart-task-999 completed');
    expect(unknown.code).toBe(1);
    expect(unknown.output).toContain('cart-task-001, cart-task-002, cart-task-003');
  });
});
