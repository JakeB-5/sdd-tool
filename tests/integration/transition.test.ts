/**
 * sdd transition 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd transition', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-transition-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('new-to-change 전환', () => {
    it('신규 스펙을 변경 워크플로우로 전환한다', async () => {
      // 신규 스펙 생성
      await execAsync(
        `node "${cliPath}" new transition-test --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" transition new-to-change transition-test`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/전환|transition|변경|change/i);
    });

    it('존재하지 않는 스펙에 에러를 반환한다', async () => {
      try {
        await execAsync(
          `node "${cliPath}" transition new-to-change non-existent`,
          { cwd: tempDir }
        );
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string };
        const output = (execError.stdout || '') + (execError.stderr || '');
        expect(output).toMatch(/찾을 수 없|not found|에러|error/i);
      }
    });

    it('변경 제안이 생성된다', async () => {
      await execAsync(
        `node "${cliPath}" new to-change-spec --no-branch`,
        { cwd: tempDir }
      );

      await execAsync(
        `node "${cliPath}" transition new-to-change to-change-spec`,
        { cwd: tempDir }
      );

      // 변경 제안 확인
      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('change-to-new 전환', () => {
    it('변경 제안을 신규 워크플로우로 전환한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "전환 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" transition change-to-new ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/전환|transition|신규|new/i);
    });

    it('존재하지 않는 변경에 에러를 반환한다', async () => {
      try {
        await execAsync(
          `node "${cliPath}" transition change-to-new non-existent-change`,
          { cwd: tempDir }
        );
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string };
        const output = (execError.stdout || '') + (execError.stderr || '');
        expect(output).toMatch(/찾을 수 없|not found|에러|error/i);
      }
    });

    it('신규 스펙이 생성된다', async () => {
      // 변경 제안 생성 (제목 포함)
      await execAsync(
        `node "${cliPath}" change -t "신규로 전환할 변경"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      // 명시적 이름으로 전환
      await execAsync(
        `node "${cliPath}" transition change-to-new ${changeId} --name new-from-change`,
        { cwd: tempDir }
      );

      // 새 스펙 확인 (common 폴더에 생성됨)
      const specsPath = path.join(tempDir, '.sdd', 'specs', 'common');
      const specs = await fs.readdir(specsPath);
      // 생성된 스펙이 있는지 확인
      expect(specs.some(s => s.includes('new-from-change') || s.startsWith('feature-'))).toBe(true);
    });
  });

  describe('guide 서브커맨드', () => {
    it('전환 가이드를 출력한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" transition guide`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/가이드|guide|전환|transition/i);
      expect(stdout).toContain('new-to-change');
      expect(stdout).toContain('change-to-new');
    });
  });

  describe('전환 시나리오', () => {
    it('중복 발견 시 new → change 전환', async () => {
      // 기존 스펙 생성
      await execAsync(
        `node "${cliPath}" new existing-feature --no-branch`,
        { cwd: tempDir }
      );

      // 새 스펙 생성 (중복 발견 가정)
      await execAsync(
        `node "${cliPath}" new duplicate-feature --no-branch`,
        { cwd: tempDir }
      );

      // 중복이므로 change로 전환
      const { stdout } = await execAsync(
        `node "${cliPath}" transition new-to-change duplicate-feature`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/전환|change/i);
    });

    it('범위 확대 시 change → new 전환', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "범위가 큰 변경"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      // 범위가 커서 new로 전환
      const { stdout } = await execAsync(
        `node "${cliPath}" transition change-to-new ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/전환|new/i);
    });
  });

  describe('스펙 연결 유지', () => {
    it('전환 후 원본 참조를 유지한다', async () => {
      // 스펙 생성
      await execAsync(
        `node "${cliPath}" new linked-feature --no-branch`,
        { cwd: tempDir }
      );

      // 전환
      await execAsync(
        `node "${cliPath}" transition new-to-change linked-feature`,
        { cwd: tempDir }
      );

      // 변경 제안에 원본 참조 확인
      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeDir = changes[0];
      const proposalPath = path.join(changesPath, changeDir, 'proposal.md');

      const content = await fs.readFile(proposalPath, 'utf-8');
      expect(content).toContain('linked-feature');
    });
  });
});
