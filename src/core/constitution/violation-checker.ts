/**
 * Constitution 위반 검사 모듈
 *
 * 스펙 내용이 Constitution 원칙을 위반하는지 검사합니다.
 */
import { ParsedConstitution, compareVersions, normalizeVersion, parseVersion } from './schemas.js';

/**
 * 위반 심각도
 */
export type ViolationSeverity = 'critical' | 'warning' | 'info';

/**
 * 위반 항목
 */
export interface Violation {
  /** 위반 규칙 ID (예: P1, FORBIDDEN-1) */
  ruleId: string;
  /** 위반 규칙 설명 */
  rule: string;
  /** 스펙에서 위반한 내용 */
  matchedContent: string;
  /** 위반된 라인 번호 (1-indexed) */
  line?: number;
  /** 심각도 */
  severity: ViolationSeverity;
  /** 설명 */
  message: string;
}

/**
 * 버전 불일치 정보
 */
export interface VersionMismatch {
  specVersion: string;
  constitutionVersion: string;
  severity: ViolationSeverity;
  message: string;
}

/**
 * Constitution 검증 결과
 */
export interface ConstitutionCheckResult {
  /** 검증 통과 여부 */
  passed: boolean;
  /** 위반 항목 목록 */
  violations: Violation[];
  /** 버전 불일치 (있는 경우) */
  versionMismatch?: VersionMismatch;
  /** 현재 Constitution 버전 */
  constitutionVersion: string;
  /** 스펙에 constitution_version이 없어 버전 확인을 하지 못함 (정보) */
  specVersionMissing: boolean;
  /** 실제로 평가한 규칙 수 (키워드 규칙 검사가 비활성화되어 현재 0) */
  rulesChecked: number;
}

/**
 * Constitution 검사
 *
 * NOTE: 키워드 기반 위반 검사는 false positive가 많아 비활성화됨
 * - "코드", "테스트" 같은 일반 단어가 위반으로 감지되는 버그
 * - 현재는 버전 호환성만 확인하며, 평가하지 않은 규칙은 rulesChecked에 포함하지 않음
 * - 향후 명시적 패턴 기반 검사로 대체 예정
 */
export function checkConstitutionViolations(
  specContent: string,
  specConstitutionVersion: string | undefined,
  constitution: ParsedConstitution
): ConstitutionCheckResult {
  const violations: Violation[] = [];
  const constitutionVersion = constitution.metadata.version;

  const versionMismatch = specConstitutionVersion
    ? checkVersionMismatch(specConstitutionVersion, constitutionVersion)
    : undefined;

  return {
    passed: versionMismatch?.severity !== 'critical',
    violations,
    versionMismatch,
    constitutionVersion,
    specVersionMissing: !specConstitutionVersion,
    rulesChecked: 0,
  };
}

/**
 * 버전 불일치 검사
 */
function checkVersionMismatch(
  rawSpecVersion: string,
  constitutionVersion: string
): VersionMismatch | undefined {
  // Short forms (`1`, `1.2`) are compared as X.Y.Z; an unparseable version is never a silent pass
  const specVersion = normalizeVersion(rawSpecVersion);
  if (!specVersion || !parseVersion(constitutionVersion)) {
    return {
      specVersion: rawSpecVersion,
      constitutionVersion,
      severity: 'warning',
      message: !specVersion
        ? `constitution_version 형식을 해석할 수 없습니다: ${rawSpecVersion} (형식: X.Y.Z). 현재 Constitution 버전: ${constitutionVersion}`
        : `Constitution 버전 형식을 해석할 수 없습니다: ${constitutionVersion} (형식: X.Y.Z)`,
    };
  }

  // 버전 비교
  const comparison = compareVersions(specVersion, constitutionVersion);

  if (comparison < 0) {
    // 스펙 버전이 더 낮음 (Constitution이 업데이트됨)
    const parsed1 = specVersion.split('.').map(Number);
    const parsed2 = constitutionVersion.split('.').map(Number);

    // Major 버전이 다르면 critical
    if (parsed1[0] !== parsed2[0]) {
      return {
        specVersion,
        constitutionVersion,
        severity: 'critical',
        message: `Constitution Major 버전이 변경되었습니다 (${specVersion} → ${constitutionVersion}). 스펙 검토가 필요합니다.`,
      };
    }

    // Minor 버전이 다르면 warning
    if (parsed1[1] !== parsed2[1]) {
      return {
        specVersion,
        constitutionVersion,
        severity: 'warning',
        message: `Constitution Minor 버전이 변경되었습니다 (${specVersion} → ${constitutionVersion}). 새 원칙을 확인하세요.`,
      };
    }

    // Patch 버전만 다르면 info
    return {
      specVersion,
      constitutionVersion,
      severity: 'info',
      message: `Constitution Patch 버전이 변경되었습니다 (${specVersion} → ${constitutionVersion}).`,
    };
  }

  return undefined;
}

/**
 * 위반 결과를 보기 좋은 형식으로 변환
 */
export function formatViolationReport(result: ConstitutionCheckResult): string {
  const lines: string[] = [];

  lines.push('=== Constitution 검사 결과 ===');
  lines.push('');

  if (!result.passed) {
    lines.push('❌ 검사 실패');
  } else if (result.specVersionMissing) {
    lines.push(`ℹ️ 스펙에 constitution_version이 없어 버전 확인을 건너뜀 (현재 v${result.constitutionVersion})`);
  } else {
    lines.push(`✅ 검사 통과: Constitution 버전 확인 (v${result.constitutionVersion})`);
  }

  if (result.rulesChecked > 0) {
    lines.push(`검사한 규칙 수: ${result.rulesChecked}`);
  }
  lines.push('');

  // 버전 불일치
  if (result.versionMismatch) {
    const vm = result.versionMismatch;
    const icon = vm.severity === 'critical' ? '🔴' : vm.severity === 'warning' ? '🟡' : '🔵';
    lines.push(`${icon} 버전 불일치`);
    lines.push(`   스펙: ${vm.specVersion} → Constitution: ${vm.constitutionVersion}`);
    lines.push(`   ${vm.message}`);
    lines.push('');
  }

  // 위반 항목
  if (result.violations.length > 0) {
    lines.push('--- 위반 항목 ---');
    lines.push('');

    for (const v of result.violations) {
      const icon = v.severity === 'critical' ? '🔴' : v.severity === 'warning' ? '🟡' : '🔵';
      lines.push(`${icon} [${v.ruleId}] ${v.message}`);
      if (v.line) {
        lines.push(`   라인 ${v.line}: ${v.matchedContent}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
