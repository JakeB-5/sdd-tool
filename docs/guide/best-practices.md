# 모범 사례

SDD Tool을 효과적으로 사용하기 위한 모범 사례입니다.

## 명세 작성

### 1. RFC 2119 키워드 사용

| 키워드 | 의미 | 사용 시기 |
|--------|------|----------|
| **SHALL/MUST** | 절대 필수 | 핵심 기능, 보안 요구사항 |
| **SHOULD** | 권장 (예외 허용) | 사용자 경험 개선 |
| **MAY** | 선택적 | 부가 기능 |
| **SHALL NOT** | 절대 금지 | 보안 위반, 안티패턴 |

### 2. GIVEN-WHEN-THEN 작성

```markdown
### Scenario 1: 성공적인 로그인

- **GIVEN** 유효한 사용자 계정이 있을 때
- **WHEN** 올바른 이메일과 비밀번호로 로그인하면
- **THEN** JWT 토큰이 반환된다
- **AND** 토큰 만료 시간이 설정된다
```

### 3. 요구사항 ID 부여

```markdown
### REQ-01: 사용자 로그인

시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHALL).
```

## Constitution 작성

### 1. 명확한 원칙 정의

```markdown
## 핵심 원칙

- 사용자 데이터 보호가 최우선이다
- 성능보다 정확성이 중요하다
```

### 2. 기술 제약 명시

```markdown
## 기술 원칙

- TypeScript 엄격 모드 사용
- 모든 함수에 타입 정의 필수
```

### 3. 금지 사항 목록

```markdown
## 금지 사항

- any 타입 사용 금지
- 외부 의존성 무분별한 추가 금지
```

## 작업 분해

### 1. 적절한 크기

- 2-4시간 내 완료 가능한 크기
- 너무 크면 분할, 너무 작으면 병합

### 2. 의존성 명시

```markdown
- [ ] Task 1: 데이터 모델 정의
- [ ] Task 2: API 구현 (depends on: Task 1)
- [ ] Task 3: UI 구현 (depends on: Task 2)
```

### 3. 우선순위 표시

- 🔴 HIGH: 즉시 처리
- 🟡 MEDIUM: 다음 처리
- 🟢 LOW: 나중에 처리

## 코드와 명세 동기화

### 1. @spec 주석 사용

```typescript
/**
 * @spec REQ-01
 * 사용자 로그인 처리
 */
function login(email: string, password: string) {
  // ...
}
```

### 2. 정기적인 동기화 검사

```bash
sdd sync
```

### 3. 변경 시 명세 먼저 수정

1. 명세 수정
2. 변경 영향도 분석
3. 코드 수정
4. 검증

## 팀 협업

### 1. PR에 명세 링크 포함

```markdown
## 관련 명세

- [사용자 인증](/.sdd/specs/auth/spec.md)
```

### 2. 변경 제안 프로세스

1. `/sdd.change`로 변경 제안
2. 팀 리뷰
3. 승인 후 적용

### 3. Constitution 버전 관리

명세에 `constitution_version` 포함:

```yaml
---
id: feature-x
constitution_version: 1.0.0
---
```
