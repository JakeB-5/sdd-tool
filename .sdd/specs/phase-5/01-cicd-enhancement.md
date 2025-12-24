---
id: phase5-cicd
title: "CI/CD 강화"
status: draft
version: 1.0.0
created: 2025-12-24
author: Claude
dependencies: [phase4-sync]
---

# CI/CD 강화

> GitHub Actions, npm 자동 배포, 품질 게이트를 포함한 완전한 CI/CD 파이프라인 구축

## 개요

SDD Tool의 안정적인 릴리즈와 품질 보증을 위한 CI/CD 파이프라인을 구축합니다.

## 요구사항

### REQ-01: GitHub Actions 워크플로우

- 시스템은 PR 시 자동 테스트를 실행해야 한다(SHALL)
- 시스템은 테스트 커버리지를 검사해야 한다(SHALL)
- 시스템은 린트 검사를 실행해야 한다(SHALL)
- 시스템은 타입 검사를 실행해야 한다(SHALL)
- 시스템은 빌드 검증을 실행해야 한다(SHALL)

### REQ-02: 자동 릴리즈

- 시스템은 태그 푸시 시 npm에 자동 배포해야 한다(SHALL)
- 시스템은 GitHub Release를 자동 생성해야 한다(SHALL)
- 시스템은 CHANGELOG를 자동 생성해야 한다(SHOULD)
- 시스템은 Semantic Versioning을 따라야 한다(SHALL)

### REQ-03: 품질 게이트

- 시스템은 테스트 커버리지 80% 미만 시 실패해야 한다(SHALL)
- 시스템은 린트 에러 시 실패해야 한다(SHALL)
- 시스템은 스펙 검증 실패 시 경고해야 한다(SHOULD)
- 시스템은 스펙-코드 동기화 검사를 실행해야 한다(SHOULD)

### REQ-04: 문서 자동 배포

- 시스템은 main 브랜치 푸시 시 문서를 자동 배포해야 한다(SHALL)
- 시스템은 GitHub Pages에 배포해야 한다(SHALL)

### REQ-05: 보안 검사

- 시스템은 의존성 취약점을 검사해야 한다(SHALL)
- 시스템은 시크릿 노출을 검사해야 한다(SHOULD)

## 시나리오

### Scenario 1: PR 품질 검사

- **GIVEN** feature 브랜치에서 PR이 생성되었을 때
- **WHEN** CI 워크플로우가 실행되면
- **THEN** 테스트, 린트, 타입검사, 빌드가 실행된다
- **AND** 모든 검사가 통과해야 머지 가능하다

### Scenario 2: 자동 npm 배포

- **GIVEN** v1.0.0 태그가 푸시되었을 때
- **WHEN** release 워크플로우가 실행되면
- **THEN** npm에 패키지가 배포된다
- **AND** GitHub Release가 생성된다

### Scenario 3: 커버리지 게이트

- **GIVEN** 테스트 커버리지가 75%일 때
- **WHEN** CI 워크플로우가 실행되면
- **THEN** 커버리지 검사가 실패한다
- **AND** PR 머지가 차단된다

### Scenario 4: 문서 자동 배포

- **GIVEN** main 브랜치에 푸시되었을 때
- **WHEN** docs 워크플로우가 실행되면
- **THEN** 문서가 GitHub Pages에 배포된다

## 워크플로우 구조

```
.github/
└── workflows/
    ├── ci.yml           # PR 품질 검사
    ├── release.yml      # 자동 릴리즈
    ├── docs.yml         # 문서 배포
    └── security.yml     # 보안 검사
```

### ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run typecheck
      - run: pnpm run build
      - run: pnpm run test:coverage

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  spec-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install && pnpm build
      - run: node bin/sdd.js validate || true
```

### release.yml

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install
      - run: pnpm run build
      - run: pnpm run test

      - name: Publish to npm
        run: pnpm publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Generate changelog
        id: changelog
        uses: metcalfc/changelog-generator@v4
        with:
          myToken: ${{ secrets.GITHUB_TOKEN }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          body: ${{ steps.changelog.outputs.changelog }}
          generate_release_notes: true
```

### docs.yml

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'README.md'

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4

      - name: Build docs
        run: |
          npm install -g vitepress
          cd docs && vitepress build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/.vitepress/dist
```

## 품질 게이트 설정

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### package.json 스크립트

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "build": "tsup",
    "prepublishOnly": "pnpm run build && pnpm run test"
  }
}
```

## 기술 설계

### Secrets 설정

| Secret | 용도 |
|--------|------|
| `NPM_TOKEN` | npm 배포 토큰 |
| `CODECOV_TOKEN` | 커버리지 리포트 |

### Branch Protection Rules

- main 브랜치에 직접 푸시 금지
- PR 리뷰 필수
- CI 통과 필수
- 커버리지 검사 통과 필수
