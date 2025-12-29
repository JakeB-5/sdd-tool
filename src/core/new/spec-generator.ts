/**
 * 기능 명세 생성기
 */
import { FeatureMetadata, FeatureStatus } from './schemas.js';

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
  const status = options.status || 'draft';
  const depends = options.depends?.length ? `\n  - ${options.depends.join('\n  - ')}` : 'null';
  const domainLine = options.domain ? `\ndomain: ${options.domain}` : '';
  const constitutionLine = options.constitutionVersion
    ? `\nconstitution_version: ${options.constitutionVersion}`
    : '';

  let content = `---
id: ${options.id}
title: "${options.title}"
status: ${status}
created: ${today}${domainLine}
depends: ${depends}${constitutionLine}
---

# ${options.title}

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
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  const lines = frontmatter.split('\n');
  const metadata: Record<string, unknown> = {};

  let currentKey = '';
  let isArray = false;
  const arrayItems: string[] = [];

  for (const line of lines) {
    if (line.startsWith('  - ')) {
      if (isArray) {
        arrayItems.push(line.replace('  - ', '').trim());
      }
    } else {
      if (isArray && currentKey) {
        metadata[currentKey] = arrayItems.length > 0 ? [...arrayItems] : null;
        arrayItems.length = 0;
        isArray = false;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();

        if (value === '' || value === '|') {
          currentKey = key;
          isArray = true;
        } else if (value === 'null') {
          metadata[key] = null;
        } else if (value.startsWith('"') && value.endsWith('"')) {
          metadata[key] = value.slice(1, -1);
        } else {
          metadata[key] = value;
        }
      }
    }
  }

  if (isArray && currentKey) {
    metadata[currentKey] = arrayItems.length > 0 ? arrayItems : null;
  }

  return {
    id: metadata.id as string,
    title: metadata.title as string,
    status: metadata.status as FeatureStatus,
    created: metadata.created as string,
    updated: metadata.updated as string | undefined,
    branch: metadata.branch as string | undefined,
    depends: metadata.depends as string[] | null,
  };
}

/**
 * 명세 상태 업데이트
 */
export function updateSpecStatus(content: string, newStatus: FeatureStatus): string {
  const today = new Date().toISOString().split('T')[0];

  let updated = content.replace(
    /^(---\n[\s\S]*?)status:\s*\w+/m,
    `$1status: ${newStatus}`
  );

  if (updated.includes('updated:')) {
    updated = updated.replace(
      /updated:\s*[\d-]+/,
      `updated: ${today}`
    );
  } else {
    updated = updated.replace(
      /(status:\s*\w+)/,
      `$1\nupdated: ${today}`
    );
  }

  return updated;
}
