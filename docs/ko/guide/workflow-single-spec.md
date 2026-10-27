# 단일 스펙 변경 워크플로우

하나의 스펙을 생성하거나 수정할 때의 워크플로우입니다.

## 개요

```
브랜치 생성 → 스펙 작성 → 검증 → 커밋 → PR → 리뷰 → 병합
```

---

## 단계별 가이드

### 1. 브랜치 생성

```bash
# main에서 새 브랜치 생성
git checkout main
git pull origin main
git checkout -b spec/auth/user-login
```

### 2. 스펙 작성

```bash
# 방금 만든 브랜치에서 새 스펙 생성
sdd new auth/user-login --no-branch

# 또는 기존 스펙 수정
# .sdd/specs/auth/user-login/spec.md 편집
```

`sdd new`는 없는 도메인을 자동으로 만들고, **`--no-branch`를 주지 않으면** 자체적으로 `feature/<id>` 브랜치를 만들어
전환합니다. 1단계에서 작업 브랜치를 이미 만들었으므로 여기서는 `--no-branch`를 쓰세요(또는 1단계를 건너뛰고
`sdd new`가 브랜치를 만들게 해도 됩니다). `--all`을 붙이면 plan.md, tasks.md, checklist.md도 함께 만들며, 기존 파일은
`--force` 없이는 덮어쓰지 않습니다.

### 3. 로컬 검증

```bash
# 스펙 하나 검증 (validate는 경로를 받습니다)
sdd validate .sdd/specs/auth/user-login/spec.md

# 전체 검증
sdd validate

# Constitution 준수 확인
sdd validate --constitution
```

### 4. 커밋

```bash
# 변경 파일 확인
git status

# 스테이징
git add .sdd/specs/auth/user-login/

# 커밋 (컨벤션 준수)
git commit -m "spec(auth/user-login): add user login specification

이메일/비밀번호 기반 로그인 명세:
- 입력 검증 규칙
- 세션 생성 정책
- 실패 시나리오 정의

Depends-On: core/user-model"
```

### 5. 푸시

```bash
git push -u origin spec/auth/user-login
```

### 6. PR 생성

```bash
# GitHub CLI 사용
gh pr create \
  --title "spec(auth): user-login specification" \
  --body "## 개요
사용자 로그인 기능 명세

## 변경 내용
- 새 스펙: auth/user-login

## 체크리스트
- [x] sdd validate 통과
- [x] 의존성 명시
- [ ] 리뷰어 승인"
```

### 7. 리뷰 & 수정

리뷰 피드백 반영:

```bash
# 수정
# spec.md 편집

# 재검증
sdd validate .sdd/specs/auth/user-login/spec.md

# 추가 커밋
git add .
git commit -m "spec-update(auth/user-login): address review feedback

- REQ-003 명확화
- 시나리오 2 수정"

git push
```

### 8. 병합

PR 승인 후:

```bash
# GitHub에서 Squash and merge
# 또는 CLI로
gh pr merge --squash
```

### 9. 정리

```bash
# 로컬 브랜치 삭제
git checkout main
git pull
git branch -d spec/auth/user-login
```

---

## 전체 명령어 요약

```bash
# 1. 브랜치 생성
git checkout main && git pull
git checkout -b spec/auth/user-login

# 2. 스펙 작성
sdd new auth/user-login --no-branch

# 3. 검증
sdd validate .sdd/specs/auth/user-login/spec.md

# 4. 커밋 & 푸시
git add .sdd/specs/auth/user-login/
git commit -m "spec(auth/user-login): add user login specification"
git push -u origin spec/auth/user-login

# 5. PR
gh pr create --title "spec(auth): user-login"

# 6. 병합 후 정리
gh pr merge --squash
git checkout main && git pull
git branch -d spec/auth/user-login
```

---

## 모범 사례

### 스펙 작성

- **한 스펙 = 한 기능**: 범위를 명확하게
- **의존성 명시**: frontmatter `depends` 필드 사용 (`depends: [core/user-model]`, 없으면 `[]`). 본문에서 다른 스펙을 언급하는 것은 의존성이 아님
- **GIVEN-WHEN-THEN**: 시나리오는 구체적으로

### 커밋

- **작은 단위**: 논리적 변경 단위로
- **컨벤션 준수**: `spec(scope): message` 형식
- **본문 활용**: 변경 이유 설명

### 리뷰

- **자가 검증**: PR 전 `sdd validate`
- **설명 포함**: PR 본문에 맥락 제공
- **빠른 반응**: 피드백에 신속하게 대응

---

## 문제 해결

### 검증 실패

```bash
# 오류 확인
sdd validate .sdd/specs/auth/user-login/spec.md

# 일반적인 원인:
# - 대문자 SHALL/MUST/SHOULD 키워드 누락
# - 채우지 않은 템플릿 플레이스홀더 ([요구사항 제목], {{...}})
# - GIVEN-WHEN-THEN 형식 오류
# - 의존성 스펙 미존재
```

### 커밋 훅 실패

```bash
# 커밋 메시지 형식 확인
# 올바른 형식: spec(auth/user-login): message

# 훅 우회 (권장하지 않음)
git commit --no-verify
```

### 충돌 발생

```bash
# main 최신화
git fetch origin
git rebase origin/main

# 충돌 해결 후
sdd validate .sdd/specs/auth/user-login/spec.md
git add .
git rebase --continue
```

---

## 관련 문서

- [커밋 컨벤션](./commit-convention.md)
- [브랜치 전략](./branch-strategy.md)
- [다중 스펙 워크플로우](./workflow-bundle-spec.md)
