/**
 * 기능 명세 생성기
 */
import { FeatureMetadata, FeatureStatus } from './schemas.js';
import { normalizeSpecStatus, type LegacySpecStatus } from '../spec/status.js';
import { readFrontmatter, stringifyFrontmatter, updateFrontmatter } from '../../utils/frontmatter.js';

/**
 * 명세 생성 옵션
 */
export interface GenerateSpecOptions {
  id: string;
  title: string;
  description: string;
  domain?: string;
  requirements?: string[];
  scenarios?: Array<{
    name: string;
    given: string;
    when: string;
    then: string;
  }>;
  depends?: string[];
  status?: FeatureStatus;
  constitutionVersion?: string;
}

/**
 * spec.md 파일 내용 생성
 */
export function generateSpec(options: GenerateSpecOptions): string {
  const today = new Date().toISOString().split('T')[0];
  const status = normalizeSpecStatus(options.status) ?? 'draft';

  // YAML is serialized (not interpolated) so quotes/colons in values stay valid
  let content = stringifyFrontmatter(
    {
      id: options.id,
      title: options.title,
      status,
      created: today,
      domain: options.domain || undefined,
      depends: options.depends?.length ? options.depends : null,
      constitution_version: options.constitutionVersion || undefined,
    },
    `
# ${options.title}`
  );

  content += `

> ${options.description}

---

## 개요

${options.description}

---

## 요구사항

`;

  if (options.requirements?.length) {
    options.requirements.forEach((req, index) => {
      content += `### REQ-${String(index + 1).padStart(2, '0')}: ${req.split(':')[0] || req}

${req}

`;
    });
  } else {
    content += `### REQ-01: [요구사항 제목]

[요구사항 상세 설명]
- 시스템은 [기능]을 지원해야 한다(SHALL)

`;
  }

  content += `---

## 시나리오

`;

  if (options.scenarios?.length) {
    options.scenarios.forEach((scenario, index) => {
      content += `### Scenario ${index + 1}: ${scenario.name}

- **GIVEN** ${scenario.given}
- **WHEN** ${scenario.when}
- **THEN** ${scenario.then}

`;
    });
  } else {
    content += `### Scenario 1: [시나리오명]

- **GIVEN** [전제 조건]
- **WHEN** [행동/트리거]
- **THEN** [예상 결과]

`;
  }

  content += `---

## 비기능 요구사항

### 성능

- 응답 시간: [N]ms 이내 (SHOULD)

### 보안

- [보안 요구사항] (SHALL)

---

## 제약사항

- [기술적 제약사항]
- [비즈니스 제약사항]

---

## 용어 정의

| 용어 | 정의 |
|------|------|
| [용어1] | [정의1] |
`;

  return content;
}

/**
 * 명세 메타데이터 파싱
 */
export function parseSpecMetadata(content: string): FeatureMetadata | null {
  const { data, hasFrontmatter } = readFrontmatter(content);
  if (!hasFrontmatter) {
    return null;
  }

  const optionalString = (value: unknown): string | undefined =>
    value === undefined || value === null ? undefined : String(value);

  let depends: string[] | null = null;
  if (Array.isArray(data.depends)) {
    depends = data.depends.map(String);
  } else if (typeof data.depends === 'string' && data.depends.trim() !== '') {
    depends = data.depends.split(',').map((d) => d.trim()).filter(Boolean);
  }

  // Legacy aliases are normalized; an unknown status is kept verbatim so
  // callers can display it (with the unknown-status icon) instead of hiding it.
  const status = normalizeSpecStatus(data.status) ?? optionalString(data.status) ?? 'draft';

  return {
    id: optionalString(data.id) as string,
    title: optionalString(data.title) as string,
    status: status as FeatureStatus,
    created: optionalString(data.created) as string,
    updated: optionalString(data.updated),
    branch: optionalString(data.branch),
    depends,
  };
}

/**
 * 명세 상태 업데이트 (항상 표준 상태로 기록)
 */
export function updateSpecStatus(
  content: string,
  newStatus: FeatureStatus | LegacySpecStatus
): string {
  const status = normalizeSpecStatus(newStatus);
  if (!status) {
    throw new Error(`유효하지 않은 상태입니다: ${newStatus}`);
  }

  const { hasFrontmatter, malformed } = readFrontmatter(content);
  if (!hasFrontmatter && !malformed) {
    return content;
  }

  // Throws on unclosed/invalid frontmatter instead of truncating the body
  const today = new Date().toISOString().split('T')[0];
  return updateFrontmatter(content, { status, updated: today });
}
