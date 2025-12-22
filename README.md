# SDD Tool

**Spec-Driven Development CLI** - 명세 기반 개발을 위한 통합 CLI 도구

[![npm version](https://img.shields.io/npm/v/sdd-tool)](https://www.npmjs.com/package/sdd-tool)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 개요

SDD Tool은 명세(Specification)를 중심으로 소프트웨어를 개발하는 방법론을 지원하는 CLI 도구입니다. 코드보다 명세를 우선시하여, 명세가 구현의 진실 공급원(Source of Truth)이 되도록 합니다.

### 핵심 개념

- **명세 우선**: 코드 작성 전 명세 작성
- **RFC 2119 키워드**: SHALL, MUST, SHOULD, MAY, SHALL NOT
- **GIVEN-WHEN-THEN**: 시나리오 기반 요구사항 정의
- **델타 시스템**: ADDED, MODIFIED, REMOVED로 변경 추적
- **헌법(Constitution)**: 프로젝트 핵심 원칙 정의

## 설치

```bash
# npm
npm install -g sdd-tool

# pnpm
pnpm add -g sdd-tool

# 또는 로컬에서 실행
git clone https://github.com/JakeB-5/sdd-tool.git
cd sdd-tool
pnpm install
pnpm run build
```

## 빠른 시작

```bash
# 1. 프로젝트 초기화
sdd init

# 2. 워크플로우 시작 (통합 진입점)
sdd start

# 3. 새 기능 생성
sdd new user-auth --title "사용자 인증" --all

# 4. 스펙 검증
sdd validate

# 5. 프로젝트 상태 확인
sdd status
```

## 명령어

### `sdd init`

SDD 프로젝트를 초기화합니다.

```bash
sdd init              # 기본 초기화
sdd init --force      # 기존 파일 덮어쓰기
```

생성되는 구조:
```
.sdd/
├── constitution.md   # 프로젝트 헌법 (핵심 원칙)
├── AGENTS.md         # AI 워크플로우 가이드
├── specs/            # 기능 명세
├── changes/          # 변경 제안
├── archive/          # 완료된 변경
└── templates/        # 템플릿 파일
.claude/
└── commands/         # Claude 슬래시 커맨드
```

### `sdd start`

통합 워크플로우 진입점입니다.

```bash
sdd start                          # 상태 확인 및 워크플로우 메뉴
sdd start --status                 # 상태만 표시
sdd start --workflow new-feature   # 특정 워크플로우 시작
sdd start --workflow change-spec   # 변경 워크플로우
```

### `sdd new`

새로운 기능을 생성합니다.

```bash
# 기본 사용
sdd new <feature-name>

# 옵션
sdd new auth --title "인증 기능" --description "사용자 인증"
sdd new auth --all              # spec, plan, tasks, checklist 모두 생성
sdd new auth --numbered         # 자동 번호 부여 (feature/001-auth)
sdd new auth --no-branch        # Git 브랜치 생성 안 함

# 서브커맨드
sdd new plan <feature>          # 구현 계획 생성
sdd new tasks <feature>         # 작업 분해 생성
sdd new checklist               # 워크플로우 체크리스트 생성
sdd new counter                 # 기능 번호 카운터 관리
sdd new counter --peek          # 다음 번호 확인
sdd new counter --history       # 생성 이력
sdd new counter --set <n>       # 번호 설정
```

### `sdd validate`

스펙 파일의 형식을 검증합니다.

```bash
sdd validate                    # 전체 검증
sdd validate path/to/spec.md    # 특정 파일 검증
sdd validate --strict           # 엄격 모드 (경고도 에러)
sdd validate --check-links      # 참조 링크 유효성 검사
sdd validate --quiet            # 조용한 모드
```

검증 항목:
- YAML frontmatter 존재 및 형식
- RFC 2119 키워드 사용
- GIVEN-WHEN-THEN 시나리오 포함
- 참조 링크 유효성 (--check-links)

### `sdd constitution`

프로젝트 Constitution(헌법)을 관리합니다.

```bash
sdd constitution                # Constitution 표시
sdd constitution show           # Constitution 내용 표시
sdd constitution version        # 버전만 표시
sdd constitution validate       # 형식 검증
sdd constitution history        # 변경 이력 조회
sdd constitution bump           # 버전 업데이트
sdd constitution bump --major   # 주요 변경 (원칙 삭제 등)
sdd constitution bump --minor   # 기능 추가
sdd constitution bump --patch   # 문구 수정
```

### `sdd change`

변경 제안을 생성하고 관리합니다.

```bash
sdd change                      # 새 변경 제안 생성
sdd change -t "제목"            # 제목과 함께 생성
sdd change -l                   # 진행 중인 변경 목록
sdd change <id>                 # 특정 변경 조회
sdd change diff <id>            # 변경 내용 diff
sdd change validate <id>        # 변경 제안 검증
sdd change apply <id>           # 변경 적용
sdd change archive <id>         # 변경 아카이브
```

### `sdd impact`

스펙 변경의 영향도를 분석합니다.

```bash
sdd impact <feature>            # 특정 기능 영향도 분석
sdd impact <feature> --graph    # 의존성 그래프 출력 (Mermaid)
sdd impact <feature> --json     # JSON 형식 출력
sdd impact report               # 전체 프로젝트 리포트
sdd impact report --json        # JSON 형식 리포트
sdd impact change <id>          # 변경 제안 영향도 분석
```

### `sdd transition`

워크플로우 간 전환을 수행합니다.

```bash
sdd transition new-to-change <spec-id>    # new → change 전환
sdd transition change-to-new <change-id>  # change → new 전환
sdd transition guide                       # 전환 가이드
```

### `sdd migrate`

기존 문서를 SDD 형식으로 마이그레이션합니다.

```bash
sdd migrate docs <source>       # 문서 마이그레이션
sdd migrate analyze <file>      # 문서 분석
sdd migrate scan [dir]          # 디렉토리 스캔
```

### `sdd cicd`

CI/CD 파이프라인을 설정합니다.

```bash
sdd cicd setup                  # GitHub Actions 설정
sdd cicd setup gitlab           # GitLab CI 설정
sdd cicd setup all              # 모든 플랫폼 설정
sdd cicd hooks                  # Git hooks 설정
sdd cicd check                  # CI 검증 실행
```

### `sdd status`

프로젝트 상태를 조회합니다.

```bash
sdd status                      # 기본 상태
sdd status --verbose            # 상세 정보
sdd status --json               # JSON 형식
```

### `sdd list`

항목 목록을 조회합니다.

```bash
sdd list                        # 전체 요약
sdd list features               # 기능 목록
sdd list changes                # 변경 목록
sdd list specs                  # 스펙 파일 목록
sdd list templates              # 템플릿 목록
```

### `sdd prompt`

AI 도구용 슬래시 커맨드 프롬프트를 출력합니다.

```bash
sdd prompt                      # 사용 가능한 명령어 목록
sdd prompt --list               # 명령어 목록
sdd prompt new                  # /sdd.new 프롬프트
sdd prompt change               # /sdd.change 프롬프트
```

## 워크플로우

### 신규 기능 개발

```
1. sdd start                    # 워크플로우 시작
2. sdd new <feature> --all      # 기능 생성 (spec, plan, tasks)
3. spec.md 작성                 # 요구사항 정의
4. sdd validate                 # 명세 검증
5. plan.md 작성                 # 구현 계획
6. tasks.md 기반 구현           # 작업별 구현
7. sdd change archive           # 완료 후 아카이브
```

### 기존 기능 변경

```
1. sdd change -t "변경 제목"    # 변경 제안 생성
2. proposal.md 작성             # 변경 내용 정의
3. sdd impact <feature>         # 영향도 분석
4. sdd change validate <id>     # 검증
5. sdd change apply <id>        # 변경 적용
6. sdd change archive <id>      # 아카이브
```

### 워크플로우 전환

작업 중 워크플로우를 변경해야 할 때:

```
# 새 기능 → 변경 제안 (기존 스펙과 중복 발견 시)
sdd transition new-to-change <spec-id>

# 변경 → 새 기능 (범위가 커서 분리 필요 시)
sdd transition change-to-new <change-id>
```

## Claude 슬래시 커맨드

`sdd init` 실행 시 `.claude/commands/` 디렉토리에 Claude Code용 슬래시 커맨드가 자동 생성됩니다.

### 기본 워크플로우 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/sdd.start` | 통합 진입점 - 워크플로우 시작 |
| `/sdd.new` | 새 기능 명세 작성 |
| `/sdd.plan` | 구현 계획 작성 |
| `/sdd.tasks` | 작업 분해 |
| `/sdd.implement` | 순차적 구현 진행 |
| `/sdd.validate` | 스펙 형식 검증 |
| `/sdd.status` | 프로젝트 상태 확인 |
| `/sdd.change` | 변경 제안 작성 |
| `/sdd.constitution` | Constitution 관리 |

### 고급 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/sdd.chat` | 대화형 SDD 어시스턴트 |
| `/sdd.guide` | 전체 워크플로우 가이드 |
| `/sdd.transition` | 워크플로우 전환 |
| `/sdd.analyze` | 요청 분석 및 규모 판단 |
| `/sdd.research` | 기술 리서치 문서 작성 |
| `/sdd.data-model` | 데이터 모델 문서 작성 |
| `/sdd.prepare` | 환경 준비 가이드 |

### 사용법

Claude Code에서 슬래시 커맨드를 입력하면 해당 워크플로우가 자동으로 실행됩니다:

```
/sdd.start      # 워크플로우 시작
/sdd.new        # 새 기능 명세 작성 시작
/sdd.chat       # 대화형 모드로 SDD 작업
```

### 워크플로우 예시

1. **대화형 모드로 시작**
   ```
   /sdd.chat
   → 자연어로 SDD 작업 수행
   → 질문/작성/검토/실행 모드 지원
   ```

2. **새 기능 개발**
   ```
   /sdd.new
   → 기능명과 설명 입력
   → spec.md 자동 생성 및 작성 안내
   ```

3. **워크플로우 전환**
   ```
   /sdd.transition
   → new ↔ change 워크플로우 전환
   → 전환 가이드 제공
   ```

## 스펙 파일 형식

### spec.md

```markdown
---
id: feature-id
title: "기능 제목"
status: draft
created: 2025-12-21
constitution_version: 1.0.0
depends: null
---

# 기능 제목

> 기능 설명

---

## 요구사항

### REQ-01: 요구사항 제목

- 시스템은 [기능]을 지원해야 한다(SHALL)
- 응답 시간은 1초 이내여야 한다(SHOULD)

---

## 시나리오

### Scenario 1: 성공 케이스

- **GIVEN** 유효한 사용자가 있을 때
- **WHEN** 로그인을 시도하면
- **THEN** 메인 페이지로 이동한다
```

### RFC 2119 키워드

| 키워드 | 의미 | 사용 예시 |
|--------|------|-----------|
| **SHALL** / **MUST** | 절대 필수 | "시스템은 인증을 지원해야 한다(SHALL)" |
| **SHOULD** | 권장 (예외 가능) | "응답 시간은 1초 이내여야 한다(SHOULD)" |
| **MAY** | 선택적 | "다크 모드를 지원할 수 있다(MAY)" |
| **SHALL NOT** | 절대 금지 | "평문 비밀번호를 저장해서는 안 된다(SHALL NOT)" |

## CI/CD 통합

### GitHub Actions

```bash
sdd cicd setup github
# .github/workflows/sdd-validate.yml 생성
```

### GitLab CI

```bash
sdd cicd setup gitlab
# .gitlab-ci-sdd.yml 생성
```

### Git Hooks

```bash
sdd cicd hooks
# .husky/pre-commit, pre-push 생성
```

## 개발

```bash
# 의존성 설치
pnpm install

# 빌드
pnpm run build

# 개발 모드 (watch)
pnpm run dev

# 테스트
pnpm test                       # watch 모드
pnpm run test:run               # 단일 실행
pnpm run test:coverage          # 커버리지

# 린트
pnpm run lint

# 타입 체크
pnpm run typecheck
```

### 프로젝트 구조

```
sdd-tool/
├── bin/                        # CLI 진입점
│   └── sdd.js
├── src/
│   ├── cli/                    # CLI 명령어
│   │   ├── commands/
│   │   │   ├── init.ts
│   │   │   ├── new.ts
│   │   │   ├── validate.ts
│   │   │   ├── change.ts
│   │   │   ├── impact.ts
│   │   │   ├── status.ts
│   │   │   ├── list.ts
│   │   │   ├── prompt.ts
│   │   │   ├── constitution.ts
│   │   │   ├── start.ts
│   │   │   ├── transition.ts
│   │   │   ├── migrate.ts
│   │   │   └── cicd.ts
│   │   └── index.ts
│   ├── core/                   # 핵심 로직
│   │   ├── spec/               # 스펙 파서/검증
│   │   ├── constitution/       # 헌법 시스템
│   │   ├── change/             # 변경 워크플로우
│   │   ├── impact/             # 영향도 분석
│   │   └── new/                # 신규 기능 워크플로우
│   ├── generators/             # 파일 생성기
│   ├── prompts/                # 슬래시 커맨드
│   ├── errors/                 # 에러 처리
│   ├── utils/                  # 유틸리티
│   └── types/                  # 타입 정의
├── templates/                  # 기본 템플릿
└── tests/                      # 테스트
    ├── unit/
    └── integration/
```

## 라이선스

MIT License
