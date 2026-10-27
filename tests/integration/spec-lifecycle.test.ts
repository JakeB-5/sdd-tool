/**
 * 스펙 라이프사이클 통합 테스트
 *
 * 빌드된 CLI로 init → new → 작성 → validate --strict → list/status → 상태 전이를
 * 실행하여 validate/list/status가 같은 표준 상태 테이블을 사용하는지 검증한다.
 * (CI와 동일하게 `pnpm build` 이후 실행)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SPEC_STATUSES, SPEC_STATUS_INFO } from '../../src/core/spec/status.js';

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

const TITLE = 'Auth: "Login"';

const FILLED_BODY = `
# ${TITLE}

> 이메일/비밀번호 로그인

## 요구사항

### REQ-01: 이메일 로그인

- 시스템은 이메일과 비밀번호로 로그인을 지원해야 한다(SHALL).
- 시스템은 비밀번호를 평문으로 저장해서는 안 된다(SHALL NOT).

## 시나리오

### Scenario 1: 로그인 성공

- **GIVEN** 등록된 사용자가 있을 때
- **WHEN** 올바른 이메일과 비밀번호로 로그인하면
- **THEN** 세션이 발급된다
`;

describe('spec lifecycle (built CLI)', () => {
  let projectDir: string;
  let specPath: string;

  /** Replace the frontmatter status line, keeping everything else */
  async function setStatus(status: string): Promise<void> {
    const content = await fs.readFile(specPath, 'utf-8');
    await fs.writeFile(specPath, content.replace(/^status: .*$/m, `status: ${status}`));
  }

  beforeAll(async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-spec-lifecycle-'));
    await runOk(['init'], projectDir);
    await runOk(['new', 'login', '--title', TITLE, '--no-branch'], projectDir);
    specPath = path.join(projectDir, '.sdd', 'specs', 'common', 'login', 'spec.md');
  }, 60000);

  afterAll(async () => {
    await fs.rm(projectDir, { recursive: true, force: true });
  });

  it('new가 따옴표/콜론이 있는 제목을 유효한 YAML로 기록한다', async () => {
    const content = await fs.readFile(specPath, 'utf-8');
    expect(content).toContain(`title: '${TITLE}'`);

    const list = await runOk(['list', 'features'], projectDir);
    expect(list.stdout).toContain(`${SPEC_STATUS_INFO.draft.icon} ${TITLE} (common/login) - draft`);
  });

  it('작성하지 않은 템플릿은 --strict에서 플레이스홀더 경고로 실패한다', async () => {
    const result = await runCli(['validate', '--strict'], projectDir);
    expect(result.code).not.toBe(0);
    expect(result.stdout).toContain('템플릿 플레이스홀더가 남아 있습니다');
  });

  it('요구사항과 시나리오를 작성하면 validate --strict를 통과한다', async () => {
    const content = await fs.readFile(specPath, 'utf-8');
    const frontmatterEnd = content.indexOf('\n---\n', 4) + '\n---\n'.length;
    await fs.writeFile(specPath, content.slice(0, frontmatterEnd) + FILLED_BODY);

    const result = await runCli(['validate', '--strict'], projectDir);
    expect(result.stdout).not.toContain('⚠');
    expect(result.stdout).toContain('Constitution 버전 확인 통과 (v1.0.0)');
    expect(result.stdout).not.toMatch(/개 규칙/);
    expect(result.code).toBe(0);
  });

  it('모든 표준 상태가 validate --strict를 통과하고 list/status에 같은 아이콘으로 표시된다', async () => {
    for (const status of SPEC_STATUSES) {
      await setStatus(status);

      const validate = await runCli(['validate', '--strict'], projectDir);
      expect(validate.code, `${status}: ${validate.stdout}`).toBe(0);

      const { icon } = SPEC_STATUS_INFO[status];
      const list = await runOk(['list', 'features'], projectDir);
      expect(list.stdout).toContain(`${icon} ${TITLE} (common/login) - ${status}`);

      const statusOut = await runOk(['status'], projectDir);
      expect(statusOut.stdout).toContain(`${icon} ${TITLE} (common/login)`);
      expect(statusOut.stdout).not.toContain('❓');
    }
  }, 60000);

  it('레거시 상태(completed)는 경고와 함께 통과하고 implemented로 표시된다', async () => {
    await setStatus('completed');

    const validate = await runCli(['validate'], projectDir);
    expect(validate.code).toBe(0);
    expect(validate.stdout).toContain("status 'completed'는 더 이상 사용되지 않습니다");

    const list = await runOk(['list', 'features'], projectDir);
    expect(list.stdout).toContain(`${SPEC_STATUS_INFO.implemented.icon} ${TITLE} (common/login) - implemented`);

    await setStatus('implemented');
  });

  it('Constitution patch bump 후에도 validate --strict가 통과한다', async () => {
    await runOk(['constitution', 'bump', '--patch', '-m', '문구 수정'], projectDir);

    const result = await runCli(['validate', '--strict'], projectDir);
    expect(result.code, result.stdout).toBe(0);
    expect(result.stdout).toContain('Constitution Patch 버전이 변경되었습니다 (1.0.0 → 1.0.1)');
  });
});
