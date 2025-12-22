/**
 * sdd cicd 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd cicd', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-cicd-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('setup 서브커맨드', () => {
    it('GitHub Actions 워크플로우를 설정한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" cicd setup`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/설정|setup|생성|created/i);

      // GitHub Actions 파일 생성 확인
      const workflowPath = path.join(tempDir, '.github', 'workflows', 'sdd-validate.yml');
      const exists = await fs.stat(workflowPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('GitLab CI 설정을 생성한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" cicd setup gitlab`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/설정|setup|gitlab/i);

      // GitLab CI 파일 생성 확인
      const ciPath = path.join(tempDir, '.gitlab-ci-sdd.yml');
      const exists = await fs.stat(ciPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('모든 플랫폼 설정을 생성한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" cicd setup all`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/설정|setup|all|모든/i);

      // 두 파일 모두 생성 확인
      const githubPath = path.join(tempDir, '.github', 'workflows', 'sdd-validate.yml');
      const gitlabPath = path.join(tempDir, '.gitlab-ci-sdd.yml');

      const githubExists = await fs.stat(githubPath).then(() => true).catch(() => false);
      const gitlabExists = await fs.stat(gitlabPath).then(() => true).catch(() => false);

      expect(githubExists).toBe(true);
      expect(gitlabExists).toBe(true);
    });
  });

  describe('hooks 서브커맨드', () => {
    it('Git hooks를 설정한다', async () => {
      // Git 저장소 초기화
      await execAsync('git init', { cwd: tempDir });

      const { stdout } = await execAsync(
        `node "${cliPath}" cicd hooks`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/hook|설정|생성/i);
    });

    it('pre-commit hook을 생성한다', async () => {
      await execAsync('git init', { cwd: tempDir });

      await execAsync(
        `node "${cliPath}" cicd hooks`,
        { cwd: tempDir }
      );

      // Husky 또는 직접 hook 확인
      const huskyPath = path.join(tempDir, '.husky', 'pre-commit');
      const gitHookPath = path.join(tempDir, '.git', 'hooks', 'pre-commit');

      const huskyExists = await fs.stat(huskyPath).then(() => true).catch(() => false);
      const gitHookExists = await fs.stat(gitHookPath).then(() => true).catch(() => false);

      expect(huskyExists || gitHookExists).toBe(true);
    });
  });

  describe('check 서브커맨드', () => {
    it('CI 검증을 실행한다', async () => {
      await execAsync(
        `node "${cliPath}" new ci-check-test --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" cicd check`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/검증|check|validation/i);
    });

    it('스펙이 없어도 검증을 수행한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" cicd check`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/검증|check|pass/i);
    });
  });

  describe('GitHub Actions 워크플로우 내용', () => {
    it('push와 pull_request 트리거를 포함한다', async () => {
      await execAsync(
        `node "${cliPath}" cicd setup`,
        { cwd: tempDir }
      );

      const workflowPath = path.join(tempDir, '.github', 'workflows', 'sdd-validate.yml');
      const content = await fs.readFile(workflowPath, 'utf-8');

      expect(content).toContain('push');
      expect(content).toContain('pull_request');
    });

    it('sdd validate 명령을 실행한다', async () => {
      await execAsync(
        `node "${cliPath}" cicd setup`,
        { cwd: tempDir }
      );

      const workflowPath = path.join(tempDir, '.github', 'workflows', 'sdd-validate.yml');
      const content = await fs.readFile(workflowPath, 'utf-8');

      expect(content).toMatch(/sdd.*validate|npx.*sdd/i);
    });

    it('Node.js 설정을 포함한다', async () => {
      await execAsync(
        `node "${cliPath}" cicd setup`,
        { cwd: tempDir }
      );

      const workflowPath = path.join(tempDir, '.github', 'workflows', 'sdd-validate.yml');
      const content = await fs.readFile(workflowPath, 'utf-8');

      expect(content).toMatch(/node|setup-node/i);
    });
  });

  describe('GitLab CI 내용', () => {
    it('validate stage를 포함한다', async () => {
      await execAsync(
        `node "${cliPath}" cicd setup gitlab`,
        { cwd: tempDir }
      );

      const ciPath = path.join(tempDir, '.gitlab-ci-sdd.yml');
      const content = await fs.readFile(ciPath, 'utf-8');

      expect(content).toMatch(/validate|stage/i);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 플랫폼은 무시하고 기본 설정을 생성한다', async () => {
      // 잘못된 플랫폼은 무시되고 기본 동작 수행
      const { stdout } = await execAsync(
        `node "${cliPath}" cicd setup invalid-platform`,
        { cwd: tempDir }
      );

      // 에러가 발생하지 않고 기본 동작 수행
      expect(stdout).toBeDefined();
    });
  });
});
