/**
 * sdd sync 통합 테스트
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
 * SDD 프로젝트 초기화 및 스펙 파일 생성
 */
async function setupSddProject(tempDir: string): Promise<void> {
  // SDD 초기화
  await runCli(['init'], tempDir);

  const sddPath = path.join(tempDir, '.sdd');
  const specsPath = path.join(sddPath, 'specs');

  // 테스트용 스펙 디렉토리 및 파일 생성 (.sdd/specs/user-auth/spec.md)
  const userAuthSpecPath = path.join(specsPath, 'user-auth');
  await fs.mkdir(userAuthSpecPath, { recursive: true });

  const specContent = `# Spec: user-auth
version: 1.0.0

## Requirements

### REQ-001: 사용자 로그인
사용자는 이메일과 비밀번호로 로그인할 수 있어야 한다.

### REQ-002: 로그아웃
사용자는 언제든지 로그아웃할 수 있어야 한다.

### REQ-003: 세션 관리
로그인 세션은 24시간 유지되어야 한다.
`;

  await fs.writeFile(path.join(userAuthSpecPath, 'spec.md'), specContent, 'utf-8');

  // 소스 디렉토리 및 파일 생성
  const srcPath = path.join(tempDir, 'src');
  await fs.mkdir(srcPath, { recursive: true });

  const authCode = `/**
 * 사용자 인증 모듈
 * @spec REQ-001
 */
export async function login(email: string, password: string) {
  // 로그인 구현
}

/**
 * 로그아웃
 * @spec REQ-002
 */
export async function logout() {
  // 로그아웃 구현
}
`;

  await fs.writeFile(path.join(srcPath, 'auth.ts'), authCode, 'utf-8');

  // 테스트 파일 생성
  const testPath = path.join(tempDir, 'tests');
  await fs.mkdir(testPath, { recursive: true });

  const authTest = `describe('인증', () => {
  it('REQ-001: 올바른 자격 증명으로 로그인한다', () => {
    // 테스트 구현
  });

  it('REQ-002: 사용자가 로그아웃할 수 있다', () => {
    // 테스트 구현
  });
});
`;

  await fs.writeFile(path.join(testPath, 'auth.test.ts'), authTest, 'utf-8');
}

describe('sdd sync', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-sync-test-'));
  });

  afterEach(async () => {
    await rmWithRetry(tempDir);
  });

  it('기본 sync 명령어가 실행된다', async () => {
    await setupSddProject(tempDir);

    const result = await runCli(['sync'], tempDir);

    expect(result.code).toBe(7); // 미구현 요구사항이 있으면 exit code 7 (VALIDATION_ERROR)
    expect(result.stdout).toContain('동기화 검증');
    expect(result.stdout).toContain('동기화율');
  });

  it('유효한 스펙의 동기화 상태를 표시한다', async () => {
    await setupSddProject(tempDir);

    const result = await runCli(['sync'], tempDir);

    // 구현된 요구사항 표시
    expect(result.stdout).toContain('REQ-001');
    expect(result.stdout).toContain('REQ-002');

    // 미구현 요구사항 표시
    expect(result.stdout).toContain('REQ-003');

    // 동기화율 표시 (소수점 포함 가능)
    expect(result.stdout).toMatch(/동기화율: \d+(\.\d+)?%/);
  });

  it('--threshold 옵션으로 임계값 미달 시 실패한다', async () => {
    await setupSddProject(tempDir);

    const result = await runCli(['sync', '--ci', '--threshold', '100'], tempDir);

    // CI 모드에서 임계값 미달 시 실패 (exit code 7)
    expect(result.code).toBe(7);

    // stdout 또는 stderr에 출력이 있어야 함
    const output = result.stdout + result.stderr;
    expect(output).toContain('동기화율');
  });

  it('--json 옵션으로 JSON 형식을 출력한다', async () => {
    await setupSddProject(tempDir);

    const result = await runCli(['sync', '--json'], tempDir);

    // JSON 파싱 가능 여부 확인
    expect(() => JSON.parse(result.stdout)).not.toThrow();

    const json = JSON.parse(result.stdout);
    expect(json).toHaveProperty('specs');
    expect(json).toHaveProperty('requirements');
    expect(json).toHaveProperty('syncRate');
    expect(json).toHaveProperty('implemented');
    expect(json).toHaveProperty('missing');
    expect(json).toHaveProperty('totalRequirements');
    expect(json).toHaveProperty('totalImplemented');
  });

  it('--markdown 옵션으로 마크다운 형식을 출력한다', async () => {
    await setupSddProject(tempDir);

    const result = await runCli(['sync', '--markdown'], tempDir);

    // 마크다운 형식 확인
    expect(result.stdout).toContain('# SDD Sync 리포트');
    expect(result.stdout).toContain('## 요약');
    expect(result.stdout).toContain('| 지표 | 값 |');
  });

  it('SDD 프로젝트가 아니면 에러를 반환한다', async () => {
    // sdd init 없이 sync 실행
    const result = await runCli(['sync'], tempDir);

    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain('SDD 프로젝트가 아닙니다');
  });

  it('--spec 옵션으로 특정 스펙만 검증한다', async () => {
    await setupSddProject(tempDir);

    // 추가 스펙 생성
    const specsPath = path.join(tempDir, '.sdd', 'specs');
    const userProfilePath = path.join(specsPath, 'user-profile');
    await fs.mkdir(userProfilePath, { recursive: true });

    const anotherSpec = `# Spec: user-profile
version: 1.0.0

## Requirements

### REQ-101: 프로필 조회
사용자는 자신의 프로필을 조회할 수 있어야 한다.
`;
    await fs.writeFile(path.join(userProfilePath, 'spec.md'), anotherSpec, 'utf-8');

    // user-auth 스펙만 검증
    const result = await runCli(['sync', 'user-auth'], tempDir);

    // user-auth의 요구사항만 표시되어야 함
    expect(result.stdout).toContain('REQ-001');
    expect(result.stdout).toContain('REQ-002');
    expect(result.stdout).toContain('REQ-003');

    // user-profile 요구사항은 나타나지 않아야 함
    expect(result.stdout).not.toContain('REQ-101');
  });

  it('빈 specs 디렉토리를 처리한다', async () => {
    // SDD 초기화만 하고 스펙 파일 생성하지 않음
    await runCli(['init'], tempDir);

    const result = await runCli(['sync'], tempDir);

    // 요구사항이 없으면 성공
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('요구사항이 없습니다');
  });
});
