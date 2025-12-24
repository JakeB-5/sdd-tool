/**
 * Prepare 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executePrepare } from '../../../../src/cli/commands/prepare.js';

describe('executePrepare', () => {
  let tempDir: string;
  let sddDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-prepare-test-'));
    sddDir = path.join(tempDir, '.sdd');
    specsDir = path.join(sddDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('존재하지 않는 기능에 에러를 반환한다', async () => {
    const result = await executePrepare('non-existent', {}, tempDir);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('non-existent');
    }
  });

  it('기능 문서를 분석하고 보고서를 생성한다', async () => {
    // 기능 디렉토리 및 문서 생성
    const featureDir = path.join(specsDir, 'user-auth');
    await fs.mkdir(featureDir);

    await fs.writeFile(
      path.join(featureDir, 'tasks.md'),
      `# Tasks

- [ ] 테스트 작성: UserService 단위 테스트
- [ ] 구현: REST API 엔드포인트
- [ ] 문서 업데이트
`
    );

    const result = await executePrepare('user-auth', { dryRun: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.report.feature).toBe('user-auth');
      expect(result.data.report.totalTasks).toBe(3);
      // 테스트, API, 문서 관련 도구가 감지되어야 함
      expect(result.data.report.skills.required).toBeGreaterThan(0);
    }
  });

  it('dry-run 모드에서는 파일을 생성하지 않는다', async () => {
    const featureDir = path.join(specsDir, 'dry-run-test');
    await fs.mkdir(featureDir);

    await fs.writeFile(
      path.join(featureDir, 'tasks.md'),
      `# Tasks

- [ ] 테스트 작성
`
    );

    const result = await executePrepare('dry-run-test', { dryRun: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reportPath).toBeUndefined();
      expect(result.data.created.agents).toHaveLength(0);
      expect(result.data.created.skills).toHaveLength(0);
    }
  });

  it('auto-approve 모드에서 누락된 도구를 생성한다', async () => {
    const featureDir = path.join(specsDir, 'auto-approve-test');
    await fs.mkdir(featureDir);

    await fs.writeFile(
      path.join(featureDir, 'tasks.md'),
      `# Tasks

- [ ] 테스트 작성
`
    );

    const result = await executePrepare(
      'auto-approve-test',
      { autoApprove: true },
      tempDir
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // prepare.md가 생성되어야 함
      expect(result.data.reportPath).toBeDefined();

      // 에이전트나 스킬이 생성되었는지 확인
      const totalCreated =
        result.data.created.agents.length + result.data.created.skills.length;
      expect(totalCreated).toBeGreaterThan(0);
    }
  });

  it('이미 존재하는 도구는 생성하지 않는다', async () => {
    // 에이전트 디렉토리 생성
    const agentsDir = path.join(tempDir, '.claude', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    // 기존 에이전트 생성
    await fs.writeFile(
      path.join(agentsDir, 'test-runner.md'),
      `---
name: test-runner
description: 기존 테스트 에이전트
---

# Test Runner
`
    );

    // 기능 디렉토리 생성
    const featureDir = path.join(specsDir, 'existing-tools');
    await fs.mkdir(featureDir);

    await fs.writeFile(
      path.join(featureDir, 'tasks.md'),
      `# Tasks

- [ ] 테스트 작성
`
    );

    const result = await executePrepare(
      'existing-tools',
      { autoApprove: true },
      tempDir
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // test-runner는 이미 존재하므로 생성되지 않아야 함
      const createdAgents = result.data.created.agents;
      const hasTestRunner = createdAgents.some(p => p.includes('test-runner'));
      expect(hasTestRunner).toBe(false);

      // 보고서에서 test-runner는 존재 상태여야 함
      const testRunnerCheck = result.data.report.agents.checks.find(
        c => c.tool.name === 'test-runner'
      );
      if (testRunnerCheck) {
        expect(testRunnerCheck.status).toBe('exists');
      }
    }
  });

  it('여러 종류의 도구를 동시에 감지한다', async () => {
    const featureDir = path.join(specsDir, 'multi-tools');
    await fs.mkdir(featureDir);

    await fs.writeFile(
      path.join(featureDir, 'tasks.md'),
      `# Tasks

- [ ] 테스트 작성: UserService 단위 테스트
- [ ] REST API 구현
- [ ] React 컴포넌트 생성
- [ ] 코드 리뷰
`
    );

    const result = await executePrepare('multi-tools', { dryRun: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      // 여러 에이전트가 감지되어야 함
      expect(result.data.report.agents.required).toBeGreaterThanOrEqual(2);
      // 여러 스킬이 감지되어야 함
      expect(result.data.report.skills.required).toBeGreaterThanOrEqual(3);
    }
  });
});
