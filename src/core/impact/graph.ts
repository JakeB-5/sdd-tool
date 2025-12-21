/**
 * 의존성 그래프 분석
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  DependencyType,
} from './schemas.js';
import { success, failure, Result } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { directoryExists } from '../../utils/fs.js';

/**
 * 스펙 디렉토리에서 의존성 그래프 구축
 */
export async function buildDependencyGraph(
  specsPath: string
): Promise<Result<DependencyGraph, ChangeError>> {
  try {
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: [],
    };

    if (!(await directoryExists(specsPath))) {
      return success(graph);
    }

    // 스펙 파일 수집
    const specFiles = await collectSpecFiles(specsPath);

    // 각 스펙 파일 분석
    for (const filePath of specFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(specsPath, filePath);
      const specId = getSpecId(relativePath);

      // 노드 생성
      const node: DependencyNode = {
        id: specId,
        path: relativePath,
        title: extractTitle(content),
        dependsOn: [],
        dependedBy: [],
      };

      // frontmatter에서 명시적 의존성 추출
      const { data: frontmatter } = matter(content);
      if (frontmatter.depends) {
        const explicitDeps = Array.isArray(frontmatter.depends)
          ? frontmatter.depends
          : [frontmatter.depends];

        for (const dep of explicitDeps) {
          if (dep && dep !== 'null') {
            node.dependsOn.push(dep);
            graph.edges.push({
              from: specId,
              to: dep,
              type: 'explicit',
              description: 'frontmatter depends 필드',
            });
          }
        }
      }

      // 내용에서 참조 추출
      const references = extractReferences(content, specFiles.map((f) => getSpecId(path.relative(specsPath, f))));
      for (const ref of references) {
        if (ref !== specId && !node.dependsOn.includes(ref)) {
          node.dependsOn.push(ref);
          graph.edges.push({
            from: specId,
            to: ref,
            type: 'reference',
            description: '문서 내 참조',
          });
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
 * 스펙 파일 수집 (재귀)
 */
async function collectSpecFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSpecFiles(fullPath)));
    } else if (entry.name.endsWith('.md') && entry.name !== 'AGENTS.md') {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 파일 경로에서 스펙 ID 추출
 */
function getSpecId(relativePath: string): string {
  return relativePath
    .replace(/\\/g, '/')
    .replace(/\.md$/, '')
    .replace(/\/spec$/, '');
}

/**
 * 마크다운에서 제목 추출
 */
function extractTitle(content: string): string | undefined {
  const { content: body } = matter(content);
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

  return mermaid;
}

/**
 * Mermaid ID 정리
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}
