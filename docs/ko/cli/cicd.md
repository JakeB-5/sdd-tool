# sdd cicd

CI/CD 파이프라인 통합을 설정합니다.

## 사용법

```bash
sdd cicd <subcommand> [options]
```

## 서브커맨드

### setup

CI 워크플로우 파일을 생성합니다.

```bash
# GitHub Actions
sdd cicd setup github

# GitLab CI
sdd cicd setup gitlab

# 모든 플랫폼
sdd cicd setup all
```

**생성되는 파일:**

| 플랫폼 | 파일 |
|--------|------|
| GitHub | `.github/workflows/sdd-validate.yml` |
| GitHub | `.github/workflows/sdd-labeler.yml` |
| GitLab | `.gitlab-ci-sdd.yml` |

### hooks

Git hooks를 설정합니다 (husky 방식).

```bash
sdd cicd hooks
sdd cicd hooks pre-commit
sdd cicd hooks --install
```

훅 스크립트를 `.husky/`에 씁니다(`pre-commit`과 `pre-push`, 또는 지정한 하나만). `--install`을 주면 husky 설치 절차
(`npm install -D husky`, `npx husky init`)를 먼저 출력하지만 실행하지는 않습니다. 스크립트가 동작하려면 husky를 직접
설치하세요.

::: tip
직접 Git hooks 방식을 원한다면 `sdd git hooks install`을 사용하세요.
:::

### check

CI 환경에서 프로젝트 구조를 확인하고 모든 스펙을 검증합니다 (`sdd validate`와 같은 검증).
검증 실패 시 종료 코드 `2`(VALIDATION_FAILED)로 종료합니다.

```bash
sdd cicd check
sdd cicd check --strict
sdd cicd check --fail-on-warning
```

지원하지 않는 플랫폼/훅 이름을 지정하면 파일을 생성하지 않고 에러로 종료합니다.

## 옵션

### setup 옵션

| 옵션 | 설명 |
|------|------|
| `--strict` | 엄격 모드 (경고도 에러로 처리) |

### check 옵션

| 옵션 | 설명 |
|------|------|
| `--strict` | 엄격 모드 |
| `--fail-on-warning` | 경고 시 실패 |

## 예시

```bash
# GitHub Actions 설정
sdd cicd setup github

# 엄격 모드로 설정
sdd cicd setup github --strict

# CI 환경에서 검증
sdd cicd check
```

## 워크플로우 내용

### sdd-validate.yml

```yaml
on:
  push:
    branches: [main, master, develop]
    paths: ['.sdd/**']
  pull_request:
    branches: [main, master, develop]
    paths: ['.sdd/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g sdd-tool@2.1.0   # 파일을 생성한 버전으로 고정
      - run: sdd validate
      - run: sdd constitution validate
      - run: sdd impact report --json > impact-report.json   # 아티팩트로 업로드
```

설치 단계는 `sdd cicd setup`을 실행한 CLI의 `sdd-tool@<버전>`으로 고정됩니다(GitLab 파일과 `sdd init`이 쓰는
워크플로우도 같습니다). 업그레이드할 때 버전을 바꾸세요. 생성되는 워크플로우는 `sdd validate`만 실행하므로,
스펙-코드 추적성을 CI 게이트로 쓰려면 `sdd sync --ci --threshold 80`을 직접 추가하세요
(임계값 미만이면 종료 코드 2, [sdd sync](/ko/cli/sync) 참고).

### sdd-labeler.yml

PR에 자동으로 라벨을 추가합니다 (워크플로우가 `permissions`를 선언합니다: `contents: read`,
`pull-requests: write`, `issues: write`):
- `spec:<domain>` - 변경된 도메인
- `constitution` - Constitution 변경 시

## 관련 문서

- [CI/CD 설정 가이드](/guide/cicd-setup)
- [커밋 컨벤션](/guide/commit-convention)
- [브랜치 전략](/guide/branch-strategy)
