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
  parseDomainFeatureName,
  detectDomain,
  validateDomain,
  buildNextSteps,
  setSpecStatus,
  setTaskStatus,
  parseTaskStatusArg,
} from '../../../../src/cli/commands/new.js';
import { executeDomainCreate } from '../../../../src/cli/commands/domain.js';
import { executeContextSet, executeContextClear } from '../../../../src/cli/commands/context.js';

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

  it('명시한 title이 spec.md 제목보다 우선한다', async () => {
    await fs.writeFile(
      path.join(featurePath, 'spec.md'),
      '---\nid: test-feature\ntitle: "스펙 제목"\n---\n'
    );

    const result = await createPlan(featurePath, 'test-feature', '계획 전용 제목');

    expect(result.success).toBe(true);
    if (result.success) {
      const planContent = await fs.readFile(result.data, 'utf-8');
      expect(planContent).toContain('계획 전용 제목');
      expect(planContent).not.toContain('스펙 제목');
    }
  });

  it('plan.md를 쓸 수 없으면 실패를 반환한다', async () => {
    const planPath = path.join(featurePath, 'plan.md');
    await fs.writeFile(planPath, 'old');
    await fs.chmod(planPath, 0o444);

    try {
      const result = await createPlan(featurePath, 'test-feature', undefined, true);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('계획 파일 생성 실패');
      }
    } finally {
      await fs.chmod(planPath, 0o644);
    }
  });

  it('plan.md가 이미 있으면 덮어쓰지 않고 --force를 안내한다', async () => {
    const planPath = path.join(featurePath, 'plan.md');
    await fs.writeFile(planPath, 'edited plan');

    const result = await createPlan(featurePath, 'test-feature');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(planPath);
      expect(result.error.message).toContain('--force');
    }
    expect(await fs.readFile(planPath, 'utf-8')).toBe('edited plan');
  });

  it('force이면 기존 plan.md를 덮어쓴다', async () => {
    const planPath = path.join(featurePath, 'plan.md');
    await fs.writeFile(planPath, 'edited plan');

    const result = await createPlan(featurePath, 'test-feature', undefined, true);

    expect(result.success).toBe(true);
    expect(await fs.readFile(planPath, 'utf-8')).toContain('feature: test-feature');
  });
});

describe('buildNextSteps', () => {
  it('생성된 파일 단계를 건너뛰어도 번호가 연속된다', () => {
    expect(buildNextSteps('/f', 'login', { plan: true })).toEqual([
      '/f/spec.md 편집',
      'sdd new tasks login - 작업 분해',
      'sdd validate - 명세 검증',
    ]);
    expect(buildNextSteps('/f', 'login', { all: true })).toHaveLength(2);
    expect(buildNextSteps('/f', 'login', {})).toHaveLength(4);
  });
});

describe('createFeature - 쓰기 실패', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-new-write-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('spec.md를 쓸 수 없으면 실패를 반환한다', async () => {
    const featureDir = path.join(sddPath, 'specs', 'common', 'locked');
    await fs.mkdir(featureDir, { recursive: true });
    await fs.writeFile(path.join(featureDir, 'spec.md'), 'old');
    await fs.chmod(path.join(featureDir, 'spec.md'), 0o444);

    try {
      const result = await createFeature(sddPath, 'locked', { force: true });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('파일 생성 실패');
      }
    } finally {
      await fs.chmod(path.join(featureDir, 'spec.md'), 0o644);
    }
  });
});

describe('createFeature - 덮어쓰기 방지', () => {
  let tempDir: string;
  let sddPath: string;
  let featureDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-new-overwrite-'));
    sddPath = path.join(tempDir, '.sdd');
    featureDir = path.join(sddPath, 'specs', 'common', 'login');
    await fs.mkdir(featureDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('spec.md가 이미 있으면 실패하고 내용을 보존한다', async () => {
    await fs.writeFile(path.join(featureDir, 'spec.md'), 'edited spec');

    const result = await createFeature(sddPath, 'login', {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(path.join(featureDir, 'spec.md'));
      expect(result.error.message).toContain('--force');
    }
    expect(await fs.readFile(path.join(featureDir, 'spec.md'), 'utf-8')).toBe('edited spec');
  });

  it('--all에서 하나라도 존재하면 아무 파일도 쓰지 않는다', async () => {
    await fs.writeFile(path.join(featureDir, 'tasks.md'), 'edited tasks');

    const result = await createFeature(sddPath, 'login', { all: true });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('tasks.md');
      expect(result.error.message).not.toContain('plan.md');
    }
    expect(await fs.readFile(path.join(featureDir, 'tasks.md'), 'utf-8')).toBe('edited tasks');
    const specExists = await fs
      .stat(path.join(featureDir, 'spec.md'))
      .then(() => true)
      .catch(() => false);
    expect(specExists).toBe(false);
  });

  it('spec.md만 있는데 --plan이면 기존 기능에 추가하는 명령을 안내한다', async () => {
    await fs.writeFile(path.join(featureDir, 'spec.md'), 'edited spec');

    const result = await createFeature(sddPath, 'login', { plan: true });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('--force');
      expect(result.error.message).toContain('sdd new plan common/login');
      expect(result.error.message).toContain('sdd new tasks common/login');
    }
  });

  it('force이면 기존 파일을 덮어쓴다', async () => {
    await fs.writeFile(path.join(featureDir, 'spec.md'), 'edited spec');
    await fs.writeFile(path.join(featureDir, 'plan.md'), 'edited plan');

    const result = await createFeature(sddPath, 'login', { all: true, force: true });

    expect(result.success).toBe(true);
    expect(await fs.readFile(path.join(featureDir, 'spec.md'), 'utf-8')).toContain('id: login');
    expect(await fs.readFile(path.join(featureDir, 'plan.md'), 'utf-8')).toContain('feature: login');
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

  it('구현 작업은 테스트 우선이며 사후 테스트 작업이 없다', async () => {
    const result = await createTasks(featurePath, 'test-feature');

    expect(result.success).toBe(true);
    if (result.success) {
      const tasksContent = await fs.readFile(result.data, 'utf-8');
      expect(tasksContent).not.toMatch(/### [^\n]+: 테스트 작성/);
      expect(tasksContent.match(/실패하는 테스트로 먼저 작성/g)).toHaveLength(2);
    }
  });

  it('tasks.md가 이미 있으면 덮어쓰지 않고 force이면 덮어쓴다', async () => {
    const tasksPath = path.join(featurePath, 'tasks.md');
    await fs.writeFile(tasksPath, 'edited tasks');

    const refused = await createTasks(featurePath, 'test-feature');
    expect(refused.success).toBe(false);
    if (!refused.success) {
      expect(refused.error.message).toContain(tasksPath);
      expect(refused.error.message).toContain('--force');
    }
    expect(await fs.readFile(tasksPath, 'utf-8')).toBe('edited tasks');

    const forced = await createTasks(featurePath, 'test-feature', true);
    expect(forced.success).toBe(true);
    expect(await fs.readFile(tasksPath, 'utf-8')).toContain('feature: test-feature');
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

  it('checklist.md가 이미 있으면 덮어쓰지 않고 force이면 덮어쓴다', async () => {
    const checklistPath = path.join(sddPath, 'checklist.md');
    await fs.writeFile(checklistPath, 'edited checklist');

    const refused = await createChecklist(sddPath);
    expect(refused.success).toBe(false);
    if (!refused.success) {
      expect(refused.error.message).toContain(checklistPath);
    }
    expect(await fs.readFile(checklistPath, 'utf-8')).toBe('edited checklist');

    const forced = await createChecklist(sddPath, true);
    expect(forced.success).toBe(true);
    expect(await fs.readFile(checklistPath, 'utf-8')).not.toBe('edited checklist');
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

describe('parseDomainFeatureName', () => {
  it('슬래시가 없으면 이름만 반환한다', () => {
    const result = parseDomainFeatureName('login');
    expect(result).toEqual({ name: 'login' });
    expect(result.domain).toBeUndefined();
  });

  it('도메인/이름 형식을 파싱한다', () => {
    const result = parseDomainFeatureName('auth/login');
    expect(result).toEqual({ domain: 'auth', name: 'login' });
  });

  it('중첩된 슬래시를 처리한다', () => {
    const result = parseDomainFeatureName('auth/oauth/google');
    expect(result).toEqual({ domain: 'auth', name: 'oauth/google' });
  });
});

describe('detectDomain', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-detect-domain-'));
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.sdd', 'domains'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.sdd', 'specs'), { recursive: true });

    // 테스트용 도메인 생성
    await executeDomainCreate('core', { description: '핵심' }, tempDir);
    await executeDomainCreate('auth', { description: '인증' }, tempDir);
  });

  afterEach(async () => {
    await executeContextClear(tempDir);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('컨텍스트가 없으면 undefined를 반환한다', async () => {
    const result = await detectDomain(tempDir);
    expect(result).toBeUndefined();
  });

  it('단일 활성 도메인이면 해당 도메인을 반환한다', async () => {
    await executeContextSet(['auth'], { includeDeps: false }, tempDir);
    const result = await detectDomain(tempDir);
    expect(result).toBe('auth');
  });

  it('여러 활성 도메인이면 undefined를 반환한다', async () => {
    await executeContextSet(['core', 'auth'], {}, tempDir);
    const result = await detectDomain(tempDir);
    expect(result).toBeUndefined();
  });
});

describe('validateDomain', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validate-domain-'));
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.sdd', 'domains'), { recursive: true });

    // 테스트용 도메인 생성
    await executeDomainCreate('auth', { description: '인증' }, tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('존재하는 도메인은 success를 반환한다', async () => {
    const result = await validateDomain(tempDir, 'auth');
    expect(result.success).toBe(true);
  });

  it('존재하지 않는 도메인은 failure를 반환한다', async () => {
    const result = await validateDomain(tempDir, 'nonexistent');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('도메인을 찾을 수 없습니다');
    }
  });
});

describe('createFeature with domain', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-feature-domain-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
    await fs.mkdir(path.join(sddPath, 'domains'), { recursive: true });

    // 테스트용 도메인 생성
    await executeDomainCreate('auth', { description: '인증' }, tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('도메인이 지정되면 spec에 도메인이 포함된다', async () => {
    const result = await createFeature(sddPath, 'login', { domain: 'auth' });

    expect(result.success).toBe(true);
    if (result.success) {
      const specPath = path.join(result.data.featurePath, 'spec.md');
      const specContent = await fs.readFile(specPath, 'utf-8');
      expect(specContent).toContain('domain: auth');
    }
  });

  it('도메인/이름 형식으로 생성한다', async () => {
    const result = await createFeature(sddPath, 'auth/oauth', {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.featureId).toBe('oauth');
      const specPath = path.join(result.data.featurePath, 'spec.md');
      const specContent = await fs.readFile(specPath, 'utf-8');
      expect(specContent).toContain('domain: auth');
    }
  });

  it('존재하지 않는 도메인은 자동 생성하고 스펙을 연결한다', async () => {
    const result = await createFeature(sddPath, 'pricing/discount', {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domain).toBe('pricing');
      expect(result.data.domainCreated).toBe(true);
    }
    const domainsYml = await fs.readFile(path.join(sddPath, 'domains.yml'), 'utf-8');
    expect(domainsYml).toContain('pricing:');
    expect(domainsYml).toContain('discount');
    const domainMd = await fs
      .stat(path.join(sddPath, 'domains', 'pricing', 'domain.md'))
      .then(() => true)
      .catch(() => false);
    expect(domainMd).toBe(true);
  });

  it('기존 도메인이면 domainCreated가 false이다', async () => {
    const result = await createFeature(sddPath, 'auth/session', {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domainCreated).toBe(false);
    }
  });

  it('덮어쓰기가 거부되면 도메인을 만들지 않는다', async () => {
    const featureDir = path.join(sddPath, 'specs', 'pricing', 'discount');
    await fs.mkdir(featureDir, { recursive: true });
    await fs.writeFile(path.join(featureDir, 'spec.md'), 'edited');

    const result = await createFeature(sddPath, 'pricing/discount', {});

    expect(result.success).toBe(false);
    const domainsYml = await fs.readFile(path.join(sddPath, 'domains.yml'), 'utf-8');
    expect(domainsYml).not.toContain('pricing:');
    const domainMd = await fs
      .stat(path.join(sddPath, 'domains', 'pricing', 'domain.md'))
      .then(() => true)
      .catch(() => false);
    expect(domainMd).toBe(false);
  });

  it.each([
    ['pricing/', '기능 이름이 비어 있습니다'],
    ['pricing/!!!', '기능 이름이 비어 있습니다'],
    ['/cart', '도메인 이름이 비어 있습니다'],
  ])('빈 이름(%s)은 거부하고 도메인·파일을 만들지 않는다', async (name, message) => {
    const result = await createFeature(sddPath, name, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(message);
    }
    const domainsYml = await fs.readFile(path.join(sddPath, 'domains.yml'), 'utf-8');
    expect(domainsYml).not.toContain('pricing:');
    expect(domainsYml).not.toContain('""');
    const specsEntries = await fs.readdir(path.join(sddPath, 'specs'));
    expect(specsEntries).toEqual([]);
  });

  it('등록되지 않은 common은 도메인 미지정과 같이 처리한다', async () => {
    const result = await createFeature(sddPath, 'common/cart', {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domain).toBe('common');
      expect(result.data.domainCreated).toBe(false);
      expect(result.data.featurePath).toBe(path.join(sddPath, 'specs', 'common', 'cart'));
    }
    const domainsYml = await fs.readFile(path.join(sddPath, 'domains.yml'), 'utf-8');
    expect(domainsYml).not.toContain('common:');
    const spec = await fs.readFile(path.join(sddPath, 'specs', 'common', 'cart', 'spec.md'), 'utf-8');
    expect(spec).not.toContain('domain: common');
  });

  it.each([
    ['login', { domain: '../../escape' }],
    ['login', { domain: '..' }],
    ['../escape', {}],
  ])('경로 조작 도메인(%s, %j)은 거부하고 디렉토리를 만들지 않는다', async (name, options) => {
    const result = await createFeature(sddPath, name, options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('유효하지 않은 도메인 ID');
    }
    const escaped = await fs
      .stat(path.join(tempDir, 'escape'))
      .then(() => true)
      .catch(() => false);
    expect(escaped).toBe(false);
  });
});

describe('setSpecStatus', () => {
  let tempDir: string;
  let sddPath: string;
  let specPath: string;

  const SPEC = `---
id: cart
title: "카트" # display title
status: draft
created: 2026-10-27
domain: pricing
depends: null
---

# 카트
`;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-spec-status-'));
    sddPath = path.join(tempDir, '.sdd');
    specPath = path.join(sddPath, 'specs', 'pricing', 'cart', 'spec.md');
    await fs.mkdir(path.dirname(specPath), { recursive: true });
    await fs.writeFile(specPath, SPEC);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('status만 바꾸고 나머지 frontmatter 서식은 유지한다 (updated 필드가 없으면 추가하지 않음)', async () => {
    const result = await setSpecStatus(sddPath, 'pricing/cart', 'implemented');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ featureId: 'pricing/cart', from: 'draft', to: 'implemented', changed: true });
    }
    expect(await fs.readFile(specPath, 'utf-8')).toBe(SPEC.replace('status: draft', 'status: implemented'));
  });

  it('updated 필드가 있으면 오늘 날짜로 갱신한다', async () => {
    await fs.writeFile(specPath, SPEC.replace('created: 2026-10-27', 'created: 2026-10-27\nupdated: 2020-01-01'));
    const today = new Date().toISOString().split('T')[0];

    const result = await setSpecStatus(sddPath, 'cart', 'review');

    expect(result.success).toBe(true);
    const content = await fs.readFile(specPath, 'utf-8');
    expect(content).toContain('status: review');
    expect(content).toContain(`updated: ${today}`);
    expect(content).not.toContain('2020-01-01');
  });

  it('레거시 별칭과 대소문자를 표준 상태로 기록한다', async () => {
    const result = await setSpecStatus(sddPath, 'cart', 'Completed');

    expect(result.success).toBe(true);
    expect(await fs.readFile(specPath, 'utf-8')).toContain('status: implemented');
  });

  it('같은 상태면 파일을 쓰지 않고 changed=false를 반환한다', async () => {
    const result = await setSpecStatus(sddPath, 'cart', 'draft');

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.changed).toBe(false);
    expect(await fs.readFile(specPath, 'utf-8')).toBe(SPEC);
  });

  it('유효하지 않은 상태는 허용 값을 나열하며 실패한다', async () => {
    const result = await setSpecStatus(sddPath, 'cart', 'done');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("'done'");
      expect(result.error.message).toContain('draft, review, approved, planned, tasked, implementing, implemented, deprecated');
    }
    expect(await fs.readFile(specPath, 'utf-8')).toBe(SPEC);
  });

  it('없는 기능은 사용 가능한 기능을 나열하며 실패한다', async () => {
    const result = await setSpecStatus(sddPath, 'nope', 'review');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("'nope'");
      expect(result.error.message).toContain('pricing/cart');
    }
  });

  it('여러 도메인에 같은 기능이 있으면 모호성 오류를 반환한다', async () => {
    const other = path.join(sddPath, 'specs', 'shop', 'cart', 'spec.md');
    await fs.mkdir(path.dirname(other), { recursive: true });
    await fs.writeFile(other, SPEC);

    const result = await setSpecStatus(sddPath, 'cart', 'review');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('pricing/cart, shop/cart');
    }
  });

  it('CRLF 스펙은 CRLF 줄바꿈을 유지한다', async () => {
    const crlf = SPEC.replace(/\n/g, '\r\n');
    await fs.writeFile(specPath, crlf);

    const result = await setSpecStatus(sddPath, 'cart', 'approved');

    expect(result.success).toBe(true);
    expect(await fs.readFile(specPath, 'utf-8')).toBe(crlf.replace('status: draft', 'status: approved'));
  });

  it('frontmatter가 없는 스펙은 수정하지 않고 실패한다', async () => {
    await fs.writeFile(specPath, '# 카트\n');

    const result = await setSpecStatus(sddPath, 'cart', 'review');

    expect(result.success).toBe(false);
    expect(await fs.readFile(specPath, 'utf-8')).toBe('# 카트\n');
  });
});

describe('setTaskStatus', () => {
  let tempDir: string;
  let sddPath: string;
  let tasksPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-task-status-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
    const created = await createFeature(sddPath, 'pricing/cart', { tasks: true });
    if (!created.success) throw created.error;
    tasksPath = path.join(created.data.featurePath, 'tasks.md');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('작업 상태를 바꾸고 진행 상황/완료 수를 갱신한다', async () => {
    const result = await setTaskStatus(sddPath, 'pricing/cart', 'cart-task-001', 'completed');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        featureId: 'pricing/cart',
        taskId: 'cart-task-001',
        from: 'pending',
        to: 'completed',
        changed: true,
        progress: { completed: 1, total: 3 },
      });
    }
    const content = await fs.readFile(tasksPath, 'utf-8');
    expect(content).toMatch(/### cart-task-001:[^\n]*\n\n- \*\*상태:\*\* 완료/);
    expect(content).toContain('- 완료: 1');
    expect(content).toContain('- 대기: 2');
    expect(content).toContain('completed: 1');
  });

  it.each([
    ['in-progress', 'in_progress', '진행 중'],
    ['in_progress', 'in_progress', '진행 중'],
    ['blocked', 'blocked', '차단됨'],
    ['진행 중', 'in_progress', '진행 중'],
    ['완료', 'completed', '완료'],
  ])('상태 입력 %s를 %s로 정규화한다', async (input, normalized, written) => {
    const result = await setTaskStatus(sddPath, 'cart', 'cart-task-002', input);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.to).toBe(normalized);
    expect(await fs.readFile(tasksPath, 'utf-8')).toContain(`- **상태:** ${written}`);
  });

  it('영문 Status 라벨은 영문 값으로 기록한다', async () => {
    await fs.writeFile(tasksPath, '# 작업\n\n### t-1: 하나\n\n- **Status:** pending\n');

    const result = await setTaskStatus(sddPath, 'cart', 't-1', 'in-progress');

    expect(result.success).toBe(true);
    expect(await fs.readFile(tasksPath, 'utf-8')).toContain('- **Status:** in-progress');
  });

  it('번호만 주면 유일한 작업과 일치한다', async () => {
    const result = await setTaskStatus(sddPath, 'cart', '3', 'completed');

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.taskId).toBe('cart-task-003');
  });

  it('번호가 여러 작업과 일치하면 실패한다', async () => {
    await fs.writeFile(
      tasksPath,
      '# 작업\n\n### a-1: 하나\n- **상태:** 대기\n\n### b-1: 둘\n- **상태:** 대기\n'
    );

    const result = await setTaskStatus(sddPath, 'cart', '1', 'completed');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain('a-1, b-1');
  });

  it('없는 작업 ID는 사용 가능한 ID를 나열하며 실패한다', async () => {
    const before = await fs.readFile(tasksPath, 'utf-8');

    const result = await setTaskStatus(sddPath, 'cart', 'cart-task-999', 'completed');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('cart-task-999');
      expect(result.error.message).toContain('cart-task-001, cart-task-002, cart-task-003');
    }
    expect(await fs.readFile(tasksPath, 'utf-8')).toBe(before);
  });

  it('유효하지 않은 작업 상태는 허용 값을 나열하며 실패한다', async () => {
    const result = await setTaskStatus(sddPath, 'cart', 'cart-task-001', 'finished');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain('pending, in-progress');
  });

  it.each(['완료 안 됨', '123 completed', 'completed-ish', '**pending**', '✅ 완료', 'done', ''])(
    'CLI 상태 인자는 정확한 값만 허용한다: %j',
    async (input) => {
      const before = await fs.readFile(tasksPath, 'utf-8');

      const result = await setTaskStatus(sddPath, 'cart', 'cart-task-001', input);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.message).toContain('유효하지 않은 작업 상태');
      expect(await fs.readFile(tasksPath, 'utf-8')).toBe(before);
    }
  );

  it.each([
    [' Completed ', 'completed'],
    ['IN-PROGRESS', 'in_progress'],
    ['진행중', 'in_progress'],
    ['진행  중', 'in_progress'],
    ['차단됨', 'blocked'],
    ['대기', 'pending'],
  ])('CLI 상태 인자 %j는 대소문자/공백을 무시하고 %s로 정규화한다', (input, expected) => {
    expect(parseTaskStatusArg(input)).toBe(expected);
  });

  it('결과에 스펙 상태를 포함한다', async () => {
    const result = await setTaskStatus(sddPath, 'cart', 'cart-task-001', 'completed');

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.specStatus).toBe('draft');
  });

  it('상태 줄이 없는 작업은 파일을 바꾸지 않고 실패한다', async () => {
    const content = '# 작업\n\n### t-1: 하나\n\n- **우선순위:** 🔴 HIGH\n';
    await fs.writeFile(tasksPath, content);

    const result = await setTaskStatus(sddPath, 'cart', 't-1', 'completed');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain('상태 줄');
    expect(await fs.readFile(tasksPath, 'utf-8')).toBe(content);
  });

  it('tasks.md가 없으면 sdd new tasks를 안내하며 실패한다', async () => {
    await fs.rm(tasksPath);

    const result = await setTaskStatus(sddPath, 'cart', 'cart-task-001', 'completed');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain('sdd new tasks pricing/cart');
  });
});
