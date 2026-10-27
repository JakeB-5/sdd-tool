# /sdd-reverse

기존 코드베이스에서 스펙 초안을 작성합니다 (브라운필드 도입).

## 개요

`/sdd-reverse`는 AI가 주도합니다. AI가 코드를 읽고 스펙 초안을 작성하며, `sdd reverse` CLI는 결정적인 부분(구조 스캔, 리뷰 상태, 확정)을, `sdd validate`는 초안 검증을 담당합니다. 초안은 사용자가 승인한 후에만 정식 스펙이 됩니다.

```
스캔 -> 코드 읽기 -> 초안 작성 -> 검증 -> 리뷰(사용자 승인) -> 확정
```

## 사용법

```
/sdd-reverse [scan|review|finalize] [args]
```

Codex에서는 `$sdd-reverse`로 호출합니다. 인수 없이 실행하면 전체 흐름을 진행하고, 하위 명령을 주면 해당 단계로 바로 이동합니다.

## 규칙

- 초안에는 **관찰된 동작만** 적습니다. 코드가 구현하지 않는 요구사항을 만들어내지 않으며, 의도가 불분명한 부분(죽은 코드, 모호한 분기, 테스트 부재)은 추측하지 않고 "Uncertain: ..."으로 표시합니다.
- 초안은 `.sdd/.reverse-drafts/<domain>/<feature>/spec.md`에만 작성합니다. 스킬은 `.sdd/specs/`에 직접 쓰지 않으며, 그 일은 `sdd reverse finalize`가 합니다.
- `<domain>`과 `<feature>`는 kebab-case id입니다. frontmatter `id`는 `<feature>`와, `domain`(있다면)은 `<domain>`과 같아야 합니다.
- 사용자의 명시적 확인 없이는 초안을 승인하지 않습니다.

## 워크플로우

### 1. 스캔

```bash
sdd reverse scan --json                       # 프로젝트 전체
sdd reverse scan src/ --json                  # 하위 디렉토리
sdd reverse scan --json --exclude "**/*.test.ts" --language ts
```

JSON에는 요약(파일 수, 라인 수, 언어 분포), 도메인 후보(`id`, `path`, `files`, `lines`, `languages`), 어느 도메인에도 속하지 않은 소스 파일이 들어 있습니다. 후보는 디렉토리 기반이며, 코드상 더 나은 경계가 있으면 AI가 합치거나 나누거나 이름을 바꿉니다.

### 2. 코드 읽기

AI는 도메인별로 진입점, 공개 API, 라우트 핸들러, 데이터 모델, 검증 규칙, 에러 처리, 기존 테스트(의도된 동작의 가장 좋은 근거)를 읽고 동작을 기능 단위(기능당 스펙 하나)로 묶습니다.

### 3. 초안 작성

AI가 `/sdd-spec`과 같은 형식으로 `.sdd/.reverse-drafts/<domain>/<feature>/spec.md`를 작성합니다:

```markdown
---
id: invoice
title: Invoice
status: draft
created: 2026-10-27
domain: billing
depends: []
---

# Invoice

> Creates invoices for completed orders.

## Overview

기능 설명, 구현 파일(예: `src/billing/invoice.ts`), 의도가 불분명한 부분.

## Requirements

### REQ-01: Create invoice

The system SHALL create an invoice for every completed order.

## Scenarios

### Scenario 1: Completed order (REQ-01)

- **GIVEN** an order is completed
- **WHEN** the billing job runs
- **THEN** an invoice SHALL be created
```

- RFC 2119 키워드는 대문자로 씁니다 (SHALL, MUST, SHOULD, MAY와 그 부정형).
- 모든 초안에는 `### REQ-xx: 제목` 요구사항이 하나 이상, GIVEN/WHEN/THEN 시나리오가 하나 이상 있어야 합니다.
- 코드가 실제로 의존하는 경우에만 `depends`에 다른 스펙 id를 적습니다 (`depends: [<domain>/<feature>]`, 없으면 `[]`).
- `[요구사항 제목]` 같은 템플릿 플레이스홀더를 남기지 않습니다.

### 4. 검증

```bash
sdd validate .sdd/.reverse-drafts
```

AI가 모든 에러(가능하면 경고도)를 고치고 통과할 때까지 다시 실행합니다.

### 5. 리뷰

```bash
sdd reverse review --list                 # 모든 초안, 상태, 검증 결과
sdd reverse review <domain>/<feature>     # 초안 하나와 내용
```

AI가 각 초안(요구사항, 시나리오, 남은 불확실성)을 요약하고 어떤 것을 승인/수정/거부할지 묻습니다. 요청된 수정은 먼저 초안 파일에 반영됩니다.

### 6. 승인 / 거부 (사용자 확인 후)

```bash
sdd reverse review billing/invoice --approve
sdd reverse review billing/refund --reject --reason "covers two features"
```

검증 에러가 있는 초안은 승인할 수 없습니다. 승인은 초안 내용의 해시에 묶여 있어, 이후 파일이 바뀌면(CRLF → LF 정규화 포함) 대기 상태로 돌아가므로 다시 승인해야 합니다.

### 7. 확정

```bash
sdd reverse finalize                      # 승인된 초안 전부
sdd reverse finalize billing/invoice      # 승인된 초안 하나
sdd reverse finalize --force              # 기존 스펙 덮어쓰기 (스킬이 먼저 확인)
```

승인된 초안은 `.sdd/specs/<domain>/<feature>/spec.md`로 이동하고, 필요하면 도메인이 `.sdd/domains.yml`에 등록되며, 스펙이 도메인에 연결되고, 초안은 삭제됩니다. 기존 스펙은 `--force`가 있을 때만 덮어씁니다.

## 도구 권한

생성되는 스킬은 `Read`, `Glob`, `Grep`, `Write`, `Edit`, `Bash(sdd reverse *)`, `Bash(sdd validate *)`를 허용합니다. 진행 중에 사용자 승인을 받아야 하므로 별도 컨텍스트(fork)가 아닌 메인 대화에서 실행됩니다.

## 다음 단계

- 확정된 스펙 검증: `sdd validate .sdd/specs`
- `/sdd-domain`으로 도메인 조정
- 새 기능은 `/sdd-spec`으로 작성

## 관련 명령어

- [`sdd reverse`](/ko/cli/reverse) - CLI 레퍼런스
- [`/sdd-spec`](/ko/commands/sdd-spec) - 스펙 작성/수정
- [`/sdd-validate`](/ko/commands/sdd-validate) - 스펙 검증
