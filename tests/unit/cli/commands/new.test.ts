/**
 * new 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getConstitutionVersion,
  createFeature,
  createPlan,
  createTasks,
  createChecklist,
  getCounterStatus,
} from '../../../../src/cli/commands/new.js';

describe('getConstitutionVersion', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-new-test-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('constitution.md가 없으면 undefined를 반환한다', async () => {
    const result = await getConstitutionVersion(sddPath);
    expect(result).toBeUndefined();
  });

  it('유효한 constitution.md에서 버전을 추출한다', async () => {
    const constitutionContent = `---
version: 1.2.3
created: 2024-01-01
---

# Constitution: test-project

## 핵심 원칙

### 1. 품질 우선

- 테스트는 필수다(SHALL)
`;
    await fs.writeFile(path.join(sddPath, 'constitution.md'), constitutionContent);

    const result = await getConstitutionVersion(sddPath);
    expect(result).toBe('1.2.3');
  });
});

describe('createFeature', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-feature-test-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기본 옵션으로 기능을 생성한다', async () => {
    const result = await createFeature(sddPath, 'test-feature', {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.featureId).toBe('test-feature');
      expect(result.data.filesCreated).toContain('spec.md');
    }
  });

  it('plan 옵션이 있으면 plan.md도 생성한다', async () => {
    const result = await createFeature(sddPath, 'test-feature', { plan: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filesCreated).toContain('spec.md');
      expect(result.data.filesCreated).toContain('plan.md');
    }
  });

  it('tasks 옵션이 있으면 tasks.md도 생성한다', async () => {
    const result = await createFeature(sddPath, 'test-feature', { tasks: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filesCreated).toContain('spec.md');
      expect(result.data.filesCreated).toContain('tasks.md');
    }
  });

  it('all 옵션이 있으면 모든 파일을 생성한다', async () => {
    const result = await createFeature(sddPath, 'test-feature', { all: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filesCreated).toContain('spec.md');
      expect(result.data.filesCreated).toContain('plan.md');
      expect(result.data.filesCreated).toContain('tasks.md');
      expect(result.data.filesCreated).toContain('checklist.md');
    }
  });

  it('title과 description 옵션을 사용한다', async () => {
    const result = await createFeature(sddPath, 'test-feature', {
      title: '테스트 기능',
      description: '테스트 설명',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const specPath = path.join(result.data.featurePath, 'spec.md');
      const specContent = await fs.readFile(specPath, 'utf-8');
      expect(specContent).toContain('테스트 기능');
    }
  });
});

describe('createPlan', () => {
  let tempDir: string;
  let featurePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-plan-test-'));
    featurePath = path.join(tempDir, 'test-feature');
    await fs.mkdir(featurePath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기능 디렉토리가 없으면 실패한다', async () => {
    const result = await createPlan('/nonexistent/path', 'test-feature');
    expect(result.success).toBe(false);
  });

  it('plan.md 파일을 생성한다', async () => {
    const result = await createPlan(featurePath, 'test-feature');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('plan.md');
      const planExists = await fs
        .stat(result.data)
        .then(() => true)
        .catch(() => false);
      expect(planExists).toBe(true);
    }
  });

  it('spec.md에서 제목을 추출한다', async () => {
    const specContent = `---
id: test-feature
title: "추출된 제목"
---

# Spec
`;
    await fs.writeFile(path.join(featurePath, 'spec.md'), specContent);

    const result = await createPlan(featurePath, 'test-feature');

    expect(result.success).toBe(true);
    if (result.success) {
      const planContent = await fs.readFile(result.data, 'utf-8');
      expect(planContent).toContain('추출된 제목');
    }
  });
});

describe('createTasks', () => {
  let tempDir: string;
  let featurePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-tasks-test-'));
    featurePath = path.join(tempDir, 'test-feature');
    await fs.mkdir(featurePath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기능 디렉토리가 없으면 실패한다', async () => {
    const result = await createTasks('/nonexistent/path', 'test-feature');
    expect(result.success).toBe(false);
  });

  it('tasks.md 파일을 생성한다', async () => {
    const result = await createTasks(featurePath, 'test-feature');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('tasks.md');
      const tasksExists = await fs
        .stat(result.data)
        .then(() => true)
        .catch(() => false);
      expect(tasksExists).toBe(true);
    }
  });

  it('기본 작업 항목을 포함한다', async () => {
    const result = await createTasks(featurePath, 'test-feature');

    expect(result.success).toBe(true);
    if (result.success) {
      const tasksContent = await fs.readFile(result.data, 'utf-8');
      expect(tasksContent).toContain('기반 구조 설정');
      expect(tasksContent).toContain('핵심 기능 구현');
    }
  });
});

describe('createChecklist', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-checklist-test-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('.sdd 디렉토리가 없으면 실패한다', async () => {
    const result = await createChecklist('/nonexistent/.sdd');
    expect(result.success).toBe(false);
  });

  it('checklist.md 파일을 생성한다', async () => {
    const result = await createChecklist(sddPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('checklist.md');
      const checklistExists = await fs
        .stat(result.data)
        .then(() => true)
        .catch(() => false);
      expect(checklistExists).toBe(true);
    }
  });
});

describe('getCounterStatus', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-counter-test-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('카운터 상태를 반환한다', async () => {
    const result = await getCounterStatus(sddPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nextNumber).toBeGreaterThan(0);
      expect(result.data.totalFeatures).toBeGreaterThanOrEqual(0);
    }
  });
});
