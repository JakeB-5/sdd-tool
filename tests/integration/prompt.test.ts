/**
 * sdd prompt 통합 테스트
 */
import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.resolve(__dirname, '../../bin/sdd.js');

/**
 * CLI 실행 헬퍼
 */
function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [binPath, ...args], { shell: true });
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

describe('sdd prompt', () => {
  it('명령어 없이 실행하면 목록을 출력한다', async () => {
    const result = await runCli(['prompt']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('/sdd:change');
    expect(result.stdout).toContain('/sdd:apply');
    expect(result.stdout).toContain('/sdd:archive');
    expect(result.stdout).toContain('/sdd:validate');
  });

  it('--list 옵션으로 목록을 출력한다', async () => {
    const result = await runCli(['prompt', '--list']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('사용 가능한 슬래시 커맨드');
  });

  it('change 프롬프트를 출력한다', async () => {
    const result = await runCli(['prompt', 'change']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('/sdd:change');
    expect(result.stdout).toContain('RFC 2119');
    expect(result.stdout).toContain('GIVEN-WHEN-THEN');
    expect(result.stdout).toContain('sdd validate');
  });

  it('apply 프롬프트를 출력한다', async () => {
    const result = await runCli(['prompt', 'apply']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('/sdd:apply');
    expect(result.stdout).toContain('delta.md');
  });

  it('archive 프롬프트를 출력한다', async () => {
    const result = await runCli(['prompt', 'archive']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('/sdd:archive');
    expect(result.stdout).toContain('.sdd/archive/');
  });

  it('validate 프롬프트를 출력한다', async () => {
    const result = await runCli(['prompt', 'validate']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('/sdd:validate');
    expect(result.stdout).toContain('sdd validate');
    expect(result.stdout).toContain('--strict');
  });

  it('알 수 없는 명령어는 에러를 반환한다', async () => {
    const result = await runCli(['prompt', 'unknown']);

    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain('알 수 없는 명령어');
  });
});
