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

**`depends` 문법:** `<domain>/<feature>` 형식 스펙 ID의 YAML 목록이며, 의존성이 없으면 `[]`입니다
(`sdd new`는 `depends: []`로 생성). 한 줄 목록(`depends: [pricing/cart, auth/session]`)과
블록 목록(`- pricing/cart`) 모두 허용하고, 이름이 유일하면 `<feature>`만 써도 됩니다.
`sdd impact`의 의존성(그래프 · 순환 · 건강도)은 `depends`로만 만들어집니다. 본문에서 다른 스펙을
`` `pricing/cart` ``, 링크, `specs/...` 경로로 언급하면 참조로만 보고하며 의존성으로 세지 않습니다.

### 2. RFC 2119 키워드

요구사항의 강도를 명확하게 표현:

- **SHALL/MUST**: 절대 필수
- **SHOULD**: 권장
- **MAY**: 선택
- **SHALL NOT**: 절대 금지

### 3. GIVEN-WHEN-THEN

시나리오를 검증 가능하게 작성:

- **GIVEN**: 전제 조건
- **WHEN**: 동작
- **THEN**: 예상 결과

## 가이드 목차

- [RFC 2119 키워드](/spec-writing/rfc2119)
- [GIVEN-WHEN-THEN](/spec-writing/given-when-then)
- [요구사항 작성](/spec-writing/requirements)
- [Constitution](/spec-writing/constitution)
