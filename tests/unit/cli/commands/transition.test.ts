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
import { parseSpec } from '../../../../src/core/spec/parser.js';
import { validateSpecs } from '../../../../src/core/spec/validator.js';
import { readFrontmatter } from '../../../../src/utils/frontmatter.js';

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

  it('proposal.md frontmatter는 따옴표/콜론이 있는 제목도 유효한 YAML로 기록한다', async () => {
    const specPath = path.join(sddPath, 'specs', 'test-spec');
    await fs.mkdir(specPath, { recursive: true });
    await fs.writeFile(path.join(specPath, 'spec.md'), '# Test Spec');

    const title = 'Auth: "Login" 확장';
    const result = await transitionNewToChange(sddPath, 'test-spec', { title, reason: 'a: b' });
    expect(result.success).toBe(true);
    if (!result.success) return;

    const proposal = await fs.readFile(path.join(result.data.changePath, 'proposal.md'), 'utf-8');
    const { data } = readFrontmatter(proposal);
    expect(data.title).toBe(title);
    expect(data.transition_reason).toBe('a: b');
    expect(data.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.created_at).toBeUndefined();
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

  it('생성된 spec.md는 validateSpecs를 에러 없이 통과한다 (제목의 따옴표/콜론 포함)', async () => {
    const changePath = path.join(sddPath, 'changes', 'CHG-001');
    await fs.mkdir(changePath, { recursive: true });
    await fs.writeFile(path.join(changePath, 'proposal.md'), '# Auth: "Login" 개선\n\n## 배경');

    const result = await transitionChangeToNew(sddPath, 'CHG-001', {
      name: 'auth-login',
      reason: '사유: "분리"',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;

    const specFile = path.join(result.data.featurePath, 'spec.md');
    const content = await fs.readFile(specFile, 'utf-8');
    const parsed = parseSpec(content);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.metadata.title).toBe('Auth: "Login" 개선');
      expect(parsed.data.metadata.transition_reason).toBe('사유: "분리"');
      expect(parsed.data.metadata.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(parsed.data.scenarios).toHaveLength(1);
    }

    const validation = await validateSpecs(specFile);
    expect(validation.success).toBe(true);
    if (validation.success) {
      const [file] = validation.data.files;
      expect(file.errors).toEqual([]);
      expect(file.valid).toBe(true);
      // created_at is no longer emitted, so no W001; the unfilled template only yields W005
      expect(file.warnings.map((w) => w.code)).toEqual(['W005']);
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

  it.each(['..', '../CHG-001', 'CHG-001/..', 'foo'])(
    '유효하지 않은 변경 ID(%s)는 거부한다',
    async (badId) => {
      const result = await transitionChangeToNew(sddPath, badId, { name: 'x' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('유효하지 않은 변경 ID');
      }
    }
  );

  it.each(['../../escape', '..', 'a/b', 'a\\b'])(
    '경로 조작 기능 이름(%s)은 거부하고 디렉토리를 만들지 않는다',
    async (badName) => {
      const changePath = path.join(sddPath, 'changes', 'CHG-001');
      await fs.mkdir(changePath, { recursive: true });
      await fs.writeFile(path.join(changePath, 'proposal.md'), '# Test');

      const result = await transitionChangeToNew(sddPath, 'CHG-001', { name: badName });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('유효하지 않은 기능 이름');
      }
      const escaped = await fs
        .stat(path.join(sddPath, 'escape'))
        .then(() => true)
        .catch(() => false);
      expect(escaped).toBe(false);
    }
  );

  it('제목에서 파생된 기능 이름도 경로 조작을 거부한다', async () => {
    const changePath = path.join(sddPath, 'changes', 'CHG-001');
    await fs.mkdir(changePath, { recursive: true });
    await fs.writeFile(path.join(changePath, 'proposal.md'), '# ../../evil\n');

    const result = await transitionChangeToNew(sddPath, 'CHG-001', {});

    expect(result.success).toBe(false);
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
