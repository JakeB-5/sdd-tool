/**
 * domain.md 템플릿 생성
 * 도메인 개요 문서 템플릿
 */

import type { DomainInfo } from '../schemas/domains.schema.js';

/**
 * domain.md 템플릿 옵션
 */
export interface DomainTemplateOptions {
  /** 도메인 ID */
  id: string;
  /** 도메인 설명 */
  description: string;
  /** 소스 코드 경로 */
  path?: string;
  /** 의존하는 도메인 (uses) */
  uses?: string[];
  /** 확장하는 도메인 (extends) */
  extends?: string[];
  /** 구현하는 인터페이스 도메인 (implements) */
  implements?: string[];
  /** 소유자 */
  owner?: string;
  /** 태그 */
  tags?: string[];
}

/**
 * domain.md 템플릿 생성
 */
export function generateDomainMd(options: DomainTemplateOptions): string {
  const today = new Date().toISOString().split('T')[0];
  const uses = options.uses ?? [];
  const extendsArr = options.extends ?? [];
  const implementsArr = options.implements ?? [];

  const hasDependencies = uses.length > 0 || extendsArr.length > 0 || implementsArr.length > 0;

  let content = `---
id: ${options.id}
created: ${today}
---

# 도메인: ${options.id}

> ${options.description}

---

## 개요

### 범위 및 책임

이 도메인은 다음을 담당합니다:

- (책임 1 설명)
- (책임 2 설명)

### 경계 정의

- **포함**: (이 도메인이 다루는 것)
- **제외**: (이 도메인이 다루지 않는 것)

`;

  // 소스 경로
  if (options.path) {
    content += `### 소스 경로

\`${options.path}\`

`;
  }

  // 의존성 섹션
  content += `---

## 의존성

`;

  if (!hasDependencies) {
    content += `이 도메인은 다른 도메인에 의존하지 않습니다.

`;
  } else {
    if (uses.length > 0) {
      content += `### Uses (사용)

${uses.map((d) => `- \`${d}\`: (사용 목적 설명)`).join('\n')}

`;
    }

    if (extendsArr.length > 0) {
      content += `### Extends (확장)

${extendsArr.map((d) => `- \`${d}\`: (확장 내용 설명)`).join('\n')}

`;
    }

    if (implementsArr.length > 0) {
      content += `### Implements (구현)

${implementsArr.map((d) => `- \`${d}\`: (구현 인터페이스 설명)`).join('\n')}

`;
    }
  }

  // 스펙 목록 섹션
  content += `---

## 스펙 목록

이 도메인에 속한 기능 명세:

| 스펙 ID | 상태 | 설명 |
|---------|------|------|
| (스펙이 추가되면 여기에 표시됩니다) | - | - |

---

## 공개 인터페이스

다른 도메인에서 사용할 수 있는 공개 API/인터페이스:

### 제공하는 기능

- (공개 기능 1)
- (공개 기능 2)

### 제공하는 타입/인터페이스

- (공개 타입 1)
- (공개 타입 2)

---

## 비고

`;

  // 소유자 정보
  if (options.owner) {
    content += `- **소유자**: ${options.owner}
`;
  }

  // 태그
  if (options.tags && options.tags.length > 0) {
    content += `- **태그**: ${options.tags.map((t) => `\`${t}\``).join(', ')}
`;
  }

  content += `
(추가 참고사항이나 설계 결정 배경 등)
`;

  return content;
}

/**
 * DomainInfo에서 템플릿 옵션 생성
 */
export function domainInfoToTemplateOptions(info: DomainInfo): DomainTemplateOptions {
  return {
    id: info.id,
    description: info.description,
    path: info.path,
    uses: info.dependencies.uses,
    extends: info.dependencies.extends,
    implements: info.dependencies.implements,
    owner: info.owner,
    tags: info.tags,
  };
}

/**
 * 기본 도메인 템플릿 생성 (빈 템플릿)
 */
export function generateDefaultDomainMd(domainId: string): string {
  return generateDomainMd({
    id: domainId,
    description: '도메인 설명을 입력하세요',
  });
}
