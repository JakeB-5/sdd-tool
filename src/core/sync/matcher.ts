/**
 * 매처 - 스펙 요구사항과 코드 참조 매칭
 *
 * 참조 해석 규칙:
 * - `<spec>#REQ-xxx`: 해당 스펙의 REQ-xxx에만 매칭 (<spec>은 canonical id 또는 유일한 feature 이름)
 * - bare `REQ-xxx`: REQ-xxx를 가진 스펙이 하나뿐일 때만 매칭, 여러 스펙에 있으면 경고 후 무시
 * - 요구사항은 코드 또는 테스트 중 하나 이상에서 참조되면 implemented로 본다
 */
import type {
  ExtractedRequirement,
  CodeReference,
  RequirementStatus,
  SyncResult,
  SpecSummary,
  CodeLocation,
} from './schemas.js';

/**
 * 참조 해석 결과
 */
type RefResolution =
  | { kind: 'matched'; specId: string }
  | { kind: 'orphan' }
  | { kind: 'ambiguous'; candidates: string[] };

function requirementKey(specId: string, reqId: string): string {
  return `${specId}#${reqId}`;
}

export class SyncMatcher {
  /**
   * 스펙 요구사항과 코드 참조를 매칭하여 동기화 결과 생성
   *
   * @param allRequirements 참조 해석(모호성/고아 판정)에 사용할 전체 요구사항.
   *   특정 스펙만 검사할 때도 다른 스펙의 같은 REQ ID를 고려하도록 전달한다. 기본값은 requirements.
   */
  match(
    requirements: ExtractedRequirement[],
    codeRefs: CodeReference[],
    testRefs: CodeReference[],
    allRequirements: ExtractedRequirement[] = requirements
  ): SyncResult {
    // 모든 참조 병합
    const allRefs = [...codeRefs, ...testRefs];

    // 참조별 대상 스펙 해석
    const universe = [...allRequirements, ...requirements];
    const resolutions = allRefs.map((ref) => this.resolveRef(ref, universe));

    // 요구사항 키(spec#REQ)별 매칭 참조
    const refsByKey = new Map<string, CodeReference[]>();
    allRefs.forEach((ref, i) => {
      const resolution = resolutions[i];
      if (resolution.kind !== 'matched') return;
      const key = requirementKey(resolution.specId, ref.reqId);
      const list = refsByKey.get(key) ?? [];
      list.push(ref);
      refsByKey.set(key, list);
    });

    // 요구사항별 상태 계산
    const requirementStatuses = this.calculateStatuses(requirements, refsByKey);

    // 스펙별 요약 계산
    const specs = this.calculateSpecSummaries(requirements, requirementStatuses);

    // 고아 코드 찾기 (어느 스펙에도 없는 참조)
    const orphans = this.findOrphans(allRefs.filter((_, i) => resolutions[i].kind === 'orphan'));

    // 모호한 bare 참조 경고
    const warnings = this.collectAmbiguityWarnings(allRefs, resolutions);

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
      warnings,
    };
  }

  /**
   * 참조가 가리키는 스펙 해석
   */
  private resolveRef(ref: CodeReference, requirements: ExtractedRequirement[]): RefResolution {
    const specsWithReq = [
      ...new Set(requirements.filter(r => r.id === ref.reqId).map(r => r.specId)),
    ];

    if (ref.specRef) {
      const specRef = ref.specRef.replace(/^\/+|\/+$/g, '');
      const allSpecIds = [...new Set(requirements.map(r => r.specId))];
      const exact = allSpecIds.find(id => id === specRef);
      const byFeature = allSpecIds.filter(id => id.split('/').pop() === specRef);
      const specId = exact ?? (byFeature.length === 1 ? byFeature[0] : undefined);

      if (!specId) {
        return byFeature.length > 1
          ? { kind: 'ambiguous', candidates: byFeature }
          : { kind: 'orphan' };
      }
      return specsWithReq.includes(specId) ? { kind: 'matched', specId } : { kind: 'orphan' };
    }

    if (specsWithReq.length === 0) return { kind: 'orphan' };
    if (specsWithReq.length === 1) return { kind: 'matched', specId: specsWithReq[0] };
    return { kind: 'ambiguous', candidates: specsWithReq };
  }

  /**
   * 요구사항별 상태 계산
   */
  private calculateStatuses(
    requirements: ExtractedRequirement[],
    refsByKey: Map<string, CodeReference[]>
  ): RequirementStatus[] {
    return requirements.map(req => {
      // 이 요구사항(스펙 범위)을 참조하는 코드/테스트
      const matchingRefs = refsByKey.get(requirementKey(req.specId, req.id)) ?? [];

      const codeLocations: CodeLocation[] = matchingRefs.map(ref => ({
        file: ref.file,
        line: ref.line,
        type: ref.type,
        text: ref.context,
      }));

      // 코드 또는 테스트 중 하나 이상에서 참조되면 implemented
      const status: RequirementStatus['status'] =
        matchingRefs.length > 0 ? 'implemented' : 'missing';

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
   * 고아 코드 정리 (같은 파일의 같은 참조는 한 번만)
   */
  private findOrphans(orphanRefs: CodeReference[]): CodeLocation[] {
    const seen = new Set<string>();
    return orphanRefs
      .filter(ref => {
        const key = `${ref.file}:${ref.specRef ?? ''}#${ref.reqId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(ref => ({
        file: ref.file,
        line: ref.line,
        type: ref.type,
        text: `${ref.specRef ? `${ref.specRef}#` : ''}${ref.reqId}: ${ref.context || ''}`,
      }));
  }

  /**
   * 모호한 참조 경고 생성
   */
  private collectAmbiguityWarnings(
    refs: CodeReference[],
    resolutions: RefResolution[]
  ): string[] {
    const warnings = new Set<string>();
    refs.forEach((ref, i) => {
      const resolution = resolutions[i];
      if (resolution.kind !== 'ambiguous') return;
      const label = ref.specRef ? `${ref.specRef}#${ref.reqId}` : ref.reqId;
      warnings.add(
        `${ref.file}:${ref.line} - ${label} 참조가 여러 스펙(${resolution.candidates.join(', ')})에 해당하여 무시되었습니다. ` +
          `<domain>/<feature>#${ref.reqId} 형식으로 지정하세요.`
      );
    });
    return [...warnings];
  }
}
