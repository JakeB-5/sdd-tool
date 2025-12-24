/**
 * 매처 - 스펙 요구사항과 코드 참조 매칭
 */
import type {
  ExtractedRequirement,
  CodeReference,
  RequirementStatus,
  SyncResult,
  SpecSummary,
  CodeLocation,
} from './schemas.js';

export class SyncMatcher {
  /**
   * 스펙 요구사항과 코드 참조를 매칭하여 동기화 결과 생성
   */
  match(
    requirements: ExtractedRequirement[],
    codeRefs: CodeReference[],
    testRefs: CodeReference[]
  ): SyncResult {
    // 모든 참조 병합
    const allRefs = [...codeRefs, ...testRefs];

    // 요구사항별 상태 계산
    const requirementStatuses = this.calculateStatuses(requirements, allRefs);

    // 스펙별 요약 계산
    const specs = this.calculateSpecSummaries(requirements, requirementStatuses);

    // 고아 코드 찾기 (스펙에 없는 REQ-xxx 참조)
    const orphans = this.findOrphans(requirements, allRefs);

    // 전체 통계
    const implemented = requirementStatuses
      .filter(r => r.status === 'implemented')
      .map(r => r.id);
    const missing = requirementStatuses.filter(r => r.status === 'missing').map(r => r.id);

    const totalRequirements = requirements.length;
    const totalImplemented = implemented.length;
    const syncRate = totalRequirements > 0 ? (totalImplemented / totalRequirements) * 100 : 100;

    return {
      specs,
      requirements: requirementStatuses,
      syncRate: Math.round(syncRate * 100) / 100,
      implemented,
      missing,
      orphans,
      totalRequirements,
      totalImplemented,
    };
  }

  /**
   * 요구사항별 상태 계산
   */
  private calculateStatuses(
    requirements: ExtractedRequirement[],
    allRefs: CodeReference[]
  ): RequirementStatus[] {
    return requirements.map(req => {
      // 이 요구사항을 참조하는 코드/테스트 찾기
      const matchingRefs = allRefs.filter(ref => ref.reqId === req.id);

      // 코드와 테스트 분리
      const codeLocations: CodeLocation[] = matchingRefs.map(ref => ({
        file: ref.file,
        line: ref.line,
        type: ref.type,
        text: ref.context,
      }));

      // 상태 결정
      let status: RequirementStatus['status'];
      if (matchingRefs.length === 0) {
        status = 'missing';
      } else {
        const hasCode = matchingRefs.some(r => r.type === 'code');
        const hasTest = matchingRefs.some(r => r.type === 'test');
        // 코드와 테스트 모두 있으면 implemented, 하나만 있으면 partial
        status = hasCode || hasTest ? 'implemented' : 'missing';
      }

      return {
        id: req.id,
        specId: req.specId,
        title: req.title,
        keyword: req.keyword,
        status,
        locations: codeLocations,
      };
    });
  }

  /**
   * 스펙별 요약 계산
   */
  private calculateSpecSummaries(
    requirements: ExtractedRequirement[],
    statuses: RequirementStatus[]
  ): SpecSummary[] {
    // 스펙 ID별로 그룹화
    const specIds = [...new Set(requirements.map(r => r.specId))];

    return specIds.map(specId => {
      const specReqs = statuses.filter(s => s.specId === specId);
      const implementedCount = specReqs.filter(s => s.status === 'implemented').length;
      const missingCount = specReqs.filter(s => s.status === 'missing').length;
      const requirementCount = specReqs.length;
      const syncRate =
        requirementCount > 0 ? (implementedCount / requirementCount) * 100 : 100;

      // 스펙 제목 찾기 (첫 번째 요구사항에서)
      const firstReq = requirements.find(r => r.specId === specId);

      return {
        id: specId,
        title: firstReq?.title,
        requirementCount,
        implementedCount,
        missingCount,
        syncRate: Math.round(syncRate * 100) / 100,
      };
    });
  }

  /**
   * 고아 코드 찾기 (스펙에 없는 REQ-xxx 참조)
   */
  private findOrphans(
    requirements: ExtractedRequirement[],
    allRefs: CodeReference[]
  ): CodeLocation[] {
    const knownReqIds = new Set(requirements.map(r => r.id));
    const orphanRefs = allRefs.filter(ref => !knownReqIds.has(ref.reqId));

    // 중복 제거 (같은 파일의 같은 REQ-xxx)
    const seen = new Set<string>();
    return orphanRefs
      .filter(ref => {
        const key = `${ref.file}:${ref.reqId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(ref => ({
        file: ref.file,
        line: ref.line,
        type: ref.type,
        text: `${ref.reqId}: ${ref.context || ''}`,
      }));
  }
}
