/**
 * 도메인 의존성 그래프
 * 순환 의존성 감지, 위상 정렬, 시각화
 */

import type { DomainsConfig, DomainInfo, DependencyType } from '../../schemas/domains.schema.js';
import { toDomainInfoList } from '../../schemas/domains.schema.js';

/**
 * 그래프 엣지 정보
 */
export interface DomainEdge {
  from: string;
  to: string;
  type: DependencyType;
}

/**
 * 순환 경로 정보
 */
export interface CyclePath {
  path: string[];
  type: DependencyType;
}

/**
 * 의존성 그래프 분석 결과
 */
export interface GraphAnalysis {
  /** 모든 도메인 ID */
  nodes: string[];
  /** 모든 엣지 */
  edges: DomainEdge[];
  /** 순환 의존성 */
  cycles: CyclePath[];
  /** 루트 도메인 (의존하는 것이 없는) */
  roots: string[];
  /** 리프 도메인 (의존받는 것이 없는) */
  leaves: string[];
  /** 위상 정렬된 순서 (순환이 없을 경우) */
  topologicalOrder: string[] | null;
}

/**
 * 도메인 의존성 그래프 클래스
 */
export class DomainGraph {
  private domains: Map<string, DomainInfo>;
  private adjacencyList: Map<string, DomainEdge[]>;
  private reverseAdjacencyList: Map<string, DomainEdge[]>;

  constructor(config: DomainsConfig) {
    this.domains = new Map();
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();

    this.buildGraph(config);
  }

  /**
   * 그래프 구축
   */
  private buildGraph(config: DomainsConfig): void {
    const domainInfos = toDomainInfoList(config);

    // 노드 초기화
    for (const info of domainInfos) {
      this.domains.set(info.id, info);
      this.adjacencyList.set(info.id, []);
      this.reverseAdjacencyList.set(info.id, []);
    }

    // 엣지 추가
    for (const info of domainInfos) {
      const addEdges = (targets: string[], type: DependencyType) => {
        for (const to of targets) {
          if (this.domains.has(to)) {
            const edge: DomainEdge = { from: info.id, to, type };
            this.adjacencyList.get(info.id)!.push(edge);
            this.reverseAdjacencyList.get(to)!.push(edge);
          }
        }
      };

      addEdges(info.dependencies.uses ?? [], 'uses');
      addEdges(info.dependencies.extends ?? [], 'extends');
      addEdges(info.dependencies.implements ?? [], 'implements');
    }
  }

  /**
   * 모든 노드 ID 가져오기
   */
  getNodes(): string[] {
    return Array.from(this.domains.keys());
  }

  /**
   * 모든 엣지 가져오기
   */
  getEdges(): DomainEdge[] {
    const edges: DomainEdge[] = [];
    for (const edgeList of this.adjacencyList.values()) {
      edges.push(...edgeList);
    }
    return edges;
  }

  /**
   * 특정 도메인의 의존성 가져오기 (나가는 방향)
   */
  getDependencies(domainId: string): DomainEdge[] {
    return this.adjacencyList.get(domainId) ?? [];
  }

  /**
   * 특정 도메인에 의존하는 도메인들 가져오기 (들어오는 방향)
   */
  getDependents(domainId: string): DomainEdge[] {
    return this.reverseAdjacencyList.get(domainId) ?? [];
  }

  /**
   * Tarjan 알고리즘으로 강한 연결 요소(SCC) 찾기 - 순환 감지용
   */
  findCycles(): CyclePath[] {
    const cycles: CyclePath[] = [];
    const nodes = this.getNodes();
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const parent = new Map<string, { node: string; type: DependencyType } | null>();

    const dfs = (node: string, pathTypes: Map<string, DependencyType>): boolean => {
      visited.add(node);
      recStack.add(node);

      const edges = this.adjacencyList.get(node) ?? [];
      for (const edge of edges) {
        pathTypes.set(edge.to, edge.type);

        if (!visited.has(edge.to)) {
          parent.set(edge.to, { node, type: edge.type });
          if (dfs(edge.to, pathTypes)) {
            return true;
          }
        } else if (recStack.has(edge.to)) {
          // 순환 발견
          const cyclePath: string[] = [edge.to];
          let current = node;
          while (current !== edge.to) {
            cyclePath.unshift(current);
            const p = parent.get(current);
            if (!p) break;
            current = p.node;
          }
          cyclePath.unshift(edge.to); // 시작점을 다시 추가하여 순환 표시

          cycles.push({
            path: cyclePath,
            type: edge.type,
          });
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node)) {
        parent.set(node, null);
        dfs(node, new Map());
      }
    }

    return cycles;
  }

  /**
   * 순환 의존성이 있는지 확인
   */
  hasCycles(): boolean {
    return this.findCycles().length > 0;
  }

  /**
   * 위상 정렬 (Kahn's algorithm)
   * 의존받는 노드가 먼저 나옴 (빌드 순서)
   * 순환이 있으면 null 반환
   */
  topologicalSort(): string[] | null {
    const nodes = this.getNodes();
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // 역방향 진입 차수 계산 (의존하는 쪽에서 의존받는 쪽으로)
    for (const node of nodes) {
      inDegree.set(node, 0);
    }

    // reverseAdjacencyList 사용: 의존받는 노드 -> 의존하는 노드
    for (const node of nodes) {
      for (const edge of this.reverseAdjacencyList.get(node) ?? []) {
        // edge.from이 node에 의존하므로, node가 먼저 처리되어야 함
        // node의 진입 차수를 edge.from에서 오는 것으로 계산
        inDegree.set(edge.from, (inDegree.get(edge.from) ?? 0) + 1);
      }
    }

    // 진입 차수가 0인 노드 (아무에게도 의존하지 않는 노드) 큐에 추가
    for (const [node, degree] of inDegree) {
      if (degree === 0) {
        queue.push(node);
      }
    }

    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);

      // 이 노드에 의존하는 노드들의 진입 차수 감소
      for (const edge of this.reverseAdjacencyList.get(node) ?? []) {
        const newDegree = (inDegree.get(edge.from) ?? 1) - 1;
        inDegree.set(edge.from, newDegree);
        if (newDegree === 0) {
          queue.push(edge.from);
        }
      }
    }

    // 모든 노드가 포함되지 않으면 순환 존재
    if (result.length !== nodes.length) {
      return null;
    }

    return result;
  }

  /**
   * 루트 도메인 찾기 (다른 도메인에 의존하지 않는)
   */
  findRoots(): string[] {
    return this.getNodes().filter((node) => {
      const deps = this.adjacencyList.get(node) ?? [];
      return deps.length === 0;
    });
  }

  /**
   * 리프 도메인 찾기 (다른 도메인이 의존하지 않는)
   */
  findLeaves(): string[] {
    return this.getNodes().filter((node) => {
      const deps = this.reverseAdjacencyList.get(node) ?? [];
      return deps.length === 0;
    });
  }

  /**
   * 두 도메인 사이의 경로 찾기 (BFS)
   */
  findPath(from: string, to: string): string[] | null {
    if (from === to) return [from];
    if (!this.domains.has(from) || !this.domains.has(to)) return null;

    const visited = new Set<string>();
    const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }];

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (visited.has(node)) continue;
      visited.add(node);

      for (const edge of this.adjacencyList.get(node) ?? []) {
        const newPath = [...path, edge.to];
        if (edge.to === to) {
          return newPath;
        }
        queue.push({ node: edge.to, path: newPath });
      }
    }

    return null;
  }

  /**
   * 전체 그래프 분석
   */
  analyze(): GraphAnalysis {
    return {
      nodes: this.getNodes(),
      edges: this.getEdges(),
      cycles: this.findCycles(),
      roots: this.findRoots(),
      leaves: this.findLeaves(),
      topologicalOrder: this.topologicalSort(),
    };
  }

  /**
   * Mermaid 다이어그램 생성
   */
  toMermaid(options: { title?: string; direction?: 'LR' | 'TD' | 'BT' | 'RL' } = {}): string {
    const direction = options.direction ?? 'LR';
    const lines: string[] = [];

    lines.push(`graph ${direction}`);

    if (options.title) {
      lines.push(`  %% ${options.title}`);
    }

    // 노드 정의
    for (const [id, info] of this.domains) {
      const label = info.description ? `${id}[${id}<br/>${info.description}]` : id;
      lines.push(`  ${id}["${info.description || id}"]`);
    }

    // 엣지 정의
    for (const node of this.getNodes()) {
      for (const edge of this.adjacencyList.get(node) ?? []) {
        let arrow = '-->';
        let label = '';

        switch (edge.type) {
          case 'uses':
            arrow = '-->';
            label = 'uses';
            break;
          case 'extends':
            arrow = '-.->'; // 점선
            label = 'extends';
            break;
          case 'implements':
            arrow = '==>';  // 굵은 선
            label = 'impl';
            break;
        }

        lines.push(`  ${edge.from} ${arrow}|${label}| ${edge.to}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * DOT 형식 (Graphviz) 생성
   */
  toDot(options: { title?: string } = {}): string {
    const lines: string[] = [];

    lines.push('digraph DomainGraph {');
    lines.push('  rankdir=LR;');
    lines.push('  node [shape=box, style=rounded];');

    if (options.title) {
      lines.push(`  label="${options.title}";`);
    }

    // 노드 정의
    for (const [id, info] of this.domains) {
      const label = info.description ? `${id}\\n${info.description}` : id;
      lines.push(`  ${id} [label="${label}"];`);
    }

    // 엣지 정의
    for (const node of this.getNodes()) {
      for (const edge of this.adjacencyList.get(node) ?? []) {
        let style = '';
        switch (edge.type) {
          case 'uses':
            style = '';
            break;
          case 'extends':
            style = ' [style=dashed]';
            break;
          case 'implements':
            style = ' [style=bold]';
            break;
        }
        lines.push(`  ${edge.from} -> ${edge.to}${style};`);
      }
    }

    lines.push('}');

    return lines.join('\n');
  }

  /**
   * JSON 형식으로 내보내기
   */
  toJson(): object {
    return {
      nodes: this.getNodes().map((id) => ({
        id,
        ...this.domains.get(id),
      })),
      edges: this.getEdges(),
    };
  }
}

/**
 * 도메인 설정에서 그래프 생성 헬퍼 함수
 */
export function createDomainGraph(config: DomainsConfig): DomainGraph {
  return new DomainGraph(config);
}

/**
 * 순환 경로를 읽기 쉽게 포맷팅
 */
export function formatCyclePath(cycle: CyclePath): string {
  return `${cycle.path.join(' → ')} (${cycle.type})`;
}

/**
 * 순환 의존성 경고 메시지 생성
 */
export function formatCycleWarning(cycles: CyclePath[]): string {
  if (cycles.length === 0) {
    return '';
  }

  const lines = ['⚠️ 순환 의존성이 발견되었습니다:', ''];
  for (const cycle of cycles) {
    lines.push(`  • ${formatCyclePath(cycle)}`);
  }
  return lines.join('\n');
}
