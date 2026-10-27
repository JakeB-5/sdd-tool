/**
 * What-if 시뮬레이션 테스트
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  parseDeltaFromProposal,
  resolveDeltaSourcePath,
  runSimulation,
  formatSimulationResult,
  type DeltaItem,
} from '../../../../src/core/impact/simulator.js';
import { generateDelta } from '../../../../src/core/change/delta.js';
import { transitionNewToChange } from '../../../../src/cli/commands/transition.js';

describe('parseDeltaFromProposal', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-simulator-test-'));
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('ADDED 섹션을 파싱한다', async () => {
    const proposalPath = path.join(tempDir, 'proposal-add.md');
    await fs.writeFile(proposalPath, `---
id: change-001
---

# 변경 제안

## ADDED

- \`new-feature\` - 새로운 기능 추가
- \`another-feature\` - 또 다른 기능

---
`);

    const result = await parseDeltaFromProposal(proposalPath);
    expect(result.success).toBe(true);

    const deltas = result.data as DeltaItem[];
    const added = deltas.filter((d) => d.type === 'ADDED');
    expect(added.length).toBe(2);
    expect(added[0].specId).toBe('new-feature');
    expect(added[1].specId).toBe('another-feature');
  });

  it('MODIFIED 섹션을 파싱한다', async () => {
    const proposalPath = path.join(tempDir, 'proposal-modify.md');
    await fs.writeFile(proposalPath, `---
id: change-002
---

# 변경 제안

## MODIFIED

- \`existing-feature\` - 기존 기능 수정

---
`);

    const result = await parseDeltaFromProposal(proposalPath);
    expect(result.success).toBe(true);

    const deltas = result.data as DeltaItem[];
    const modified = deltas.filter((d) => d.type === 'MODIFIED');
    expect(modified.length).toBe(1);
    expect(modified[0].specId).toBe('existing-feature');
  });

  it('REMOVED 섹션을 파싱한다', async () => {
    const proposalPath = path.join(tempDir, 'proposal-remove.md');
    await fs.writeFile(proposalPath, `---
id: change-003
---

# 변경 제안

## REMOVED

- \`deprecated-feature\` - 사용하지 않는 기능 제거

---
`);

    const result = await parseDeltaFromProposal(proposalPath);
    expect(result.success).toBe(true);

    const deltas = result.data as DeltaItem[];
    const removed = deltas.filter((d) => d.type === 'REMOVED');
    expect(removed.length).toBe(1);
    expect(removed[0].specId).toBe('deprecated-feature');
  });

  it('복합 변경을 파싱한다', async () => {
    const proposalPath = path.join(tempDir, 'proposal-complex.md');
    await fs.writeFile(proposalPath, `---
id: change-004
---

# 변경 제안

## ADDED

- \`new-api\` - 새 API 추가

## MODIFIED

- \`core-module\` - 핵심 모듈 수정

## REMOVED

- \`legacy-api\` - 레거시 API 제거

---
`);

    const result = await parseDeltaFromProposal(proposalPath);
    expect(result.success).toBe(true);

    const deltas = result.data as DeltaItem[];
    expect(deltas.length).toBe(3);
    expect(deltas.some((d) => d.type === 'ADDED' && d.specId === 'new-api')).toBe(true);
    expect(deltas.some((d) => d.type === 'MODIFIED' && d.specId === 'core-module')).toBe(true);
    expect(deltas.some((d) => d.type === 'REMOVED' && d.specId === 'legacy-api')).toBe(true);
  });

  it('존재하지 않는 파일은 에러를 반환한다', async () => {
    const result = await parseDeltaFromProposal('/nonexistent/path/proposal.md');
    expect(result.success).toBe(false);
  });

  it('delta.md 형식의 여러 MODIFIED 대상과 depends 추가/제거를 파싱한다', async () => {
    const deltaPath = path.join(tempDir, 'delta-multi.md');
    await fs.writeFile(deltaPath, `---
proposal: CHG-001
created: 2025-01-01
---

# Delta

## MODIFIED

### specs/auth/login/spec.md

#### Before

\`\`\`yaml
depends: [core, session]
\`\`\`

#### After

\`\`\`yaml
depends: [core, token]
\`\`\`

### \`auth/logout\`

#### Before

\`\`\`
old
\`\`\`

#### After

\`\`\`
new
\`\`\`
`);

    const result = await parseDeltaFromProposal(deltaPath);
    expect(result.success).toBe(true);

    const modified = (result.data as DeltaItem[]).filter((d) => d.type === 'MODIFIED');
    expect(modified).toHaveLength(2);
    expect(modified[0].specId).toBe('auth/login');
    expect(modified[0].newDependencies).toEqual(['token']);
    expect(modified[0].removedDependencies).toEqual(['session']);
    expect(modified[1].specId).toBe('auth/logout');
    expect(modified[1].newDependencies).toBeUndefined();
    expect(modified[1].removedDependencies).toBeUndefined();
  });
});

describe('parseDeltaFromProposal - 스펙 대상만 사용', () => {
  let tempDir: string;
  let sddPath: string;
  let specsPath: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-sim-targets-'));
    sddPath = path.join(tempDir, '.sdd');
    specsPath = path.join(sddPath, 'specs');
    await fs.mkdir(path.join(specsPath, 'auth', 'login'), { recursive: true });
    await fs.mkdir(path.join(specsPath, 'auth', 'session'), { recursive: true });
    await fs.writeFile(path.join(specsPath, 'auth', 'login', 'spec.md'), '---\nid: login\ndepends: session\n---\n# 로그인\n');
    await fs.writeFile(path.join(specsPath, 'auth', 'session', 'spec.md'), '---\nid: session\n---\n# 세션\n');
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const writeDelta = async (name: string, body: string): Promise<string> => {
    const p = path.join(tempDir, name);
    await fs.writeFile(p, `---\nproposal: CHG-001\ncreated: 2025-01-01\n---\n\n# Delta\n\n${body}`);
    return p;
  };

  it('ADDED/REMOVED의 요구사항 bullet은 스펙으로 취급하지 않는다', async () => {
    const deltaPath = await writeDelta('bullets.md', `## ADDED

### REQ-02: 토큰 갱신

- 시스템은 만료 5분 전에 토큰을 갱신해야 한다(SHALL)
- 시스템은 갱신 실패 시 재로그인을 요구해야 한다(SHALL)

### auth/login

- 시스템은 \`token\`을 발급해야 한다(SHALL)

## REMOVED

- 레거시 쿠키 세션 (MUST NOT)
`);

    const parsed = await parseDeltaFromProposal(deltaPath);
    expect(parsed.success).toBe(true);
    const sim = await runSimulation(specsPath, 'auth/login', parsed.data as DeltaItem[]);
    expect(sim.success).toBe(true);

    const data = sim.data!;
    expect(data.changes.addedSpecs).toEqual([]);
    expect(data.changes.removedSpecs).toEqual([]);
    // `### auth/login` resolves to an existing spec → modification; `### REQ-02` is dropped
    expect(data.changes.modifiedSpecs).toEqual(['auth/login']);
    expect(data.projected.totalSpecs).toBe(data.current.totalSpecs);
  });

  it('sdd change가 만든 미작성 delta 템플릿은 적용할 델타가 없다', async () => {
    const deltaPath = path.join(tempDir, 'template.md');
    await fs.writeFile(deltaPath, generateDelta({ proposalId: 'CHG-001', title: '템플릿' }));

    const parsed = await parseDeltaFromProposal(deltaPath);
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual([]);
  });

  it('transition이 만든 미작성 delta 템플릿도 적용할 델타가 없다', async () => {
    const result = await transitionNewToChange(sddPath, 'auth/login', {});
    expect(result.success).toBe(true);
    if (!result.success) return;

    const parsed = await parseDeltaFromProposal(path.join(result.data.changePath, 'delta.md'));
    expect(parsed.success).toBe(true);
    const sim = await runSimulation(specsPath, 'auth/login', parsed.data as DeltaItem[]);
    expect(sim.success).toBe(false);
    expect(sim.success ? '' : sim.error.message).toContain('델타를 찾을 수 없습니다');
  });

  it('depends: null / 여러 줄 YAML 목록을 파싱한다', async () => {
    const deltaPath = await writeDelta('yaml-deps.md', `## MODIFIED

### auth/session

#### Before

\`\`\`yaml
depends: null
\`\`\`

#### After

\`\`\`yaml
depends:
  - auth/login
  - core
\`\`\`

### auth/login

#### Before

\`\`\`yaml
id: login
depends:
  - session
\`\`\`

#### After

\`\`\`yaml
id: login
depends: ~
\`\`\`
`);

    const parsed = await parseDeltaFromProposal(deltaPath);
    expect(parsed.success).toBe(true);
    const [session, login] = parsed.data as DeltaItem[];
    expect(session.newDependencies).toEqual(['auth/login', 'core']);
    expect(session.removedDependencies).toBeUndefined();
    expect(login.newDependencies).toBeUndefined();
    expect(login.removedDependencies).toEqual(['session']);
  });
});

describe('resolveDeltaSourcePath', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-delta-source-'));
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('proposal.md 옆에 delta.md가 있으면 delta.md를 사용한다', async () => {
    const changeDir = path.join(tempDir, 'CHG-001');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'proposal.md'), '');
    await fs.writeFile(path.join(changeDir, 'delta.md'), '');

    expect(await resolveDeltaSourcePath(path.join(changeDir, 'proposal.md'))).toBe(
      path.join(changeDir, 'delta.md')
    );
  });

  it('delta.md가 없으면 레거시 proposal.md를 사용한다', async () => {
    const changeDir = path.join(tempDir, 'CHG-002');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'proposal.md'), '');

    expect(await resolveDeltaSourcePath(path.join(changeDir, 'proposal.md'))).toBe(
      path.join(changeDir, 'proposal.md')
    );
  });
});

describe('runSimulation', () => {
  let tempDir: string;
  let specsPath: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-simulator-test-'));
    specsPath = path.join(tempDir, 'specs');
    await fs.mkdir(specsPath, { recursive: true });

    // 테스트용 스펙 생성
    const featureA = path.join(specsPath, 'feature-a');
    const featureB = path.join(specsPath, 'feature-b');
    await fs.mkdir(featureA, { recursive: true });
    await fs.mkdir(featureB, { recursive: true });

    await fs.writeFile(path.join(featureA, 'spec.md'), `---
id: feature-a
title: "기능 A"
depends: null
---

# 기능 A

기본 기능
`);

    await fs.writeFile(path.join(featureB, 'spec.md'), `---
id: feature-b
title: "기능 B"
depends: feature-a
---

# 기능 B

A에 의존하는 기능
`);
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙 추가 시뮬레이션을 실행한다', async () => {
    const deltas: DeltaItem[] = [
      {
        type: 'ADDED',
        specId: 'feature-c',
        description: '새로운 기능 C',
        newDependencies: ['feature-a'],
      },
    ];

    const result = await runSimulation(specsPath, 'feature-a', deltas);
    expect(result.success).toBe(true);

    const data = result.data!;
    expect(data.changes.addedSpecs).toContain('feature-c');
    expect(data.projected.totalSpecs).toBeGreaterThan(data.current.totalSpecs);
  });

  it('MODIFIED의 removedDependencies를 적용하고 제거된 엣지를 센다', async () => {
    const deltas: DeltaItem[] = [
      { type: 'MODIFIED', specId: 'feature-b', removedDependencies: ['feature-a'] },
    ];

    const result = await runSimulation(specsPath, 'feature-a', deltas);
    expect(result.success).toBe(true);

    const data = result.data!;
    expect(data.changes.removedEdges).toBe(1);
    expect(data.changes.addedEdges).toBe(0);
    expect(data.projected.totalEdges).toBe(data.current.totalEdges - 1);
    expect(data.noLongerAffected).toContain('feature-b');
  });

  it('스펙 제거 시뮬레이션을 실행한다', async () => {
    const deltas: DeltaItem[] = [
      {
        type: 'REMOVED',
        specId: 'feature-b',
        description: '기능 B 제거',
      },
    ];

    const result = await runSimulation(specsPath, 'feature-a', deltas);
    expect(result.success).toBe(true);

    const data = result.data!;
    expect(data.changes.removedSpecs).toContain('feature-b');
    expect(data.projected.totalSpecs).toBeLessThan(data.current.totalSpecs);
  });

  it('현재 상태와 예상 상태를 비교한다', async () => {
    const deltas: DeltaItem[] = [
      {
        type: 'ADDED',
        specId: 'feature-d',
        description: '기능 D',
        newDependencies: ['feature-a'],
      },
    ];

    const result = await runSimulation(specsPath, 'feature-a', deltas);
    expect(result.success).toBe(true);

    const data = result.data!;
    expect(data.current).toBeDefined();
    expect(data.projected).toBeDefined();
    expect(typeof data.riskDelta).toBe('number');
  });
});

describe('runSimulation (도메인 레이아웃)', () => {
  let tempDir: string;
  let specsPath: string;

  async function writeSpec(id: string, depends: string): Promise<void> {
    await fs.mkdir(path.join(specsPath, id), { recursive: true });
    await fs.writeFile(
      path.join(specsPath, id, 'spec.md'),
      `---\nstatus: draft\ndepends: ${depends}\n---\n\n# ${id}\n`
    );
  }

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-simulator-domain-'));
    specsPath = path.join(tempDir, 'specs');
    await writeSpec('auth/login', 'null');
    await writeSpec('auth/core', 'null');
    await writeSpec('billing/core', 'null');
    await writeSpec('common/signup', 'login');
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('bare 대상과 델타 의존성을 canonical id로 해석한다', async () => {
    const deltas: DeltaItem[] = [
      { type: 'ADDED', specId: 'profile', description: '프로필', newDependencies: ['login'] },
    ];

    const result = await runSimulation(specsPath, 'login', deltas);

    expect(result.success).toBe(true);
    const data = result.data!;
    expect(data.current.targetRiskScore).toBeGreaterThan(0);
    expect(data.projected.targetRiskScore).toBeGreaterThanOrEqual(data.current.targetRiskScore);
    expect(data.newlyAffected.map((s) => s.id)).toEqual(['profile']);
  });

  it('찾을 수 없는 대상은 에러를 반환한다', async () => {
    const result = await runSimulation(specsPath, 'nope', []);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('스펙을 찾을 수 없습니다');
  });

  it('모호한 대상은 후보와 함께 에러를 반환한다', async () => {
    const result = await runSimulation(specsPath, 'core', []);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('auth/core, billing/core');
  });
});

describe('formatSimulationResult', () => {
  it('시뮬레이션 결과를 포맷한다', () => {
    const result = {
      current: {
        totalSpecs: 5,
        totalEdges: 3,
        targetRiskScore: 3,
        targetRiskLevel: 'low' as const,
      },
      projected: {
        totalSpecs: 6,
        totalEdges: 5,
        targetRiskScore: 5,
        targetRiskLevel: 'medium' as const,
      },
      changes: {
        addedSpecs: ['new-feature'],
        removedSpecs: [],
        modifiedSpecs: [],
        addedEdges: 2,
        removedEdges: 0,
      },
      newlyAffected: [
        {
          id: 'existing-feature',
          path: 'existing-feature/spec.md',
          level: 'medium' as const,
          type: 'explicit' as const,
          reason: '새 의존성 추가',
        },
      ],
      noLongerAffected: [],
      riskDelta: 2,
      warnings: ['리스크 증가'],
      recommendations: ['테스트 필요'],
    };

    const formatted = formatSimulationResult(result, 'target-spec');

    expect(formatted).toContain('What-if 시뮬레이션');
    expect(formatted).toContain('target-spec');
    expect(formatted).toContain('현재');
    expect(formatted).toContain('변경 후');
    expect(formatted).toContain('new-feature');
    expect(formatted).toContain('리스크 증가');
    expect(formatted).toContain('테스트 필요');
  });
});
