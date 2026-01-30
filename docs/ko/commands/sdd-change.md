# /sdd.change

::: warning Deprecated
이 커맨드는 `/sdd.spec`으로 대체되었습니다.  
`/sdd.spec`은 새 기능 작성과 기존 스펙 수정을 자동으로 판단하여 적절한 워크플로우로 안내합니다.
:::

기존 스펙의 변경을 제안합니다.

## 사용법

```
/sdd.change <스펙 ID> [변경 사유]
```

## 인수

| 인수 | 설명 |
|------|------|
| 스펙 ID | 변경할 스펙의 ID |
| 변경 사유 | 변경이 필요한 이유 (선택) |

## 동작

AI가 대화를 통해 변경 제안을 작성합니다:

1. 기존 스펙 분석
2. 변경 범위 파악
3. 델타(ADDED/MODIFIED/REMOVED) 생성
4. 영향도 분석

## 생성 파일

```
.sdd/changes/<change-id>/
├── proposal.md      # 변경 제안서
├── delta.md         # 변경 내용 (ADDED/MODIFIED/REMOVED)
└── impact.md        # 영향도 분석
```

## 예시

```
/sdd.change user-auth OAuth 로그인 추가

AI: user-auth 스펙의 변경 제안을 작성합니다.
    현재 스펙을 분석 중...

    기존 요구사항:
    - REQ-01: 이메일/비밀번호 로그인

    추가될 요구사항:
    - REQ-02: Google OAuth 로그인
    - REQ-03: GitHub OAuth 로그인
```

## 다음 단계

변경 제안 작성 후:

```
sdd change validate <change-id>  → 제안 검증
sdd change apply <change-id>     → 변경 적용
```
