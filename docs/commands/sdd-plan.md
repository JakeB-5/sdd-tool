# /sdd.plan

구현 계획을 수립합니다.

## 사용법

```
/sdd.plan [feature-id]
```

## 인수

| 인수 | 설명 |
|------|------|
| feature-id | 기능 ID (생략 시 최근 작성한 스펙) |

## 동작

AI가 기술적 구현 계획을 수립합니다:

1. 스펙 분석
2. 기술 결정사항 도출
3. 구현 단계(Phase) 정의
4. 리스크 분석

## 생성 파일

```
.sdd/specs/<feature-id>/plan.md
```

## 예시

```
/sdd.plan user-auth

AI: user-auth 스펙을 분석하여 구현 계획을 수립합니다.

    기술 결정사항:
    - JWT 라이브러리: jsonwebtoken
    - 비밀번호 해싱: bcrypt
    - 토큰 저장: httpOnly 쿠키

    구현 단계:
    1. 데이터 모델 정의
    2. 인증 서비스 구현
    3. API 엔드포인트 구현
    4. 미들웨어 구현
```

## 생성되는 plan.md

```markdown
---
spec_id: user-auth
created: 2025-12-24
---

# 구현 계획: user-auth

## 기술 결정사항

| 항목 | 선택 | 근거 |
|------|------|------|
| JWT 라이브러리 | jsonwebtoken | 널리 사용, 안정적 |
| 비밀번호 해싱 | bcrypt | 업계 표준 |

## 구현 단계

### Phase 1: 데이터 모델
- User 스키마 정의
- 마이그레이션 작성

### Phase 2: 인증 서비스
- 로그인 로직
- 토큰 생성/검증

## 리스크

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 토큰 탈취 | 높음 | 짧은 만료시간, refresh token |
```

## 다음 단계

계획 수립 후:

```
/sdd.tasks  → 작업 분해
```
