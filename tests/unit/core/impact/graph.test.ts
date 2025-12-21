/**
 * 의존성 그래프 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildDependencyGraph, generateMermaidGraph } from '../../../../src/core/impact/graph.js';

describe('buildDependencyGraph', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-impact-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('빈 디렉토리에서 빈 그래프를 반환한다', async () => {
    const result = await buildDependencyGraph(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nodes.size).toBe(0);
      expect(result.data.edges).toHaveLength(0);
    }
  });

  it('스펙 파일에서 노드를 생성한다', async () => {
    await fs.writeFile(
      path.join(tempDir, 'auth.md'),
      `---
status: draft
created: 2025-12-21
depends: null
---

# 인증 기능
`
    );

    const result = await buildDependencyGraph(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nodes.size).toBe(1);
      expect(result.data.nodes.has('auth')).toBe(true);
    }
  });

  it('명시적 의존성을 추출한다', async () => {
    await fs.mkdir(path.join(tempDir, 'auth'));
    await fs.writeFile(
      path.join(tempDir, 'auth', 'spec.md'),
      `---
status: draft
created: 2025-12-21
depends: database
---

# 인증 기능
`
    );

    await fs.mkdir(path.join(tempDir, 'database'));
    await fs.writeFile(
      path.join(tempDir, 'database', 'spec.md'),
      `---
status: draft
created: 2025-12-21
depends: null
---

# 데이터베이스
`
    );

    const result = await buildDependencyGraph(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nodes.size).toBe(2);

      const authNode = result.data.nodes.get('auth');
      expect(authNode?.dependsOn).toContain('database');

      const dbNode = result.data.nodes.get('database');
      expect(dbNode?.dependedBy).toContain('auth');

      expect(result.data.edges).toHaveLength(1);
      expect(result.data.edges[0]).toMatchObject({
        from: 'auth',
        to: 'database',
        type: 'explicit',
      });
    }
  });

  it('배열 형식의 의존성을 처리한다', async () => {
    await fs.writeFile(
      path.join(tempDir, 'payment.md'),
      `---
status: draft
created: 2025-12-21
depends:
  - auth
  - database
---

# 결제 기능
`
    );

    const result = await buildDependencyGraph(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      const paymentNode = result.data.nodes.get('payment');
      expect(paymentNode?.dependsOn).toContain('auth');
      expect(paymentNode?.dependsOn).toContain('database');
    }
  });
});

describe('generateMermaidGraph', () => {
  it('Mermaid 그래프를 생성한다', () => {
    const graph = {
      nodes: new Map([
        ['auth', { id: 'auth', path: 'auth.md', title: '인증', dependsOn: [], dependedBy: ['payment'] }],
        ['payment', { id: 'payment', path: 'payment.md', title: '결제', dependsOn: ['auth'], dependedBy: [] }],
      ]),
      edges: [{ from: 'payment', to: 'auth', type: 'explicit' as const }],
    };

    const mermaid = generateMermaidGraph(graph);

    expect(mermaid).toContain('graph LR');
    expect(mermaid).toContain('auth');
    expect(mermaid).toContain('payment');
    expect(mermaid).toContain('-->');
  });

  it('대상 스펙을 강조 표시한다', () => {
    const graph = {
      nodes: new Map([
        ['auth', { id: 'auth', path: 'auth.md', title: '인증', dependsOn: [], dependedBy: [] }],
      ]),
      edges: [],
    };

    const mermaid = generateMermaidGraph(graph, 'auth');

    expect(mermaid).toContain('fill:#ff9');
  });
});
