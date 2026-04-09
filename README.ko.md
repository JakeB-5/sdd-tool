# SDD Tool

**Spec-Driven Development CLI** - AI와 함께하는 명세 기반 개발 도구

[![npm version](https://img.shields.io/npm/v/sdd-tool)](https://www.npmjs.com/package/sdd-tool)
[![CI](https://github.com/JakeB-5/sdd-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/JakeB-5/sdd-tool/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> 🇺🇸 **[English Documentation](README.md)**

📚 **[문서 사이트](https://jakeb-5.github.io/sdd-tool/)** | 🚀 **[시작하기](https://jakeb-5.github.io/sdd-tool/guide/getting-started)** | 📋 **[CLI 레퍼런스](https://jakeb-5.github.io/sdd-tool/cli/)**

## 개요

SDD Tool은 **Claude Code**와 함께 사용하도록 설계된 명세 기반 개발(Spec-Driven Development) CLI입니다. **슬래시 커맨드**와 **스킬 2.0(Skills 2.0)**을 통해 AI와 대화하며 스펙을 작성하고, 코드를 구현합니다.

### 핵심 개념

- **명세 우선**: 코드 작성 전 명세 작성
- **AI 협업**: Claude Code 슬래시 커맨드로 워크플로우 자동화
- **RFC 2119 키워드**: SHALL, MUST, SHOULD, MAY로 요구사항 명확화
- **GIVEN-WHEN-THEN**: 시나리오 기반 요구사항 정의
- **헌법(Constitution)**: 프로젝트 핵심 원칙 정의

---

## 설치

```bash
npm install -g sdd-tool
```

---

## 빠른 시작

```bash
# 1. 프로젝트 초기화 (슬래시 커맨드 + 스킬 2.0 + Git/CI-CD 설정)
sdd init

# 2. Claude Code 실행
claude

# 3. 슬래시 커맨드 또는 스킬로 워크플로우 시작
/sdd.start
```

---

## 전체 워크플로우

```
┌─────────────────────────────────────────────────────────────┐
│                    SDD 슬래시 커맨드 워크플로우                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. /sdd.start        → 워크플로우 시작                      │
│     │                                                       │
│     ▼                                                       │
│  2. /sdd.constitution → 프로젝트 원칙 정의                   │
│     │                                                       │
│     ▼                                                       │
│  3. /sdd.spec         → 기능 명세 작성/수정 (spec.md)        │
│     │                                                       │
│     ▼                                                       │
│  4. /sdd.plan         → 구현 계획 수립 (plan.md)             │
│     │                                                       │
│     ▼                                                       │
│  5. /sdd.tasks        → 작업 분해 (tasks.md)                 │
│     │                                                       │
│     ▼                                                       │
│  6. /sdd.prepare      → 서브에이전트/스킬 점검                │
│     │                                                       │
│     ▼                                                       │
│  7. /sdd.implement    → 순차적 구현                          │
│     │                                                       │
│     ▼                                                       │
│  8. /sdd.validate     → 명세 검증                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 슬래시 커맨드 & 스킬 2.0

`sdd init` 실행 시 `.claude/commands/` (슬래시 커맨드, 한국어)와 `.claude/skills/sdd-*/` (스킬 2.0, 영어)에 자동 생성됩니다.

> 각 `sdd.foo` 슬래시 커맨드는 `.claude/skills/sdd-foo/SKILL.md` 스킬과 1:1로 대응됩니다. 슬래시 커맨드는 점 표기법(dot-notation), 스킬은 케밥 케이스(kebab-case)를 사용합니다. 기본적으로 둘 다 생성되며, `--no-commands` 또는 `--no-skills`로 각각 건너뛸 수 있습니다.

### 스킬 2.0 (v1.6.0+)

스킬 2.0 정의는 모델 라우팅 정확도를 위해 영어로 작성되며, 다음 프론트매터 필드를 포함합니다:

| 필드 | 적용 대상 |
|------|----------|
| `context: fork` | 분석/도메인 스킬 7개 (`sdd-analyze`, `sdd-impact`, `sdd-sync`, `sdd-search`, `sdd-report`, `sdd-reverse`, `sdd-research`) |
| `context: manual-invoke-only` | `sdd-watch` |
| `disable-model-invocation: true` | 유틸리티 스킬 5개 (`sdd-guide`, `sdd-chat`, `sdd-cicd`, `sdd-watch`, `sdd-migrate`) |
| `allowed-tools` | 모든 스킬 — 최소 권한 glob 패턴 (예: `Bash(sdd validate*)`) |

스킬 2.0 프론트매터 세부 사항은 Claude Code 팀의 공식 발표를 참고하세요.

### 핵심 워크플로우

| 커맨드 | 설명 | 사용 예시 |
|--------|------|----------|
| `/sdd.start` | 통합 진입점 | `/sdd.start` |
| `/sdd.constitution` | 프로젝트 원칙 관리 | `/sdd.constitution React 기반 할일 앱` |
| `/sdd.spec` | **기능 명세 작성/수정 (통합)** | `/sdd.spec 사용자 인증 기능` |
| `/sdd.plan` | 구현 계획 작성 | `/sdd.plan` |
| `/sdd.tasks` | 작업 분해 | `/sdd.tasks` |
| `/sdd.prepare` | 서브에이전트/스킬 점검 | `/sdd.prepare` |
| `/sdd.implement` | 순차적 구현 | `/sdd.implement` |
| `/sdd.validate` | 스펙 검증 | `/sdd.validate` |

> **Note**: `/sdd.spec`은 새 기능 작성과 기존 스펙 수정을 자동으로 판단하여 적절한 워크플로우로 안내합니다.

### 변경 관리

| 커맨드 | 설명 |
|--------|------|
| `/sdd.impact` | 변경 영향도 분석 |
| `/sdd.transition` | new ↔ change 워크플로우 전환 |

### Deprecated

| 커맨드 | 대체 | 설명 |
|--------|------|------|
| `/sdd.new` | `/sdd.spec` | 새 기능 명세 작성 |
| `/sdd.change` | `/sdd.spec` | 기존 스펙 변경 제안 |

### 분석 및 품질

| 커맨드 | 설명 |
|--------|------|
| `/sdd.analyze` | 요청 분석 및 규모 판단 |
| `/sdd.quality` | 스펙 품질 점수 산출 |
| `/sdd.report` | 프로젝트 리포트 생성 |
| `/sdd.search` | 스펙 검색 |
| `/sdd.status` | 프로젝트 상태 확인 |
| `/sdd.list` | 항목 목록 조회 |
| `/sdd.sync` | 스펙-코드 동기화 검증 |
| `/sdd.diff` | 스펙 변경사항 시각화 |
| `/sdd.export` | 스펙 내보내기 (HTML, JSON) |

### 문서 생성

| 커맨드 | 설명 |
|--------|------|
| `/sdd.research` | 기술 리서치 문서 |
| `/sdd.data-model` | 데이터 모델 문서 |
| `/sdd.guide` | 워크플로우 가이드 |

### 운영

| 커맨드 | 설명 |
|--------|------|
| `/sdd.chat` | 대화형 SDD 어시스턴트 |
| `/sdd.watch` | 파일 감시 모드 |
| `/sdd.migrate` | 외부 도구에서 마이그레이션 |
| `/sdd.cicd` | CI/CD 설정 |
| `/sdd.prompt` | 프롬프트 출력 |

---

## 워크플로우 상세

### Step 1: /sdd.start

프로젝트 상태를 분석하고 다음 작업을 안내합니다:

```
/sdd.start
```

- 신규 프로젝트: Constitution 작성 권장
- 기존 프로젝트: 워크플로우 선택 메뉴 제공

### Step 2: /sdd.constitution

프로젝트의 핵심 원칙을 정의합니다:

```
/sdd.constitution React 기반 할일 관리 앱
```

AI가 `.sdd/constitution.md`를 분석하고, 프로젝트 원칙 작성을 도와줍니다:
- 핵심 원칙 (Core Principles)
- 기술 원칙 (Technical Principles)
- 금지 사항 (Forbidden)

### Step 3: /sdd.spec

기능 명세를 AI와 함께 작성합니다:

```
/sdd.spec 사용자 인증 기능
```

AI가 대화를 통해 다음을 생성합니다:
- `spec.md` - 기능 명세 (RFC 2119 + GIVEN-WHEN-THEN)

### Step 4: /sdd.plan

구현 계획을 수립합니다:

```
/sdd.plan
```

- 기술 결정사항과 근거
- 구현 단계(Phase) 정의
- 리스크 분석 및 완화 전략

### Step 5: /sdd.tasks

작업을 실행 가능한 단위로 분해합니다:

```
/sdd.tasks
```

- 각 작업은 2-4시간 내 완료 가능한 크기
- 작업 간 의존성 표시
- 우선순위: HIGH(🔴), MEDIUM(🟡), LOW(🟢)

### Step 6: /sdd.prepare

구현에 필요한 Claude Code 도구를 점검합니다:

```
/sdd.prepare
```

**기능:**
- tasks.md 분석하여 필요한 도구 자동 감지
- 서브에이전트 (`.claude/agents/`) 존재 여부 확인
- 스킬 (`.claude/skills/`) 존재 여부 확인
- 누락된 도구 자동 생성

**감지 대상:**

| 키워드 | 서브에이전트 | 스킬 |
|--------|-------------|------|
| 테스트, test | test-runner | test |
| api, rest | api-scaffold | gen-api |
| component | component-gen | gen-component |
| database | - | db-migrate |
| 문서, doc | - | gen-doc |
| review | code-reviewer | review |

**CLI에서도 사용 가능:**

```bash
sdd prepare user-auth                 # 대화형
sdd prepare user-auth --dry-run       # 미리보기
sdd prepare user-auth --auto-approve  # 자동 생성
```

### Step 7: /sdd.implement

작업 목록을 기반으로 순차적 구현:

```
/sdd.implement
```

AI가 tasks.md를 읽고, TDD 방식으로 구현을 안내합니다:
1. 작업 상태를 "진행 중"으로 변경
2. 테스트 작성
3. 코드 구현
4. 작업 상태를 "완료"로 변경

### Step 8: /sdd.validate

명세 검증:

```
/sdd.validate
```

- RFC 2119 키워드 사용 여부
- GIVEN-WHEN-THEN 형식 준수
- 메타데이터 필수 필드 확인

---

## 대화형 모드: /sdd.chat

자연어로 SDD 작업을 수행할 수 있습니다:

```
/sdd.chat
```

예시 대화:
```
You: 사용자 인증 기능을 만들고 싶어
AI: 사용자 인증 기능의 명세를 작성해 드릴게요. 먼저 몇 가지 질문이 있습니다...
    1. 어떤 인증 방식을 사용하시나요? (JWT, 세션, OAuth)
    2. 소셜 로그인이 필요한가요?
    ...
```

---

## 스펙 파일 형식

### spec.md 예시

```markdown
---
id: user-auth
title: "사용자 인증"
status: draft
created: 2025-12-24
constitution_version: 1.0.0
---

# 사용자 인증

> JWT 기반 사용자 인증 시스템

## 요구사항

### REQ-01: 로그인

- 시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHALL)
- 로그인 실패 시 구체적인 에러 메시지를 반환해야 한다(SHOULD)

## 시나리오

### Scenario 1: 성공적인 로그인

- **GIVEN** 유효한 사용자 계정이 있을 때
- **WHEN** 올바른 이메일과 비밀번호로 로그인하면
- **THEN** JWT 토큰이 반환된다
- **AND** 토큰 만료 시간이 설정된다
```

### RFC 2119 키워드

| 키워드 | 의미 |
|--------|------|
| **SHALL** / **MUST** | 절대 필수 |
| **SHOULD** | 권장 (예외 허용) |
| **MAY** | 선택적 |
| **SHALL NOT** | 절대 금지 |

---

## CLI 명령어

슬래시 커맨드 외에 터미널에서 직접 사용할 수 있는 명령어들입니다.

### 기본 명령어

```bash
sdd init                    # 프로젝트 초기화 (대화형 Git/CI-CD 설정 포함)
sdd init --skip-git-setup   # Git/CI-CD 설정 건너뛰기
sdd init --auto-approve     # 모든 설정 자동 승인
sdd init --no-skills        # .claude/skills/ 생성 건너뛰기
sdd init --no-commands      # .claude/commands/ 생성 건너뛰기
sdd validate                # 스펙 검증
sdd status                  # 상태 확인
sdd list                    # 목록 조회
```

### 기능 개발

```bash
sdd new <name>              # 새 기능 생성 (common 도메인)
sdd new <name> -d <domain>  # 도메인 지정 생성 (v1.3.0)
sdd new <name> --all        # spec + plan + tasks 모두 생성
sdd prepare <name>          # 서브에이전트/스킬 점검
```

**v1.3.0 도메인 기반 구조:**
- 도메인 미지정 시 `common` 폴더에 생성
- 경로: `.sdd/specs/<domain>/<feature>/spec.md`
- 예: `sdd new login -d auth` → `.sdd/specs/auth/login/spec.md`

### 변경 관리

```bash
sdd change                  # 변경 제안 생성
sdd change apply <id>       # 변경 적용
sdd impact <feature>        # 영향도 분석
```

### 품질 및 분석

```bash
sdd quality                 # 품질 분석
sdd report                  # 리포트 생성
sdd search <query>          # 스펙 검색
```

### 동기화 및 변경 추적 (v0.8.0)

```bash
sdd sync                    # 스펙-코드 동기화 검증
sdd sync user-auth          # 특정 스펙만 검증
sdd sync --ci --threshold 80 # CI 모드 (동기화율 임계값)
sdd sync --json             # JSON 출력
sdd sync --markdown         # 마크다운 리포트

sdd diff                    # 스펙 변경사항 (작업 디렉토리)
sdd diff --staged           # 스테이징된 변경
sdd diff abc123 def456      # 커밋 간 비교
sdd diff --stat             # 통계 요약
sdd diff --json             # JSON 출력
```

### 스펙 내보내기 (v0.9.0)

```bash
sdd export user-auth        # 단일 스펙 HTML 내보내기
sdd export --all            # 전체 스펙 내보내기
sdd export --format json    # JSON 형식
sdd export --format markdown # 마크다운 병합
sdd export -o ./docs/specs.html # 출력 경로 지정
sdd export --theme dark     # 다크 테마
sdd export --no-toc         # 목차 제외
```

### 도메인 관리 (v1.2.0)

```bash
sdd domain create auth              # 새 도메인 생성
sdd domain list                     # 도메인 목록
sdd domain show auth                # 도메인 상세 정보
sdd domain link auth user-login     # 스펙을 도메인에 연결
sdd domain depends order --on auth  # 도메인 의존성 설정
sdd domain graph                    # 의존성 그래프 (Mermaid)
sdd domain graph --format dot       # DOT 형식
```

### 컨텍스트 관리 (v1.2.0)

```bash
sdd context set auth                # 컨텍스트 설정
sdd context set auth order          # 여러 도메인
sdd context set auth --include-deps # 의존성 포함
sdd context show                    # 현재 컨텍스트
sdd context specs                   # 컨텍스트 내 스펙 목록
sdd context clear                   # 컨텍스트 해제
```

### 역추출 (v1.2.0)

```bash
sdd reverse scan                    # 프로젝트 구조 스캔
sdd reverse scan --depth deep       # 심층 분석
sdd reverse extract                 # 스펙 초안 추출
sdd reverse extract --ai            # AI 기반 의도 추론
sdd reverse review                  # 추출된 스펙 리뷰
sdd reverse finalize                # 승인된 스펙 확정
```

### Git 워크플로우 (v1.0.0)

```bash
# Git Hooks 설정
sdd git hooks install       # pre-commit, commit-msg, pre-push 설치
sdd git hooks uninstall     # hooks 제거

# 커밋 템플릿 설정
sdd git template install    # .gitmessage 템플릿 설치

# 전체 Git 워크플로우 설정
sdd git setup               # hooks + template + .gitignore/.gitattributes

# CI/CD 설정
sdd cicd setup github       # GitHub Actions 워크플로우 생성
sdd cicd setup gitlab       # GitLab CI 설정 생성
sdd cicd check              # CI 환경 검증
```

---

## Claude Code 도구 구조

```
your-project/
├── .sdd/
│   ├── constitution.md     # 프로젝트 헌법
│   ├── AGENTS.md           # AI 워크플로우 가이드
│   ├── domains.yml         # 도메인 정의 (v1.2.0)
│   ├── .context.json       # 현재 컨텍스트 (v1.2.0)
│   ├── specs/              # 기능 명세 (v1.3.0: 도메인 기반 구조)
│   │   ├── common/         # 기본 도메인 (도메인 미지정 시)
│   │   │   └── feature-name/
│   │   │       ├── spec.md
│   │   │       ├── plan.md
│   │   │       └── tasks.md
│   │   └── auth/           # 도메인별 그룹
│   │       └── login/
│   │           ├── spec.md
│   │           ├── plan.md
│   │           └── tasks.md
│   ├── changes/            # 변경 제안
│   ├── archive/            # 완료된 변경
│   └── .reverse-drafts/    # 역추출 임시 스펙 (v1.2.0)
│
└── .claude/
    ├── commands/           # 슬래시 커맨드 — 한국어, 점 표기법 (sdd.start.md …)
    │   ├── sdd.start.md
    │   ├── sdd.new.md
    │   └── ...
    ├── agents/             # 서브에이전트
    │   ├── test-runner.md
    │   └── api-scaffold.md
    ├── skills/             # 스킬
    │   ├── dev-implement/  # 개발 스킬 (v1.2.0)
    │   │   └── SKILL.md
    │   ├── dev-test/
    │   │   └── SKILL.md
    │   ├── sdd-start/      # SDD 워크플로우 스킬 — 영어, 케밥 케이스 (v1.6.0)
    │   │   └── SKILL.md
    │   ├── sdd-spec/
    │   │   └── SKILL.md
    │   └── ...             # sdd-* 스킬 32개
    └── settings.json       # 스킬 설정 (v1.2.0)
```

> **스킬 2.0 (v1.6.0)**: `sdd init`이 `.claude/skills/sdd-*/SKILL.md`에 영어 스킬 2.0 정의 32개를 생성합니다. 한국어 슬래시 커맨드와 1:1로 대응되며, `context`, `allowed-tools`, `disable-model-invocation` 등 스킬 2.0 프론트매터를 포함합니다. v1.2.0에서 도입된 `dev-*` 스킬 6개는 변경 없이 유지됩니다.

---

## 개발

```bash
git clone https://github.com/JakeB-5/sdd-tool.git
cd sdd-tool
pnpm install
pnpm run build
pnpm test
```

### 문서 개발

```bash
pnpm run docs:dev      # 개발 서버
pnpm run docs:build    # 빌드
pnpm run docs:preview  # 미리보기
```

### 테스트 커버리지

```bash
pnpm run test:coverage  # 커버리지 리포트
```

---

## 기여

기여를 환영합니다! [CONTRIBUTING.md](CONTRIBUTING.md)를 참고해주세요.

---

## 변경 이력

자세한 변경 이력은 [CHANGELOG.md](CHANGELOG.md)를 참고해주세요.

---

## 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고해주세요.
