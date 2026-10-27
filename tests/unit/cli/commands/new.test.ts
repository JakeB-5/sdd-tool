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
