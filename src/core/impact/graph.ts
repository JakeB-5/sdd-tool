/**
 * 의존성 그래프 분석
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readFrontmatter } from '../../utils/frontmatter.js';
import { toStringList } from '../spec/schemas.js';
import {
  DependencyGraph,
  DependencyNode,
} from './schemas.js';
import { success, failure, Result } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { directoryExists } from '../../utils/fs.js';
import { listSpecsUnder, resolveSpecRef } from '../spec/locator.js';

/**
 * 스펙 디렉토리에서 의존성 그래프 구축
 */
export async function buildDependencyGraph(
  specsPath: string
): Promise<Result<DependencyGraph, ChangeError>> {
  try {
    const dangling: Array<{ from: string; to: string }> = [];
    const references: Array<{ from: string; to: string }> = [];
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: [],
      dangling,
      references,
    };

    if (!(await directoryExists(specsPath))) {
      return success(graph);
    }

    // 스펙 수집 (spec.md만, canonical id 기준)
    const locations = await listSpecsUnder(specsPath);
    const allSpecIds = locations.map((l) => l.id);

    // 각 스펙 파일 분석
    for (const location of locations) {
      const content = await fs.readFile(location.specPath, 'utf-8');
      const specId = location.id;

      // 노드 생성
      const node: DependencyNode = {
        id: specId,
        path: path.relative(specsPath, location.specPath),
        title: extractTitle(content),
        dependsOn: [],
        dependedBy: [],
      };

      // frontmatter에서 명시적 의존성 추출 (문자열/쉼표 구분/YAML 리스트, 스펙 스키마와 동일 규칙)
      const { data: frontmatter, body } = readFrontmatter(content);
      const normalizedDeps = toStringList(frontmatter.depends);
      if (Array.isArray(normalizedDeps)) {
        const explicitDeps: unknown[] = normalizedDeps;

        for (const rawDep of explicitDeps) {
          if (rawDep === null || rawDep === undefined) continue;
          const dep = String(rawDep).trim();
          if (!dep || dep === 'null') continue;

          const target = resolveSpecRef(locations, dep, location.domain);
          if (!target) {
            // Unresolved dependency: record as dangling, never as an edge
            dangling.push({ from: specId, to: dep });
            continue;
          }
          if (target.id === specId || node.dependsOn.includes(target.id)) continue;

          node.dependsOn.push(target.id);
          graph.edges.push({
            from: specId,
            to: target.id,
            type: 'explicit',
            description: 'frontmatter depends 필드',
          });
        }
      }

      // Body mentions (`domain/feature`, links, specs/ paths) are informational
      // references only: they never become dependency edges, so they cannot
      // create cycles or change the health score. Dependencies come from `depends`.
      for (const ref of extractReferences(body, allSpecIds)) {
        if (ref !== specId && !node.dependsOn.includes(ref)) {
          references.push({ from: specId, to: ref });
        }
      }

      graph.nodes.set(specId, node);
    }

    // 역방향 의존성 계산
    for (const edge of graph.edges) {
      const targetNode = graph.nodes.get(edge.to);
      if (targetNode && !targetNode.dependedBy.includes(edge.from)) {
        targetNode.dependedBy.push(edge.from);
      }
    }

    return success(graph);
  } catch (error) {
    return failure(
      new ChangeError(
        `의존성 그래프 구축 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * 마크다운에서 제목 추출
 */
function extractTitle(content: string): string | undefined {
  const { body } = readFrontmatter(content);
  const titleMatch = body.match(/^#\s+(.+)$/m);
  return titleMatch?.[1]?.trim();
}

/**
 * 내용에서 다른 스펙 참조 추출
 */
function extractReferences(content: string, allSpecIds: string[]): string[] {
  const references: string[] = [];

  for (const specId of allSpecIds) {
    // 스펙 ID나 경로가 문서에서 언급되는지 확인
    const patterns = [
      new RegExp(`\\[.*?\\]\\(.*?${escapeRegex(specId)}.*?\\)`, 'gi'), // 마크다운 링크
      new RegExp(`specs/${escapeRegex(specId)}`, 'gi'), // specs/ 경로
      new RegExp(`\`${escapeRegex(specId)}\``, 'gi'), // 백틱 내 참조
    ];

    for (const pattern of patterns) {
      if (pattern.test(content) && !references.includes(specId)) {
        references.push(specId);
        break;
      }
    }
  }

  return references;
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Mermaid 그래프 생성
 */
export function generateMermaidGraph(
  graph: DependencyGraph,
  targetSpec?: string
): string {
  let mermaid = 'graph LR\n';

  // 노드 정의
  for (const [id, node] of graph.nodes) {
    const label = node.title || id;
    const style = targetSpec === id ? 'fill:#ff9' : '';
    mermaid += `    ${sanitizeId(id)}["${label}"]\n`;
    if (style) {
      mermaid += `    style ${sanitizeId(id)} ${style}\n`;
    }
  }

  // 엣지 정의
  for (const edge of graph.edges) {
    const arrowStyle = edge.type === 'explicit' ? '-->' : '-..->';
    mermaid += `    ${sanitizeId(edge.from)} ${arrowStyle} ${sanitizeId(edge.to)}\n`;
  }

  // Body references: dotted and labelled so they are not read as dependencies
  for (const ref of graph.references ?? []) {
    mermaid += `    ${sanitizeId(ref.from)} -. 참조 .-> ${sanitizeId(ref.to)}\n`;
  }

  return mermaid;
}

/**
 * Mermaid ID 정리
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}
