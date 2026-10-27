# 스펙 작성 가이드

명세 기반 개발(SDD)의 스펙 작성 방법을 안내합니다.

## 스펙이란?

스펙(Specification)은 구현해야 할 기능의 요구사항과 시나리오를 정의한 문서입니다.

## 스펙 구조

```markdown
---
id: feature-id
title: "기능 제목"
status: draft
created: 2025-12-24
depends: []
constitution_version: 1.0.0
---

# 기능 제목

> 기능에 대한 간단한 설명

## 요구사항

### REQ-01: 요구사항 제목

- 시스템은 ... 해야 한다(SHALL)
- 시스템은 ... 해야 한다(SHOULD)

## 시나리오

### Scenario 1: 시나리오 제목

- **GIVEN** 전제 조건
- **WHEN** 동작
- **THEN** 예상 결과
```

## 핵심 요소

### 1. 메타데이터

```yaml
---
id: user-auth           # 고유 식별자
title: "사용자 인증"     # 제목
status: draft           # 상태
created: 2025-12-24     # 생성일
constitution_version: 1.0.0  # 헌법 버전
depends: [auth/session] # 의존하는 스펙 (없으면 [])
---
```

**`sdd validate`가 검사하는 것:** `created`(YYYY-MM-DD)만 검사하며, 없으면 경고입니다(`--strict`에서는 에러). 나머지 필드는
검증상 선택입니다(`sdd new`는 항상 씁니다). `status`를 생략하면 `draft`로 취급하고, `constitution_version`이 없는 스펙은
constitution 버전 검사를 건너뜁니다.

**`depends` 문법:** `<domain>/<feature>` 형식 스펙 ID의 YAML 목록이며, 의존성이 없으면 `[]`입니다
(`sdd new`는 `depends: []`로 생성). 한 줄 목록(`depends: [pricing/cart, auth/session]`)과
블록 목록(`- pricing/cart`) 모두 허용하고, 이름이 유일하면 `<feature>`만 써도 됩니다.
`sdd impact`의 의존성(그래프 · 순환 · 건강도)은 `depends`로만 만들어집니다. 본문에서 다른 스펙을
`` `pricing/cart` ``, 링크, `specs/...` 경로로 언급하면 참조로만 보고하며 의존성으로 세지 않습니다.

**`status` 값과 생애주기:** `draft` → `review` → `approved` → `planned` → `tasked` → `implementing` → `implemented`,
그리고 폐기된 스펙의 `deprecated`입니다 (레거시 `specified` / `completed`는 각각 `review` / `implemented`로 읽습니다).
frontmatter를 직접 고치지 말고 CLI로 바꾸세요:

```bash
sdd new status auth/user-auth implemented
# ✅ auth/user-auth 스펙 상태: implementing → implemented
```

`<feature>`는 `<domain>/<feature>` 또는 유일한 기능 이름입니다. `sdd status`는 상태를 자동으로 바꾸지 않고 기능별
다음 단계만 제안하며, 마지막 작업을 완료하면 `sdd new status <feature> implemented`를 제안합니다.

### 2. 요구사항 정의와 추적성

요구사항은 `### REQ-01: 제목` 헤딩으로 **정의**합니다(레벨 2~4. `REQ-01 제목`, `` `REQ-01`: 제목 ``,
`[REQ-01] 제목`도 인식). ID는 스펙 안에서 고유하며 스펙마다 `REQ-01`부터 다시 시작합니다. `sdd sync`는 헤딩으로
정의된 ID만 요구사항으로 세고, 본문 · 표에서 언급만 한 ID는 참조일 뿐입니다. REQ ID를 언급하지만 정의 헤딩이 없는
스펙은 경고를 받습니다.

코드와 테스트는 `@spec <domain>/<feature>#REQ-01`(예: `@spec auth/login#REQ-01`)로 요구사항을 참조합니다. 한정하지
않은 `REQ-01`은 그 ID를 가진 스펙이 정확히 하나일 때만 인정되므로 항상 한정해서 쓰세요. 커버리지는 `sdd sync`로
확인합니다 ([sdd sync](/ko/cli/sync) 참고).

### 3. RFC 2119 키워드

요구사항의 강도를 명확하게 표현:

- **SHALL/MUST**: 절대 필수
- **SHOULD**: 권장
- **MAY**: 선택
- **SHALL NOT**: 절대 금지

### 4. GIVEN-WHEN-THEN

시나리오를 검증 가능하게 작성:

- **GIVEN**: 전제 조건
- **WHEN**: 동작
- **THEN**: 예상 결과

## 가이드 목차

- [RFC 2119 키워드](/spec-writing/rfc2119)
- [GIVEN-WHEN-THEN](/spec-writing/given-when-then)
- [요구사항 작성](/spec-writing/requirements)
- [Constitution](/spec-writing/constitution)
