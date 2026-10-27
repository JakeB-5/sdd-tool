/**
 * What-if 시뮬레이션 모듈
 *
 * 변경 제안을 실제로 적용하지 않고 영향도를 미리 분석합니다.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { parseDeltaBody, splitMarkdownSections } from '../change/delta.js';
import { readFrontmatter } from '../../utils/frontmatter.js';
import { toStringList } from '../spec/schemas.js';
import {
  DependencyGraph,
  ImpactLevel,
  AffectedSpec,
  getImpactLevel,
  RISK_WEIGHTS,
} from './schemas.js';
import { buildDependencyGraph } from './graph.js';
import { Result, success, failure } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { fileExists } from '../../utils/fs.js';
import {
  listSpecsUnder,
  resolveSpecIn,
  resolveSpecRef,
  type SpecLocation,
} from '../spec/locator.js';

/**
 * 델타 변경 유형
 */
export type DeltaType = 'ADDED' | 'MODIFIED' | 'REMOVED';

/**
 * 델타 변경 항목
 */
export interface DeltaItem {
  type: DeltaType;
  specId: string;
  description?: string;
  before?: string;
  after?: string;
  newDependencies?: string[];
  removedDependencies?: string[];
  /** Target came from a heading (`### <spec-ref>`): dropped unless it resolves to an existing spec */
  requiresExistingSpec?: boolean;
}

/**
 * 시뮬레이션 결과
 */
export interface SimulationResult {
  /** 실제로 적용된 델타 (스펙 참조 해석 후) */
  deltas?: DeltaItem[];
  /** 현재 상태 */
  current: {
    totalSpecs: number;
    totalEdges: number;
    targetRiskScore: number;
    targetRiskLevel: ImpactLevel;
  };
  /** 변경 후 상태 */
  projected: {
    totalSpecs: number;
    totalEdges: number;
    targetRiskScore: number;
    targetRiskLevel: ImpactLevel;
  };
  /** 변경 사항 */
  changes: {
    addedSpecs: string[];
    removedSpecs: string[];
    modifiedSpecs: string[];
    addedEdges: number;
    removedEdges: number;
  };
  /** 새로 영향받는 스펙 */
  newlyAffected: AffectedSpec[];
  /** 더 이상 영향받지 않는 스펙 */
  noLongerAffected: string[];
  /** 리스크 변화 */
  riskDelta: number;
  /** 경고 메시지 */
  warnings: string[];
  /** 권장 사항 */
  recommendations: string[];
}

/**
 * 시뮬레이션에 사용할 델타 파일 경로 결정
 *
 * Delta data lives in `delta.md` next to `proposal.md`; the proposal itself is only
 * used for legacy changes that have no delta.md.
 */
export async function resolveDeltaSourcePath(proposalPath: string): Promise<string> {
  if (path.basename(proposalPath) === 'proposal.md') {
    const deltaPath = path.join(path.dirname(proposalPath), 'delta.md');
    if (await fileExists(deltaPath)) {
      return deltaPath;
    }
  }
  return proposalPath;
}

/**
 * 델타 파일(delta.md 또는 레거시 proposal.md)에서 델타 파싱
 */
export async function parseDeltaFromProposal(
  proposalPath: string
): Promise<Result<DeltaItem[], ChangeError>> {
  try {
    if (!(await fileExists(proposalPath))) {
      return failure(new ChangeError(`제안서 파일을 찾을 수 없습니다: ${proposalPath}`));
    }

    const content = await fs.readFile(proposalPath, 'utf-8');
    const { added, modified, removed } = parseDeltaBody(readFrontmatter(content).body);
    const deltas: DeltaItem[] = [];

    // ADDED/REMOVED hold spec body text (requirements); only explicit spec targets count
    for (const section of added) {
      deltas.push(...extractSectionTargets('ADDED', section.content));
    }

    // MODIFIED: `### <target>` 대상별 Before/After, 대상이 없으면 명시적 스펙 목록 항목
    for (const item of modified) {
      if (item.target) {
        deltas.push({
          type: 'MODIFIED',
          specId: normalizeSpecTarget(item.target),
          description: item.target,
          before: item.before,
          after: item.after,
          requiresExistingSpec: true,
          ...extractDependencyChanges(item.before, item.after),
        });
      } else {
        for (const ref of parseExplicitSpecItems(item.content)) {
          deltas.push({ type: 'MODIFIED', specId: ref.specId, description: ref.line });
        }
      }
    }

    for (const section of removed) {
      deltas.push(...extractSectionTargets('REMOVED', section.content));
    }

    return success(deltas);
  } catch (error) {
    return failure(
      new ChangeError(`델타 파싱 실패: ${error instanceof Error ? error.message : String(error)}`)
    );
  }
}

/**
 * 명시적 스펙 목록 항목 파싱: `` - `spec-ref` - 설명 `` (백틱 참조로 시작하는 항목만)
 *
 * Plain bullets are requirement text (e.g. `- 시스템은 ... (SHALL)`) and are ignored.
 */
function parseExplicitSpecItems(section: string): Array<{ specId: string; line: string }> {
  const items: Array<{ specId: string; line: string }> = [];
  for (const line of section.split('\n')) {
    const match = line.match(/^\s*[-*]\s+`([^`\s]+)`/);
    if (match) {
      items.push({ specId: normalizeSpecTarget(match[1]), line: line.trim().replace(/^[-*]\s+/, '') });
    }
  }
  return items;
}

/**
 * ADDED/REMOVED 섹션에서 스펙 대상 추출
 *
 * - `` - `spec-ref` - 설명 ``: 스펙 자체의 추가/제거
 * - `### <spec-ref>`: 기존 스펙 안의 요구사항 추가/제거 → 그 스펙의 수정으로 취급
 *   (기존 스펙으로 해석되지 않는 제목, 예: `### REQ-02: ...`는 runSimulation에서 버려짐)
 */
function extractSectionTargets(type: 'ADDED' | 'REMOVED', content: string): DeltaItem[] {
  const deltas: DeltaItem[] = parseExplicitSpecItems(content).map((ref) => ({
    type,
    specId: ref.specId,
    description: ref.line,
  }));

  for (const section of splitMarkdownSections(content, 3)) {
    if (section.heading === null) continue;
    deltas.push({
      type: 'MODIFIED',
      specId: normalizeSpecTarget(section.heading),
      description: `${type}: ${section.heading}`,
      requiresExistingSpec: true,
    });
  }

  return deltas;
}

/**
 * MODIFIED 대상 제목을 스펙 참조로 정규화
 * (`specs/auth/login/spec.md`, `.sdd/specs/auth/login`, `` `auth/login` `` → `auth/login`)
 */
function normalizeSpecTarget(target: string): string {
  return target
    .replace(/`/g, '')
    .trim()
    .replace(/^\.?\/?(?:\.sdd\/)?specs\//, '')
    .replace(/\/spec\.md$/, '')
    .replace(/\/+$/, '');
}

/**
 * Before/After 텍스트의 `depends:` 키를 YAML로 파싱 (키가 없거나 YAML 오류면 undefined)
 *
 * Accepts flow lists, block lists, comma strings; `null`/`~`/empty → [].
 */
function parseDependsLine(text: string | undefined): string[] | undefined {
  if (!text) return undefined;
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^\s*depends:/.test(line));
  if (start === -1) return undefined;

  // The `depends:` line plus its indented / `- item` continuation lines
  const indent = lines[start].match(/^\s*/)?.[0].length ?? 0;
  const block = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    const lineIndent = line.match(/^\s*/)?.[0].length ?? 0;
    if (line.trim() === '' || lineIndent > indent || /^\s*-\s/.test(line)) {
      block.push(line);
    } else {
      break;
    }
  }

  let value: unknown;
  try {
    const parsed = parseYaml(block.map((line) => line.slice(indent)).join('\n')) as
      | { depends?: unknown }
      | null;
    value = parsed?.depends;
  } catch {
    return undefined;
  }

  const list = toStringList(value ?? []);
  return Array.isArray(list) ? list.map((d) => String(d).trim()).filter(Boolean) : [];
}

/**
 * Before/After의 depends 비교로 추가/제거된 의존성 계산
 */
function extractDependencyChanges(
  before: string | undefined,
  after: string | undefined
): Pick<DeltaItem, 'newDependencies' | 'removedDependencies'> {
  const beforeDeps = parseDependsLine(before);
  const afterDeps = parseDependsLine(after);
  if (!afterDeps) {
    // Without an After depends line the dependency change is unknown
    return {};
  }
  if (!beforeDeps) {
    return { newDependencies: afterDeps };
  }
  const added = afterDeps.filter((d) => !beforeDeps.includes(d));
  const removed = beforeDeps.filter((d) => !afterDeps.includes(d));
  return {
    ...(added.length > 0 ? { newDependencies: added } : {}),
    ...(removed.length > 0 ? { removedDependencies: removed } : {}),
  };
}

/**
 * What-if 시뮬레이션 실행
 */
export async function runSimulation(
  specsPath: string,
  targetRef: string,
  rawDeltas: DeltaItem[]
): Promise<Result<SimulationResult, ChangeError>> {
  try {
    // 0. 대상 스펙 및 델타의 스펙 참조를 canonical id로 해석
    const allSpecs = await listSpecsUnder(specsPath);
    const resolvedTarget = resolveSpecIn(allSpecs, targetRef);
    if (!resolvedTarget.success) {
      return failure(new ChangeError(resolvedTarget.error.message));
    }
    const targetSpec = resolvedTarget.data.id;
    const deltas = resolveSimulationDeltas(allSpecs, rawDeltas);
    if (deltas.length === 0) {
      return failure(
        new ChangeError('변경 제안에서 델타를 찾을 수 없습니다. (기존 스펙으로 해석되는 대상이 없음)')
      );
    }

    // 1. 현재 그래프 구축
    const currentGraphResult = await buildDependencyGraph(specsPath);
    if (!currentGraphResult.success) {
      return failure(currentGraphResult.error);
    }
    const currentGraph = currentGraphResult.data;

    // 2. 가상 그래프 생성 (딥 복사)
    const projectedGraph = cloneGraph(currentGraph);

    // 3. 델타 적용
    applyDeltas(projectedGraph, deltas);

    // 4. 영향도 계산
    const currentRisk = calculateRiskScore(currentGraph, targetSpec);
    const projectedRisk = calculateRiskScore(projectedGraph, targetSpec);

    // 5. 새로 영향받는 스펙 계산
    const currentAffected = getAffectedSpecs(currentGraph, targetSpec);
    const projectedAffected = getAffectedSpecs(projectedGraph, targetSpec);

    const newlyAffected = projectedAffected.filter(
      (spec) => !currentAffected.some((s) => s.id === spec.id)
    );
    const noLongerAffected = currentAffected
      .filter((spec) => !projectedAffected.some((s) => s.id === spec.id))
      .map((s) => s.id);

    // 6. 변경 사항 요약
    const addedSpecs = deltas.filter((d) => d.type === 'ADDED').map((d) => d.specId);
    const removedSpecs = deltas.filter((d) => d.type === 'REMOVED').map((d) => d.specId);
    const modifiedSpecs = deltas.filter((d) => d.type === 'MODIFIED').map((d) => d.specId);

    // 7. 경고 및 권장사항 생성
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const riskDelta = projectedRisk.score - currentRisk.score;

    if (riskDelta > 2) {
      warnings.push(`리스크 점수가 ${riskDelta}점 증가합니다 (${currentRisk.score} → ${projectedRisk.score})`);
    }

    if (newlyAffected.length > 3) {
      warnings.push(`${newlyAffected.length}개의 스펙이 새로 영향받게 됩니다`);
      recommendations.push('변경 범위를 줄이거나 단계적 적용을 고려하세요');
    }

    if (projectedRisk.level === 'high' && currentRisk.level !== 'high') {
      warnings.push('변경 후 리스크 수준이 "high"로 상승합니다');
      recommendations.push('영향받는 스펙들의 테스트 계획을 먼저 수립하세요');
    }

    if (removedSpecs.length > 0) {
      const affectedByRemoved = removedSpecs.filter((specId) => {
        const node = currentGraph.nodes.get(specId);
        return node && node.dependedBy.length > 0;
      });
      if (affectedByRemoved.length > 0) {
        warnings.push(`제거될 스펙 중 다른 스펙에서 참조하는 것이 있습니다: ${affectedByRemoved.join(', ')}`);
      }
    }

    return success({
      current: {
        totalSpecs: currentGraph.nodes.size,
        totalEdges: currentGraph.edges.length,
        targetRiskScore: currentRisk.score,
        targetRiskLevel: currentRisk.level,
      },
      projected: {
        totalSpecs: projectedGraph.nodes.size,
        totalEdges: projectedGraph.edges.length,
        targetRiskScore: projectedRisk.score,
        targetRiskLevel: projectedRisk.level,
      },
      changes: {
        addedSpecs,
        removedSpecs,
        modifiedSpecs,
        ...countEdgeChanges(currentGraph, projectedGraph),
      },
      newlyAffected,
      noLongerAffected,
      riskDelta,
      warnings,
      recommendations,
      deltas,
    });
  } catch (error) {
    return failure(
      new ChangeError(`시뮬레이션 실패: ${error instanceof Error ? error.message : String(error)}`)
    );
  }
}

/**
 * 델타를 canonical id로 해석하고, 기존 스펙이 필요한 대상(제목 기반)이 해석되지 않으면 제외
 */
export function resolveSimulationDeltas(allSpecs: SpecLocation[], deltas: DeltaItem[]): DeltaItem[] {
  return deltas
    .filter((delta) => !delta.requiresExistingSpec || resolveSpecRef(allSpecs, delta.specId))
    .map((delta) => resolveDeltaRefs(allSpecs, delta));
}

/**
 * 델타의 스펙 id와 의존성 참조를 canonical id로 해석 (해석 불가 시 원래 값 유지: 신규 스펙 등)
 */
function resolveDeltaRefs(allSpecs: SpecLocation[], delta: DeltaItem): DeltaItem {
  const own = resolveSpecRef(allSpecs, delta.specId);
  const fromDomain = own ? own.domain : undefined;
  const resolveDep = (dep: string): string => resolveSpecRef(allSpecs, dep, fromDomain)?.id ?? dep;

  return {
    ...delta,
    specId: own?.id ?? delta.specId,
    newDependencies: delta.newDependencies?.map(resolveDep),
    removedDependencies: delta.removedDependencies?.map(resolveDep),
  };
}

/**
 * 현재/예상 그래프 간 추가·제거된 엣지 수 (from→to 기준)
 */
function countEdgeChanges(
  current: DependencyGraph,
  projected: DependencyGraph
): { addedEdges: number; removedEdges: number } {
  const key = (e: { from: string; to: string }): string => `${e.from}\u0000${e.to}`;
  const currentKeys = new Set(current.edges.map(key));
  const projectedKeys = new Set(projected.edges.map(key));
  return {
    addedEdges: [...projectedKeys].filter((k) => !currentKeys.has(k)).length,
    removedEdges: [...currentKeys].filter((k) => !projectedKeys.has(k)).length,
  };
}

/**
 * 그래프 딥 복사
 */
function cloneGraph(graph: DependencyGraph): DependencyGraph {
  const cloned: DependencyGraph = {
    nodes: new Map(),
    edges: [...graph.edges.map((e) => ({ ...e }))],
  };

  for (const [id, node] of graph.nodes) {
    cloned.nodes.set(id, {
      ...node,
      dependsOn: [...node.dependsOn],
      dependedBy: [...node.dependedBy],
    });
  }

  return cloned;
}

/**
 * 델타를 가상 그래프에 적용
 */
function applyDeltas(graph: DependencyGraph, deltas: DeltaItem[]): void {
  for (const delta of deltas) {
    switch (delta.type) {
      case 'ADDED':
        // 새 노드 추가
        if (!graph.nodes.has(delta.specId)) {
          graph.nodes.set(delta.specId, {
            id: delta.specId,
            path: `${delta.specId}/spec.md`,
            title: delta.description,
            dependsOn: delta.newDependencies || [],
            dependedBy: [],
          });

          // 의존성 엣지 추가
          for (const dep of delta.newDependencies || []) {
            graph.edges.push({
              from: delta.specId,
              to: dep,
              type: 'explicit',
            });

            // 역방향 업데이트
            const targetNode = graph.nodes.get(dep);
            if (targetNode) {
              targetNode.dependedBy.push(delta.specId);
            }
          }
        }
        break;

      case 'REMOVED':
        // 노드 및 관련 엣지 제거
        if (graph.nodes.has(delta.specId)) {
          const node = graph.nodes.get(delta.specId)!;

          // 관련 엣지 제거
          graph.edges = graph.edges.filter(
            (e) => e.from !== delta.specId && e.to !== delta.specId
          );

          // 다른 노드에서 참조 제거
          for (const depId of node.dependsOn) {
            const depNode = graph.nodes.get(depId);
            if (depNode) {
              depNode.dependedBy = depNode.dependedBy.filter((id) => id !== delta.specId);
            }
          }

          for (const byId of node.dependedBy) {
            const byNode = graph.nodes.get(byId);
            if (byNode) {
              byNode.dependsOn = byNode.dependsOn.filter((id) => id !== delta.specId);
            }
          }

          graph.nodes.delete(delta.specId);
        }
        break;

      case 'MODIFIED':
        // 제거된 의존성 적용
        if (graph.nodes.has(delta.specId) && delta.removedDependencies) {
          const node = graph.nodes.get(delta.specId)!;
          const removed = new Set(delta.removedDependencies);
          node.dependsOn = node.dependsOn.filter((dep) => !removed.has(dep));
          graph.edges = graph.edges.filter(
            (e) => !(e.from === delta.specId && removed.has(e.to))
          );
          for (const dep of removed) {
            const depNode = graph.nodes.get(dep);
            if (depNode) {
              depNode.dependedBy = depNode.dependedBy.filter((id) => id !== delta.specId);
            }
          }
        }

        // 추가된 의존성 적용
        if (graph.nodes.has(delta.specId) && delta.newDependencies) {
          const node = graph.nodes.get(delta.specId)!;
          const oldDeps = new Set(node.dependsOn);

          for (const newDep of delta.newDependencies) {
            if (!oldDeps.has(newDep)) {
              node.dependsOn.push(newDep);
              graph.edges.push({
                from: delta.specId,
                to: newDep,
                type: 'explicit',
              });

              const targetNode = graph.nodes.get(newDep);
              if (targetNode) {
                targetNode.dependedBy.push(delta.specId);
              }
            }
          }
        }
        break;
    }
  }
}

/**
 * 리스크 점수 계산
 */
function calculateRiskScore(
  graph: DependencyGraph,
  targetSpec: string
): { score: number; level: ImpactLevel } {
  const node = graph.nodes.get(targetSpec);
  if (!node) {
    return { score: 0, level: 'low' };
  }

  let score = 0;

  // 직접 의존하는 것들
  score += node.dependsOn.length * RISK_WEIGHTS.directDependency;

  // 이 스펙에 의존하는 것들
  score += node.dependedBy.length * RISK_WEIGHTS.directDependency;

  // 간접 의존성 (2단계까지)
  const indirectDeps = new Set<string>();
  for (const depId of node.dependedBy) {
    const depNode = graph.nodes.get(depId);
    if (depNode) {
      for (const indirectId of depNode.dependedBy) {
        if (indirectId !== targetSpec) {
          indirectDeps.add(indirectId);
        }
      }
    }
  }
  score += indirectDeps.size * RISK_WEIGHTS.indirectDependency;

  // 정규화 (1-10)
  score = Math.min(10, Math.max(1, Math.round(score)));

  return {
    score,
    level: getImpactLevel(score),
  };
}

/**
 * 영향받는 스펙 목록 가져오기
 */
function getAffectedSpecs(graph: DependencyGraph, targetSpec: string): AffectedSpec[] {
  const affected: AffectedSpec[] = [];
  const node = graph.nodes.get(targetSpec);

  if (!node) return affected;

  // 직접 영향받는 스펙 (이 스펙에 의존하는 것들)
  for (const depId of node.dependedBy) {
    const depNode = graph.nodes.get(depId);
    if (depNode) {
      affected.push({
        id: depId,
        path: depNode.path,
        title: depNode.title,
        level: 'high',
        type: 'explicit',
        reason: `${targetSpec}에 직접 의존`,
      });
    }
  }

  // 간접 영향받는 스펙
  const visited = new Set<string>([targetSpec, ...node.dependedBy]);
  const queue = [...node.dependedBy];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentNode = graph.nodes.get(current);

    if (!currentNode) continue;

    for (const byId of currentNode.dependedBy) {
      if (!visited.has(byId)) {
        visited.add(byId);
        const byNode = graph.nodes.get(byId);
        if (byNode) {
          affected.push({
            id: byId,
            path: byNode.path,
            title: byNode.title,
            level: 'medium',
            type: 'reference',
            reason: `${current}를 통해 간접 영향`,
          });
          queue.push(byId);
        }
      }
    }
  }

  return affected;
}

/**
 * 시뮬레이션 결과를 텍스트로 포맷
 */
export function formatSimulationResult(result: SimulationResult, targetSpec: string): string {
  const lines: string[] = [];

  lines.push('=== What-if 시뮬레이션 결과 ===');
  lines.push(`대상 스펙: ${targetSpec}`);
  lines.push('');

  // 상태 비교
  lines.push('--- 상태 비교 ---');
  lines.push('');
  lines.push('| 항목 | 현재 | 변경 후 | 차이 |');
  lines.push('|------|------|---------|------|');
  lines.push(
    `| 스펙 수 | ${result.current.totalSpecs} | ${result.projected.totalSpecs} | ${result.projected.totalSpecs - result.current.totalSpecs >= 0 ? '+' : ''}${result.projected.totalSpecs - result.current.totalSpecs} |`
  );
  lines.push(
    `| 엣지 수 | ${result.current.totalEdges} | ${result.projected.totalEdges} | ${result.projected.totalEdges - result.current.totalEdges >= 0 ? '+' : ''}${result.projected.totalEdges - result.current.totalEdges} |`
  );
  lines.push(
    `| 리스크 점수 | ${result.current.targetRiskScore} | ${result.projected.targetRiskScore} | ${result.riskDelta >= 0 ? '+' : ''}${result.riskDelta} |`
  );
  lines.push(
    `| 리스크 수준 | ${result.current.targetRiskLevel} | ${result.projected.targetRiskLevel} | - |`
  );
  lines.push('');

  // 변경 사항
  if (result.changes.addedSpecs.length > 0 ||
      result.changes.removedSpecs.length > 0 ||
      result.changes.modifiedSpecs.length > 0) {
    lines.push('--- 변경 사항 ---');
    lines.push('');
    if (result.changes.addedSpecs.length > 0) {
      lines.push(`추가: ${result.changes.addedSpecs.join(', ')}`);
    }
    if (result.changes.removedSpecs.length > 0) {
      lines.push(`제거: ${result.changes.removedSpecs.join(', ')}`);
    }
    if (result.changes.modifiedSpecs.length > 0) {
      lines.push(`수정: ${result.changes.modifiedSpecs.join(', ')}`);
    }
    lines.push('');
  }

  // 새로 영향받는 스펙
  if (result.newlyAffected.length > 0) {
    lines.push('--- 새로 영향받는 스펙 ---');
    lines.push('');
    for (const spec of result.newlyAffected) {
      lines.push(`- ${spec.id} (${spec.level}): ${spec.reason}`);
    }
    lines.push('');
  }

  // 더 이상 영향받지 않는 스펙
  if (result.noLongerAffected.length > 0) {
    lines.push('--- 더 이상 영향받지 않는 스펙 ---');
    lines.push('');
    lines.push(result.noLongerAffected.join(', '));
    lines.push('');
  }

  // 경고
  if (result.warnings.length > 0) {
    lines.push('--- 경고 ---');
    lines.push('');
    for (const warning of result.warnings) {
      lines.push(`⚠️ ${warning}`);
    }
    lines.push('');
  }

  // 권장사항
  if (result.recommendations.length > 0) {
    lines.push('--- 권장사항 ---');
    lines.push('');
    for (const rec of result.recommendations) {
      lines.push(`💡 ${rec}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
