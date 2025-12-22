/**
 * sdd list 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd list', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-list-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('기본 실행', () => {
    it('프로젝트 요약을 출력한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" list`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('SDD 프로젝트 요약');
      expect(stdout).toContain('기능:');
      expect(stdout).toContain('대기 중인 변경:');
    });

    it('ls 별칭으로 실행할 수 있다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" ls`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('SDD 프로젝트 요약');
    });
  });

  describe('features 서브커맨드', () => {
    it('기능 목록을 출력한다', async () => {
      // 기능 생성
      await execAsync(
        `node "${cliPath}" new auth --title "인증 기능" --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" list features`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('기능 목록');
      expect(stdout).toContain('인증 기능');
      expect(stdout).toContain('auth');
    });

    it('f 별칭으로 실행할 수 있다', async () => {
      await execAsync(
        `node "${cliPath}" new test-f --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" list f`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('기능 목록');
    });

    it('--status 옵션으로 상태별 필터링한다', async () => {
      await execAsync(
        `node "${cliPath}" new draft-feature --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" list features --status draft`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('draft');
    });

    it('기능이 없으면 안내 메시지를 출력한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" list features`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('기능이 없습니다');
    });
  });

  describe('changes 서브커맨드', () => {
    it('변경 목록을 출력한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" list changes`,
        { cwd: tempDir }
      );

      // 변경이 없어도 메시지 출력
      expect(stdout).toMatch(/변경|없습니다/);
    });

    it('c 별칭으로 실행할 수 있다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" list c`,
        { cwd: tempDir }
      );

      expect(stdout).toBeDefined();
    });

    it('--pending 옵션으로 대기 중인 변경만 표시한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" list changes --pending`,
        { cwd: tempDir }
      );

      // 아카이브 관련 내용이 없어야 함
      expect(stdout).not.toContain('아카이브된 변경');
    });

    it('--archived 옵션으로 아카이브된 변경만 표시한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" list changes --archived`,
        { cwd: tempDir }
      );

      // 대기 중인 변경 관련 내용이 없어야 함
      expect(stdout).not.toContain('대기 중인 변경');
    });
  });

  describe('specs 서브커맨드', () => {
    it('스펙 파일 목록을 출력한다', async () => {
      await execAsync(
        `node "${cliPath}" new spec-list-test --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" list specs`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('스펙 파일 목록');
      expect(stdout).toContain('spec-list-test');
    });

    it('s 별칭으로 실행할 수 있다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" list s`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('스펙 파일 목록');
    });

    it('중첩된 디렉토리 구조를 표시한다', async () => {
      await execAsync(
        `node "${cliPath}" new nested-feature --all --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" list specs`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('nested-feature');
      expect(stdout).toContain('spec.md');
    });
  });

  describe('templates 서브커맨드', () => {
    it('템플릿 목록을 출력한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" list templates`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('템플릿 목록');
      expect(stdout).toContain('spec.md');
      expect(stdout).toContain('proposal.md');
    });

    it('t 별칭으로 실행할 수 있다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" list t`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('템플릿 목록');
    });
  });

  describe('상태 아이콘', () => {
    it('draft 상태는 올바른 아이콘을 표시한다', async () => {
      await execAsync(
        `node "${cliPath}" new icon-test --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" list features`,
        { cwd: tempDir }
      );

      // draft 아이콘
      expect(stdout).toMatch(/📝|draft/);
    });
  });
});
