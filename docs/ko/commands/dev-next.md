# dev-next (Skill)

다음 구현할 스펙을 추천하는 개발 스킬입니다.

> **Note**: 이것은 슬래시 커맨드가 아닌 **스킬**입니다. Claude가 작업 컨텍스트에 따라 자동으로 선택하여 사용합니다.

## 개요

`dev-next` 스킬은 의존성 그래프를 분석하여 다음에 구현할 스펙을 추천합니다. 의존성이 없거나 이미 충족된 스펙을 우선 제안합니다.

## 트리거 조건

Claude가 다음과 같은 요청을 받으면 자동으로 이 스킬을 사용합니다:

- "다음 뭐 해", "다음 작업", "뭐 구현할까"
- "next", "what's next"

## 사용 예시

```
User: 다음 뭐 구현할까?

Claude: 📋 다음 구현 추천

## 추천 스펙: core/validation

이유:
  - 의존성 없음 (독립 모듈)
  - 다른 3개 스펙이 이 모듈에 의존
  - 구현 난이도: 낮음

### 스펙 개요
입력 데이터 검증 유틸리티

### 주요 기능
- 이메일 형식 검증
- 비밀번호 규칙 검증
- 공통 검증 함수

### 의존 스펙 (이것을 기다리는 것)
- auth/login
- auth/registration
- user/profile

구현하시겠습니까?
```

## 전체 순서 표시

```
User: 전체 구현 순서 알려줘

Claude: 📊 전체 구현 순서

1. ⏳ core/validation (의존성 없음)
2. ⏳ core/types (의존성 없음)
3. ⏳ auth/token (← core/types)
4. ⏳ auth/login (← core/validation, auth/token)
5. ⏳ auth/registration (← auth/login)
6. ⏳ payment/checkout (← auth/login)

✅ 완료: 0개
⏳ 대기: 6개

추천: core/validation부터 시작
```

## 관련 스킬

- [`dev-implement`](/commands/dev-implement) - 스펙 구현
- [`dev-status`](/commands/dev-status) - 구현 현황
