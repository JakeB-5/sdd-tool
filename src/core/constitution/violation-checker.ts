/**
 * Constitution 위반 검사 모듈
 *
 * 스펙 내용이 Constitution 원칙을 위반하는지 검사합니다.
 */
import { ParsedConstitution, compareVersions } from './schemas.js';

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
  /** 검사한 규칙 수 */
  rulesChecked: number;
}

/**
 * 금지 키워드 패턴
 * Constitution의 금지 사항에서 추출한 키워드를 스펙에서 검색
 */
interface ForbiddenPattern {
  /** 원본 금지 규칙 */
  rule: string;
  /** 검색할 키워드 패턴 */
  patterns: string[];
  /** 부정적 표현 (이것이 있으면 위반 아님) */
  negativePatterns: string[];
}

/**
 * Constitution 위반 검사
 *
 * NOTE: 키워드 기반 위반 검사는 false positive가 많아 비활성화됨
 * - "코드", "테스트" 같은 일반 단어가 위반으로 감지되는 버그
 * - 버전 호환성 검사만 유지
 * - 향후 명시적 패턴 기반 검사로 대체 예정
 */
export function checkConstitutionViolations(
  specContent: string,
  specConstitutionVersion: string | undefined,
  constitution: ParsedConstitution
): ConstitutionCheckResult {
  const violations: Violation[] = [];
  let rulesChecked = 0;

  // 1. 버전 불일치 검사 (유지)
  const versionMismatch = checkVersionMismatch(specConstitutionVersion, constitution.metadata.version);

  // 2. 금지 사항 규칙 수 카운트 (검사는 비활성화)
  rulesChecked += constitution.forbidden.length;

  // 3. 원칙 규칙 수 카운트 (검사는 비활성화)
  for (const principle of constitution.principles) {
    rulesChecked += principle.rules.length;
  }

  // NOTE: 키워드 기반 위반 검사 비활성화
  // - extractForbiddenPattern/checkForbiddenViolation 로직이 일반 단어를 위반으로 감지
  // - 향후 명시적 패턴 시스템으로 대체 시 재활성화

  // 4. 결과 반환 (버전 검사 결과만 반영)
  const hasVersionIssue = versionMismatch && versionMismatch.severity === 'critical';

  return {
    passed: !hasVersionIssue,
    violations,
    versionMismatch,
    rulesChecked,
  };
}

/**
 * 버전 불일치 검사
 */
function checkVersionMismatch(
  specVersion: string | undefined,
  constitutionVersion: string
): VersionMismatch | undefined {
  // 스펙에 버전이 없으면 경고
  if (!specVersion) {
    return {
      specVersion: '(없음)',
      constitutionVersion,
      severity: 'warning',
      message: `스펙에 constitution_version이 지정되지 않았습니다. 현재 Constitution 버전: ${constitutionVersion}`,
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
 * 금지 규칙에서 키워드 패턴 추출
 */
function extractForbiddenPattern(rule: string): ForbiddenPattern {
  const patterns: string[] = [];
  const negativePatterns: string[] = [];

  // SHALL NOT / MUST NOT 앞뒤의 내용 모두 추출
  const forbiddenMatch = rule.match(/(.+?)(?:SHALL\s+NOT|MUST\s+NOT)\s*(.+?)(?:\(|$)/i);

  if (forbiddenMatch) {
    const beforeKeyword = forbiddenMatch[1].trim();
    const afterKeyword = forbiddenMatch[2].trim();

    // 앞뒤 모두에서 핵심 키워드 추출
    const keywords = [
      ...extractKeywords(beforeKeyword),
      ...extractKeywords(afterKeyword),
    ];
    patterns.push(...keywords);
  } else {
    // 전체 규칙에서 키워드 추출 (폴백)
    patterns.push(...extractKeywords(rule));
  }

  // 부정적 패턴 (예: "암호화된", "해시된" 등은 위반이 아님)
  const safePatterns = [
    '암호화',
    '해시',
    'encrypt',
    'hash',
    'bcrypt',
    'argon2',
    '보안',
    'secure',
  ];
  negativePatterns.push(...safePatterns);

  return {
    rule,
    patterns,
    negativePatterns,
  };
}

/**
 * 텍스트에서 핵심 키워드 추출
 */
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];

  // 한글 키워드
  const koreanKeywords = text.match(/[가-힣]+/g) || [];
  keywords.push(...koreanKeywords.filter((k) => k.length >= 2));

  // 영문 키워드
  const englishKeywords = text.match(/[a-zA-Z]+/g) || [];
  keywords.push(...englishKeywords.filter((k) => k.length >= 3));

  // 불용어 제거
  const stopwords = ['을', '를', '이', '가', '는', '은', '에', '의', 'the', 'a', 'an', 'and', 'or', 'not'];
  return keywords.filter((k) => !stopwords.includes(k.toLowerCase()));
}

/**
 * 금지 규칙 위반 검사
 */
function checkForbiddenViolation(
  content: string,
  pattern: ForbiddenPattern,
  ruleId: string
): Violation | null {
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // 패턴 매칭
    for (const keyword of pattern.patterns) {
      const keywordLower = keyword.toLowerCase();

      if (lineLower.includes(keywordLower)) {
        // 부정적 패턴 확인 (안전한 표현이 있으면 위반 아님)
        const hasSafePattern = pattern.negativePatterns.some((safe) =>
          lineLower.includes(safe.toLowerCase())
        );

        if (!hasSafePattern) {
          return {
            ruleId,
            rule: pattern.rule,
            matchedContent: line.trim(),
            line: i + 1,
            severity: 'critical',
            message: `금지된 내용 발견: "${keyword}" - 규칙: ${pattern.rule}`,
          };
        }
      }
    }
  }

  return null;
}

/**
 * 위반 결과를 보기 좋은 형식으로 변환
 */
export function formatViolationReport(result: ConstitutionCheckResult): string {
  const lines: string[] = [];

  lines.push('=== Constitution 위반 검사 결과 ===');
  lines.push('');

  if (result.passed) {
    lines.push('✅ 검사 통과: 위반 사항 없음');
  } else {
    lines.push('❌ 검사 실패: 위반 사항 발견');
  }

  lines.push(`검사한 규칙 수: ${result.rulesChecked}`);
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
