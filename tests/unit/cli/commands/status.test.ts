/**
 * status 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getFeatureInfo,
  getFeatureStage,
  getFeatureNextStep,
  buildStatusNextSteps,
  getProjectStatus,
  getStatusIcon,
  type FeatureInfo,
} from '../../../../src/cli/commands/status.js';

function feature(overrides: Partial<FeatureInfo>): FeatureInfo {
  const base: Omit<FeatureInfo, 'stage'> = {
    id: 'pricing/cart',
    title: '카트',
    status: 'draft',
    hasSpec: true,
    hasPlan: true,
    hasTasks: true,
    taskProgress: { completed: 0, total: 3 },
    ...overrides,
  };
  return { ...base, stage: overrides.stage ?? getFeatureStage(base) };
}

describe('getFeatureStage', () => {
  it('plan.md가 없으면 plan 단계다', () => {
    expect(feature({ hasPlan: false, hasTasks: false, taskProgress: undefined }).stage).toBe('plan');
  });

  it('tasks.md가 없거나 작업이 0개면 tasks 단계다', () => {
    expect(feature({ hasTasks: false, taskProgress: undefined }).stage).toBe('tasks');
    expect(feature({ taskProgress: { completed: 0, total: 0 } }).stage).toBe('tasks');
  });

  it('미완료 작업이 있으면 implement 단계다', () => {
    expect(feature({ status: 'implementing', taskProgress: { completed: 1, total: 3 } }).stage).toBe('implement');
  });

  it('모든 작업이 완료됐지만 스펙이 implemented가 아니면 finalize 단계다', () => {
    expect(feature({ status: 'tasked', taskProgress: { completed: 3, total: 3 } }).stage).toBe('finalize');
  });

  it('모든 작업 완료 + implemented(레거시 completed 포함)면 done이다', () => {
    expect(feature({ status: 'implemented', taskProgress: { completed: 3, total: 3 } }).stage).toBe('done');
    expect(feature({ status: 'completed', taskProgress: { completed: 3, total: 3 } }).stage).toBe('done');
  });

  it('deprecated 스펙은 파일과 관계없이 done이다', () => {
    expect(feature({ status: 'deprecated', hasPlan: false }).stage).toBe('done');
  });
});

describe('buildStatusNextSteps', () => {
  it('기능이 없으면 sdd new를 안내한다', () => {
    expect(buildStatusNextSteps([])).toEqual(['sdd new <name> - 새 기능 생성']);
  });

  it('기능별 단계에 맞는 현재 명령/스킬 이름을 안내한다', () => {
    const steps = buildStatusNextSteps([
      feature({ id: 'a/plan-me', hasPlan: false, hasTasks: false, taskProgress: undefined }),
      feature({ id: 'a/tasks-me', hasTasks: false, taskProgress: undefined }),
      feature({ id: 'a/impl-me', taskProgress: { completed: 2, total: 5 } }),
      feature({ id: 'a/final-me', status: 'implementing', taskProgress: { completed: 2, total: 2 } }),
      feature({ id: 'a/done', status: 'implemented', taskProgress: { completed: 2, total: 2 } }),
    ]);

    expect(steps).toHaveLength(4);
    expect(steps[0]).toContain('sdd new plan a/plan-me');
    expect(steps[0]).toContain('/sdd-plan');
    expect(steps[0]).toContain('$sdd-plan');
    expect(steps[1]).toContain('sdd new tasks a/tasks-me');
    expect(steps[2]).toContain('(2/5)');
    expect(steps[2]).toContain('sdd new task a/impl-me <task-id> completed');
    expect(steps[3]).toContain('sdd new status a/final-me implemented');
    expect(steps.join('\n')).not.toContain('a/done');
    expect(steps.join('\n')).not.toMatch(/sdd:/);
  });

  it('모든 기능이 완료되면 빈 목록 대신 완료를 명시한다', () => {
    const steps = buildStatusNextSteps([
      feature({ status: 'implemented', taskProgress: { completed: 4, total: 4 } }),
      feature({ id: 'pricing/old', status: 'deprecated' }),
    ]);

    expect(steps).toHaveLength(1);
    expect(steps[0]).toContain('모든 기능(2개)이 구현 완료');
  });

  it('done 기능에는 개별 안내가 없다', () => {
    expect(getFeatureNextStep(feature({ status: 'implemented', taskProgress: { completed: 1, total: 1 } }))).toBeUndefined();
  });
});

describe('getStatusIcon', () => {
  it('draft 상태 아이콘을 반환한다', () => {
    expect(getStatusIcon('draft')).toBe('📝');
  });

  it('레거시 specified 상태는 review 아이콘을 반환한다', () => {
    expect(getStatusIcon('specified')).toBe('👀');
  });

  it('implemented 상태는 ❓가 아닌 아이콘을 반환한다', () => {
    expect(getStatusIcon('implemented')).toBe('✅');
  });

  it('planned 상태 아이콘을 반환한다', () => {
    expect(getStatusIcon('planned')).toBe('📋');
  });

  it('tasked 상태 아이콘을 반환한다', () => {
    expect(getStatusIcon('tasked')).toBe('✏️');
  });

  it('implementing 상태 아이콘을 반환한다', () => {
    expect(getStatusIcon('implementing')).toBe('🔨');
  });

  it('completed 상태 아이콘을 반환한다', () => {
    expect(getStatusIcon('completed')).toBe('✅');
  });

  it('알 수 없는 상태에 기본 아이콘을 반환한다', () => {
    expect(getStatusIcon('unknown')).toBe('❓');
    expect(getStatusIcon('random')).toBe('❓');
  });
});

describe('getFeatureInfo', () => {
  let tempDir: string;
  let featurePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-status-feature-'));
    featurePath = path.join(tempDir, 'test-feature');
    await fs.mkdir(featurePath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기본 정보를 반환한다', async () => {
    const info = await getFeatureInfo('test', featurePath);

    expect(info.id).toBe('test');
    expect(info.title).toBe('test');
    expect(info.status).toBe('unknown');
    expect(info.hasSpec).toBe(false);
    expect(info.hasPlan).toBe(false);
    expect(info.hasTasks).toBe(false);
  });

  it('spec.md가 있으면 메타데이터를 파싱한다', async () => {
    await fs.writeFile(
      path.join(featurePath, 'spec.md'),
      `---
title: "테스트 기능"
status: implementing
---

# 테스트 기능

내용
`
    );

    const info = await getFeatureInfo('test', featurePath);

    expect(info.hasSpec).toBe(true);
    expect(info.title).toBe('테스트 기능');
    expect(info.status).toBe('implementing');
  });

  it('plan.md 존재 여부를 확인한다', async () => {
    await fs.writeFile(path.join(featurePath, 'plan.md'), '# Plan');

    const info = await getFeatureInfo('test', featurePath);

    expect(info.hasPlan).toBe(true);
  });

  it('tasks.md가 있으면 진행률을 계산한다', async () => {
    await fs.writeFile(
      path.join(featurePath, 'tasks.md'),
      `---
feature: test
created: 2025-01-01
total: 3
completed: 2
---

# 작업 목록: 테스트

---

## 작업 목록

### test-1: 작업 1
- **상태:** 대기
- **우선순위:** 🟡 MEDIUM

### test-2: 작업 2
- **상태:** 완료
- **우선순위:** 🔴 HIGH

### test-3: 작업 3
- **상태:** 완료
- **우선순위:** 🟢 LOW

---
`
    );

    const info = await getFeatureInfo('test', featurePath);

    expect(info.hasTasks).toBe(true);
    expect(info.taskProgress).toBeDefined();
    expect(info.taskProgress?.total).toBe(3);
    expect(info.taskProgress?.completed).toBe(2);
    // No plan.md yet, so the stage is still plan
    expect(info.stage).toBe('plan');
  });

  it('파일·스펙 상태·작업 진행률로 단계를 계산한다', async () => {
    await fs.writeFile(path.join(featurePath, 'spec.md'), '---\ntitle: "x"\nstatus: implementing\n---\n# x\n');
    await fs.writeFile(path.join(featurePath, 'plan.md'), '# Plan');
    await fs.writeFile(
      path.join(featurePath, 'tasks.md'),
      '# 작업\n\n### t-1: 하나\n- **Status:** completed\n\n### t-2: 둘\n- **Status:** completed\n'
    );

    const info = await getFeatureInfo('test', featurePath);

    expect(info.taskProgress).toEqual({ completed: 2, total: 2 });
    expect(info.stage).toBe('finalize');
  });
});

describe('getProjectStatus', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-status-project-'));
    sddPath = path.join(tempDir, '.sdd');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('초기화되지 않은 프로젝트를 감지한다', async () => {
    const status = await getProjectStatus(tempDir);

    expect(status.initialized).toBe(false);
    expect(status.features).toEqual([]);
  });

  it('초기화된 프로젝트 상태를 반환한다', async () => {
    await fs.mkdir(sddPath, { recursive: true });

    const status = await getProjectStatus(tempDir);

    expect(status.initialized).toBe(true);
    expect(status.hasConstitution).toBe(false);
    expect(status.hasAgents).toBe(false);
  });

  it('constitution.md 존재를 확인한다', async () => {
    await fs.mkdir(sddPath, { recursive: true });
    await fs.writeFile(path.join(sddPath, 'constitution.md'), '# Constitution');

    const status = await getProjectStatus(tempDir);

    expect(status.hasConstitution).toBe(true);
  });

  it('루트 AGENTS.md의 SDD 블록 존재를 확인한다', async () => {
    await fs.mkdir(sddPath, { recursive: true });
    await fs.writeFile(path.join(tempDir, 'AGENTS.md'), '# Mine\n\n<!-- sdd:begin -->\nguide\n<!-- sdd:end -->\n');

    const status = await getProjectStatus(tempDir);

    expect(status.hasAgents).toBe(true);
  });

  it('SDD 블록이 없는 AGENTS.md나 이전 .sdd/AGENTS.md는 인정하지 않는다', async () => {
    await fs.mkdir(sddPath, { recursive: true });
    await fs.writeFile(path.join(tempDir, 'AGENTS.md'), '# Mine\n');
    await fs.writeFile(path.join(sddPath, 'AGENTS.md'), '# Agents');

    const status = await getProjectStatus(tempDir);

    expect(status.hasAgents).toBe(false);
  });

  it('기능 목록을 수집한다', async () => {
    const specsDir = path.join(sddPath, 'specs');
    const featureDir = path.join(specsDir, 'auth');
    await fs.mkdir(featureDir, { recursive: true });
    await fs.writeFile(
      path.join(featureDir, 'spec.md'),
      `---
title: "인증"
status: draft
---

# 인증
`
    );

    const status = await getProjectStatus(tempDir);

    expect(status.features.length).toBe(1);
    expect(status.features[0].id).toBe('auth');
    expect(status.features[0].title).toBe('인증');
    expect(status.features[0].status).toBe('draft');
  });

  it('여러 기능을 수집한다', async () => {
    const specsDir = path.join(sddPath, 'specs');

    // 기능 1
    const feature1Dir = path.join(specsDir, 'auth');
    await fs.mkdir(feature1Dir, { recursive: true });
    await fs.writeFile(
      path.join(feature1Dir, 'spec.md'),
      '---\ntitle: "인증"\nstatus: completed\n---\n# 인증'
    );

    // 기능 2
    const feature2Dir = path.join(specsDir, 'user');
    await fs.mkdir(feature2Dir, { recursive: true });
    await fs.writeFile(
      path.join(feature2Dir, 'spec.md'),
      '---\ntitle: "사용자"\nstatus: implementing\n---\n# 사용자'
    );

    const status = await getProjectStatus(tempDir);

    expect(status.features.length).toBe(2);
  });
});
