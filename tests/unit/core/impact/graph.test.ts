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
    await fs.mkdir(path.join(tempDir, 'auth'));
    await fs.writeFile(
      path.join(tempDir, 'auth', 'spec.md'),
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

  async function writeSpec(relDir: string, frontmatter: string, title: string): Promise<void> {
    await fs.mkdir(path.join(tempDir, relDir), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, relDir, 'spec.md'),
      `---\nstatus: draft\n${frontmatter}\n---\n\n# ${title}\n`
    );
  }

  it('배열 형식의 의존성을 처리한다', async () => {
    await writeSpec('payment', 'depends:\n  - auth\n  - database', '결제 기능');
    await writeSpec('auth', 'depends: null', '인증');
    await writeSpec('database', 'depends: null', '데이터베이스');

    const result = await buildDependencyGraph(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      const paymentNode = result.data.nodes.get('payment');
      expect(paymentNode?.dependsOn).toContain('auth');
      expect(paymentNode?.dependsOn).toContain('database');
    }
  });

  it('spec.md만 노드로 만들고 plan/tasks/checklist는 제외한다', async () => {
    await writeSpec('auth/login', 'depends: null', '로그인');
    for (const name of ['plan.md', 'tasks.md', 'checklist.md', 'prepare.md']) {
      await fs.writeFile(path.join(tempDir, 'auth', 'login', name), `# ${name}`);
    }

    const result = await buildDependencyGraph(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.from(result.data.nodes.keys())).toEqual(['auth/login']);
    }
  });

  it('도메인 레이아웃에서 bare depends를 canonical id로 해석하고 역방향 엣지를 만든다', async () => {
    await writeSpec('auth/login', 'depends: null', '로그인');
    await writeSpec('common/signup', 'depends: login', '회원가입');

    const result = await buildDependencyGraph(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nodes.get('common/signup')?.dependsOn).toEqual(['auth/login']);
      expect(result.data.nodes.get('auth/login')?.dependedBy).toEqual(['common/signup']);
      expect(result.data.edges).toEqual([
        expect.objectContaining({ from: 'common/signup', to: 'auth/login', type: 'explicit' }),
      ]);
    }
  });

  it('같은 도메인의 feature를 우선 해석한다', async () => {
    await writeSpec('auth/core', 'depends: null', 'auth core');
    await writeSpec('billing/core', 'depends: null', 'billing core');
    await writeSpec('auth/login', 'depends: core', '로그인');

    const result = await buildDependencyGraph(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nodes.get('auth/login')?.dependsOn).toEqual(['auth/core']);
    }
  });

  it('해석되지 않는 의존성은 dangling으로 기록하고 엣지로 만들지 않는다', async () => {
    await writeSpec('payment', 'depends:\n  - missing', '결제');

    const result = await buildDependencyGraph(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nodes.get('payment')?.dependsOn).toEqual([]);
      expect(result.data.edges).toHaveLength(0);
      expect(result.data.dangling).toEqual([{ from: 'payment', to: 'missing' }]);
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
