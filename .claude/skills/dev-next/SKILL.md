---
name: dev-next
description: 의존성 그래프를 분석하여 다음 구현할 스펙을 추천합니다. 사용자가 "다음 뭐 해", "다음 작업", "뭐 구현할까", "next" 등을 요청할 때 사용합니다.
allowed-tools: Read Glob Grep
---

# 다음 구현 스펙 추천

## Instructions

### 1. 스펙 목록 스캔

`.sdd/specs/` 디렉토리에서 모든 스펙 파일을 찾습니다.

### 2. 상태 분석

각 스펙의 frontmatter에서 상태 확인 (`src/core/spec/status.ts`의 `SPEC_STATUSES` 기준):
- `status: draft` - 초안
- `status: review` - 검토 중
- `status: approved` - 승인됨
- `status: planned` - 계획 완료
- `status: tasked` - 작업 분해 완료
- `status: implementing` - 구현 중
- `status: implemented` - 구현 완료
- `status: deprecated` - 폐기됨

### 3. 의존성 그래프 분석

`depends` 필드를 확인하여:
- 의존성이 없는 스펙 우선
- 의존하는 스펙이 모두 구현된 스펙 추천
- 순환 의존성 감지 및 경고

### 4. 추천 결과 제시

우선순위에 따라 정렬:
1. 의존성 없음 + draft 상태
2. 의존성 해결됨 + draft 상태
3. 의존성 미해결 (블로킹 상태)

## Examples

**사용자**: "다음 뭐 구현하면 돼?"

**응답**:
```
## 다음 구현 추천

### 1순위: core/validation (의존성 없음)
- 상태: draft
- 설명: 입력 검증 유틸리티

### 2순위: auth/login (의존: core/validation)
- 상태: draft
- 설명: 사용자 로그인
- 블로커: core/validation 구현 필요

"core/validation 구현해줘" 라고 요청하세요.
```
