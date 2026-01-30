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

::: tip
직접 Git hooks 방식을 원한다면 `sdd git hooks install`을 사용하세요.
:::

### check

CI 환경에서 스펙 검증을 수행합니다.

```bash
sdd cicd check
sdd cicd check --strict
sdd cicd check --fail-on-warning
```

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
  pull_request:
    paths:
      - '.sdd/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm install -g sdd-tool
      - run: sdd validate
```

### sdd-labeler.yml

PR에 자동으로 라벨을 추가합니다:
- `spec:<domain>` - 변경된 도메인
- `constitution` - Constitution 변경 시
- `spec:new` - 새 스펙 추가
- `spec:update` - 스펙 수정
- `spec:remove` - 스펙 삭제

## 관련 문서

- [CI/CD 설정 가이드](/guide/cicd-setup)
- [커밋 컨벤션](/guide/commit-convention)
- [브랜치 전략](/guide/branch-strategy)
