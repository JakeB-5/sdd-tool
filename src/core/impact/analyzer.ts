/**
 * 영향도 분석기
 */
import path from 'node:path';
import {
  DependencyGraph,
  ImpactAnalysisResult,
  AffectedSpec,
  ImpactLevel,
  RISK_WEIGHTS,
  getImpactLevel,
  ImpactReport,
  ChangeImpactAnalysis,
} from './schemas.js';
import { buildDependencyGraph, generateMermaidGraph } from './graph.js';
import { success, failure, Result } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { directoryExists, fileExists, readFile } from '../../utils/fs.js';
import { listSpecs, resolveSpec, resolveSpecRef } from '../spec/locator.js';
import { parseProposal, isValidChangeId } from '../change/index.js';

/**
 * 영향도 분석 실행
 */
export async function analyzeImpact(
  sddPath: string,
  targetSpec: string
): Promise<Result<ImpactAnalysisResult, ChangeError>> {
  try {
    const specsPath = path.join(sddPath, 'specs');

    if (!(await directoryExists(specsPath))) {
      return failure(new ChangeError('스펙 디렉토리를 찾을 수 없습니다.'));
    }

    // 의존성 그래프 구축
    const graphResult = await buildDependencyGraph(specsPath);
    if (!graphResult.success) {
      return failure(graphResult.error);
    }

    const graph = graphResult.data;

    // 스펙 참조 해석 (<domain>/<feature>, bare feature, 레거시 id)
    const resolved = await resolveSpec(sddPath, targetSpec);
    if (!resolved.success) {
      return failure(new ChangeError(resolved.error.message));
    }
    const effectiveTargetSpec = resolved.data.id;
    const targetNode = graph.nodes.get(effectiveTargetSpec);

    if (!targetNode) {
      return failure(new ChangeError(`스펙을 찾을 수 없습니다: ${targetSpec}`));
    }

    // 의존하는 스펙 (이 스펙이 사용하는)
    const dependsOn: AffectedSpec[] = targetNode.dependsOn.map((depId) => {
      const depNode = graph.nodes.get(depId);
      const edge = graph.edges.find((e) => e.from === effectiveTargetSpec && e.to === depId);
      return {
        id: depId,
        path: depNode?.path || depId,
        title: depNode?.title,
        level: 'low' as ImpactLevel,
        type: edge?.type || 'reference',
        reason: edge?.description || '의존',
      };
    });

    // 영향 받는 스펙 (이 스펙을 사용하는)
    const affectedBy: AffectedSpec[] = targetNode.dependedBy.map((depId) => {
      const depNode = graph.nodes.get(depId);
      const edge = graph.edges.find((e) => e.from === depId && e.to === effectiveTargetSpec);
      const level = determineImpactLevel(edge?.type);
      return {
        id: depId,
        path: depNode?.path || depId,
        title: depNode?.title,
        level,
        type: edge?.type || 'reference',
        reason: edge?.description || '이 스펙에 의존함',
      };
    });

    // 간접 영향 분석 (transitive)
    const transitiveAffected = getTransitiveAffected(graph, effectiveTargetSpec);

    // 리스크 점수 계산
    const riskScore = calculateRiskScore(dependsOn, affectedBy, transitiveAffected);
    const riskLevel = getImpactLevel(riskScore);

    // 요약 및 권장사항 생성
    const summary = generateSummary(effectiveTargetSpec, dependsOn, affectedBy, transitiveAffected, riskScore);
    const recommendations = generateRecommendations(affectedBy, transitiveAffected, riskLevel);

    return success({
      targetSpec: effectiveTargetSpec,
      dependsOn,
      affectedBy,
      transitiveAffected,
      riskScore,
      riskLevel,
      summary,
      recommendations,
      danglingDependencies: (graph.dangling ?? [])
        .filter((d) => d.from === effectiveTargetSpec)
        .map((d) => d.to),
      references: (graph.references ?? [])
        .filter((r) => r.from === effectiveTargetSpec)
        .map((r) => r.to),
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `영향도 분석 실패:${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * 의존성 유형에 따른 영향도 수준 결정
 */
function determineImpactLevel(type?: string): ImpactLevel {
  switch (type) {
    case 'explicit':
    case 'api':
      return 'high';
    case 'data':
      return 'medium';
    default:
      return 'low';
  }
}

/** Maximum BFS distance explored for transitive impact */
const MAX_TRANSITIVE_DISTANCE = 6;

/**
 * 간접 영향 받는 스펙 조회 (BFS)
 *
 * 각 스펙은 최단 거리에서 한 번만 집계되며, 직접 의존(거리 1)은 제외한다.
 */
function getTransitiveAffected(graph: DependencyGraph, specId: string): AffectedSpec[] {
  const result: AffectedSpec[] = [];
  const distance = new Map<string, number>([[specId, 0]]);
  const queue: string[] = [specId];

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const currentDistance = distance.get(currentId) ?? 0;
    const node = graph.nodes.get(currentId);
    if (!node || currentDistance >= MAX_TRANSITIVE_DISTANCE) continue;

    for (const depId of node.dependedBy) {
      if (distance.has(depId)) continue;
      const depDistance = currentDistance + 1;
      distance.set(depId, depDistance);
      queue.push(depId);

      if (depDistance >= 2) {
        const depNode = graph.nodes.get(depId);
        const edge = graph.edges.find((e) => e.from === depId && e.to === currentId);
        const indirectDepth = depDistance - 1;
        result.push({
          id: depId,
          path: depNode?.path || depId,
          title: depNode?.title,
          level: indirectDepth === 1 ? 'medium' : 'low',
          type: edge?.type || 'reference',
          reason: `${indirectDepth}단계 간접 의존`,
        });
      }
    }
  }

  return result;
}

/**
 * 리스크 점수 계산
 */
function calculateRiskScore(
  dependsOn: AffectedSpec[],
  affectedBy: AffectedSpec[],
  transitiveAffected: AffectedSpec[] = []
): number {
  let score = 0;

  // 직접 영향 받는 스펙 수
  const highImpactCount = affectedBy.filter((s) => s.level === 'high').length;
  const mediumImpactCount = affectedBy.filter((s) => s.level === 'medium').length;
  const lowImpactCount = affectedBy.filter((s) => s.level === 'low').length;

  score += highImpactCount * RISK_WEIGHTS.directDependency;
  score += mediumImpactCount * RISK_WEIGHTS.indirectDependency;
  score += lowImpactCount * 0.5;

  // 간접 영향 추가
  score += transitiveAffected.length * 0.3;

  // API 변경 포함 시
  if (affectedBy.some((s) => s.type === 'api')) {
    score += RISK_WEIGHTS.apiChange;
  }

  // 데이터 모델 변경 포함 시
  if (affectedBy.some((s) => s.type === 'data')) {
    score += RISK_WEIGHTS.dataModelChange;
  }

  // 1-10 범위로 정규화
  return Math.min(10, Math.max(1, Math.round(score)));
}

/**
 * 요약 생성
 */
function generateSummary(
  targetSpec: string,
  dependsOn: AffectedSpec[],
  affectedBy: AffectedSpec[],
  transitiveAffected: AffectedSpec[],
  riskScore: number
): string {
  const parts: string[] = [];

  parts.push(`'${targetSpec}' 스펙 변경 시:`);

  if (dependsOn.length > 0) {
    parts.push(`- ${dependsOn.length}개 스펙에 의존함`);
  }

  if (affectedBy.length > 0) {
    parts.push(`- ${affectedBy.length}개 스펙에 직접 영향을 줌`);

    const highCount = affectedBy.filter((s) => s.level === 'high').length;
    if (highCount > 0) {
      parts.push(`  - 높은 영향: ${highCount}개`);
    }
  }

  if (transitiveAffected.length > 0) {
    parts.push(`- ${transitiveAffected.length}개 스펙에 간접 영향을 줌`);
  }

  parts.push(`- 총 영향 범위: ${affectedBy.length + transitiveAffected.length}개 스펙`);
  parts.push(`- 리스크 점수: ${riskScore}/10`);

  return parts.join('\n');
}

/**
 * 권장사항 생성
 */
function generateRecommendations(
  affectedBy: AffectedSpec[],
  transitiveAffected: AffectedSpec[],
  riskLevel: ImpactLevel
): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'high') {
    recommendations.push('변경 전 영향 받는 모든 스펙을 검토하세요.');
    recommendations.push('관련 팀과 변경 사항을 공유하세요.');
    recommendations.push('단계적 마이그레이션을 고려하세요.');
  } else if (riskLevel === 'medium') {
    recommendations.push('영향 받는 스펙의 테스트를 확인하세요.');
    recommendations.push('변경 후 영향 스펙 검증을 수행하세요.');
  } else {
    recommendations.push('표준 변경 프로세스를 따르세요.');
  }

  // 특정 유형에 대한 권장사항
  const hasApiDep = affectedBy.some((s) => s.type === 'api');
  if (hasApiDep) {
    recommendations.push('API 변경 시 버전 관리를 고려하세요.');
  }

  const hasDataDep = affectedBy.some((s) => s.type === 'data');
  if (hasDataDep) {
    recommendations.push('데이터 마이그레이션 계획을 수립하세요.');
  }

  // 간접 영향 관련 권장사항
  if (transitiveAffected.length > 3) {
    recommendations.push('영향 범위가 넓습니다. 변경 제안서(CHG)를 작성하세요.');
  }

  return recommendations;
}

/**
 * 영향도 분석 결과 포맷팅
 */
export function formatImpactResult(result: ImpactAnalysisResult): string {
  const lines: string[] = [];

  lines.push(`📊 영향도 분석: ${result.targetSpec}`);
  lines.push('');

  if (result.dependsOn.length > 0) {
    lines.push('🔗 의존하는 스펙 (이 기능이 사용하는):');
    for (const dep of result.dependsOn) {
      lines.push(`  └─ ${dep.id} (${dep.type})`);
    }
    lines.push('');
  }

  if (result.affectedBy.length > 0) {
    lines.push('⚠️  직접 영향 받는 스펙 (이 기능을 사용하는):');
    for (const affected of result.affectedBy) {
      const icon = affected.level === 'high' ? '🔴' : affected.level === 'medium' ? '🟡' : '🟢';
      lines.push(`  ├─ ${icon} ${affected.id} (${affected.type})`);
    }
    lines.push('');
  }

  if (result.transitiveAffected.length > 0) {
    lines.push('🔄 간접 영향 받는 스펙:');
    for (const affected of result.transitiveAffected) {
      lines.push(`  └─ ${affected.id} (${affected.reason})`);
    }
    lines.push('');
  }

  const dangling = result.danglingDependencies ?? [];
  if (dangling.length > 0) {
    lines.push('⚠️  해석되지 않는 의존성 (존재하지 않는 스펙):');
    for (const dep of dangling) {
      lines.push(`  └─ ${dep}`);
    }
    lines.push('');
  }

  const references = result.references ?? [];
  if (references.length > 0) {
    lines.push('📎 본문 참조 (의존성 아님 — 의존성은 frontmatter `depends`로 선언):');
    for (const ref of references) {
      lines.push(`  └─ ${ref}`);
    }
    lines.push('');
  }

  const riskIcon = result.riskLevel === 'high' ? '🔴' : result.riskLevel === 'medium' ? '🟡' : '🟢';
  lines.push(`📈 리스크 점수: ${result.riskScore}/10 ${riskIcon}`);
  lines.push('');

  if (result.recommendations.length > 0) {
    lines.push('💡 권장사항:');
    for (const rec of result.recommendations) {
      lines.push(`  - ${rec}`);
    }
  }

  return lines.join('\n');
}

/**
 * 전체 프로젝트 영향도 리포트 생성
 */
export async function generateImpactReport(
  sddPath: string
): Promise<Result<ImpactReport, ChangeError>> {
  try {
    const specsPath = path.join(sddPath, 'specs');

    if (!(await directoryExists(specsPath))) {
      return failure(new ChangeError('스펙 디렉토리를 찾을 수 없습니다.'));
    }

    // 의존성 그래프 구축
    const graphResult = await buildDependencyGraph(specsPath);
    if (!graphResult.success) {
      return failure(graphResult.error);
    }

    const graph = graphResult.data;
    const nodes = Array.from(graph.nodes.values());

    // 연결성 통계
    const mostConnected = nodes
      .map((node) => ({
        id: node.id,
        title: node.title,
        inbound: node.dependedBy.length,
        outbound: node.dependsOn.length,
        total: node.dependedBy.length + node.dependsOn.length,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 고립된 스펙
    const orphanSpecs = nodes
      .filter((n) => n.dependsOn.length === 0 && n.dependedBy.length === 0)
      .map((n) => n.id);

    // 순환 의존성 탐지
    const circularDeps = detectCircularDependencies(graph);

    // 건강도 점수 계산
    const healthScore = calculateHealthScore(nodes.length, graph.edges.length, orphanSpecs.length, circularDeps.length);

    // 요약
    const summary = generateReportSummary(nodes.length, graph.edges.length, orphanSpecs.length, circularDeps.length, healthScore);

    return success({
      generatedAt: new Date().toISOString(),
      projectPath: sddPath,
      totalSpecs: nodes.length,
      totalEdges: graph.edges.length,
      totalReferences: graph.references?.length ?? 0,
      mostConnectedSpecs: mostConnected,
      orphanSpecs,
      circularDependencies: circularDeps,
      healthScore,
      summary,
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `영향도 리포트 생성 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * 순환 의존성 탐지
 */
function detectCircularDependencies(
  graph: DependencyGraph
): Array<{ cycle: string[]; description: string }> {
  const cycles: Array<{ cycle: string[]; description: string }> = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);

    const node = graph.nodes.get(nodeId);
    if (!node) return;

    recStack.add(nodeId);

    for (const depId of node.dependsOn) {
      // Unresolved ids are never part of a cycle
      if (!graph.nodes.has(depId)) continue;

      if (!visited.has(depId)) {
        dfs(depId, [...path, nodeId]);
      } else if (recStack.has(depId)) {
        // 순환 발견
        const cycleStart = path.indexOf(depId);
        const cycle = cycleStart >= 0 ? [...path.slice(cycleStart), nodeId, depId] : [nodeId, depId];
        cycles.push({
          cycle,
          description: `순환 의존성: ${cycle.join(' → ')}`,
        });
      }
    }

    // Always unwind, so later traversals do not see stale stack entries
    recStack.delete(nodeId);
  }

  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  }

  return cycles;
}

/**
 * 건강도 점수 계산
 */
function calculateHealthScore(
  totalSpecs: number,
  totalEdges: number,
  orphanCount: number,
  circularCount: number
): number {
  if (totalSpecs === 0) return 100;

  let score = 100;

  // 고립된 스펙이 많으면 감점
  const orphanRatio = orphanCount / totalSpecs;
  score -= orphanRatio * 20;

  // 순환 의존성이 있으면 감점
  score -= circularCount * 10;

  // 연결성이 너무 낮으면 감점
  const avgConnections = (totalEdges * 2) / totalSpecs;
  if (avgConnections < 0.5 && totalSpecs > 2) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 리포트 요약 생성
 */
function generateReportSummary(
  totalSpecs: number,
  totalEdges: number,
  orphanCount: number,
  circularCount: number,
  healthScore: number
): string {
  const parts: string[] = [];

  parts.push(`프로젝트 의존성 분석 결과:`);
  parts.push(`- 총 ${totalSpecs}개 스펙, ${totalEdges}개 의존 관계`);

  if (orphanCount > 0) {
    parts.push(`- ${orphanCount}개 스펙이 다른 스펙과 연결되지 않음`);
  }

  if (circularCount > 0) {
    parts.push(`- ${circularCount}개 순환 의존성 발견 (해결 필요)`);
  }

  const healthLevel = healthScore >= 80 ? '양호' : healthScore >= 50 ? '주의 필요' : '문제 있음';
  parts.push(`- 건강도 점수: ${healthScore}/100 (${healthLevel})`);

  return parts.join('\n');
}

/**
 * 변경 제안 영향 분석
 */
export async function analyzeChangeImpact(
  sddPath: string,
  changeId: string
): Promise<Result<ChangeImpactAnalysis, ChangeError>> {
  if (!isValidChangeId(changeId)) {
    return failure(new ChangeError(`유효하지 않은 변경 ID입니다: ${changeId} (형식: CHG-001)`));
  }

  try {
    const changePath = path.join(sddPath, 'changes', changeId);
    const proposalPath = path.join(changePath, 'proposal.md');

    if (!(await fileExists(proposalPath))) {
      return failure(new ChangeError(`변경 제안을 찾을 수 없습니다: ${changeId}`));
    }

    const contentResult = await readFile(proposalPath);
    if (!contentResult.success) {
      return failure(new ChangeError('proposal.md를 읽을 수 없습니다.'));
    }

    const parseResult = parseProposal(contentResult.data);
    if (!parseResult.success) {
      return failure(new ChangeError(`제안서 파싱 실패: ${parseResult.error.message}`));
    }

    const proposal = parseResult.data;
    const specsPath = path.join(sddPath, 'specs');

    // 의존성 그래프 구축
    const graphResult = await buildDependencyGraph(specsPath);
    if (!graphResult.success) {
      return failure(graphResult.error);
    }

    const graph = graphResult.data;
    const allAffected: AffectedSpec[] = [];
    const allTransitive: AffectedSpec[] = [];

    const allSpecs = await listSpecs(sddPath);

    // 각 영향 받는 스펙에 대해 분석
    for (const specPath of proposal.affectedSpecs) {
      const specRef = specPath.replace(/^specs\//, '').replace(/\/spec\.md$/, '');
      const specId = resolveSpecRef(allSpecs, specRef)?.id ?? specRef;
      const node = graph.nodes.get(specId);

      if (node) {
        // 직접 영향 받는 스펙
        for (const depId of node.dependedBy) {
          const depNode = graph.nodes.get(depId);
          if (!allAffected.some((a) => a.id === depId)) {
            allAffected.push({
              id: depId,
              path: depNode?.path || depId,
              title: depNode?.title,
              level: 'high',
              type: 'explicit',
              reason: `${specId} 변경으로 인한 영향`,
            });
          }
        }

        // 간접 영향
        const transitive = getTransitiveAffected(graph, specId);
        for (const t of transitive) {
          if (!allTransitive.some((a) => a.id === t.id)) {
            allTransitive.push(t);
          }
        }
      }
    }

    const totalImpact = allAffected.length + allTransitive.length;
    const riskLevel = getImpactLevel(Math.min(10, totalImpact * 2));

    const recommendations: string[] = [];
    if (totalImpact > 5) {
      recommendations.push('영향 범위가 넓습니다. 단계적 적용을 고려하세요.');
    }
    if (allAffected.length > 0) {
      recommendations.push(`${allAffected.length}개 스펙의 업데이트가 필요합니다.`);
    }
    recommendations.push('변경 후 sdd validate를 실행하세요.');

    return success({
      changeId,
      title: proposal.title,
      status: proposal.metadata.status,
      affectedSpecs: allAffected,
      transitiveAffected: allTransitive,
      totalImpact,
      riskLevel,
      recommendations,
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `변경 영향 분석 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * 영향도 리포트 포맷팅
 */
export function formatImpactReport(report: ImpactReport): string {
  const lines: string[] = [];

  lines.push('📊 프로젝트 의존성 리포트');
  lines.push(`생성: ${report.generatedAt}`);
  lines.push('');

  lines.push(`📈 통계`);
  lines.push(`  - 총 스펙 수: ${report.totalSpecs}`);
  lines.push(`  - 총 의존 관계: ${report.totalEdges}`);
  if (report.totalReferences) {
    lines.push(`  - 본문 참조 (의존성 아님): ${report.totalReferences}`);
  }
  const healthIcon = report.healthScore >= 80 ? '🟢' : report.healthScore >= 50 ? '🟡' : '🔴';
  lines.push(`  - 건강도 점수: ${report.healthScore}/100 ${healthIcon}`);
  lines.push('');

  if (report.mostConnectedSpecs.length > 0) {
    lines.push('🔗 핵심 스펙 (연결 수 기준):');
    for (const spec of report.mostConnectedSpecs) {
      lines.push(`  - ${spec.id}: 입력 ${spec.inbound}, 출력 ${spec.outbound}`);
    }
    lines.push('');
  }

  if (report.orphanSpecs.length > 0) {
    lines.push('⚠️  고립된 스펙 (연결 없음):');
    for (const spec of report.orphanSpecs) {
      lines.push(`  - ${spec}`);
    }
    lines.push('');
  }

  if (report.circularDependencies.length > 0) {
    lines.push('🔴 순환 의존성:');
    for (const cycle of report.circularDependencies) {
      lines.push(`  - ${cycle.description}`);
    }
    lines.push('');
  }

  lines.push('📝 요약');
  lines.push(report.summary);

  return lines.join('\n');
}

export { generateMermaidGraph };
