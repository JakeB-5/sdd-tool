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
---
```

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
