# 브랜치 전략

SDD 프로젝트에서 권장하는 Git 브랜치 전략입니다.

## 브랜치 구조

```
main (또는 master)
  │
  ├── spec/auth/user-login        # 개별 스펙 작업
  ├── spec/billing/subscription
  │
  ├── spec-bundle/q1-features     # 관련 스펙 묶음
  │
  └── constitution/v2.0           # Constitution 변경
```

---

## 브랜치 명명 규칙

### 패턴

| 패턴 | 용도 | 예시 |
|------|------|------|
| `spec/<domain>/<name>` | 개별 스펙 | `spec/auth/user-login` |
| `spec-bundle/<name>` | 스펙 묶음 | `spec-bundle/payment-v2` |
| `constitution/<version>` | Constitution | `constitution/v2.0` |
| `sdd-infra/<name>` | SDD 설정/구조 | `sdd-infra/add-billing-domain` |

### 규칙

- **영문 소문자**만 사용
- **하이픈**(`-`)으로 단어 구분
- **슬래시**(`/`)로 계층 구분
- 간결하고 **설명적인** 이름

### 예시

```bash
# 좋은 예
spec/auth/user-login
spec/billing/subscription-management
spec-bundle/payment-system-v2
constitution/v2.0

# 피해야 할 예
spec/UserLogin          # 대문자
spec_auth_login         # 언더스코어
spec/auth/login/oauth   # 너무 깊은 계층
```

---

## 워크플로우

### 기본 흐름

```
1. 브랜치 생성
   main ──→ spec/auth/user-login

2. 스펙 작성 & 리뷰
   spec/auth/user-login에서 작업
   PR 생성 → 리뷰 → 승인

3. 병합
   spec/auth/user-login ──→ main
   (squash merge 권장)

4. 브랜치 삭제
   spec/auth/user-login 삭제
```

### 브랜치 생성

```bash
# 개별 스펙
git checkout -b spec/auth/user-login

# 스펙 묶음 (여러 관련 스펙)
git checkout -b spec-bundle/payment-v2

# Constitution 변경
git checkout -b constitution/v2.0

# SDD 설정 변경
git checkout -b sdd-infra/add-billing-domain
```

### 병합

```bash
# Squash merge 권장 (깔끔한 히스토리)
git checkout main
git merge --squash spec/auth/user-login
git commit

# 또는 GitHub PR에서 Squash and merge
```

---

## 보호 규칙

### main 브랜치

```yaml
# GitHub Branch Protection
main:
  # 필수 리뷰
  required_reviews: 2
  dismiss_stale_reviews: true

  # 필수 상태 체크
  required_status_checks:
    - sdd-validate
    - sdd-lint

  # 직접 푸시 금지
  allow_force_push: false
  allow_deletions: false
```

### spec/* 브랜치

```yaml
# 스펙 브랜치는 자유롭게
spec/*:
  required_reviews: 0    # 작업 중엔 리뷰 불필요
  allow_force_push: true # 히스토리 정리 허용
```

### constitution/* 브랜치

```yaml
# Constitution은 엄격하게
constitution/*:
  required_reviews: 3           # 더 많은 리뷰어
  required_reviewers:
    - tech-leads
    - architects
  allow_force_push: false
```

---

## GitHub 설정 방법

### Branch Protection Rules

1. **Settings** → **Branches** → **Add rule**
2. **Branch name pattern**: `main`
3. 옵션 설정:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (2)
   - ✅ Dismiss stale pull request approvals
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

### 상태 체크 추가

1. **Settings** → **Branches** → `main` 규칙 편집
2. **Require status checks to pass** 활성화
3. 체크 추가:
   - `sdd-validate`
   - `sdd-lint` (있는 경우)

---

## 브랜치별 권장 사항

### spec/* (개별 스펙)

- **수명**: 짧게 (1-3일)
- **커밋**: 자유롭게, 마지막에 squash
- **리뷰**: PR에서 진행
- **병합 후**: 삭제

```bash
# 작업 시작
git checkout -b spec/auth/mfa-setup

# 작업 중 (여러 커밋 OK)
git commit -m "wip: mfa 초안"
git commit -m "wip: 시나리오 추가"
git commit -m "wip: 요구사항 정리"

# PR 생성 후 squash merge
```

### spec-bundle/* (스펙 묶음)

- **수명**: 중간 (1-2주)
- **용도**: 관련된 여러 스펙을 함께 작업
- **커밋**: 스펙별로 구분
- **리뷰**: 전체 묶음 리뷰

```bash
# Breaking Change가 있는 경우
git checkout -b spec-bundle/payment-v2

# 관련 스펙들 작업
git commit -m "spec(billing/payment-gateway-v2): add new PG spec"
git commit -m "spec-update(billing/checkout): update payment flow"
git commit -m "spec(billing/refund-v2): add refund policy"
```

### constitution/* (Constitution)

- **수명**: 중간 (리뷰 기간)
- **용도**: 프로젝트 원칙 변경
- **커밋**: 신중하게
- **리뷰**: 전체 팀 필수

```bash
# Constitution 변경
git checkout -b constitution/v2.0

# 변경 및 버전 업데이트
# constitution.md 수정

# 영향 분석
sdd validate --constitution

# 상세한 커밋 메시지
git commit -m "constitution: v2.0 - add API design principles

신규 원칙:
- API 응답 형식 표준화 (MUST)
- 에러 코드 체계 (MUST)
- 버전 관리 정책 (SHOULD)

Breaking: 기존 API 스펙 12개 업데이트 필요"
```

---

## 충돌 해결

### 스펙 파일 충돌

스펙 파일은 **수동 해결**이 원칙입니다.

```bash
# 충돌 발생 시
git merge main
# CONFLICT in .sdd/specs/auth/user-login/spec.md

# 수동으로 해결
# 1. 파일 열어서 충돌 마커 확인
# 2. 내용 병합 (의미적으로)
# 3. 검증
sdd validate auth/user-login

# 해결 완료
git add .sdd/specs/auth/user-login/spec.md
git commit
```

### Constitution 충돌

Constitution 충돌은 **반드시 논의** 후 해결합니다.

```bash
# 충돌 발생 시
# 1. 팀 논의
# 2. 합의된 내용으로 수정
# 3. 전체 검증
sdd validate --constitution
```

---

## 자동화

### 브랜치 생성 도우미

```bash
# SDD CLI로 브랜치 생성 (향후 지원)
sdd branch spec auth/user-login
# → git checkout -b spec/auth/user-login

sdd branch constitution v2.0
# → git checkout -b constitution/v2.0
```

### 병합 후 자동 삭제

GitHub에서 자동 삭제 설정:
1. **Settings** → **General**
2. **Automatically delete head branches** ✅

---

## 관련 문서

- [커밋 컨벤션](./commit-convention.md)
- [단일 스펙 워크플로우](./workflow-single-spec.md)
- [다중 스펙 워크플로우](./workflow-bundle-spec.md)
- [Constitution 변경](./workflow-constitution.md)
