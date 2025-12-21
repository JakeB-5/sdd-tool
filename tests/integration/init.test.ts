/**
 * sdd init 통합 테스트
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

describe('sdd init', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-init-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기본 디렉토리 구조를 생성한다', async () => {
    const result = await runCli(['init'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('초기화되었습니다');

    // 디렉토리 확인
    const sddPath = path.join(tempDir, '.sdd');
    expect(await fs.stat(sddPath).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(sddPath, 'specs')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(sddPath, 'changes')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(sddPath, 'archive')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(sddPath, 'templates')).then(() => true).catch(() => false)).toBe(true);
  });

  it('constitution.md를 생성한다', async () => {
    await runCli(['init'], tempDir);

    const constitutionPath = path.join(tempDir, '.sdd', 'constitution.md');
    const content = await fs.readFile(constitutionPath, 'utf-8');

    expect(content).toContain('# Constitution:');
    expect(content).toContain('version: 1.0.0');
    expect(content).toContain('SHALL');
  });

  it('AGENTS.md를 생성한다', async () => {
    await runCli(['init'], tempDir);

    const agentsPath = path.join(tempDir, '.sdd', 'AGENTS.md');
    const content = await fs.readFile(agentsPath, 'utf-8');

    // 50줄 규칙: 상단에 RFC 2119와 GIVEN-WHEN-THEN 포함
    expect(content).toContain('# SDD Workflow Guide');
    expect(content).toContain('워크플로우');
    expect(content).toContain('SHALL');
    expect(content).toContain('GIVEN');
  });

  it('템플릿 파일을 생성한다', async () => {
    await runCli(['init'], tempDir);

    const templatesPath = path.join(tempDir, '.sdd', 'templates');

    expect(await fs.stat(path.join(templatesPath, 'spec.md')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(templatesPath, 'proposal.md')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(templatesPath, 'delta.md')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(templatesPath, 'tasks.md')).then(() => true).catch(() => false)).toBe(true);
  });

  it('이미 존재하면 에러를 반환한다', async () => {
    // 먼저 초기화
    await runCli(['init'], tempDir);

    // 다시 초기화 시도
    const result = await runCli(['init'], tempDir);

    expect(result.code).not.toBe(0);
    // 에러는 stdout 또는 stderr에 출력될 수 있음
    const output = result.stdout + result.stderr;
    expect(output).toContain('이미 존재');
  });

  it('--force 옵션으로 덮어쓸 수 있다', async () => {
    // 먼저 초기화
    await runCli(['init'], tempDir);

    // force로 다시 초기화
    const result = await runCli(['init', '--force'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('덮어씁니다');
  });
});
