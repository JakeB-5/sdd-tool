/**
 * sdd domain 통합 테스트
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

describe('sdd domain', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-domain-integration-'));

    // 기본 SDD 프로젝트 구조 생성
    await fs.mkdir(path.join(testDir, '.sdd'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd', 'domains'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd', 'specs'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('domain create', () => {
    it('새 도메인을 생성한다', async () => {
      const result = await runCli(['domain', 'create', 'auth', '--description', '인증 도메인'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('생성');
    });

    it('경로 옵션으로 도메인을 생성한다', async () => {
      const result = await runCli(['domain', 'create', 'auth', '-d', '인증', '-p', 'src/auth'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('생성');
    });
  });

  describe('domain list', () => {
    beforeEach(async () => {
      await runCli(['domain', 'create', 'core', '-d', '핵심'], testDir);
      await runCli(['domain', 'create', 'auth', '-d', '인증', '--depends-on', 'core'], testDir);
    });

    it('도메인 목록을 출력한다', async () => {
      const result = await runCli(['domain', 'list'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('core');
      expect(result.stdout).toContain('auth');
    });

    it('JSON 형식으로 출력한다', async () => {
      const result = await runCli(['domain', 'list', '--json'], testDir);

      expect(result.code).toBe(0);
      const json = JSON.parse(result.stdout);
      expect(json).toBeInstanceOf(Array);
      expect(json.map((d: { id: string }) => d.id)).toContain('core');
    });

    it('ls 별칭으로 실행할 수 있다', async () => {
      const result = await runCli(['domain', 'ls'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('core');
    });
  });

  describe('domain show', () => {
    beforeEach(async () => {
      await runCli(['domain', 'create', 'core', '-d', '핵심'], testDir);
      await runCli(['domain', 'create', 'auth', '-d', '인증', '--depends-on', 'core'], testDir);
    });

    it('도메인 상세 정보를 출력한다', async () => {
      const result = await runCli(['domain', 'show', 'auth'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('auth');
      expect(result.stdout).toContain('인증');
    });
  });

  describe('domain graph', () => {
    beforeEach(async () => {
      await runCli(['domain', 'create', 'core', '-d', '핵심'], testDir);
      await runCli(['domain', 'create', 'auth', '-d', '인증', '--depends-on', 'core'], testDir);
      await runCli(['domain', 'create', 'order', '-d', '주문', '--depends-on', 'core', '--depends-on', 'auth'], testDir);
    });

    it('Mermaid 형식으로 그래프를 출력한다', async () => {
      const result = await runCli(['domain', 'graph'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('graph LR');
    });

    it('DOT 형식으로 그래프를 출력한다', async () => {
      const result = await runCli(['domain', 'graph', '--format', 'dot'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('digraph');
    });

    it('JSON 형식으로 그래프를 출력한다', async () => {
      const result = await runCli(['domain', 'graph', '--format', 'json'], testDir);

      expect(result.code).toBe(0);
      const json = JSON.parse(result.stdout);
      expect(json.nodes).toBeDefined();
      expect(json.edges).toBeDefined();
    });

    it('파일에 그래프를 저장한다', async () => {
      const result = await runCli(['domain', 'graph', '-o', 'graph.md'], testDir);

      expect(result.code).toBe(0);
    });
  });

  describe('domain validate', () => {
    beforeEach(async () => {
      await runCli(['domain', 'create', 'core', '-d', '핵심'], testDir);
      await runCli(['domain', 'create', 'auth', '-d', '인증', '--depends-on', 'core'], testDir);
    });

    it('유효한 도메인 구조를 검증한다', async () => {
      const result = await runCli(['domain', 'validate'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('통과');
    });
  });

  describe('domain delete', () => {
    beforeEach(async () => {
      await runCli(['domain', 'create', 'auth', '-d', '인증'], testDir);
    });

    it('도메인을 삭제한다', async () => {
      const result = await runCli(['domain', 'delete', 'auth'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('삭제');
    });

    it('rm 별칭으로 실행할 수 있다', async () => {
      const result = await runCli(['domain', 'rm', 'auth'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('삭제');
    });
  });

  describe('domain rename', () => {
    beforeEach(async () => {
      await runCli(['domain', 'create', 'auth', '-d', '인증'], testDir);
    });

    it('도메인 이름을 변경한다', async () => {
      const result = await runCli(['domain', 'rename', 'auth', 'authentication'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('변경');
    });
  });

  describe('domain link/unlink', () => {
    beforeEach(async () => {
      await runCli(['domain', 'create', 'auth', '-d', '인증'], testDir);
    });

    it('스펙을 도메인에 연결한다', async () => {
      const result = await runCli(['domain', 'link', 'auth', 'user-login'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('연결');
    });

    it('스펙 연결을 해제한다', async () => {
      await runCli(['domain', 'link', 'auth', 'user-login'], testDir);
      const result = await runCli(['domain', 'unlink', 'auth', 'user-login'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('해제');
    });
  });

  describe('domain depends', () => {
    beforeEach(async () => {
      await runCli(['domain', 'create', 'core', '-d', '핵심'], testDir);
      await runCli(['domain', 'create', 'auth', '-d', '인증'], testDir);
    });

    it('의존성을 추가한다', async () => {
      const result = await runCli(['domain', 'depends', 'auth', '--on', 'core'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('추가');
    });

    it('의존성을 제거한다', async () => {
      await runCli(['domain', 'depends', 'auth', '--on', 'core'], testDir);
      const result = await runCli(['domain', 'depends', 'auth', '--on', 'core', '--remove'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('제거');
    });

    it('의존성 타입을 지정할 수 있다', async () => {
      const result = await runCli(['domain', 'depends', 'auth', '--on', 'core', '--type', 'extends'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('extends');
    });
  });

  describe('domain update', () => {
    beforeEach(async () => {
      await runCli(['domain', 'create', 'auth', '-d', '인증'], testDir);
    });

    it('도메인 설명을 업데이트한다', async () => {
      const result = await runCli(['domain', 'update', 'auth', '-d', '인증 및 인가'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('업데이트');
    });

    it('도메인 경로를 업데이트한다', async () => {
      const result = await runCli(['domain', 'update', 'auth', '-p', 'src/authentication'], testDir);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('업데이트');
    });
  });
});
