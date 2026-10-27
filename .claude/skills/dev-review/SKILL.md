---
name: dev-review
description: 구현된 코드가 스펙을 충족하는지 검증하고 코드 품질, 타입 안전성, 에러 처리를 검토합니다. 사용자가 "리뷰해줘", "코드 검토", "품질 확인", "review" 등을 요청할 때 사용합니다.
argument-hint: <spec-path>
allowed-tools: Read Glob Grep Bash(pnpm vitest *)
---

# 코드 리뷰

## Instructions

### 1. 스펙 대조 검증

구현된 코드가 스펙의 요구사항을 충족하는지 확인:
- 모든 Scenario가 테스트로 커버되는지
- RFC 2119 키워드(SHALL/MUST)가 모두 구현되었는지

### 2. 코드 품질 검사

- TypeScript 타입 안전성
- 에러 처리 완전성
- 코드 중복 여부
- 네이밍 컨벤션

### 3. 테스트 커버리지 확인

```bash
pnpm vitest run --coverage
```

### 4. 리뷰 결과 작성

- ✅ 통과 항목
- ⚠️ 개선 권장 항목
- ❌ 필수 수정 항목

## Examples

**사용자**: "auth/login 코드 리뷰해줘"

**응답**:
```
## 코드 리뷰: auth/login

### 스펙 충족도: 4/5 (80%)
- ✅ REQ-01: 이메일 로그인
- ✅ REQ-02: 비밀번호 검증
- ⚠️ REQ-03: 로그인 실패 횟수 제한 (미구현)

### 코드 품질
- ✅ 타입 안전성
- ⚠️ 에러 메시지 i18n 미적용
- ✅ 테스트 커버리지 85%

### 권장 사항
1. 로그인 실패 횟수 제한 기능 추가
2. 에러 메시지 국제화 적용
```
