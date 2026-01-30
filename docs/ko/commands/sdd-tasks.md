# /sdd.tasks

작업을 실행 가능한 단위로 분해합니다.

## 사용법

```
/sdd.tasks [feature-id]
```

## 인수

| 인수 | 설명 |
|------|------|
| feature-id | 기능 ID (생략 시 최근 작성한 스펙) |

## 동작

AI가 구현 계획을 작업 단위로 분해합니다:

1. 계획 분석
2. 작업 정의
3. 의존성 설정
4. 우선순위 부여

## 생성 파일

```
.sdd/specs/<feature-id>/tasks.md
```

## 작업 크기 기준

- 2-4시간 내 완료 가능한 크기
- 명확한 완료 조건
- 테스트 가능

## 예시

```
/sdd.tasks user-auth

AI: user-auth 계획을 작업 단위로 분해합니다.
```

## 생성되는 tasks.md

```markdown
---
spec_id: user-auth
total_tasks: 8
completed: 0
---

# 작업 목록: user-auth

## Phase 1: 데이터 모델

- [ ] 🔴 T1: User 스키마 정의
  - 파일: src/models/user.ts
  - 의존성: 없음

- [ ] 🔴 T2: 마이그레이션 작성
  - 파일: migrations/001_users.sql
  - 의존성: T1

## Phase 2: 인증 서비스

- [ ] 🔴 T3: 비밀번호 해싱 유틸
  - 파일: src/utils/password.ts
  - 의존성: 없음

- [ ] 🔴 T4: JWT 서비스
  - 파일: src/services/jwt.ts
  - 의존성: 없음

- [ ] 🟡 T5: 로그인 서비스
  - 파일: src/services/auth.ts
  - 의존성: T1, T3, T4
```

## 우선순위

| 표시 | 우선순위 | 설명 |
|------|----------|------|
| 🔴 | HIGH | 즉시 처리 |
| 🟡 | MEDIUM | 다음 처리 |
| 🟢 | LOW | 나중에 처리 |

## 다음 단계

작업 분해 후:

```
/sdd.prepare    → 도구 점검
/sdd.implement  → 구현 시작
```
