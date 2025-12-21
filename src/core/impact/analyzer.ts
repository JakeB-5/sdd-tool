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
} from './schemas.js';
import { buildDependencyGraph, generateMermaidGraph } from './graph.js';
import { success, failure, Result } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { directoryExists } from '../../utils/fs.js';

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
    const targetNode = graph.nodes.get(targetSpec);

    if (!targetNode) {
      return failure(new ChangeError(`스펙을 찾을 수 없습니다: ${targetSpec}`));
    }

    // 의존하는 스펙 (이 스펙이 사용하는)
    const dependsOn: AffectedSpec[] = targetNode.dependsOn.map((depId) => {
      const depNode = graph.nodes.get(depId);
      const edge = graph.edges.find((e) => e.from === targetSpec && e.to === depId);
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
      const edge = graph.edges.find((e) => e.from === depId && e.to === targetSpec);
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

    // 리스크 점수 계산
    const riskScore = calculateRiskScore(dependsOn, affectedBy);
    const riskLevel = getImpactLevel(riskScore);

    // 요약 및 권장사항 생성
    const summary = generateSummary(targetSpec, dependsOn, affectedBy, riskScore);
    const recommendations = generateRecommendations(affectedBy, riskLevel);

    return success({
      targetSpec,
      dependsOn,
      affectedBy,
      riskScore,
      riskLevel,
      summary,
      recommendations,
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `영향도 분석 실패: ${error instanceof Error ? error.message : String(error)}`
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

/**
 * 리스크 점수 계산
 */
function calculateRiskScore(
  dependsOn: AffectedSpec[],
  affectedBy: AffectedSpec[]
): number {
  let score = 0;

  // 직접 영향 받는 스펙 수
  const highImpactCount = affectedBy.filter((s) => s.level === 'high').length;
  const mediumImpactCount = affectedBy.filter((s) => s.level === 'medium').length;
  const lowImpactCount = affectedBy.filter((s) => s.level === 'low').length;

  score += highImpactCount * RISK_WEIGHTS.directDependency;
  score += mediumImpactCount * RISK_WEIGHTS.indirectDependency;
  score += lowImpactCount * 0.5;

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
  riskScore: number
): string {
  const parts: string[] = [];

  parts.push(`'${targetSpec}' 스펙 변경 시:`);

  if (dependsOn.length > 0) {
    parts.push(`- ${dependsOn.length}개 스펙에 의존함`);
  }

  if (affectedBy.length > 0) {
    parts.push(`- ${affectedBy.length}개 스펙에 영향을 줌`);

    const highCount = affectedBy.filter((s) => s.level === 'high').length;
    if (highCount > 0) {
      parts.push(`  - 높은 영향: ${highCount}개`);
    }
  }

  parts.push(`- 리스크 점수: ${riskScore}/10`);

  return parts.join('\n');
}

/**
 * 권장사항 생성
 */
function generateRecommendations(
  affectedBy: AffectedSpec[],
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
    lines.push('⚠️  영향 받는 스펙 (이 기능을 사용하는):');
    for (const affected of result.affectedBy) {
      const icon = affected.level === 'high' ? '🔴' : affected.level === 'medium' ? '🟡' : '🟢';
      lines.push(`  ├─ ${icon} ${affected.id} (${affected.type})`);
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

export { generateMermaidGraph };
