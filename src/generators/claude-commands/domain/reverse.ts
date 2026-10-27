/**
 * /sdd.reverse 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const reverseCommand: ClaudeCommand = {
  name: 'sdd.reverse',
  content: `기존 코드베이스에서 SDD 스펙 초안을 작성합니다 (브라운필드 도입).

## 개요

CLI는 결정적인 부분(구조 스캔, 초안 검증, 리뷰 상태, 확정)만 담당합니다.
**코드를 읽고 초안을 작성하는 것은 Claude의 역할입니다.** 초안은 사용자 승인 후에만 정식 스펙이 됩니다.

\`\`\`
scan → 코드 읽기 → 초안 작성 → validate → review (사용자 승인) → finalize
\`\`\`

## 규칙

- 코드에서 **관찰된 동작만** 기술합니다. 코드에 없는 요구사항을 만들어내지 마세요.
- 의도가 불분명하면 추측하지 말고 개요에 "불확실: ..."로 명시합니다.
- 초안은 \`.sdd/.reverse-drafts/<domain>/<feature>/spec.md\`에만 작성합니다. \`.sdd/specs/\`에 직접 쓰지 마세요.
- \`<domain>\`은 유효한 도메인 ID(영문 소문자로 시작, 소문자/숫자/하이픈)여야 하고, \`<feature>\`는 소문자/숫자/하이픈 형식이어야 합니다.
- frontmatter \`id\`는 \`<feature>\`와, \`domain\`(지정 시)은 \`<domain>\`과 같아야 합니다.
- 사용자 확인 없이 초안을 승인하지 마세요.

## 워크플로우

### 1. 스캔

\`\`\`bash
sdd reverse scan --json
sdd reverse scan src/ --json --exclude "**/*.test.ts" --language ts
\`\`\`

JSON에는 \`summary\`(파일 수, 라인 수, 언어 분포), \`domains[]\`(도메인 후보 \`id\`, \`path\`, \`files\`),
\`unassigned\`(도메인 미지정 소스 파일)가 포함됩니다. 도메인 후보는 디렉토리 기반이므로 필요하면 합치거나 나눕니다.

### 2. 코드 읽기

도메인별로 진입점, 공개 API, 데이터 모델, 검증/에러 처리, 기존 테스트를 Read/Glob/Grep으로 읽고
기능 단위(스펙 1개 = 기능 1개)로 묶습니다.

### 3. 초안 작성

\`.sdd/.reverse-drafts/<domain>/<feature>/spec.md\`를 \`sdd new\`와 같은 형식으로 작성합니다:

\`\`\`markdown
---
id: <feature>
title: <기능 제목>
status: draft
created: <YYYY-MM-DD>
domain: <domain>
depends: []
---

# <기능 제목>

> 코드가 하는 일 한 문장 요약

## 개요

구현 파일(예: \`src/auth/login.ts\`)과 동작 설명, 불확실한 부분

## 요구사항

### REQ-01: <요구사항 제목>

시스템은 <관찰된 동작>을 수행해야 한다(SHALL).

## 시나리오

### Scenario 1: <시나리오명>

- **GIVEN** <전제 조건>
- **WHEN** <행동>
- **THEN** <관찰된 결과>
\`\`\`

- RFC 2119 키워드는 대문자(SHALL, MUST, SHOULD, MAY)로 작성합니다.
- 요구사항 1개 이상, GIVEN/WHEN/THEN 시나리오 1개 이상이 필요합니다.

### 4. 검증 및 수정

\`\`\`bash
sdd validate .sdd/.reverse-drafts
\`\`\`

에러가 없어질 때까지 초안을 수정합니다.

### 5. 사용자에게 초안 제시

\`\`\`bash
sdd reverse review --list                 # 모든 초안, 상태, 검증 결과
sdd reverse review <domain>/<feature>     # 초안 상세
\`\`\`

초안별 요구사항/시나리오/불확실한 부분을 요약하고 승인·수정·거부 여부를 사용자에게 묻습니다.

### 6. 결정 기록 (사용자 확인 후에만)

\`\`\`bash
sdd reverse review <domain>/<feature> --approve
sdd reverse review <domain>/<feature> --reject --reason "<사유>"
\`\`\`

검증 에러가 있는 초안은 승인되지 않습니다. 승인은 초안 내용의 해시에 묶여 있어, 리뷰 후 파일이
조금이라도 바뀌면(CRLF → LF 같은 줄바꿈 정규화 포함) 다시 대기 상태가 됩니다.

### 7. 확정

\`\`\`bash
sdd reverse finalize                      # 승인된 모든 초안
sdd reverse finalize <domain>/<feature>   # 특정 초안
sdd reverse finalize --force              # 기존 스펙 덮어쓰기 (사용자 확인 후)
\`\`\`

승인된 초안을 \`.sdd/specs/<domain>/<feature>/spec.md\`로 이동하고, 필요하면 \`.sdd/domains.yml\`에
도메인을 등록하고 스펙을 연결한 뒤 초안을 삭제합니다. 기존 스펙은 \`--force\` 없이 덮어쓰지 않습니다.

## 다음 단계

- \`/sdd.validate\`로 확정된 스펙 검증
- \`/sdd.domain\`으로 도메인 조정
- \`/sdd.spec\`으로 새 기능 작성
`,
};
