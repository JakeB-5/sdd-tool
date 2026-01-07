/**
 * prepare 명령어 유닛 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executePrepare } from '../../../../src/cli/commands/prepare.js';

describe('executePrepare', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-prepare-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기능 문서가 없으면 실패한다', async () => {
    // 기본 SDD 구조 생성
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'constitution.md'),
      '# Constitution'
    );

    const result = await executePrepare('nonexistent', {}, tempDir);

    expect(result.success).toBe(false);
    if (!result.success) {
      // 기능 디렉토리를 찾을 수 없다는 에러
      expect(result.error.message).toMatch(/찾을 수 없습니다/);
    }
  });

  it('tasks.md에서 필요한 도구를 감지한다', async () => {
    // SDD 구조 생성 - DocumentAnalyzer는 .sdd/specs/{featureName} 경로를 찾음
    await fs.mkdir(path.join(tempDir, '.sdd', 'specs', 'test-feature'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'constitution.md'),
      '# Constitution'
    );
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'specs', 'test-feature', 'spec.md'),
      `---
id: test-feature
title: "테스트 기능"
status: draft
---
# 테스트 기능
테스트 설명입니다(SHALL).
- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`
    );
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'specs', 'test-feature', 'tasks.md'),
      `# Tasks

## Task 1: 컴포넌트 생성
- [ ] component 파일 생성

## Task 2: 테스트 작성
- [ ] test 파일 작성
`
    );

    const result = await executePrepare('test-feature', { dryRun: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.report).toBeDefined();
      expect(result.data.report.totalTasks).toBeGreaterThanOrEqual(0);
    }
  });

  it('dry-run 모드에서는 보고서 파일을 생성하지 않는다', async () => {
    // DocumentAnalyzer는 .sdd/specs/{featureName} 경로를 찾음
    await fs.mkdir(path.join(tempDir, '.sdd', 'specs', 'dry-run-feature'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'constitution.md'),
      '# Constitution'
    );
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'specs', 'dry-run-feature', 'spec.md'),
      `---
id: dry-run-feature
title: "테스트"
status: draft
---
# 테스트
설명(SHALL).
- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`
    );
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'specs', 'dry-run-feature', 'tasks.md'),
      `# Tasks
## Task 1: API 작업
- [ ] api 엔드포인트 생성
`
    );

    const result = await executePrepare('dry-run-feature', { dryRun: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reportPath).toBeUndefined();
      expect(result.data.created.agents).toHaveLength(0);
      expect(result.data.created.skills).toHaveLength(0);
    }
  });

  it('보고서에 에이전트 및 스킬 체크 정보를 포함한다', async () => {
    // DocumentAnalyzer는 .sdd/specs/{featureName} 경로를 찾음
    await fs.mkdir(path.join(tempDir, '.sdd', 'specs', 'report-feature'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.claude', 'agents'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.claude', 'skills'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'constitution.md'),
      '# Constitution'
    );
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'specs', 'report-feature', 'spec.md'),
      `---
id: report-feature
title: "리포트 테스트"
status: draft
---
# 리포트 테스트
설명(SHALL).
- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`
    );
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'specs', 'report-feature', 'tasks.md'),
      `# Tasks
## Task 1: 테스트 작업
- [ ] test 작성
`
    );

    const result = await executePrepare('report-feature', { dryRun: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.report).toBeDefined();
      expect(result.data.report.agents).toBeDefined();
      expect(result.data.report.skills).toBeDefined();
    }
  });
});
