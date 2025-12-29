/**
 * 도메인 그래프 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  DomainGraph,
  createDomainGraph,
  formatCyclePath,
  formatCycleWarning,
} from '../../../../src/core/domain/graph.js';
import type { DomainsConfig } from '../../../../src/schemas/domains.schema.js';

describe('DomainGraph', () => {
  const createConfig = (domains: Record<string, { deps?: string[]; extends?: string[] }>): DomainsConfig => ({
    version: '1.0',
    domains: Object.fromEntries(
      Object.entries(domains).map(([id, { deps = [], extends: ext = [] }]) => [
        id,
        {
          description: `${id} 도메인`,
          specs: [],
          dependencies: {
            uses: deps,
            extends: ext,
            implements: [],
          },
        },
      ])
    ),
    rules: [],
  });

  describe('getNodes', () => {
    it('모든 노드를 반환해야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
        order: { deps: ['auth'] },
      });

      const graph = createDomainGraph(config);
      const nodes = graph.getNodes();

      expect(nodes).toHaveLength(3);
      expect(nodes).toContain('core');
      expect(nodes).toContain('auth');
      expect(nodes).toContain('order');
    });
  });

  describe('getEdges', () => {
    it('모든 엣지를 반환해야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
      });

      const graph = createDomainGraph(config);
      const edges = graph.getEdges();

      expect(edges).toHaveLength(1);
      expect(edges[0].from).toBe('auth');
      expect(edges[0].to).toBe('core');
      expect(edges[0].type).toBe('uses');
    });
  });

  describe('getDependencies', () => {
    it('도메인의 의존성을 반환해야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
      });

      const graph = createDomainGraph(config);
      const deps = graph.getDependencies('auth');

      expect(deps).toHaveLength(1);
      expect(deps[0].to).toBe('core');
    });
  });

  describe('getDependents', () => {
    it('도메인에 의존하는 도메인들을 반환해야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
        order: { deps: ['core'] },
      });

      const graph = createDomainGraph(config);
      const dependents = graph.getDependents('core');

      expect(dependents).toHaveLength(2);
    });
  });

  describe('findCycles', () => {
    it('순환이 없을 때 빈 배열을 반환해야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
        order: { deps: ['auth'] },
      });

      const graph = createDomainGraph(config);
      const cycles = graph.findCycles();

      expect(cycles).toHaveLength(0);
    });

    it('순환을 감지해야 함', () => {
      const config = createConfig({
        a: { deps: ['b'] },
        b: { deps: ['c'] },
        c: { deps: ['a'] },
      });

      const graph = createDomainGraph(config);
      const cycles = graph.findCycles();

      expect(cycles.length).toBeGreaterThan(0);
    });

    it('자기 자신을 참조하는 순환을 감지해야 함', () => {
      const config = createConfig({
        a: { deps: ['a'] },
      });

      const graph = createDomainGraph(config);
      const cycles = graph.findCycles();

      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('hasCycles', () => {
    it('순환이 없으면 false를 반환해야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
      });

      const graph = createDomainGraph(config);

      expect(graph.hasCycles()).toBe(false);
    });

    it('순환이 있으면 true를 반환해야 함', () => {
      const config = createConfig({
        a: { deps: ['b'] },
        b: { deps: ['a'] },
      });

      const graph = createDomainGraph(config);

      expect(graph.hasCycles()).toBe(true);
    });
  });

  describe('topologicalSort', () => {
    it('순환이 없으면 위상 정렬된 순서를 반환해야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
        order: { deps: ['auth', 'core'] },
      });

      const graph = createDomainGraph(config);
      const sorted = graph.topologicalSort();

      expect(sorted).not.toBeNull();
      if (sorted) {
        const coreIndex = sorted.indexOf('core');
        const authIndex = sorted.indexOf('auth');
        const orderIndex = sorted.indexOf('order');

        // core는 auth보다 먼저, auth는 order보다 먼저
        expect(coreIndex).toBeLessThan(authIndex);
        expect(authIndex).toBeLessThan(orderIndex);
      }
    });

    it('순환이 있으면 null을 반환해야 함', () => {
      const config = createConfig({
        a: { deps: ['b'] },
        b: { deps: ['a'] },
      });

      const graph = createDomainGraph(config);
      const sorted = graph.topologicalSort();

      expect(sorted).toBeNull();
    });
  });

  describe('findRoots', () => {
    it('의존성이 없는 루트 도메인을 찾아야 함', () => {
      const config = createConfig({
        core: {},
        base: {},
        auth: { deps: ['core'] },
      });

      const graph = createDomainGraph(config);
      const roots = graph.findRoots();

      expect(roots).toContain('core');
      expect(roots).toContain('base');
      expect(roots).not.toContain('auth');
    });
  });

  describe('findLeaves', () => {
    it('다른 도메인에게 의존받지 않는 리프 도메인을 찾아야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
        order: { deps: ['auth'] },
      });

      const graph = createDomainGraph(config);
      const leaves = graph.findLeaves();

      expect(leaves).toContain('order');
      expect(leaves).not.toContain('core');
      expect(leaves).not.toContain('auth');
    });
  });

  describe('findPath', () => {
    it('두 도메인 사이의 경로를 찾아야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
        order: { deps: ['auth'] },
      });

      const graph = createDomainGraph(config);
      const path = graph.findPath('order', 'core');

      expect(path).toEqual(['order', 'auth', 'core']);
    });

    it('경로가 없으면 null을 반환해야 함', () => {
      const config = createConfig({
        core: {},
        auth: {},
      });

      const graph = createDomainGraph(config);
      const path = graph.findPath('auth', 'core');

      expect(path).toBeNull();
    });

    it('같은 도메인이면 [도메인]을 반환해야 함', () => {
      const config = createConfig({
        core: {},
      });

      const graph = createDomainGraph(config);
      const path = graph.findPath('core', 'core');

      expect(path).toEqual(['core']);
    });
  });

  describe('analyze', () => {
    it('그래프 분석 결과를 반환해야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
        order: { deps: ['auth'] },
      });

      const graph = createDomainGraph(config);
      const analysis = graph.analyze();

      expect(analysis.nodes).toHaveLength(3);
      expect(analysis.edges).toHaveLength(2);
      expect(analysis.cycles).toHaveLength(0);
      expect(analysis.roots).toContain('core');
      expect(analysis.leaves).toContain('order');
      expect(analysis.topologicalOrder).not.toBeNull();
    });
  });

  describe('toMermaid', () => {
    it('Mermaid 다이어그램을 생성해야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
      });

      const graph = createDomainGraph(config);
      const mermaid = graph.toMermaid();

      expect(mermaid).toContain('graph LR');
      expect(mermaid).toContain('auth');
      expect(mermaid).toContain('core');
      expect(mermaid).toContain('-->');
    });

    it('방향 옵션을 지원해야 함', () => {
      const config = createConfig({ core: {} });
      const graph = createDomainGraph(config);

      const mermaidTD = graph.toMermaid({ direction: 'TD' });

      expect(mermaidTD).toContain('graph TD');
    });
  });

  describe('toDot', () => {
    it('DOT 형식을 생성해야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
      });

      const graph = createDomainGraph(config);
      const dot = graph.toDot();

      expect(dot).toContain('digraph DomainGraph');
      expect(dot).toContain('auth -> core');
    });
  });

  describe('toJson', () => {
    it('JSON 형식으로 내보내야 함', () => {
      const config = createConfig({
        core: {},
        auth: { deps: ['core'] },
      });

      const graph = createDomainGraph(config);
      const json = graph.toJson() as { nodes: unknown[]; edges: unknown[] };

      expect(json.nodes).toHaveLength(2);
      expect(json.edges).toHaveLength(1);
    });
  });

  describe('formatCyclePath', () => {
    it('순환 경로를 포맷팅해야 함', () => {
      const cycle = { path: ['a', 'b', 'c', 'a'], type: 'uses' as const };
      const formatted = formatCyclePath(cycle);

      expect(formatted).toBe('a → b → c → a (uses)');
    });
  });

  describe('formatCycleWarning', () => {
    it('순환이 없으면 빈 문자열을 반환해야 함', () => {
      expect(formatCycleWarning([])).toBe('');
    });

    it('순환 경고 메시지를 생성해야 함', () => {
      const cycles = [{ path: ['a', 'b', 'a'], type: 'uses' as const }];
      const warning = formatCycleWarning(cycles);

      expect(warning).toContain('순환 의존성');
      expect(warning).toContain('a → b → a');
    });
  });
});
