/**
 * sdd report 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd report', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-report-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('기본 리포트 생성', () => {
    it('HTML 리포트를 생성한다 (기본)', async () => {
      await execAsync(
        `node "${cliPath}" new report-test --no-branch`,
        { cwd: tempDir }
      );

      // 명시적 출력 경로 지정
      const reportPath = path.join(tempDir, 'sdd-report.html');
      const { stdout } = await execAsync(
        `node "${cliPath}" report -o "${reportPath}"`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/리포트|report|생성|created/i);

      // HTML 파일 생성 확인
      const exists = await fs.stat(reportPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('스펙이 없어도 리포트를 생성한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" report`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/리포트|report/i);
    });
  });

  describe('--format 옵션', () => {
    it('Markdown 형식으로 출력한다', async () => {
      await execAsync(
        `node "${cliPath}" new md-report --no-branch`,
        { cwd: tempDir }
      );

      const reportPath = path.join(tempDir, 'sdd-report.md');
      const { stdout } = await execAsync(
        `node "${cliPath}" report --format markdown -o "${reportPath}"`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/리포트|report/i);

      // Markdown 파일 생성 확인
      const exists = await fs.stat(reportPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('JSON 형식으로 출력한다', async () => {
      await execAsync(
        `node "${cliPath}" new json-report --no-branch`,
        { cwd: tempDir }
      );

      const reportPath = path.join(tempDir, 'sdd-report.json');
      const { stdout } = await execAsync(
        `node "${cliPath}" report --format json -o "${reportPath}"`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/리포트|report/i);

      // JSON 파일 생성 확인
      const exists = await fs.stat(reportPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // JSON 파싱 가능한지 확인
      const content = await fs.readFile(reportPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toBeDefined();
    });
  });

  describe('-o 옵션', () => {
    it('출력 경로를 지정한다', async () => {
      await execAsync(
        `node "${cliPath}" new output-test --no-branch`,
        { cwd: tempDir }
      );

      const customPath = path.join(tempDir, 'custom-report.html');
      await execAsync(
        `node "${cliPath}" report -o "${customPath}"`,
        { cwd: tempDir }
      );

      const exists = await fs.stat(customPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('--title 옵션', () => {
    it('리포트 제목을 설정한다', async () => {
      await execAsync(
        `node "${cliPath}" new title-test --no-branch`,
        { cwd: tempDir }
      );

      const reportPath = path.join(tempDir, 'sdd-report.html');
      await execAsync(
        `node "${cliPath}" report --title "커스텀 리포트 제목" -o "${reportPath}"`,
        { cwd: tempDir }
      );

      const content = await fs.readFile(reportPath, 'utf-8');
      expect(content).toContain('커스텀 리포트 제목');
    });
  });

  describe('--no-quality 옵션', () => {
    it('품질 분석을 제외한다', async () => {
      await execAsync(
        `node "${cliPath}" new no-quality-test --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" report --no-quality`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/리포트|report/i);
    });
  });

  describe('--no-validation 옵션', () => {
    it('검증 결과를 제외한다', async () => {
      await execAsync(
        `node "${cliPath}" new no-validation-test --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" report --no-validation`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/리포트|report/i);
    });
  });

  describe('리포트 내용', () => {
    it('Phase별 분포 통계를 포함한다', async () => {
      await execAsync(
        `node "${cliPath}" new stats-test --no-branch`,
        { cwd: tempDir }
      );

      const reportPath = path.join(tempDir, 'sdd-report.html');
      await execAsync(
        `node "${cliPath}" report -o "${reportPath}"`,
        { cwd: tempDir }
      );

      const content = await fs.readFile(reportPath, 'utf-8');
      expect(content).toMatch(/통계|stats|분포|distribution|summary/i);
    });

    it('스펙 목록을 포함한다', async () => {
      await execAsync(
        `node "${cliPath}" new spec-list-report --no-branch`,
        { cwd: tempDir }
      );

      const reportPath = path.join(tempDir, 'sdd-report.html');
      await execAsync(
        `node "${cliPath}" report -o "${reportPath}"`,
        { cwd: tempDir }
      );

      const content = await fs.readFile(reportPath, 'utf-8');
      expect(content).toContain('spec-list-report');
    });
  });

  describe('HTML 스타일', () => {
    it('반응형 스타일을 포함한다', async () => {
      await execAsync(
        `node "${cliPath}" new style-test --no-branch`,
        { cwd: tempDir }
      );

      const reportPath = path.join(tempDir, 'sdd-report.html');
      await execAsync(
        `node "${cliPath}" report -o "${reportPath}"`,
        { cwd: tempDir }
      );

      const content = await fs.readFile(reportPath, 'utf-8');
      expect(content).toContain('<style>');
      expect(content).toContain('</html>');
    });
  });
});
