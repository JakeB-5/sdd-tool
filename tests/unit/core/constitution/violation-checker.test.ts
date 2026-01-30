/**
 * Constitution 위반 검사 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  checkConstitutionViolations,
  formatViolationReport,
  type Violation,
  type ConstitutionCheckResult,
} from '../../../../src/core/constitution/violation-checker.js';
import { parseConstitution } from '../../../../src/core/constitution/parser.js';
import type { ParsedConstitution } from '../../../../src/core/constitution/schemas.js';

// 테스트용 Constitution
const testConstitutionContent = `---
version: 2.0.0
created: 2025-12-22
---

# Constitution: Test Project

> 테스트 프로젝트의 핵심 원칙

---

## 핵심 원칙

### 1. 보안

- 민감 데이터는 암호화해야 한다(SHALL)
- 평문 비밀번호를 저장해서는 안 된다(SHALL NOT)

### 2. 품질

- 테스트 커버리지는 80% 이상이어야 한다(SHOULD)
- 코드 중복을 최소화해야 한다(SHOULD)

---

## 금지 사항

- 프로덕션에서 console.log를 사용해서는 안 된다(SHALL NOT)
- 하드코딩된 시크릿을 코드에 포함해서는 안 된다(MUST NOT)
`;

// 테스트용 스펙 내용
const validSpecContent = `---
id: test-feature
title: "테스트 기능"
status: draft
constitution_version: 2.0.0
---

# 테스트 기능

## 요구사항

- 사용자 데이터를 암호화하여 저장한다(SHALL)
- 비밀번호는 bcrypt로 해시하여 저장한다(SHALL)
`;

const violatingSpecContent = `---
id: bad-feature
title: "문제가 있는 기능"
status: draft
constitution_version: 2.0.0
---

# 문제가 있는 기능

## 요구사항

- 비밀번호를 평문으로 저장한다(SHALL)
- console.log로 에러를 출력한다(SHALL)
`;

const oldVersionSpecContent = `---
id: old-feature
title: "이전 버전 기능"
status: draft
constitution_version: 1.0.0
---

# 이전 버전 기능

## 요구사항

- 데이터를 암호화한다(SHALL)
`;

const noVersionSpecContent = `---
id: no-version
title: "버전 없는 기능"
status: draft
---

# 버전 없는 기능

## 요구사항

- 정상적인 기능이다(SHALL)
`;

describe('checkConstitutionViolations', () => {
  let constitution: ParsedConstitution;

  // Constitution 파싱
  beforeAll(() => {
    const result = parseConstitution(testConstitutionContent);
    if (!result.success) {
      throw new Error('Failed to parse test constitution');
    }
    constitution = result.data;
  });

  it('위반이 없는 스펙은 통과한다', () => {
    const result = checkConstitutionViolations(
      validSpecContent,
      '2.0.0',
      constitution
    );

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.versionMismatch).toBeUndefined();
  });

  // NOTE: 키워드 기반 위반 검사가 비활성화됨 (false positive 버그로 인해)
  // 이제 버전 호환성만 검사하므로 violations 배열은 항상 비어있음
  it('키워드 기반 위반 검사는 비활성화되어 violations가 비어있다', () => {
    const result = checkConstitutionViolations(
      violatingSpecContent,
      '2.0.0',
      constitution
    );

    // 버전이 일치하므로 통과
    expect(result.passed).toBe(true);
    // 키워드 검사가 비활성화되어 violations 없음
    expect(result.violations).toHaveLength(0);
  });

  it('버전 불일치를 감지한다 (Major 변경)', () => {
    const result = checkConstitutionViolations(
      oldVersionSpecContent,
      '1.0.0',
      constitution
    );

    expect(result.versionMismatch).toBeDefined();
    expect(result.versionMismatch?.severity).toBe('critical');
    expect(result.versionMismatch?.specVersion).toBe('1.0.0');
    expect(result.versionMismatch?.constitutionVersion).toBe('2.0.0');
  });

  it('버전이 없는 스펙은 경고를 반환한다', () => {
    const result = checkConstitutionViolations(
      noVersionSpecContent,
      undefined,
      constitution
    );

    expect(result.versionMismatch).toBeDefined();
    expect(result.versionMismatch?.severity).toBe('warning');
    expect(result.versionMismatch?.specVersion).toBe('(없음)');
  });

  it('검사한 규칙 수를 반환한다', () => {
    const result = checkConstitutionViolations(
      validSpecContent,
      '2.0.0',
      constitution
    );

    // 금지 사항 + 원칙 내 SHALL NOT 규칙
    expect(result.rulesChecked).toBeGreaterThan(0);
  });

  // NOTE: 키워드 기반 위반 검사가 비활성화되어 라인 번호 반환 테스트는 제거
  it('키워드 검사 비활성화로 위반 라인 번호는 반환되지 않는다', () => {
    const result = checkConstitutionViolations(
      violatingSpecContent,
      '2.0.0',
      constitution
    );

    // 키워드 검사 비활성화로 violations 없음
    expect(result.violations).toHaveLength(0);
  });
});

describe('formatViolationReport', () => {
  it('통과한 결과를 포맷한다', () => {
    const result: ConstitutionCheckResult = {
      passed: true,
      violations: [],
      rulesChecked: 5,
    };

    const report = formatViolationReport(result);

    expect(report).toContain('✅ 검사 통과');
    expect(report).toContain('규칙 수: 5');
  });

  it('실패한 결과를 포맷한다', () => {
    const result: ConstitutionCheckResult = {
      passed: false,
      violations: [
        {
          ruleId: 'FORBIDDEN-1',
          rule: '평문 비밀번호 금지',
          matchedContent: '비밀번호를 평문으로 저장',
          line: 10,
          severity: 'critical',
          message: '금지된 내용 발견',
        },
      ],
      rulesChecked: 5,
    };

    const report = formatViolationReport(result);

    expect(report).toContain('❌ 검사 실패');
    expect(report).toContain('FORBIDDEN-1');
    expect(report).toContain('라인 10');
  });

  it('버전 불일치를 포맷한다', () => {
    const result: ConstitutionCheckResult = {
      passed: false,
      violations: [],
      versionMismatch: {
        specVersion: '1.0.0',
        constitutionVersion: '2.0.0',
        severity: 'critical',
        message: 'Major 버전 변경',
      },
      rulesChecked: 5,
    };

    const report = formatViolationReport(result);

    expect(report).toContain('버전 불일치');
    expect(report).toContain('1.0.0');
    expect(report).toContain('2.0.0');
  });
});

describe('version mismatch severity', () => {
  let constitution: ParsedConstitution;

  beforeAll(() => {
    const result = parseConstitution(testConstitutionContent);
    if (!result.success) {
      throw new Error('Failed to parse test constitution');
    }
    constitution = result.data;
  });

  it('Minor 버전 차이는 warning이다', () => {
    // Constitution version: 2.0.0, Spec version: 2.1.0 -> spec이 더 높으므로 불일치 없음
    // 반대로 테스트: Constitution 2.1.0, Spec 2.0.0
    const modifiedConstitution = {
      ...constitution,
      metadata: { ...constitution.metadata, version: '2.1.0' },
    };

    const result = checkConstitutionViolations(
      validSpecContent,
      '2.0.0',
      modifiedConstitution
    );

    expect(result.versionMismatch).toBeDefined();
    expect(result.versionMismatch?.severity).toBe('warning');
  });

  it('Patch 버전 차이는 info이다', () => {
    const modifiedConstitution = {
      ...constitution,
      metadata: { ...constitution.metadata, version: '2.0.1' },
    };

    const result = checkConstitutionViolations(
      validSpecContent,
      '2.0.0',
      modifiedConstitution
    );

    expect(result.versionMismatch).toBeDefined();
    expect(result.versionMismatch?.severity).toBe('info');
  });
});
