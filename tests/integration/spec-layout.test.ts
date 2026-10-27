/**
 * 스펙 레이아웃 교차 모듈 통합 테스트
 *
 * `sdd new`가 생성하는 도메인 레이아웃(.sdd/specs/<domain>/<feature>/spec.md)을
 * 모든 소비 명령(sync, export, report, start, validate, prepare, impact, status, list)이
 * 일관되게 인식하는지 빌드된 CLI로 검증한다. (CI와 동일하게 `pnpm build` 이후 실행)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.resolve(__dirname, '../../bin/sdd.js');

interface CliResult {
  stdout: string;
  stderr: string;
  code: number;
}

function runCli(args: string[], cwd: string): Promise<CliResult> {
  return new Promise((resolve) => {
    const proc = spawn('node', [binPath, ...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

async function runOk(args: string[], cwd: string): Promise<CliResult> {
  const result = await runCli(args, cwd);
  if (result.code !== 0) {
    throw new Error(`sdd ${args.join(' ')} failed (${result.code}):\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

function specContent(id: string, domainLine: string, depends: string): string {
  return `---
id: ${id}
title: "${id}"
status: draft
created: 2026-01-01
${domainLine}
depends: ${depends}
---

# ${id}

## 요구사항

### REQ-01: ${id} 기능

- 시스템은 ${id} 기능을 지원해야 한다(SHALL)

## 시나리오

### Scenario 1: ${id} 성공

- **GIVEN** 등록된 사용자가 있을 때
- **WHEN** ${id} 요청을 하면
- **THEN** 요청이 성공한다
`;
}

describe('spec layout (domain + common)', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-spec-layout-'));

    await runOk(['init'], projectDir);
    await runOk(['domain', 'create', 'auth', '-d', '인증'], projectDir);
    await runOk(['new', 'login', '--domain', 'auth', '--no-branch'], projectDir);
    await runOk(['new', 'signup', '--no-branch'], projectDir);

    const specsDir = path.join(projectDir, '.sdd', 'specs');
    await fs.writeFile(
      path.join(specsDir, 'auth', 'login', 'spec.md'),
      specContent('login', 'domain: auth', 'null')
    );
    await fs.writeFile(
      path.join(specsDir, 'common', 'signup', 'spec.md'),
      specContent('signup', '', 'login')
    );
  }, 60000);

  afterAll(async () => {
    await fs.rm(projectDir, { recursive: true, force: true });
  });

  it('new가 도메인 레이아웃으로 스펙을 생성한다', async () => {
    const specsDir = path.join(projectDir, '.sdd', 'specs');
    await expect(fs.stat(path.join(specsDir, 'auth', 'login', 'spec.md'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(specsDir, 'common', 'signup', 'spec.md'))).resolves.toBeDefined();
  });

  it('sync가 중첩 스펙의 요구사항을 찾는다', async () => {
    const result = await runCli(['sync', '--json'], projectDir);
    const data = JSON.parse(result.stdout);

    expect(data.totalRequirements).toBe(2);
    expect(data.specs.map((s: { id: string }) => s.id)).toEqual(['auth/login', 'common/signup']);
    expect(data.syncRate).toBeLessThan(100);
  });

  it('export가 canonical id와 bare feature를 모두 해석한다', async () => {
    const canonical = await runCli(['export', 'auth/login', '--json'], projectDir);
    expect(canonical.code).toBe(0);
    expect(JSON.parse(canonical.stdout)).toMatchObject({ success: true, specsExported: 1 });

    const bare = await runCli(['export', 'login', '--json'], projectDir);
    expect(bare.code).toBe(0);
    expect(JSON.parse(bare.stdout)).toMatchObject({ success: true, specsExported: 1 });
  });

  it('export --format json이 canonical id로 충돌 없이 내보낸다', async () => {
    const output = path.join(projectDir, 'all-specs.json');
    await runOk(['export', '--format', 'json', '-o', output], projectDir);
    const { specs } = JSON.parse(await fs.readFile(output, 'utf-8'));

    expect(specs.map((s: { id: string }) => s.id)).toEqual(['auth/login', 'common/signup']);
  });

  it('report --format json이 두 스펙을 집계한다', async () => {
    const output = path.join(projectDir, 'report.json');
    await runOk(['report', '--format', 'json', '-o', output], projectDir);
    const report = JSON.parse(await fs.readFile(output, 'utf-8'));

    expect(report.summary.totalSpecs).toBe(2);
    expect(report.specs.map((s: { id: string }) => s.id)).toEqual(['auth/login', 'common/signup']);
    // constitution.md, templates 등은 검증 대상이 아님
    expect(report.validation.files).toHaveLength(2);
    expect(report.summary.validationErrors).toBe(0);
  });

  it('start가 명세 수 2개를 표시한다', async () => {
    const result = await runOk(['start'], projectDir);
    expect(result.stdout).toContain('명세 수: 2개');
  });

  it('validate --domain auth가 도메인 스펙 1개만 검증한다', async () => {
    const result = await runOk(['validate', '--domain', 'auth'], projectDir);
    expect(result.stdout).toContain('1개 통과');
    expect(result.stdout).toContain('0개 실패');
  });

  it('validate --orphan-specs가 등록 스펙과 암묵적 common 스펙을 고아로 보지 않는다', async () => {
    const result = await runCli(['validate', '--orphan-specs'], projectDir);
    const output = result.stdout + result.stderr;

    expect(output).not.toContain('ORPHAN_SPEC');
    expect(output).not.toContain('MISSING_SPEC');
  });

  it('prepare 후에도 validate가 통과한다 (prepare.md는 검증 대상 아님)', async () => {
    await runOk(['prepare', 'login'], projectDir);
    await expect(
      fs.stat(path.join(projectDir, '.sdd', 'specs', 'auth', 'login', 'prepare.md'))
    ).resolves.toBeDefined();

    const result = await runCli(['validate'], projectDir);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('2개 통과');
    expect(result.stdout).toContain('0개 실패');
  }, 20000);

  it('impact가 signup → login 의존과 역방향 엣지를 보이고 순환이 없다', async () => {
    const signup = await runOk(['impact', 'signup', '--json'], projectDir);
    const signupData = JSON.parse(signup.stdout);
    expect(signupData.targetSpec).toBe('common/signup');
    expect(signupData.dependsOn.map((s: { id: string }) => s.id)).toEqual(['auth/login']);

    const login = await runOk(['impact', 'login', '--json'], projectDir);
    const loginData = JSON.parse(login.stdout);
    expect(loginData.affectedBy.map((s: { id: string }) => s.id)).toEqual(['common/signup']);

    const report = await runOk(['impact', 'report'], projectDir);
    expect(report.stdout).toContain('총 스펙 수: 2');
    expect(report.stdout).toContain('총 의존 관계: 1');
    expect(report.stdout).not.toContain('순환 의존성');
  });

  it('status --domain auth가 login을 표시한다', async () => {
    const result = await runOk(['status', '--domain', 'auth', '--json'], projectDir);
    const status = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')));

    expect(status.features.map((f: { id: string }) => f.id)).toEqual(['auth/login']);
  });

  it('하위 디렉토리에서도 list가 프로젝트 루트를 찾는다', async () => {
    const subDir = path.join(projectDir, 'src', 'nested');
    await fs.mkdir(subDir, { recursive: true });

    const result = await runOk(['list', 'features'], subDir);
    expect(result.stdout).toContain('auth/login');
    expect(result.stdout).toContain('common/signup');
  });
});

describe('spec layout (legacy flat)', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-spec-flat-'));
    await runOk(['init'], projectDir);

    const specsDir = path.join(projectDir, '.sdd', 'specs');
    for (const [id, depends] of [['login', 'null'], ['signup', 'login']]) {
      await fs.mkdir(path.join(specsDir, id), { recursive: true });
      await fs.writeFile(path.join(specsDir, id, 'spec.md'), specContent(id, '', depends));
    }
  }, 60000);

  afterAll(async () => {
    await fs.rm(projectDir, { recursive: true, force: true });
  });

  it('sync/report/validate/export/impact가 평면 id로 동작한다', async () => {
    const sync = JSON.parse((await runCli(['sync', '--json'], projectDir)).stdout);
    expect(sync.specs.map((s: { id: string }) => s.id)).toEqual(['login', 'signup']);

    const reportPath = path.join(projectDir, 'report.json');
    await runOk(['report', '--format', 'json', '-o', reportPath], projectDir);
    const report = JSON.parse(await fs.readFile(reportPath, 'utf-8'));
    expect(report.summary.totalSpecs).toBe(2);

    const validate = await runOk(['validate'], projectDir);
    expect(validate.stdout).toContain('2개 통과');

    const exported = await runCli(['export', 'login', '--json'], projectDir);
    expect(JSON.parse(exported.stdout)).toMatchObject({ success: true, specsExported: 1 });

    const impact = JSON.parse((await runOk(['impact', 'signup', '--json'], projectDir)).stdout);
    expect(impact.dependsOn.map((s: { id: string }) => s.id)).toEqual(['login']);
  }, 30000);
});

describe('spec layout (mixed flat + domain, same names)', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-spec-mixed-'));
    await runOk(['init'], projectDir);
    await runOk(['domain', 'create', 'auth', '-d', '인증'], projectDir);
    await runOk(['new', 'login', '--domain', 'auth', '--no-branch'], projectDir);
    await runOk(['new', 'core', '--domain', 'auth', '--no-branch'], projectDir);
    await runOk(['new', 'core', '--no-branch'], projectDir);

    const specsDir = path.join(projectDir, '.sdd', 'specs');
    // Legacy flat spec sharing a feature name, and a flat spec on the domain dir itself
    await fs.mkdir(path.join(specsDir, 'login'), { recursive: true });
    await fs.writeFile(path.join(specsDir, 'login', 'spec.md'), specContent('login', '', 'null'));
    await fs.writeFile(path.join(specsDir, 'auth', 'spec.md'), specContent('auth', '', 'null'));
  }, 60000);

  afterAll(async () => {
    await fs.rm(projectDir, { recursive: true, force: true });
  });

  it('평면 스펙과 같은 이름의 도메인 스펙을 모두 나열한다', async () => {
    const result = await runOk(['list', 'features'], projectDir);
    for (const id of ['(auth)', '(auth/core)', '(auth/login)', '(common/core)', '(login)']) {
      expect(result.stdout).toContain(id);
    }
  });

  it('정확한 canonical id를 우선 해석하고 모호한 bare 이름은 후보와 함께 실패한다', async () => {
    const flat = JSON.parse((await runCli(['export', 'login', '--json'], projectDir)).stdout);
    expect(flat).toMatchObject({ success: true, specsExported: 1 });

    const nested = JSON.parse((await runCli(['export', 'auth/login', '--json'], projectDir)).stdout);
    expect(nested).toMatchObject({ success: true, specsExported: 1 });

    const ambiguous = await runCli(['export', 'core', '--json'], projectDir);
    expect(ambiguous.code).not.toBe(0);
    expect(ambiguous.stdout).toContain('auth/core, common/core');
  });

  it('도메인 미등록 평면 스펙만 고아로 보고한다', async () => {
    const result = await runCli(['validate', '--orphan-specs'], projectDir);
    const output = result.stdout + result.stderr;

    expect(output).toContain('스펙 "login"가 어떤 도메인에도 속하지 않습니다');
    expect(output).not.toContain('스펙 "common/core"가');
  });
});

describe('outside an SDD project', () => {
  let outsideDir: string;

  beforeAll(async () => {
    outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-no-project-'));
  });

  afterAll(async () => {
    await fs.rm(outsideDir, { recursive: true, force: true });
  });

  it.each([
    ['list'],
    ['status'],
    ['export'],
    ['search', 'x'],
    ['diff'],
    ['sync'],
    ['new', 'x', '--no-branch'],
  ])('sdd %s는 0이 아닌 코드로 종료한다', async (...args) => {
    const result = await runCli(args, outsideDir);
    expect(result.code).not.toBe(0);
  });
});
