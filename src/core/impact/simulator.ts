/**
 * What-if 시뮬레이션 모듈
 *
 * 변경 제안을 실제로 적용하지 않고 영향도를 미리 분석합니다.
 */
import { promises as fs } from 'node:fs';
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
}

/**
 * 시뮬레이션 결과
 */
export interface SimulationResult {
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
 * 변경 제안 파일에서 델타 파싱
 */
export async function parseDeltaFromProposal(
  proposalPath: string
): Promise<Result<DeltaItem[], ChangeError>> {
  try {
    if (!(await fileExists(proposalPath))) {
      return failure(new ChangeError(`제안서 파일을 찾을 수 없습니다: ${proposalPath}`));
    }

    const content = await fs.readFile(proposalPath, 'utf-8');
    const deltas: DeltaItem[] = [];

    // ADDED 섹션 파싱
    const addedSection = content.match(/##\s*ADDED([\s\S]*?)(?=##\s*(?:MODIFIED|REMOVED)|---|\n$)/i);
    if (addedSection) {
      const items = parseListItems(addedSection[1]);
      for (const item of items) {
        deltas.push({
          type: 'ADDED',
          specId: extractSpecIdFromText(item),
          description: item,
        });
      }
    }

    // MODIFIED 섹션 파싱
    const modifiedSection = content.match(/##\s*MODIFIED([\s\S]*?)(?=##\s*(?:ADDED|REMOVED)|---|\n$)/i);
    if (modifiedSection) {
      const items = parseModifiedItems(modifiedSection[1]);
      deltas.push(...items);
    }

    // REMOVED 섹션 파싱
    const removedSection = content.match(/##\s*REMOVED([\s\S]*?)(?=##\s*(?:ADDED|MODIFIED)|---|\n$)/i);
    if (removedSection) {
      const items = parseListItems(removedSection[1]);
      for (const item of items) {
        deltas.push({
          type: 'REMOVED',
          specId: extractSpecIdFromText(item),
          description: item,
        });
      }
    }

    // depends 변경 추출
    extractDependencyChanges(content, deltas);

    return success(deltas);
  } catch (error) {
    return failure(
      new ChangeError(`델타 파싱 실패: ${error instanceof Error ? error.message : String(error)}`)
    );
  }
}

/**
 * 리스트 아이템 파싱
 */
function parseListItems(section: string): string[] {
  const items: string[] = [];
  const lines = section.split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*-\s+(.+)/);
    if (match) {
      items.push(match[1].trim());
    }
  }

  return items;
}

/**
 * MODIFIED 섹션 파싱 (Before/After 포함)
 */
function parseModifiedItems(section: string): DeltaItem[] {
  const items: DeltaItem[] = [];

  // ### 형식의 수정 항목 찾기
  const itemBlocks = section.split(/###\s+/);

  for (const block of itemBlocks) {
    if (!block.trim()) continue;

    const titleMatch = block.match(/^(.+?)(?:\n|$)/);
    if (!titleMatch) continue;

    const specId = extractSpecIdFromText(titleMatch[1]);
    const beforeMatch = block.match(/\*\*Before\*\*:?\s*(.+?)(?=\*\*After\*\*|$)/is);
    const afterMatch = block.match(/\*\*After\*\*:?\s*(.+?)(?=###|$)/is);

    items.push({
      type: 'MODIFIED',
      specId,
      description: titleMatch[1].trim(),
      before: beforeMatch?.[1]?.trim(),
      after: afterMatch?.[1]?.trim(),
    });
  }

  // 리스트 형식도 지원
  if (items.length === 0) {
    const listItems = parseListItems(section);
    for (const item of listItems) {
      items.push({
        type: 'MODIFIED',
        specId: extractSpecIdFromText(item),
        description: item,
      });
    }
  }

  return items;
}

/**
 * 텍스트에서 스펙 ID 추출
 */
function extractSpecIdFromText(text: string): string {
  // `spec-id` 형식
  const backtickMatch = text.match(/`([a-z0-9-]+)`/i);
  if (backtickMatch) return backtickMatch[1];

  // 첫 번째 단어 사용 (폴백)
  const wordMatch = text.match(/^([a-z0-9-]+)/i);
  return wordMatch ? wordMatch[1] : text.slice(0, 20).replace(/\s/g, '-').toLowerCase();
}

/**
 * 의존성 변경 추출
 */
function extractDependencyChanges(content: string, deltas: DeltaItem[]): void {
  // depends 추가 패턴
  const _addDepsPattern = /depends?\s*(?:에|를|:)?\s*(?:추가|add)/gi;
  const _removeDepsPattern = /depends?\s*(?:에서|를|:)?\s*(?:제거|remove)/gi;

  for (const delta of deltas) {
    // 관련 텍스트에서 의존성 변경 찾기
    if (delta.after) {
      const depsMatch = delta.after.match(/depends?:\s*\[?([^\]\n]+)\]?/i);
      if (depsMatch) {
        delta.newDependencies = depsMatch[1]
          .split(',')
          .map((d) => d.trim().replace(/["`']/g, ''))
          .filter(Boolean);
      }
    }
  }
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
    const deltas = rawDeltas.map((delta) => resolveDeltaRefs(allSpecs, delta));

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
        addedEdges: projectedGraph.edges.length - currentGraph.edges.length,
        removedEdges: 0, // 간략화
      },
      newlyAffected,
      noLongerAffected,
      riskDelta,
      warnings,
      recommendations,
    });
  } catch (error) {
    return failure(
      new ChangeError(`시뮬레이션 실패: ${error instanceof Error ? error.message : String(error)}`)
    );
  }
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
        // 의존성 변경 적용
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
