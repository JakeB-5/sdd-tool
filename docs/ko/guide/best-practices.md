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

- 요구사항은 `### REQ-01: 제목` 헤딩으로 **정의**하고, ID는 스펙 안에서 고유하게 유지합니다(스펙마다 `REQ-01`부터 시작).
- `sdd sync`는 헤딩으로 정의된 ID만 요구사항으로 셉니다. 본문에서 언급만 한 ID는 참조일 뿐입니다.
- 다른 스펙에 대한 의존성은 frontmatter `depends: [<domain>/<feature>]`(없으면 `[]`)로만 선언합니다.

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
### login-task-001: 데이터 모델 정의

- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **의존성:** 없음

### login-task-002: API 구현

- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **의존성:** login-task-001
```

### 3. 우선순위 표시

- 🔴 HIGH: 즉시 처리
- 🟡 MEDIUM: 다음 처리
- 🟢 LOW: 나중에 처리

### 4. 상태는 CLI로 갱신

작업 상태를 직접 고치지 말고 `sdd new task <feature> <task-id> in-progress|completed|blocked`를 사용하세요.
실행할 때마다 진행 상황 블록과 `completed:` / `total:`이 다시 계산됩니다. 모든 작업이 끝나면
`sdd validate` · `sdd sync` 후 `sdd new status <feature> implemented`로 스펙을 마무리합니다.

## 코드와 명세 동기화

### 1. @spec 주석 사용

```typescript
/**
 * @spec auth/login#REQ-01
 * 사용자 로그인 처리
 */
function login(email: string, password: string) {
  // ...
}
```

REQ 번호는 스펙마다 `REQ-01`부터 시작하므로 `<domain>/<feature>#REQ-xx`로 스펙을 한정해 쓰세요.
한정하지 않은 `REQ-xx`는 그 ID를 가진 스펙이 하나뿐일 때만 인정됩니다.

### 2. 정기적인 동기화 검사

```bash
sdd sync                        # 리포트만 (종료 코드 0)
sdd sync --ci --threshold 80    # 80% 미만이면 종료 코드 2
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

- [사용자 인증](/.sdd/specs/auth/user-auth/spec.md)
```

### 2. 변경 제안 프로세스

1. `/sdd-spec`으로 스펙 수정 제안
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
