# GitHub Branch Protection 설정 가이드

SDD 프로젝트에 권장하는 브랜치 보호 규칙입니다.

## 설정 위치

Repository → Settings → Branches → Add branch protection rule

---

## main 브랜치 규칙

### Branch name pattern
```
main
```

### 권장 설정

#### Protect matching branches

- [x] **Require a pull request before merging**
  - [x] Require approvals: `2`
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners
  - [ ] Restrict who can dismiss pull request reviews

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Status checks:
    - `sdd-validate`
    - `sdd-lint` (있는 경우)

- [x] **Require conversation resolution before merging**

- [ ] **Require signed commits** (선택)

- [x] **Require linear history** (권장)

- [ ] **Require merge queue** (대규모 팀)

- [ ] **Require deployments to succeed** (CI/CD)

#### Rules applied to everyone including administrators

- [x] **Do not allow bypassing the above settings**

---

## constitution/* 브랜치 규칙

### Branch name pattern
```
constitution/*
```

### 권장 설정

- [x] **Require a pull request before merging**
  - [x] Require approvals: `3` (더 많은 리뷰어)
  - [x] Dismiss stale pull request approvals

- [x] **Require status checks to pass**
  - `sdd-validate`
  - `constitution-check` (있는 경우)

- [x] **Restrict who can push**
  - 팀 리드, 아키텍트만

---

## spec/* 브랜치 규칙 (선택)

작업 중인 스펙 브랜치는 보통 보호하지 않습니다.
필요한 경우 아래 규칙을 적용할 수 있습니다.

### Branch name pattern
```
spec/*
```

### 최소 설정 (선택)

- [ ] Require a pull request (불필요)
- [ ] Require status checks (불필요)
- [x] **Allow force pushes** (히스토리 정리용)
- [x] **Allow deletions** (병합 후 삭제)

---

## CODEOWNERS 설정

`.github/CODEOWNERS` 파일을 생성하여 도메인별 리뷰어를 지정합니다.

```
# SDD 스펙 파일 오너십

# 전역 스펙 관리자
.sdd/ @sdd-maintainers

# Constitution은 리드만
.sdd/constitution.md @tech-leads @architects

# 도메인별 오너
.sdd/specs/auth/ @security-team
.sdd/specs/billing/ @billing-team
.sdd/specs/core/ @core-team

# 도메인 설정
.sdd/domains.yml @sdd-maintainers
```

---

## 상태 체크 설정

### GitHub Actions 워크플로우

`.github/workflows/sdd-validate.yml` 파일이 있어야 상태 체크가 활성화됩니다.

```yaml
name: SDD Validate

on:
  pull_request:
    paths:
      - '.sdd/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install SDD
        run: npm install -g sdd-tool
      - name: Validate Specs
        run: sdd validate --ci
```

### 상태 체크 추가 방법

1. 워크플로우 실행 후 (최소 1번)
2. Settings → Branches → main 규칙 편집
3. "Require status checks" 섹션
4. 검색창에 `sdd-validate` 입력
5. 체크 추가

---

## 빠른 설정 체크리스트

### main 브랜치
- [ ] Require PR with 2 approvals
- [ ] Dismiss stale reviews
- [ ] Require status checks (sdd-validate)
- [ ] Require up-to-date branches
- [ ] Require linear history

### constitution/* 브랜치
- [ ] Require PR with 3 approvals
- [ ] Restrict push to leads only

### 추가 설정
- [ ] CODEOWNERS 파일 생성
- [ ] GitHub Actions 워크플로우 추가
- [ ] 자동 브랜치 삭제 활성화

---

## 문제 해결

### "Status check not found"

상태 체크가 보이지 않으면:
1. 워크플로우가 최소 1번 실행되어야 함
2. PR을 `.sdd/` 경로 변경으로 생성
3. 워크플로우 이름 확인 (`sdd-validate`)

### "Required reviews not satisfied"

리뷰 수가 부족하면:
1. 팀원에게 리뷰 요청
2. CODEOWNERS에 정의된 오너 확인
3. 본인 승인은 카운트 안 됨

### Force push 필요

보호된 브랜치에 force push가 필요하면:
1. 임시로 규칙 비활성화
2. 또는 새 브랜치에서 작업 후 PR
