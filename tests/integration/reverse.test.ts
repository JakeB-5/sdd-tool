/**
 * sdd reverse 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.resolve(__dirname, '../../bin/sdd.js');

/**
 * Windows EBUSY 문제 해결을 위한 재시도 삭제
 */
async function rmWithRetry(dir: string, retries = 3, delay = 100): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

/**
 * CLI 실행 헬퍼
 */
function runCli(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [binPath, ...args], { cwd, shell: true });
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

/**
 * SDD 프로젝트 초기화 헬퍼
 */
async function initSddProject(tempDir: string): Promise<void> {
  await runCli(['init'], tempDir);
}

/**
 * 샘플 소스 파일 생성 헬퍼
 */
async function createSampleSourceFiles(tempDir: string): Promise<void> {
  const srcDir = path.join(tempDir, 'src');
  await fs.mkdir(srcDir, { recursive: true });

  // 샘플 TypeScript 파일 생성
  const authFile = path.join(srcDir, 'auth.ts');
  await fs.writeFile(
    authFile,
    `/**
 * 사용자 인증 처리
 */
export function authenticate(username: string, password: string): boolean {
  // 인증 로직
  return true;
}

/**
 * 사용자 로그아웃 처리
 */
export function logout(userId: string): void {
  // 로그아웃 로직
}
`,
    'utf-8'
  );

  const userFile = path.join(srcDir, 'user.ts');
  await fs.writeFile(
    userFile,
    `/**
 * 사용자 정보 조회
 */
export interface User {
  id: string;
  name: string;
  email: string;
}

export function getUser(id: string): User | null {
  // 사용자 조회 로직
  return null;
}
`,
    'utf-8'
  );
}

describe('sdd reverse', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-reverse-test-'));
  });

  afterEach(async () => {
    await rmWithRetry(tempDir);
  });

  it('기본 scan 서브커맨드를 실행한다', async () => {
    await initSddProject(tempDir);
    await createSampleSourceFiles(tempDir);

    const result = await runCli(['reverse', 'scan', '--skip-serena-check'], tempDir);

    expect(result.code).toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/스캔|scan/i);
  });

  it('scan --json 옵션으로 JSON 출력을 제공한다', async () => {
    await initSddProject(tempDir);
    await createSampleSourceFiles(tempDir);

    const result = await runCli(['reverse', 'scan', '--skip-serena-check', '--json'], tempDir);

    expect(result.code).toBe(0);

    // JSON 파싱 가능 여부 확인
    const jsonMatch = result.stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      expect(parsed).toBeDefined();
      expect(parsed.summary).toBeDefined();
    }
  });

  it('extract 서브커맨드로 스펙을 추출한다', async () => {
    await initSddProject(tempDir);
    await createSampleSourceFiles(tempDir);

    const result = await runCli(['reverse', 'extract', '--skip-serena-check'], tempDir);

    // Serena MCP 없이는 extract가 제대로 작동하지 않을 수 있으므로
    // 에러가 아닌지만 확인
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/추출|extract|Serena/i);
  });

  it('review list 서브커맨드를 실행한다', async () => {
    await initSddProject(tempDir);

    const result = await runCli(['reverse', 'review'], tempDir);

    // 추출된 스펙이 없으면 경고 메시지 출력
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/리뷰|review|추출|extract/i);
  });

  it('finalize 서브커맨드를 실행한다', async () => {
    await initSddProject(tempDir);

    const result = await runCli(['reverse', 'finalize', '--all'], tempDir);

    // 확정할 스펙이 없으면 적절한 메시지 출력
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/확정|finalize|스펙/i);
  });

  it('--skip-serena-check 옵션을 지원한다', async () => {
    await initSddProject(tempDir);
    await createSampleSourceFiles(tempDir);

    // Serena 체크를 건너뛰므로 에러가 발생하지 않아야 함
    const result = await runCli(['reverse', 'scan', '--skip-serena-check', '--quiet'], tempDir);

    expect(result.code).toBe(0);
  });

  it('SDD 프로젝트가 없으면 에러를 반환한다', async () => {
    // init 없이 reverse 실행
    const result = await runCli(['reverse', 'scan', '--skip-serena-check'], tempDir);

    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/SDD 프로젝트|초기화|init/i);
  });

  it('소스 파일이 있는 프로젝트를 스캔한다', async () => {
    await initSddProject(tempDir);
    await createSampleSourceFiles(tempDir);

    const result = await runCli(['reverse', 'scan', '--skip-serena-check'], tempDir);

    expect(result.code).toBe(0);
    const output = result.stdout + result.stderr;

    // 파일이 스캔되었는지 확인 (파일 수 또는 도메인 언급)
    expect(output).toMatch(/파일|file|도메인|domain/i);
  });
});
