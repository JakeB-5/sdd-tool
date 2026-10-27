# CI/CD 설정 가이드

SDD 프로젝트에 CI/CD를 통합하는 방법입니다.

## 빠른 시작

```bash
# GitHub Actions 설정
sdd cicd setup github

# 생성되는 파일:
# .github/workflows/sdd-validate.yml
# .github/workflows/sdd-labeler.yml
```

---

## GitHub Actions

### 자동 설정

```bash
sdd cicd setup github
```

### 생성되는 워크플로우

#### 1. sdd-validate.yml

PR 및 푸시 시 스펙을 자동 검증합니다.

**트리거**:
- `.sdd/` 디렉토리 변경 시
- main, master, develop 브랜치

**실행 내용**:
- 스펙 검증 (`sdd validate`)
- Constitution 검증
- 영향도 리포트 생성

#### 2. sdd-labeler.yml

PR에 자동으로 라벨을 추가합니다.

**라벨 종류**:
- `spec:도메인명` - 변경된 도메인
- `constitution` - Constitution 변경 시

라벨러 워크플로우는 필요한 `permissions`(`contents: read`, `pull-requests: write`, `issues: write`)를 직접 선언합니다.

### 수동 설정

워크플로우를 직접 생성하려면:

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install SDD
        run: npm install -g sdd-tool@2.1.0   # 사용하는 버전으로 고정

      - name: Validate Specs
        run: sdd validate
```

생성되는 워크플로우(GitHub, GitLab, `sdd init`이 쓰는 것 모두)는 생성한 CLI의 `sdd-tool@<버전>`으로 설치를 고정하므로
CLI를 업그레이드해도 CI 동작이 몰래 바뀌지 않습니다. 업그레이드할 때 버전을 함께 올리세요.

#### 스펙-코드 동기화 게이트

생성되는 워크플로우는 스펙 검증만 합니다. 요구사항이 코드나 테스트에서 참조되지 않을 때(`@spec <domain>/<feature>#REQ-01`)도
CI를 실패시키려면 단계를 추가하세요:

```yaml
      - name: Check spec-code sync
        run: sdd sync --ci --threshold 80
```

`sdd sync`는 `--ci`나 `--threshold`가 없으면 리포트만 출력하고(종료 코드 0), 게이트가 켜진 상태에서 동기화율이 임계값(기본 100)
미만이면 종료 코드 2로 끝납니다. [sdd sync](/cli/sync)를 참고하세요.

### 커스터마이징

#### 엄격 모드

```bash
sdd cicd setup github --strict
```

경고도 에러로 처리합니다.

#### 알림 추가

```yaml
# 실패 시 Slack 알림
- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {"text": "SDD 검증 실패: ${{ github.event.pull_request.html_url }}"}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## GitLab CI

### 자동 설정

```bash
sdd cicd setup gitlab
```

### 생성 파일

`.gitlab-ci-sdd.yml` 파일이 생성됩니다.

기존 `.gitlab-ci.yml`에 include하세요:

```yaml
# .gitlab-ci.yml
include:
  - local: '.gitlab-ci-sdd.yml'
```

---

## 상태 체크 설정

### GitHub Branch Protection에 연동

1. Settings → Branches → main 규칙 편집
2. "Require status checks to pass" 활성화
3. 검색창에 `Validate Specs` 입력
4. 체크 추가

이제 스펙 검증을 통과해야만 PR 병합이 가능합니다.

### 필수 체크 목록

| 체크 이름 | 설명 | 권장 |
|-----------|------|------|
| `Validate Specs` | 스펙 검증 | 필수 |
| `Add Labels` | 라벨 추가 | 선택 |

---

## Git Hooks 연동

로컬에서도 검증을 실행하려면:

```bash
# Git hooks 설치
sdd git hooks install
```

### 훅 종류

| 훅 | 시점 | 검증 내용 |
|----|------|----------|
| `pre-commit` | 커밋 전 | 스펙 파일이 스테이징되면 `sdd validate` 실행 |
| `commit-msg` | 커밋 메시지 작성 후 | 메시지 형식 검증 ([커밋 컨벤션](./commit-convention.md)) |
| `pre-push` | 푸시 전 | 전체 스펙 검증 |

---

## CI 환경 확인

CI 환경인지 확인:

```bash
# CI 환경에서 실행 (출력 간소화)
sdd validate

# CI 체크
sdd cicd check
sdd cicd check --strict
```

---

## 문제 해결

### "Status check not found"

상태 체크가 보이지 않으면:

1. 워크플로우가 최소 1번 실행되어야 함
2. `.sdd/` 경로 변경이 포함된 PR 생성
3. 워크플로우 파일 이름 확인

### 검증 실패

```bash
# 로컬에서 먼저 검증
sdd validate

# 경고도 에러로 처리 (`sdd cicd setup github --strict`와 동일)
sdd validate --strict
```

스펙 검증이 실패하면 `sdd validate`는 종료 코드 2로 끝납니다.

### 권한 오류

생성된 라벨러 워크플로우는 필요한 권한을 직접 선언합니다. 그래도 라벨 추가가 실패하면
(`permissions`가 없는 예전 워크플로우 파일이거나 읽기 전용 토큰을 쓰는 포크 PR인 경우):

1. `sdd cicd setup github`을 다시 실행(워크플로우 파일을 다시 씁니다)하거나 `permissions` 블록을 직접 추가
2. 또는 Settings → Actions → General → "Workflow permissions" → "Read and write permissions" 선택

---

## 관련 문서

- [커밋 컨벤션](./commit-convention.md)
- [브랜치 전략](./branch-strategy.md)
- [Git Hooks 설정](/cli/git)
