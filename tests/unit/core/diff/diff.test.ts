/**
 * Diff 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { executeDiff } from '../../../../src/core/diff/index.js';

const execAsync = promisify(exec);

describe('executeDiff', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-diff-test-'));
    specsDir = path.join(tempDir, '.sdd', 'specs');

    await fs.mkdir(specsDir, { recursive: true });

    // Git 저장소 초기화
    await execAsync('git init', { cwd: tempDir });
    await execAsync('git config user.email "test@test.com"', { cwd: tempDir });
    await execAsync('git config user.name "Test"', { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('Git 저장소가 아니면 오류를 반환한다', async () => {
    const nonGitDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-non-git-'));

    try {
      const result = await executeDiff(nonGitDir);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_GIT_REPOSITORY');
    } finally {
      await fs.rm(nonGitDir, { recursive: true, force: true });
    }
  });

  it('변경이 없으면 빈 결과를 반환한다', async () => {
    // 초기 스펙 생성 및 커밋
    const authDir = path.join(specsDir, 'auth');
    await fs.mkdir(authDir);
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인\n\n시스템은 로그인을 지원해야 한다(SHALL).`
    );
    await execAsync('git add .', { cwd: tempDir });
    await execAsync('git commit -m "Initial"', { cwd: tempDir });

    const result = await executeDiff(tempDir);

    expect(result.success).toBe(true);
    expect(result.data?.result.files).toHaveLength(0);
  });

  it('작업 디렉토리 변경을 감지한다', async () => {
    // 초기 스펙 생성 및 커밋
    const authDir = path.join(specsDir, 'auth');
    await fs.mkdir(authDir);
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인\n\n시스템은 로그인을 지원해야 한다(SHALL).`
    );
    await execAsync('git add .', { cwd: tempDir });
    await execAsync('git commit -m "Initial"', { cwd: tempDir });

    // 스펙 수정 (커밋하지 않음)
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인\n\n시스템은 로그인을 지원해야 한다(SHALL).\n\n### REQ-002: 로그아웃\n\n시스템은 로그아웃을 지원해야 한다(SHALL).`
    );

    const result = await executeDiff(tempDir);

    expect(result.success).toBe(true);
    expect(result.data?.result.files.length).toBeGreaterThan(0);
    expect(result.data?.result.summary.addedRequirements).toBeGreaterThan(0);
  });

  it('JSON 출력을 지원한다', async () => {
    // 초기 스펙 생성 및 커밋
    const authDir = path.join(specsDir, 'auth');
    await fs.mkdir(authDir);
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인\n\n시스템은 로그인을 지원해야 한다(SHALL).`
    );
    await execAsync('git add .', { cwd: tempDir });
    await execAsync('git commit -m "Initial"', { cwd: tempDir });

    // 스펙 수정
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인 변경\n\n시스템은 로그인을 지원해야 한다(SHALL).`
    );

    const result = await executeDiff(tempDir, { json: true });

    expect(result.success).toBe(true);
    expect(result.data?.output).toContain('"files"');

    const parsed = JSON.parse(result.data!.output);
    expect(parsed.files).toBeDefined();
    expect(parsed.summary).toBeDefined();
  });

  it('stat 옵션을 지원한다', async () => {
    // 초기 스펙 생성 및 커밋
    const authDir = path.join(specsDir, 'auth');
    await fs.mkdir(authDir);
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인\n\n시스템은 로그인을 지원해야 한다(SHALL).`
    );
    await execAsync('git add .', { cwd: tempDir });
    await execAsync('git commit -m "Initial"', { cwd: tempDir });

    // 스펙 수정
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인 변경\n\n시스템은 로그인을 지원해야 한다(SHALL).`
    );

    const result = await executeDiff(tempDir, { stat: true, noColor: true });

    expect(result.success).toBe(true);
    expect(result.data?.output).toContain('SDD Diff --stat');
  });

  it('name-only 옵션을 지원한다', async () => {
    // 초기 스펙 생성 및 커밋
    const authDir = path.join(specsDir, 'auth');
    await fs.mkdir(authDir);
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인\n\n시스템은 로그인을 지원해야 한다(SHALL).`
    );
    await execAsync('git add .', { cwd: tempDir });
    await execAsync('git commit -m "Initial"', { cwd: tempDir });

    // 스펙 수정
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인 변경\n\n시스템은 로그인을 지원해야 한다(SHALL).`
    );

    const result = await executeDiff(tempDir, { nameOnly: true });

    expect(result.success).toBe(true);
    expect(result.data?.output).toContain('.sdd/specs/auth/spec.md');
    expect(result.data?.output).not.toContain('REQ-001');
  });

  it('스테이징된 변경을 감지한다', async () => {
    // 초기 스펙 생성 및 커밋
    const authDir = path.join(specsDir, 'auth');
    await fs.mkdir(authDir);
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인\n\n시스템은 로그인을 지원해야 한다(SHALL).`
    );
    await execAsync('git add .', { cwd: tempDir });
    await execAsync('git commit -m "Initial"', { cwd: tempDir });

    // 스펙 수정 및 스테이징
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `### REQ-001: 로그인\n\n시스템은 로그인을 지원해야 한다(SHALL).\n\n### REQ-002: 로그아웃\n\n새 요구사항`
    );
    await execAsync('git add .', { cwd: tempDir });

    const result = await executeDiff(tempDir, { staged: true, noColor: true });

    expect(result.success).toBe(true);
  });
});
