/**
 * sdd change 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd change', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-change-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('변경 제안 생성', () => {
    it('새 변경 제안을 생성한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" change -t "테스트 변경"`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('변경 제안');

      // changes 디렉토리에 파일 생성 확인
      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      expect(changes.length).toBeGreaterThan(0);
    });

    it('제목 없이 실행하면 기본 제목을 사용한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" change`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('변경 제안');
    });
  });

  describe('변경 목록 조회', () => {
    it('-l 옵션으로 변경 목록을 출력한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "첫 번째 변경"`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" change -l`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/변경|목록/);
    });

    it('변경이 없으면 안내 메시지를 출력한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" change -l`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/없습니다|0/);
    });
  });

  describe('특정 변경 조회', () => {
    it('변경 ID로 상세 정보를 조회한다', async () => {
      // 변경 제안 생성
      const { stdout: createOutput } = await execAsync(
        `node "${cliPath}" change -t "조회 테스트"`,
        { cwd: tempDir }
      );

      // ID 추출
      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" change ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toBeDefined();
    });
  });

  describe('변경 검증', () => {
    it('validate 서브커맨드로 변경을 검증한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "검증 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" change validate ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/검증|valid/i);
    });
  });

  describe('변경 적용', () => {
    it('apply 서브커맨드로 변경을 적용한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "적용 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" change apply ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/적용|apply/i);
    });
  });

  describe('변경 아카이브', () => {
    it('archive 서브커맨드로 변경을 아카이브한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "아카이브 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" change archive ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/아카이브|archive/i);

      // archive 디렉토리에 이동 확인
      const archivePath = path.join(tempDir, '.sdd', 'archive');
      const archives = await fs.readdir(archivePath);
      expect(archives.length).toBeGreaterThan(0);
    });
  });

  describe('변경 diff', () => {
    it('diff 서브커맨드로 변경 내용을 표시한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "diff 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" change diff ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toBeDefined();
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 변경 ID에 에러를 반환한다', async () => {
      try {
        await execAsync(
          `node "${cliPath}" change non-existent-id`,
          { cwd: tempDir }
        );
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string };
        const output = (execError.stdout || '') + (execError.stderr || '');
        expect(output).toMatch(/찾을 수 없|not found|에러|error/i);
      }
    });
  });
});
