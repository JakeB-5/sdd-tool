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
    // Prompt names with the generated skill / real CLI they relate to
    expect(result.stdout).toContain('change (/sdd-spec)');
    expect(result.stdout).toContain('apply (sdd change apply <id>)');
    expect(result.stdout).toContain('archive (sdd change archive <id>)');
    expect(result.stdout).toContain('validate (/sdd-validate)');
    expect(result.stdout).not.toContain('/sdd:');
  });

  it('--list 옵션으로 목록을 출력한다', async () => {
    const result = await runCli(['prompt', '--list']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('사용 가능한 프롬프트');
  });

  it('목록의 모든 프롬프트는 실제로 출력 가능하다', async () => {
    const list = await runCli(['prompt', '--list']);
    const names = [...list.stdout.matchAll(/^\s*[-•*]?\s*([a-z]+) \(/gm)].map((m) => m[1]);

    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const result = await runCli(['prompt', name]);
      expect(result.code).toBe(0);
    }
  });

  it('change 프롬프트를 출력한다', async () => {
    const result = await runCli(['prompt', 'change']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('/sdd-spec');
    expect(result.stdout).toContain('RFC 2119');
    expect(result.stdout).toContain('GIVEN-WHEN-THEN');
    expect(result.stdout).toContain('sdd validate');
  });

  it('apply 프롬프트를 출력한다', async () => {
    const result = await runCli(['prompt', 'apply']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('sdd change apply');
    expect(result.stdout).toContain('delta.md');
  });

  it('archive 프롬프트를 출력한다', async () => {
    const result = await runCli(['prompt', 'archive']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('sdd change archive');
    expect(result.stdout).toContain('.sdd/archive/');
  });

  it('validate 프롬프트를 출력한다', async () => {
    const result = await runCli(['prompt', 'validate']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('/sdd-validate');
    expect(result.stdout).toContain('sdd validate');
    expect(result.stdout).toContain('--strict');
  });

  it('알 수 없는 명령어는 에러를 반환한다', async () => {
    const result = await runCli(['prompt', 'unknown']);

    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain('알 수 없는 프롬프트');
  });
});
