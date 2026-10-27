/**
 * 영향도 분석기 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  analyzeImpact,
  generateImpactReport,
  formatImpactResult,
  formatImpactReport,
  analyzeChangeImpact,
} from '../../../../src/core/impact/analyzer.js';

describe('analyzeImpact', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-impact-analyzer-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('존재하지 않는 스펙 디렉토리에 에러를 반환한다', async () => {
    const result = await analyzeImpact('/non/existent/path', 'test-spec');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/찾을 수 없|not found/i);
    }
  });

  it('존재하지 않는 스펙에 에러를 반환한다', async () => {
    const result = await analyzeImpact(tempDir, 'non-existent-spec');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('non-existent-spec');
    }
  });

  it('독립 스펙의 영향도를 분석한다', async () => {
    await fs.mkdir(path.join(specsDir, 'standalone'));
    await fs.writeFile(
      path.join(specsDir, 'standalone', 'spec.md'),
      `---
id: standalone
title: "독립 스펙"
status: draft
depends: null
---

# 독립 스펙

이 스펙은 다른 스펙에 의존하지 않습니다.

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await analyzeImpact(tempDir, 'standalone');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetSpec).toBe('standalone');
      expect(result.data.dependsOn).toHaveLength(0);
      expect(result.data.affectedBy).toHaveLength(0);
      // 독립 스펙의 리스크는 낮거나 없음
      expect(result.data.riskScore).toBeLessThanOrEqual(5);
      expect(['none', 'low']).toContain(result.data.riskLevel);
    }
  });

  it('의존성 있는 스펙의 영향도를 분석한다', async () => {
    // 기반 스펙
    await fs.mkdir(path.join(specsDir, 'base'));
    await fs.writeFile(
      path.join(specsDir, 'base', 'spec.md'),
      `---
id: base
title: "기반 스펙"
status: draft
depends: null
---

# 기반 스펙
`
    );

    // 의존 스펙
    await fs.mkdir(path.join(specsDir, 'dependent'));
    await fs.writeFile(
      path.join(specsDir, 'dependent', 'spec.md'),
      `---
id: dependent
title: "의존 스펙"
status: draft
depends: base
---

# 의존 스펙

이 스펙은 base 스펙에 의존합니다.
`
    );

    const result = await analyzeImpact(tempDir, 'base');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetSpec).toBe('base');
      expect(result.data.dependsOn).toHaveLength(0);
      expect(result.data.affectedBy.length).toBeGreaterThanOrEqual(1);
      expect(result.data.affectedBy[0].id).toBe('dependent');
    }
  });

  it('리스크 레벨을 올바르게 계산한다', async () => {
    // 많은 스펙에 의존하는 스펙 생성
    await fs.mkdir(path.join(specsDir, 'core'));
    await fs.writeFile(
      path.join(specsDir, 'core', 'spec.md'),
      `---
id: core
title: "핵심 스펙"
status: draft
depends: null
---

# 핵심 스펙
`
    );

    // 여러 스펙이 core에 의존
    for (let i = 1; i <= 5; i++) {
      await fs.mkdir(path.join(specsDir, `feature${i}`));
      await fs.writeFile(
        path.join(specsDir, `feature${i}`, 'spec.md'),
        `---
id: feature${i}
title: "기능 ${i}"
status: draft
depends: core
---

# 기능 ${i}
`
      );
    }

    const result = await analyzeImpact(tempDir, 'core');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.affectedBy.length).toBe(5);
      expect(result.data.riskScore).toBeGreaterThan(0);
      // 영향을 받는 스펙이 많으므로 리스크가 있음
      expect(['low', 'medium', 'high', 'critical']).toContain(result.data.riskLevel);
    }
  });
});

describe('formatImpactResult', () => {
  it('영향도 결과를 포맷팅한다', async () => {
    const result = {
      targetSpec: 'test-spec',
      dependsOn: [],
      affectedBy: [
        {
          id: 'dependent',
          path: 'dependent/spec.md',
          title: '의존 스펙',
          level: 'medium' as const,
          type: 'explicit' as const,
          reason: '명시적 의존',
        },
      ],
      transitiveAffected: [],
      riskScore: 25,
      riskLevel: 'medium' as const,
      summary: '테스트 요약',
      recommendations: ['권장사항 1'],
    };

    const formatted = formatImpactResult(result);

    expect(formatted).toContain('test-spec');
    expect(formatted).toContain('dependent');
    // 리스크 레벨이 표시되는지 확인 (아이콘 또는 텍스트)
    expect(formatted).toMatch(/medium|🟡|리스크/i);
  });
});

describe('generateImpactReport', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-impact-report-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('전체 프로젝트 영향도 리포트를 생성한다', async () => {
    await fs.mkdir(path.join(specsDir, 'spec1'));
    await fs.writeFile(
      path.join(specsDir, 'spec1', 'spec.md'),
      `---
status: draft
created: 2025-01-01
depends: null
---

# 스펙 1

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    await fs.mkdir(path.join(specsDir, 'spec2'));
    await fs.writeFile(
      path.join(specsDir, 'spec2', 'spec.md'),
      `---
status: draft
created: 2025-01-01
depends: spec1
---

# 스펙 2

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await generateImpactReport(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalSpecs).toBe(2);
      expect(result.data.totalEdges).toBeGreaterThanOrEqual(1);
    }
  });

  it('스펙 디렉토리가 없으면 에러를 반환한다', async () => {
    const result = await generateImpactReport('/non/existent/path');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('스펙 디렉토리');
    }
  });

  it('고립된 스펙을 감지한다', async () => {
    // 고립된 스펙 생성 (의존성 없음)
    await fs.mkdir(path.join(specsDir, 'orphan1'));
    await fs.writeFile(
      path.join(specsDir, 'orphan1', 'spec.md'),
      `---
id: orphan1
status: draft
depends: null
---

# 고립 스펙 1
`
    );

    await fs.mkdir(path.join(specsDir, 'orphan2'));
    await fs.writeFile(
      path.join(specsDir, 'orphan2', 'spec.md'),
      `---
id: orphan2
status: draft
depends: null
---

# 고립 스펙 2
`
    );

    const result = await generateImpactReport(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orphanSpecs.length).toBe(2);
      expect(result.data.orphanSpecs).toContain('orphan1');
      expect(result.data.orphanSpecs).toContain('orphan2');
    }
  });

  it('가장 많이 연결된 스펙을 식별한다', async () => {
    // 핵심 스펙 생성
    await fs.mkdir(path.join(specsDir, 'core'));
    await fs.writeFile(
      path.join(specsDir, 'core', 'spec.md'),
      `---
id: core
status: draft
depends: null
---

# 핵심 스펙
`
    );

    // 여러 스펙이 core에 의존
    for (let i = 1; i <= 3; i++) {
      await fs.mkdir(path.join(specsDir, `feature${i}`));
      await fs.writeFile(
        path.join(specsDir, `feature${i}`, 'spec.md'),
        `---
id: feature${i}
status: draft
depends: core
---

# 기능 ${i}
`
      );
    }

    const result = await generateImpactReport(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mostConnectedSpecs.length).toBeGreaterThan(0);
      // core가 가장 많이 연결된 스펙 중 하나여야 함
      const coreSpec = result.data.mostConnectedSpecs.find((s) => s.id === 'core');
      expect(coreSpec).toBeDefined();
      expect(coreSpec?.inbound).toBe(3);
    }
  });
});

describe('analyzeChangeImpact', () => {
  let tempDir: string;
  let specsDir: string;
  let changesDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-change-impact-'));
    specsDir = path.join(tempDir, 'specs');
    changesDir = path.join(tempDir, 'changes');
    await fs.mkdir(specsDir, { recursive: true });
    await fs.mkdir(changesDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('존재하지 않는 변경 제안에 에러를 반환한다', async () => {
    const result = await analyzeChangeImpact(tempDir, 'CHG-999');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('CHG-999');
    }
  });

  it.each(['..', '../CHG-001', 'CHG-001/../..', 'my-change'])(
    '유효하지 않은 변경 ID(%s)는 거부한다',
    async (badId) => {
      const result = await analyzeChangeImpact(tempDir, badId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('유효하지 않은 변경 ID');
      }
    }
  );

  it('변경 제안의 영향을 분석한다', async () => {
    // 스펙 생성
    await fs.mkdir(path.join(specsDir, 'auth'));
    await fs.writeFile(
      path.join(specsDir, 'auth', 'spec.md'),
      `---
id: auth
status: draft
depends: null
---

# 인증 스펙
`
    );

    await fs.mkdir(path.join(specsDir, 'user'));
    await fs.writeFile(
      path.join(specsDir, 'user', 'spec.md'),
      `---
id: user
status: draft
depends: auth
---

# 사용자 스펙
`
    );

    // 변경 제안 생성
    const changeDir = path.join(changesDir, 'CHG-001');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      `---
id: CHG-001
title: 인증 개선
status: draft
created: 2025-01-01
author: tester
---

# 인증 개선

## 배경

인증 시스템 개선

## 영향 받는 스펙

- specs/auth/spec.md
`
    );

    const result = await analyzeChangeImpact(tempDir, 'CHG-001');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changeId).toBe('CHG-001');
      expect(result.data.title).toBe('인증 개선');
      expect(result.data.recommendations.length).toBeGreaterThan(0);
    }
  });
});

describe('formatImpactReport', () => {
  it('영향도 리포트를 포맷팅한다', () => {
    const report = {
      generatedAt: '2025-01-01T00:00:00.000Z',
      projectPath: '/test/project',
      totalSpecs: 10,
      totalEdges: 15,
      mostConnectedSpecs: [
        { id: 'core', title: '핵심', inbound: 5, outbound: 2, total: 7 },
      ],
      orphanSpecs: ['orphan1'],
      circularDependencies: [],
      healthScore: 85,
      summary: '테스트 요약',
    };

    const formatted = formatImpactReport(report);

    expect(formatted).toContain('프로젝트 의존성 리포트');
    expect(formatted).toContain('총 스펙 수: 10');
    expect(formatted).toContain('총 의존 관계: 15');
    expect(formatted).toContain('85/100');
    expect(formatted).toContain('core');
    expect(formatted).toContain('orphan1');
  });

  it('순환 의존성이 있으면 표시한다', () => {
    const report = {
      generatedAt: '2025-01-01T00:00:00.000Z',
      projectPath: '/test/project',
      totalSpecs: 5,
      totalEdges: 5,
      mostConnectedSpecs: [],
      orphanSpecs: [],
      circularDependencies: [
        { cycle: ['A', 'B', 'A'], description: '순환 의존성: A → B → A' },
      ],
      healthScore: 60,
      summary: '순환 의존성 있음',
    };

    const formatted = formatImpactReport(report);

    expect(formatted).toContain('순환 의존성');
    expect(formatted).toContain('A → B → A');
  });
});
