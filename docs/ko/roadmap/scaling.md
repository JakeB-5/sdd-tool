# 스케일업 로드맵

SDD Tool을 중규모 SaaS (5-15명, 50-150개 스펙)로 확장하기 위한 기능 로드맵입니다.

## 목표

- 스펙 150개 이상에서도 원활한 성능
- 멀티팀 독립 운영 + 전역 일관성
- 체계적인 리뷰/승인 워크플로우
- 외부 도구와의 연동

---

## Phase 0: 협업 기반 (Git 워크플로우)

> **최우선 구현 대상**: 기술적 기능보다 선행되어야 하는 협업 기반

### 0.1 커밋 컨벤션

**목적**: 스펙 변경사항 추적 용이, 자동화된 변경 이력 생성

#### Conventional Commits 확장

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**타입 정의**:

| 타입 | 설명 | 예시 |
|------|------|------|
| `spec` | 스펙 신규 생성 | `spec(auth): add user-login specification` |
| `spec-update` | 스펙 내용 수정 | `spec-update(auth): add MFA requirements to user-login` |
| `spec-status` | 스펙 상태 변경 | `spec-status(auth): user-login draft → review` |
| `plan` | 구현 계획 | `plan(auth): add implementation plan for user-login` |
| `tasks` | 작업 분해 | `tasks(auth): break down user-login into 5 tasks` |
| `constitution` | Constitution 변경 | `constitution: add security principles (v1.1.0)` |
| `sdd-config` | SDD 설정 변경 | `sdd-config: add billing domain` |

**스코프 규칙**:

```
# 도메인/스펙 계층 구조
spec(auth): ...                    # 도메인 전체
spec(auth/user-login): ...         # 특정 스펙
spec(auth,billing): ...            # 다중 도메인

# 특수 스코프
spec(*): ...                       # 전체 스펙 영향
constitution: ...                  # Constitution (스코프 없음)
```

**Footer 활용**:

```
spec(billing): add subscription-model specification

새로운 구독 모델 스펙 추가:
- 월간/연간 플랜 정의
- 업그레이드/다운그레이드 규칙
- 프로모션 코드 처리

Refs: #123
Breaking-Spec: payment-gateway (결제 흐름 변경 필요)
Depends-On: user-auth, billing/pricing
```

#### 커밋 메시지 템플릿

```bash
# .gitmessage
# <type>(<scope>): <subject>
# |<---- 50자 이내 ---->|

# 본문 (선택사항)
# |<---- 72자 이내 ---->|

# Footer (선택사항)
# Refs: #이슈번호
# Breaking-Spec: 영향받는-스펙
# Depends-On: 의존-스펙
# Reviewed-By: @리뷰어
```

**설정**:

```bash
git config commit.template .gitmessage
```

---

### 0.2 브랜치 전략

#### 스펙 개발용 브랜치 모델

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

**브랜치 명명 규칙**:

| 패턴 | 용도 | 예시 |
|------|------|------|
| `spec/<domain>/<name>` | 개별 스펙 | `spec/auth/user-login` |
| `spec-bundle/<name>` | 스펙 묶음 | `spec-bundle/payment-v2` |
| `constitution/<version>` | Constitution | `constitution/v2.0` |
| `sdd-infra/<name>` | SDD 설정/구조 | `sdd-infra/add-billing-domain` |

#### 워크플로우

```
1. 스펙 작업 시작
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

#### 보호 규칙

```yaml
# GitHub Branch Protection 예시
main:
  required_reviews: 2
  required_status_checks:
    - sdd-validate
    - sdd-lint
  restrictions:
    - dismiss_stale_reviews: true

# 스펙 브랜치는 자유롭게
spec/*:
  required_reviews: 0
  allow_force_push: true
```

---

### 0.3 스펙 변경 워크플로우

#### 단일 스펙 변경

```bash
# 1. 브랜치 생성
git checkout -b spec/auth/user-login

# 2. 스펙 작성
sdd new auth/user-login

# 3. 검증
sdd validate auth/user-login

# 4. 커밋
git add .sdd/specs/auth/user-login/
git commit -m "spec(auth): add user-login specification

사용자 로그인 기능 명세:
- 이메일/비밀번호 인증
- OAuth 2.0 (Google, GitHub)
- 세션 관리 정책

Depends-On: data-model/user"

# 5. PR 생성
gh pr create --title "spec(auth): user-login" --body "..."

# 6. 리뷰 후 병합
gh pr merge --squash
```

#### 다중 스펙 변경 (Breaking Change)

```bash
# 1. 번들 브랜치 생성
git checkout -b spec-bundle/payment-v2

# 2. 관련 스펙들 수정
sdd new billing/payment-gateway-v2
# ... 여러 스펙 작업

# 3. 영향 분석
sdd impact billing/payment-gateway --code

# 4. 변경 요약 커밋
git commit -m "spec-bundle(billing): payment system v2

결제 시스템 전면 개편:
- payment-gateway-v2: 새 PG 연동
- refund-policy: 환불 정책 변경
- subscription: 결제 주기 변경

Breaking-Spec: billing/checkout, billing/invoice
Migration-Guide: docs/migration/payment-v2.md"

# 5. PR에 상세 설명
gh pr create --title "spec-bundle: Payment System v2" \
  --body "$(cat <<EOF
## 변경 범위
- 신규: payment-gateway-v2, refund-policy-v2
- 수정: subscription, checkout
- 영향: invoice, reporting

## Breaking Changes
checkout 스펙의 payment_method 필드 구조 변경

## 마이그레이션
docs/migration/payment-v2.md 참조
EOF
)"
```

#### Constitution 변경

```bash
# 1. Constitution 브랜치 (특별 관리)
git checkout -b constitution/v2.0

# 2. 변경 및 버전 업데이트
sdd constitution bump --minor
# constitution.md 수정

# 3. 영향 분석
sdd validate --constitution  # 위반 스펙 확인

# 4. 커밋 (상세 기록)
git commit -m "constitution: v2.0 - add API design principles

신규 원칙:
- API 응답 형식 표준화 (MUST)
- 에러 코드 체계 (MUST)
- 버전 관리 정책 (SHOULD)

Breaking: 기존 API 스펙 중 12개 업데이트 필요
- api/user-endpoint
- api/product-endpoint
..."

# 5. 전체 팀 리뷰 필수
gh pr create --reviewer @tech-leads @architects
```

---

### 0.4 Git Hooks 자동화

#### Pre-commit: 스펙 검증

```bash
#!/bin/bash
# .husky/pre-commit

# 변경된 스펙 파일 확인
CHANGED_SPECS=$(git diff --cached --name-only | grep "^\.sdd/specs/")

if [ -n "$CHANGED_SPECS" ]; then
  echo "🔍 스펙 검증 중..."

  # 개별 스펙 검증
  for spec in $CHANGED_SPECS; do
    sdd validate "$spec" || exit 1
  done

  echo "✅ 스펙 검증 통과"
fi
```

#### Commit-msg: 컨벤션 검사

```bash
#!/bin/bash
# .husky/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# 스펙 관련 커밋 패턴
SPEC_PATTERN="^(spec|spec-update|spec-status|plan|tasks|constitution|sdd-config)(\(.+\))?: .+"

# 일반 커밋 패턴 (feat, fix, etc.)
GENERAL_PATTERN="^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"

if [[ ! $COMMIT_MSG =~ $SPEC_PATTERN ]] && [[ ! $COMMIT_MSG =~ $GENERAL_PATTERN ]]; then
  echo "❌ 커밋 메시지 형식 오류"
  echo ""
  echo "스펙 커밋: spec(<scope>): <message>"
  echo "일반 커밋: feat(<scope>): <message>"
  echo ""
  echo "자세한 내용: docs/guide/scaling-roadmap.md#0.1-커밋-컨벤션"
  exit 1
fi
```

#### Pre-push: 전체 검증

```bash
#!/bin/bash
# .husky/pre-push

echo "🔍 푸시 전 검증..."

# 전체 스펙 검증
sdd validate || exit 1

# 순환 의존성 검사
sdd deps check --cycles || exit 1

# Constitution 정합성
sdd validate --constitution || exit 1

echo "✅ 검증 완료"
```

#### 설정 자동화 CLI

```bash
# Git hooks 설정
sdd git hooks install         # Husky 설치 및 훅 설정
sdd git hooks uninstall       # 훅 제거

# 커밋 템플릿 설정
sdd git template install      # .gitmessage 설정

# 전체 Git 설정
sdd git setup                 # hooks + template + .gitignore
```

---

### 0.5 .gitignore 및 Git 설정

#### SDD용 .gitignore

```gitignore
# .gitignore

# SDD 캐시 (재생성 가능)
.sdd/index.json
.sdd/.cache/

# 로컬 설정
.sdd/local.yml

# 생성된 리포트
.sdd/reports/

# 임시 파일
.sdd/**/*.tmp
.sdd/**/*.bak
```

#### Git Attributes

```gitattributes
# .gitattributes

# 스펙 파일은 항상 LF
.sdd/**/*.md text eol=lf

# 머지 전략: 스펙 충돌 시 수동 해결
.sdd/specs/** merge=spec-merge
.sdd/constitution.md merge=constitution-merge
```

#### 커스텀 머지 드라이버 (선택)

```bash
# .git/config 또는 global config
[merge "spec-merge"]
    name = SDD Spec Merge Driver
    driver = sdd merge %O %A %B %P

[merge "constitution-merge"]
    name = SDD Constitution Merge Driver
    driver = sdd merge --constitution %O %A %B %P
```

---

### 0.6 CI 연동

#### GitHub Actions: 스펙 검증

```yaml
# .github/workflows/sdd-validate.yml
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

      - name: Setup SDD
        run: npm install -g sdd-tool

      - name: Validate Specs
        run: sdd validate

      - name: Check Dependencies
        run: sdd deps check

      - name: Constitution Check
        run: sdd validate --constitution

      - name: Comment PR
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ SDD 검증 실패. 상세 내용은 Actions 로그를 확인하세요.'
            })
```

#### PR 라벨 자동화

```yaml
# .github/workflows/sdd-labeler.yml
name: SDD Labeler

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Detect Changes
        id: changes
        run: |
          SPECS=$(git diff --name-only origin/main | grep "^\.sdd/specs/" | cut -d'/' -f3 | sort -u)
          echo "domains=$SPECS" >> $GITHUB_OUTPUT

          if git diff --name-only origin/main | grep -q "constitution.md"; then
            echo "constitution=true" >> $GITHUB_OUTPUT
          fi

      - name: Apply Labels
        uses: actions/github-script@v7
        with:
          script: |
            const domains = '${{ steps.changes.outputs.domains }}'.split('\n').filter(Boolean);
            const labels = domains.map(d => `spec:${d}`);

            if ('${{ steps.changes.outputs.constitution }}' === 'true') {
              labels.push('constitution');
            }

            if (labels.length > 0) {
              await github.rest.issues.addLabels({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                labels: labels
              });
            }
```

---

### 구현 체크리스트

```
Phase 0 구현 순서:

□ 0.1 커밋 컨벤션
  □ 컨벤션 문서화
  □ .gitmessage 템플릿
  □ commitlint 설정

□ 0.2 브랜치 전략
  □ 브랜치 명명 규칙 문서화
  □ GitHub Branch Protection 설정
  □ 브랜치 템플릿 스크립트

□ 0.3 워크플로우
  □ 단일 스펙 가이드
  □ 번들 스펙 가이드
  □ Constitution 변경 가이드

□ 0.4 Git Hooks
  □ sdd git hooks install CLI
  □ pre-commit 훅
  □ commit-msg 훅
  □ pre-push 훅

□ 0.5 Git 설정
  □ .gitignore 템플릿
  □ .gitattributes 템플릿
  □ sdd init에서 자동 생성

□ 0.6 CI 연동
  □ sdd-validate.yml 템플릿
  □ sdd-labeler.yml 템플릿
  □ sdd cicd setup 명령어 확장
```

---

## Phase 1: 성능 최적화

### 1.1 인덱스 캐시 시스템

**문제**: 매번 전체 스펙 파싱으로 인한 성능 저하

**해결책**: `.sdd/index.json` 캐시 도입

```typescript
// src/core/index/schema.ts
interface SpecIndex {
  version: string;           // 인덱스 스키마 버전
  generated: string;         // 생성 시각
  checksum: string;          // 전체 무결성 해시

  specs: {
    [id: string]: {
      path: string;          // 파일 경로
      hash: string;          // 파일 해시 (변경 감지)
      title: string;
      status: SpecStatus;
      phase: number;
      domain?: string;
      dependencies: string[];
      keywords: string[];    // 전문 검색용
      updated: string;
    }
  };

  graph: {
    edges: [string, string][];  // [from, to] 의존성
    reverse: {                   // 역방향 (영향 분석용)
      [id: string]: string[]
    };
    cycles: string[][];         // 순환 의존성 캐시
  };

  stats: {
    total: number;
    byStatus: Record<SpecStatus, number>;
    byPhase: Record<number, number>;
    byDomain: Record<string, number>;
  };
}
```

**CLI 변경**:

```bash
sdd index rebuild    # 인덱스 재생성
sdd index status     # 인덱스 상태 확인
sdd index verify     # 무결성 검증
```

**자동 갱신 전략**:

```typescript
// 변경 감지 및 부분 갱신
async function updateIndex(changedFiles: string[]) {
  const index = await loadIndex();

  for (const file of changedFiles) {
    const hash = await computeHash(file);
    if (index.specs[id]?.hash !== hash) {
      // 해당 스펙만 재파싱
      index.specs[id] = await parseSpec(file);
    }
  }

  // 그래프 재계산 (변경된 부분만)
  rebuildAffectedGraph(index, changedFiles);

  await saveIndex(index);
}
```

**예상 효과**:
- 검색 속도: O(n) → O(1)
- validate 시간: 10초 → 1초 미만
- impact 분석: 즉각적

---

### 1.2 인터랙티브 의존성 그래프

**현재**: 텍스트 기반 Mermaid 출력

**개선**: 브라우저 기반 인터랙티브 그래프

```bash
sdd graph                    # 브라우저에서 열기
sdd graph --domain auth      # 도메인 필터
sdd graph --focus user-auth  # 특정 스펙 중심
sdd graph --export svg       # 이미지 내보내기
```

**기술 스택**:
- D3.js 또는 Cytoscape.js
- 로컬 HTML 파일 생성 후 브라우저 오픈
- 줌/팬/필터/검색 지원

**UI 기능**:
- 노드 클릭: 스펙 상세 정보
- 엣지 하이라이트: 의존성 경로
- 색상 코딩: 상태별, Phase별, 도메인별
- 검색: 실시간 노드 필터링

---

## Phase 2: 도메인 분리

### 2.1 멀티 Constitution 구조

**현재**:
```
.sdd/
├── constitution.md
└── specs/
```

**개선**:
```
.sdd/
├── constitution.md           # 전역 원칙 (필수 준수)
├── config.yml                # 도메인 설정
└── domains/
    ├── auth/
    │   ├── constitution.md   # 도메인 원칙 (전역 + 확장)
    │   └── specs/
    ├── billing/
    │   ├── constitution.md
    │   └── specs/
    └── core/
        └── specs/            # constitution 없으면 전역만 적용
```

**설정 파일**:

```yaml
# .sdd/config.yml
version: "1.0"

domains:
  auth:
    name: "인증/인가"
    owners: ["@security-team"]
    constitution: domains/auth/constitution.md

  billing:
    name: "결제/구독"
    owners: ["@billing-team"]
    constitution: domains/billing/constitution.md

  core:
    name: "핵심 기능"
    owners: ["@core-team"]

# 도메인 간 의존성 규칙
dependencies:
  rules:
    - from: billing
      to: auth
      allowed: true
    - from: auth
      to: billing
      allowed: false  # 순환 방지
```

**CLI 변경**:

```bash
# 도메인 지정 스펙 생성
sdd new auth/login-flow
sdd new billing/subscription-model

# 도메인별 작업
sdd validate --domain auth
sdd status --domain billing
sdd list --domain core

# 전체 현황
sdd status --by-domain
```

**Constitution 상속**:

```markdown
<!-- domains/auth/constitution.md -->
# Auth 도메인 Constitution

상위: ../constitution.md (자동 상속)

## 추가 원칙

### 보안 요구사항
- 모든 인증 스펙은 OWASP 가이드라인을 MUST 준수
- 세션 관리 스펙은 만료 정책을 MUST 명시
```

---

### 2.2 자동 의존성 감지

**현재**: 수동 `dependencies` 필드

**개선**: 내용 기반 자동 감지 + 수동 오버라이드

```typescript
// src/core/dependency/detector.ts
interface DependencyDetector {
  // 패턴 기반 감지
  patterns: [
    // 명시적 참조
    /depends on [`']([a-z-]+)[`']/gi,
    /requires [`']([a-z-]+)[`']/gi,
    /see [`']([a-z-]+)[`'] spec/gi,

    // 요구사항 참조
    /REQ-([A-Z]+-\d+)/g,

    // 링크 참조
    /\[.*?\]\(\.\.\/([a-z-]+)\//gi,
  ];

  // 키워드 매칭
  keywords: {
    'user-auth': ['인증', '로그인', '세션', 'JWT', 'OAuth'],
    'billing': ['결제', '구독', '청구', 'subscription'],
  };
}
```

**검증 명령어**:

```bash
sdd deps check           # 의존성 일관성 검사
sdd deps suggest         # 누락된 의존성 제안
sdd deps auto-fix        # 자동 추가 (확인 후)
```

**출력 예시**:

```
🔍 의존성 분석: user-profile

감지된 의존성:
  ✅ user-auth (명시됨)
  ⚠️  data-model (감지됨, 미명시)
      └─ "User 엔티티의 프로필 필드" 참조 발견 (line 23)
  ⚠️  notification (감지됨, 미명시)
      └─ "프로필 변경 시 알림" 언급 (line 45)

제안: sdd deps add user-profile data-model notification
```

---

## Phase 3: 리뷰 워크플로우

### 3.1 승인 게이트 시스템

**설정**:

```yaml
# .sdd/config.yml
review:
  enabled: true

  gates:
    draft:
      next: review
      auto: true  # 자동 전환 가능

    review:
      next: approved
      requires:
        approvers: 2
        from_teams: ["owners"]  # 도메인 owners

    approved:
      next: implemented
      requires:
        tests: true      # 테스트 존재 확인
        sync_check: true # 코드 연결 확인

  notifications:
    slack: "#sdd-reviews"

  auto_assign:
    auth/*: ["@alice", "@bob"]
    billing/*: ["@charlie"]
```

**CLI 명령어**:

```bash
# 리뷰 요청
sdd review request user-auth
sdd review request user-auth --reviewers @alice @bob

# 리뷰 작업
sdd review list                    # 내 리뷰 목록
sdd review list --pending          # 대기 중
sdd review show user-auth          # 상세 보기

# 승인/반려
sdd review approve user-auth
sdd review approve user-auth --comment "LGTM"
sdd review reject user-auth --reason "보안 검토 필요"

# 상태 전환 (권한 필요)
sdd review promote user-auth       # 다음 단계로
```

**스펙 메타데이터 확장**:

```yaml
---
status: review
review:
  requested: 2024-01-15
  requested_by: "@developer"
  reviewers:
    - name: "@alice"
      status: approved
      date: 2024-01-16
      comment: "LGTM"
    - name: "@bob"
      status: pending
---
```

---

### 3.2 변경 이력 추적

**새 필드**:

```yaml
---
history:
  - date: 2024-01-10
    author: "@developer"
    action: created

  - date: 2024-01-12
    author: "@developer"
    action: modified
    changes: ["요구사항 REQ-003 추가", "시나리오 2개 추가"]

  - date: 2024-01-15
    author: "@developer"
    action: review_requested

  - date: 2024-01-16
    author: "@alice"
    action: approved
---
```

**CLI**:

```bash
sdd history user-auth              # 변경 이력
sdd history user-auth --diff       # 버전 간 diff
sdd blame user-auth                # 라인별 작성자
```

---

## Phase 4: 외부 연동

### 4.1 Issue Tracker 동기화

**지원 대상**:
- GitHub Issues
- Linear
- Jira (추후)

**설정**:

```yaml
# .sdd/config.yml
integrations:
  github:
    enabled: true
    repo: "owner/repo"
    sync:
      spec_to_issue: true      # 스펙 → 이슈 생성
      issue_to_spec: false     # 이슈 → 스펙 (수동)
    labels:
      prefix: "spec:"
      status_mapping:
        draft: "spec:draft"
        approved: "spec:ready"

  linear:
    enabled: true
    team: "ENG"
    sync:
      spec_to_issue: true
```

**CLI**:

```bash
sdd sync github                    # GitHub 동기화
sdd sync linear                    # Linear 동기화
sdd link user-auth --github 123    # 수동 연결
sdd link user-auth --linear ENG-456
```

**스펙 메타데이터**:

```yaml
---
external:
  github:
    issue: 123
    url: "https://github.com/owner/repo/issues/123"
  linear:
    id: "ENG-456"
    url: "https://linear.app/team/issue/ENG-456"
---
```

---

### 4.2 VSCode 확장

**기능 목록**:

| 기능 | 설명 |
|------|------|
| 스펙 미리보기 | 마크다운 렌더링 + 메타데이터 표시 |
| 사이드바 | 스펙 트리 뷰, 상태별 필터 |
| 자동완성 | `@spec REQ-xxx` 참조 자동완성 |
| 호버 정보 | 스펙 ID 호버 시 요약 표시 |
| Go to Definition | 스펙 참조에서 스펙 파일로 이동 |
| Find References | 코드에서 스펙 참조 찾기 |
| 검증 | 저장 시 자동 검증, 문제 패널 표시 |
| 스니펫 | 스펙 템플릿 스니펫 |

**구현 우선순위**:
1. 스펙 트리 뷰 + 미리보기
2. `@spec` 자동완성 + 호버
3. 실시간 검증
4. Go to Definition

---

## Phase 5: 분석 및 대시보드

### 5.1 터미널 대시보드

```bash
sdd dashboard
```

```
┌─────────────────────────────────────────────────────────────┐
│  SDD Dashboard - my-saas-project                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Overview          │  📈 Progress                        │
│  ──────────────────   │  ────────────────────────────────   │
│  Total Specs: 87      │  ████████████░░░░░░░░ 62% (54/87)   │
│  Constitution: v2.1   │                                     │
│                       │  By Phase:                          │
│  By Status:           │  P1: ██████████████████ 100%        │
│  ● Draft:      12     │  P2: ████████████░░░░░░  67%        │
│  ● Review:      8     │  P3: ████░░░░░░░░░░░░░░  22%        │
│  ● Approved:   13     │                                     │
│  ● Implemented: 54    │                                     │
│                       │                                     │
├───────────────────────┴─────────────────────────────────────┤
│  🔔 Pending Reviews (3)                                     │
│  ──────────────────────────────────────────────────────────│
│  • auth/mfa-setup        waiting: @alice (2 days)          │
│  • billing/refund-flow   waiting: @bob, @charlie           │
│  • core/audit-log        waiting: @security-team           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⚠️  Issues (2)                                             │
│  ──────────────────────────────────────────────────────────│
│  • Circular dependency: billing/invoice → billing/payment  │
│  • Stale spec: core/legacy-api (no updates 30+ days)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 HTML 리포트 강화

```bash
sdd report --format html --output report.html
```

**추가 섹션**:
- 트렌드 차트 (주간/월간 진행률)
- 도메인별 히트맵
- 의존성 복잡도 지표
- 리뷰 병목 분석

---

## 구현 우선순위 요약

| Phase | 기능 | 난이도 | 영향도 | 예상 작업 |
|-------|------|--------|--------|-----------|
| **0** | 커밋 컨벤션 | 낮음 | 높음 | 문서 + 템플릿 |
| **0** | 브랜치 전략 | 낮음 | 높음 | 문서 + 보호 규칙 |
| **0** | Git Hooks | 중 | 높음 | CLI + 훅 스크립트 |
| **0** | CI 연동 | 중 | 높음 | 워크플로우 템플릿 |
| **1** | 인덱스 캐시 | 중 | 높음 | 스키마 + 빌더 + CLI |
| **1** | 인터랙티브 그래프 | 중 | 중 | D3.js 템플릿 |
| **2** | 도메인 분리 | 높음 | 높음 | 구조 변경 + CLI |
| **2** | 자동 의존성 감지 | 중 | 중 | 파서 확장 |
| **3** | 리뷰 워크플로우 | 높음 | 중 | 상태 관리 + CLI |
| **3** | 변경 이력 | 중 | 중 | 메타데이터 확장 |
| **4** | GitHub 연동 | 중 | 중 | API 연동 |
| **4** | VSCode 확장 | 높음 | 높음 | 별도 프로젝트 |
| **5** | 대시보드 | 중 | 중 | blessed/ink |

> **Phase 0이 최우선**: 기술적 기능(Phase 1-5)보다 협업 기반(Phase 0)을 먼저 구축해야 팀 확장 시 혼란을 방지할 수 있습니다.

## 관련 문서

- [현재 한계점](./current-limits.md) - 도구의 현실적 한계
- [로드맵 개요](./overview.md) - 전체 로드맵
- [모범 사례](/guide/best-practices.md) - 효과적인 사용법
