/**
 * sdd prepare 통합 테스트
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
 * 테스트용 스펙 파일 생성
 */
async function createTestSpec(
  tempDir: string,
  featureId: string,
  content: string
): Promise<void> {
  const specDir = path.join(tempDir, '.sdd', 'specs', featureId);
  await fs.mkdir(specDir, { recursive: true });

  const specPath = path.join(specDir, 'spec.md');
  await fs.writeFile(specPath, content, 'utf-8');
}

/**
 * 테스트용 tasks.md 파일 생성
 */
async function createTestTasks(
  tempDir: string,
  featureId: string,
  content: string
): Promise<void> {
  const tasksPath = path.join(tempDir, '.sdd', 'specs', featureId, 'tasks.md');
  await fs.writeFile(tasksPath, content, 'utf-8');
}

describe('sdd prepare', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-prepare-test-'));
    // SDD 프로젝트 초기화
    await runCli(['init'], tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기본 prepare 명령어 실행', async () => {
    // 테스트용 스펙 생성
    await createTestSpec(
      tempDir,
      'test-feature',
      `# Spec: Test Feature

## Tasks
- [ ] 테스트 코드 작성
- [ ] API 엔드포인트 구현
`
    );

    const result = await runCli(['prepare', 'test-feature'], tempDir);

    expect(result.code).toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain('분석 완료');
    expect(output).toMatch(/총 작업 수:\s*\d+/);
  });

  it('prepare 보고서 생성 (감지된 에이전트/스킬 표시)', async () => {
    // 에이전트와 스킬을 감지할 수 있는 키워드가 포함된 스펙 생성
    await createTestSpec(
      tempDir,
      'api-feature',
      `# Spec: API Feature

## Requirements
- REST API 엔드포인트 구현
- Jest를 사용한 테스트 작성
- 컴포넌트 생성

## Tasks
- [ ] API 스캐폴딩
- [ ] 테스트 실행
- [ ] React 컴포넌트 생성
`
    );

    const result = await runCli(['prepare', 'api-feature'], tempDir);

    expect(result.code).toBe(0);
    const output = result.stdout + result.stderr;

    // 보고서에 서브에이전트/스킬 정보가 포함되어야 함
    expect(output).toContain('서브에이전트');
    expect(output).toContain('스킬');
    expect(output).toMatch(/필요|누락/);
  });

  it('--dry-run 옵션 (파일 생성 없음)', async () => {
    await createTestSpec(
      tempDir,
      'dry-test',
      `# Spec: Dry Test

## Tasks
- [ ] API 테스트 작성
- [ ] 컴포넌트 리뷰
`
    );

    const result = await runCli(['prepare', 'dry-test', '--dry-run'], tempDir);

    expect(result.code).toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain('분석 완료');

    // 보고서 파일이 생성되지 않아야 함
    const reportPath = path.join(tempDir, '.sdd', 'reports');
    const reportExists = await fs.stat(reportPath).then(() => true).catch(() => false);
    if (reportExists) {
      const files = await fs.readdir(reportPath);
      const dryTestReports = files.filter(f => f.includes('dry-test'));
      expect(dryTestReports.length).toBe(0);
    }
  });

  it('--json 옵션 (JSON 형식 출력)', async () => {
    await createTestSpec(
      tempDir,
      'json-test',
      `# Spec: JSON Test

## Tasks
- [ ] 테스트 작성
`
    );

    const result = await runCli(['prepare', 'json-test', '--json'], tempDir);

    expect(result.code).toBe(0);

    // JSON 파싱 가능해야 함
    let parsed: any;
    try {
      parsed = JSON.parse(result.stdout);
    } catch (e) {
      // stdout에 다른 로그가 섞여있을 수 있으므로 JSON 부분만 추출 시도
      const jsonMatch = result.stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    }

    expect(parsed).toBeDefined();
    expect(parsed).toHaveProperty('feature');
    expect(parsed).toHaveProperty('totalTasks');
    expect(parsed).toHaveProperty('agents');
    expect(parsed).toHaveProperty('skills');
  });

  it('SDD 프로젝트가 없으면 에러', async () => {
    // 새 임시 디렉토리 (초기화 안됨)
    const nonSddDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-no-project-'));

    try {
      const result = await runCli(['prepare', 'any-feature'], nonSddDir);

      expect(result.code).not.toBe(0);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/찾을 수 없습니다|not found/i);
    } finally {
      await fs.rm(nonSddDir, { recursive: true, force: true });
    }
  });

  it('에이전트가 필요한 스펙으로 prepare 실행', async () => {
    // 특정 에이전트를 필요로 하는 스펙 생성
    await createTestSpec(
      tempDir,
      'agent-test',
      `# Spec: Agent Test

## Description
이 기능은 API 엔드포인트를 생성하고 Jest 테스트를 실행하며
React 컴포넌트를 생성합니다.

## Requirements
- REST API 구현
- Jest 테스트 실행
- 컴포넌트 생성
- 코드 리뷰

## Tasks
- [ ] API scaffold 생성
- [ ] test runner로 테스트 실행
- [ ] component generator로 컴포넌트 생성
- [ ] code reviewer로 리뷰
`
    );

    await createTestTasks(
      tempDir,
      'agent-test',
      `# Tasks: Agent Test

## Implementation Tasks
- [ ] api-scaffold 사용하여 REST endpoint 생성
- [ ] test-runner로 jest 테스트 실행
- [ ] component-gen으로 React 컴포넌트 생성
- [ ] code-reviewer로 코드 품질 검증
`
    );

    const result = await runCli(['prepare', 'agent-test'], tempDir);

    expect(result.code).toBe(0);
    const output = result.stdout + result.stderr;

    // 감지된 에이전트/스킬이 출력되어야 함
    expect(output).toContain('분석 완료');
    expect(output).toContain('서브에이전트');

    // 누락된 항목이 있으면 안내 메시지가 표시되어야 함
    if (output.includes('누락')) {
      expect(output).toMatch(/추가|생성|필요/);
    }
  });
});
