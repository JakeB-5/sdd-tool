/**
 * What-if 시뮬레이션 테스트
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  parseDeltaFromProposal,
  runSimulation,
  formatSimulationResult,
  type DeltaItem,
} from '../../../../src/core/impact/simulator.js';

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
