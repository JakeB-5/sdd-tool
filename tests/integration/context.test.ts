/**
 * sdd context 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
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

describe('sdd context', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-context-integration-'));

    // 기본 SDD 프로젝트 구조 생성
    await fs.mkdir(path.join(testDir, '.sdd'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd', 'domains'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd', 'specs'), { recursive: true });

    // 테스트용 도메인 생성
    await runCli(['domain', 'create', 'core', '-d', '핵심'], testDir);
    await runCli(['domain', 'create', 'auth', '-d', '인증', '--depends-on', 'core'], testDir);
    await runCli(['domain', 'create', 'order', '-d', '주문', '--depends-on', 'core', '--depends-on', 'auth'], testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('context set', () => {
    it('컨텍스트를 설정한다', async () => {
      const result = await runCli(['context', 'set', 'auth'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('컨텍스트가 설정되었습니다');
      expect(result.stdout).toContain('auth');
    });

    it('여러 도메인을 설정한다', async () => {
      const result = await runCli(['context', 'set', 'auth', 'order'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('auth');
      expect(result.stdout).toContain('order');
    });

    it('의존성을 자동으로 포함한다', async () => {
      const result = await runCli(['context', 'set', 'auth'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('core'); // 의존성으로 포함
    });

    it('의존성 포함을 비활성화할 수 있다', async () => {
      const result = await runCli(['context', 'set', 'auth', '--no-include-deps'], testDir);

      expect(result.code).toBe(0);
      // core가 읽기 전용으로 포함되지 않아야 함
    });
  });

  describe('context show', () => {
    it('빈 컨텍스트를 표시한다', async () => {
      const result = await runCli(['context', 'show'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('컨텍스트가 설정되지 않았습니다');
    });

    it('설정된 컨텍스트를 표시한다', async () => {
      await runCli(['context', 'set', 'auth'], testDir);
      const result = await runCli(['context', 'show'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('auth');
    });

    it('JSON 형식으로 출력한다', async () => {
      await runCli(['context', 'set', 'auth'], testDir);
      const result = await runCli(['context', 'show', '--json'], testDir);

      expect(result.code).toBe(0);
      const json = JSON.parse(result.stdout);
      expect(json.activeDomains).toContain('auth');
    });
  });

  describe('context clear', () => {
    it('컨텍스트를 해제한다', async () => {
      await runCli(['context', 'set', 'auth'], testDir);
      const result = await runCli(['context', 'clear'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('컨텍스트가 해제되었습니다');
    });
  });

  describe('context add', () => {
    it('컨텍스트에 도메인을 추가한다', async () => {
      await runCli(['context', 'set', 'core'], testDir);
      const result = await runCli(['context', 'add', 'auth'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('추가되었습니다');
    });
  });

  describe('context remove', () => {
    it('컨텍스트에서 도메인을 제거한다', async () => {
      await runCli(['context', 'set', 'auth', 'order'], testDir);
      const result = await runCli(['context', 'remove', 'order'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('제거되었습니다');
    });

    it('rm 별칭으로 실행할 수 있다', async () => {
      await runCli(['context', 'set', 'auth', 'order'], testDir);
      const result = await runCli(['context', 'rm', 'order'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('제거되었습니다');
    });
  });

  describe('context specs', () => {
    beforeEach(async () => {
      // 스펙 연결
      await runCli(['domain', 'link', 'core', 'utils'], testDir);
      await runCli(['domain', 'link', 'auth', 'login'], testDir);
    });

    it('컨텍스트의 스펙 목록을 출력한다', async () => {
      await runCli(['context', 'set', 'auth'], testDir);
      const result = await runCli(['context', 'specs'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('login');
    });

    it('JSON 형식으로 출력한다', async () => {
      await runCli(['context', 'set', 'auth'], testDir);
      const result = await runCli(['context', 'specs', '--json'], testDir);

      expect(result.code).toBe(0);
      const json = JSON.parse(result.stdout);
      expect(json.active).toContain('login');
      expect(json.readOnly).toContain('utils');
    });
  });

  describe('context (default)', () => {
    it('기본 동작으로 show를 실행한다', async () => {
      const result = await runCli(['context'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('컨텍스트가 설정되지 않았습니다');
    });
  });
});
