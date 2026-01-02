/**
 * transition 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getExistingChangeIds,
  extractProposalTitle,
  transitionNewToChange,
  transitionChangeToNew,
  getTransitionGuide,
} from '../../../../src/cli/commands/transition.js';

describe('getExistingChangeIds', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-transition-test-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('changes 디렉토리가 없으면 빈 배열을 반환한다', async () => {
    const result = await getExistingChangeIds(sddPath);
    expect(result).toEqual([]);
  });

  it('CHG- 접두사를 가진 디렉토리만 반환한다', async () => {
    const changesPath = path.join(sddPath, 'changes');
    await fs.mkdir(changesPath, { recursive: true });
    await fs.mkdir(path.join(changesPath, 'CHG-001'));
    await fs.mkdir(path.join(changesPath, 'CHG-002'));
    await fs.mkdir(path.join(changesPath, 'other-dir'));

    const result = await getExistingChangeIds(sddPath);
    expect(result).toContain('CHG-001');
    expect(result).toContain('CHG-002');
    expect(result).not.toContain('other-dir');
  });
});

describe('extractProposalTitle', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-proposal-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('파일이 없으면 빈 문자열을 반환한다', async () => {
    const result = await extractProposalTitle(path.join(tempDir, 'nonexistent.md'));
    expect(result).toBe('');
  });

  it('제목을 추출한다', async () => {
    const proposalPath = path.join(tempDir, 'proposal.md');
    await fs.writeFile(proposalPath, `---
id: CHG-001
---

# 테스트 제안 제목

## 배경
`);

    const result = await extractProposalTitle(proposalPath);
    expect(result).toBe('테스트 제안 제목');
  });
});

describe('transitionNewToChange', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-n2c-test-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
    await fs.mkdir(path.join(sddPath, 'changes'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙이 없으면 실패한다', async () => {
    const result = await transitionNewToChange(sddPath, 'nonexistent-spec', {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('스펙을 찾을 수 없습니다');
    }
  });

  it('스펙이 있으면 변경 제안을 생성한다', async () => {
    // 스펙 디렉토리 생성
    const specPath = path.join(sddPath, 'specs', 'test-spec');
    await fs.mkdir(specPath, { recursive: true });
    await fs.writeFile(path.join(specPath, 'spec.md'), '# Test Spec');

    const result = await transitionNewToChange(sddPath, 'test-spec', {
      title: '테스트 전환',
      reason: '테스트 목적',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changeId).toMatch(/^CHG-\d+$/);
      expect(result.data.filesCreated).toContain('proposal.md');
      expect(result.data.filesCreated).toContain('delta.md');
      expect(result.data.filesCreated).toContain('tasks.md');

      // 파일이 실제로 생성되었는지 확인
      const proposalExists = await fs
        .stat(path.join(result.data.changePath, 'proposal.md'))
        .then(() => true)
        .catch(() => false);
      expect(proposalExists).toBe(true);
    }
  });
});

describe('transitionChangeToNew', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-c2n-test-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
    await fs.mkdir(path.join(sddPath, 'changes'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('변경 제안이 없으면 실패한다', async () => {
    const result = await transitionChangeToNew(sddPath, 'CHG-999', {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('변경 제안을 찾을 수 없습니다');
    }
  });

  it('변경 제안이 있으면 새 스펙을 생성한다', async () => {
    // 변경 제안 디렉토리 생성
    const changePath = path.join(sddPath, 'changes', 'CHG-001');
    await fs.mkdir(changePath, { recursive: true });
    await fs.writeFile(
      path.join(changePath, 'proposal.md'),
      '# 테스트 변경 제안\n\n## 배경'
    );

    const result = await transitionChangeToNew(sddPath, 'CHG-001', {
      name: 'new-feature',
      reason: '분리 목적',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.featureName).toBe('new-feature');
      expect(result.data.filesCreated).toContain('spec.md');
      expect(result.data.filesCreated).toContain('plan.md');
      expect(result.data.filesCreated).toContain('tasks.md');
      expect(result.data.originalChangeId).toBe('CHG-001');

      // 파일이 실제로 생성되었는지 확인
      const specExists = await fs
        .stat(path.join(result.data.featurePath, 'spec.md'))
        .then(() => true)
        .catch(() => false);
      expect(specExists).toBe(true);
    }
  });

  it('이미 존재하는 스펙 이름이면 실패한다', async () => {
    // 변경 제안 디렉토리 생성
    const changePath = path.join(sddPath, 'changes', 'CHG-001');
    await fs.mkdir(changePath, { recursive: true });
    await fs.writeFile(path.join(changePath, 'proposal.md'), '# Test');

    // 동일 이름의 스펙 생성 (도메인 기반 구조: specs/common/existing-feature)
    await fs.mkdir(path.join(sddPath, 'specs', 'common', 'existing-feature'), { recursive: true });

    const result = await transitionChangeToNew(sddPath, 'CHG-001', {
      name: 'existing-feature',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('이미 존재');
    }
  });
});

describe('getTransitionGuide', () => {
  it('가이드 텍스트를 반환한다', () => {
    const guide = getTransitionGuide();

    expect(guide).toContain('워크플로우 전환 가이드');
    expect(guide).toContain('new → change 전환');
    expect(guide).toContain('change → new 전환');
    expect(guide).toContain('전환 판단 기준');
  });
});
