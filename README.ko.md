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

SDD Tool은 **Claude Code**와 **OpenAI Codex**에서 사용하도록 설계된 명세 기반 개발(Spec-Driven Development) CLI입니다. **SDD 스킬**(Claude Code는 `/sdd-*`, Codex는 `$sdd-*`로 호출)을 통해 AI와 대화하며 스펙을 작성하고, 코드를 구현합니다.

### 핵심 개념

- **명세 우선**: 코드 작성 전 명세 작성
- **AI 협업**: Claude Code 스킬로 워크플로우 자동화
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
# 1. 프로젝트 초기화 (Claude Code + Codex 스킬, 서브에이전트, AGENTS.md 블록, CLAUDE.md import, Git/CI-CD 설정)
sdd init

# 2. Claude Code 실행 (또는 Codex: `codex`)
claude

# 3. 시작 스킬로 워크플로우 시작 (Codex: $sdd-start)
/sdd-start
```

---

## 전체 워크플로우

```
┌─────────────────────────────────────────────────────────────┐
│                      SDD 스킬 워크플로우                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. /sdd-start        → 워크플로우 시작                      │
│     │                                                       │
│     ▼                                                       │
│  2. /sdd-constitution → 프로젝트 원칙 정의                   │
│     │                                                       │
│     ▼                                                       │
│  3. /sdd-spec         → 기능 명세 작성/수정 (spec.md)        │
│     │                                                       │
│     ▼                                                       │
│  4. /sdd-plan         → 구현 계획 수립 (plan.md)             │
│     │                                                       │
│     ▼                                                       │
│  5. /sdd-tasks        → 작업 분해 (tasks.md)                 │
│     │                                                       │
│     ▼                                                       │
│  6. /sdd-prepare      → 서브에이전트/스킬 점검                │
│     │                                                       │
│     ▼                                                       │
│  7. /sdd-implement    → 순차적 구현                          │
│     │                                                       │
│     ▼                                                       │
│  8. /sdd-validate     → 명세 검증                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

각 단계가 내부적으로 실행하는 CLI 명령어 (직접 실행해도 됩니다):

| 단계 | 스킬 | 사용하는 CLI 명령어 |
|------|------|---------------------|
| 1 | `/sdd-start` | `sdd status` |
| 2 | `/sdd-constitution` | `.sdd/constitution.md` 편집 |
| 3 | `/sdd-spec` | `sdd new <domain>/<feature> --all` (spec.md, plan.md, tasks.md, checklist.md), `sdd validate` |
| 4 | `/sdd-plan` | 이미 생성된 `plan.md` 편집, 선택적으로 `sdd new status <feature> planned` |
| 5 | `/sdd-tasks` | 이미 생성된 `tasks.md` 편집, 선택적으로 `sdd new status <feature> tasked` |
| 6 | `/sdd-prepare` | `sdd prepare <feature>` |
| 7 | `/sdd-implement` | 작업마다 `sdd new task <feature> <task-id> in-progress\|completed`, `sdd status`; 마지막 작업 후 `sdd validate`, `sdd sync <feature>`, 이어서 `sdd new status <feature> implemented` |
| 8 | `/sdd-validate` | `sdd validate` (구현 완료된 기능은 `sdd sync`도 실행) |

`<feature>`는 `<domain>/<feature>`(예: `pricing/cart`) 또는 프로젝트에서 유일한 기능 이름(예: `cart`)입니다. Codex에서는 `/sdd-*` 대신 `$sdd-*`를 사용합니다.

---

## 스킬 (슬래시 커맨드)

`sdd init` 실행 시 `.claude/skills/sdd-*/SKILL.md`에 Claude Code 스킬 30개가 자동 생성됩니다. Claude Code는 각 스킬을 슬래시 커맨드로 노출하므로 `/sdd-start`, `/sdd-spec` 등 케밥 케이스 이름으로 호출합니다.

> `.claude/commands/`는 Claude Code가 커맨드를 스킬로 통합했기 때문에 기본 생성되지 않습니다. 레거시 한국어 점 표기법 커맨드(`.claude/commands/sdd.*.md`)도 함께 생성하려면 `sdd init --legacy-commands`를 사용하세요. 스킬 생성을 건너뛰려면 `--no-skills`를 사용합니다 (Claude Code, Codex 모두).

### Codex 지원

`sdd init`은 별도 옵션 없이 같은 정의로 OpenAI Codex 파일도 함께 생성합니다:

| 생성물 | 용도 |
|--------|------|
| `.agents/skills/sdd-*/SKILL.md` | 같은 스킬 30개 (프론트매터는 `name` + `description`, 스킬 참조는 `$sdd-x` 표기) |
| `.agents/skills/<name>/agents/openai.yaml` | 명시 호출 전용 스킬(`sdd-chat`, `sdd-cicd`, `sdd-guide`, `sdd-migrate`, `sdd-watch`)에 `policy.allow_implicit_invocation: false` |
| `.codex/agents/sdd-*.toml` | 서브에이전트 (아래 참조) |
| `AGENTS.md` (프로젝트 루트) | `<!-- sdd:begin -->` … `<!-- sdd:end -->` 블록의 SDD 지침, 블록 밖 내용은 건드리지 않음 |

Codex에서는 `$sdd-spec auth/login`처럼 명시적으로 호출하거나 `/skills`에서 고릅니다. 설명(description)에 맞는 요청이면 Codex가 스킬을 암묵적으로 선택하기도 합니다.

### 서브에이전트

`sdd init`은 서브에이전트 3개를 두 도구 모두에 생성합니다 (`.claude/agents/<name>.md`, `.codex/agents/<name>.toml`):

| 서브에이전트 | 역할 |
|--------------|------|
| `sdd-spec-reviewer` | 읽기 전용 스펙 리뷰: RFC 2119, GIVEN-WHEN-THEN, 헌법 준수; `sdd validate` / `sdd quality` 실행 |
| `sdd-implementer` | `tasks.md` 작업을 테스트 우선으로 구현하고 스펙 범위를 유지 |
| `sdd-impact-analyst` | 스펙 변경 전 `sdd impact`로 읽기 전용 영향도 분석 |

"sdd-spec-reviewer로 auth/login 스펙을 리뷰해줘"처럼 이름을 지정해 위임합니다.

### 스킬 프론트매터

스킬은 모델 라우팅 정확도를 위해 영어로 작성되며, 다음 프론트매터 필드를 사용합니다:

| 필드 | 적용 대상 |
|------|----------|
| `context: fork` | 분석 스킬 6개 (`sdd-analyze`, `sdd-impact`, `sdd-report`, `sdd-research`, `sdd-search`, `sdd-sync`) |
| `disable-model-invocation: true` | 유틸리티 스킬 5개 (`sdd-chat`, `sdd-cicd`, `sdd-guide`, `sdd-migrate`, `sdd-watch`) |
| `argument-hint` | 인수를 받는 스킬 |
| `allowed-tools` | 모든 스킬 — 최소 권한 패턴 (예: `Bash(sdd validate*)`) |

### 핵심 워크플로우

| 커맨드 | 설명 | 사용 예시 |
|--------|------|----------|
| `/sdd-start` | 통합 진입점 | `/sdd-start` |
| `/sdd-constitution` | 프로젝트 원칙 관리 | `/sdd-constitution React 기반 할일 앱` |
| `/sdd-spec` | **기능 명세 작성/수정 (통합)** | `/sdd-spec 사용자 인증 기능` |
| `/sdd-plan` | 구현 계획 작성 | `/sdd-plan` |
| `/sdd-tasks` | 작업 분해 | `/sdd-tasks` |
| `/sdd-prepare` | 서브에이전트/스킬 점검 | `/sdd-prepare` |
| `/sdd-implement` | 순차적 구현 | `/sdd-implement` |
| `/sdd-validate` | 스펙 검증 | `/sdd-validate` |

> **Note**: `/sdd-spec`은 새 스펙을 작성하거나 기존 스펙을 수정합니다. 큰 수정은 `.sdd/changes/CHG-xxx/{proposal,delta,tasks}.md` 변경 제안을 거치며, `sdd change apply <id>`로 적용하고 `sdd change archive <id>`로 보관합니다.

### 변경 관리

| 커맨드 | 설명 |
|--------|------|
| `/sdd-impact` | 변경 영향도 분석 |
| `/sdd-transition` | new ↔ change 워크플로우 전환 |

> **제거됨**: `/sdd-new`와 `/sdd-change`는 더 이상 존재하지 않습니다. 대신 `/sdd-spec`을 사용하세요.

### 분석 및 품질

| 커맨드 | 설명 |
|--------|------|
| `/sdd-analyze` | 요청 분석 및 규모 판단 |
| `/sdd-quality` | 스펙 품질 점수 산출 |
| `/sdd-report` | 프로젝트 리포트 생성 |
| `/sdd-search` | 스펙 검색 |
| `/sdd-status` | 프로젝트 상태 확인 |
| `/sdd-list` | 항목 목록 조회 |
| `/sdd-sync` | 스펙-코드 동기화 검증 |
| `/sdd-diff` | 스펙 변경사항 시각화 |
| `/sdd-export` | 스펙 내보내기 (HTML, JSON) |

### 문서 생성

| 커맨드 | 설명 |
|--------|------|
| `/sdd-research` | 기술 리서치 문서 |
| `/sdd-data-model` | 데이터 모델 문서 |
| `/sdd-guide` | 워크플로우 가이드 |

### 운영

| 커맨드 | 설명 |
|--------|------|
| `/sdd-chat` | 대화형 SDD 어시스턴트 |
| `/sdd-watch` | 파일 감시 모드 |
| `/sdd-migrate` | 외부 도구에서 마이그레이션 |
| `/sdd-cicd` | CI/CD 설정 |
| `/sdd-prompt` | 프롬프트 출력 |

---

## 워크플로우 상세

### Step 1: /sdd-start

프로젝트 상태를 분석하고 다음 작업을 안내합니다:

```
/sdd-start
```

- 신규 프로젝트: Constitution 작성 권장
- 기존 프로젝트: 워크플로우 선택 메뉴 제공

### Step 2: /sdd-constitution

프로젝트의 핵심 원칙을 정의합니다:

```
/sdd-constitution React 기반 할일 관리 앱
```

AI가 `.sdd/constitution.md`를 분석하고, 프로젝트 원칙 작성을 도와줍니다:
- 핵심 원칙 (Core Principles)
- 기술 원칙 (Technical Principles)
- 금지 사항 (Forbidden)

### Step 3: /sdd-spec

기능 명세를 AI와 함께 작성합니다:

```
/sdd-spec 사용자 인증 기능
```

새 기능이면 스킬이 `sdd new <domain>/<feature> --all`을 실행한 뒤 다음을 채우도록 안내합니다:
- `spec.md` - 기능 명세 (RFC 2119 + GIVEN-WHEN-THEN)

`sdd new`는 `plan.md`, `tasks.md`, `checklist.md`도 함께 생성하고(`--all`), 없는 도메인은 자동으로 만들며(도메인 생략 시 `common`), `--no-branch`를 주지 않으면 `feature/<name>` git 브랜치를 만들어 전환합니다. 기존 파일은 덮어쓰지 않으며(종료 코드 1), 처음부터 다시 생성할 때만 `--force`를 사용하세요.

### Step 4: /sdd-plan

이미 생성된 `plan.md`에 구현 계획을 수립합니다:

```
/sdd-plan
```

- 기술 결정사항과 근거
- 구현 단계(Phase) 정의
- 리스크 분석 및 완화 전략

`plan.md`가 없을 때만 스킬이 `sdd new plan <feature>`를 실행합니다.

### Step 5: /sdd-tasks

이미 생성된 `tasks.md`에서 작업을 실행 가능한 단위로 분해합니다:

```
/sdd-tasks
```

- 각 작업은 2-4시간 내 완료 가능한 크기
- 작업 ID는 `<name>-task-NNN` (예: `cart-task-001`)
- 작업 간 의존성 표시
- 우선순위: HIGH(🔴), MEDIUM(🟡), LOW(🟢)
- 테스트 우선: 각 작업은 코드보다 먼저 시나리오의 실패하는 테스트를 작성

### Step 6: /sdd-prepare

구현에 필요한 Claude Code 도구를 점검합니다:

```
/sdd-prepare
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

### Step 7: /sdd-implement

작업 목록을 기반으로 순차적 구현:

```
/sdd-implement
```

AI가 tasks.md를 읽고, 엄격한 테스트 우선(TDD) 방식으로 작업을 하나씩 구현하도록 안내합니다:
1. `sdd new task <feature> <task-id> in-progress`
2. Red: 작업의 시나리오를 테스트로 만들고 실패하는지 확인
3. Green: 테스트를 통과하는 최소한의 코드 작성
4. 모든 테스트가 통과하는 상태에서 Refactor
5. 코드와 테스트에서 요구사항을 `@spec <domain>/<feature>#REQ-01`로 참조
6. `sdd new task <feature> <task-id> completed` 후 커밋

작업 상태는 `sdd new task`로만 변경하며, 실행할 때마다 tasks.md의 진행 집계가 다시 계산됩니다.

모든 작업이 완료되면 `/sdd-implement`가 기능을 마무리합니다:

```bash
sdd validate                              # 형식 검증
sdd sync <feature>                        # 모든 요구사항이 코드/테스트에서 커버되는지 확인
sdd new status <feature> implemented      # 스펙을 implemented로 표시
```

### Step 8: /sdd-validate

명세 검증:

```
/sdd-validate
```

- RFC 2119 키워드 사용 여부
- GIVEN-WHEN-THEN 형식 준수
- 메타데이터 필수 필드 확인

구현이 끝난 기능은 `sdd sync`도 실행해 모든 요구사항이 코드나 테스트에서 참조되는지(`@spec <domain>/<feature>#REQ-01`) 확인합니다.

---

## 대화형 모드: /sdd-chat

자연어로 SDD 작업을 수행할 수 있습니다:

```
/sdd-chat
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
id: login
title: "사용자 인증"
status: draft
created: 2025-12-24
domain: auth
depends: []
constitution_version: 1.0.0
---

# 사용자 인증

> JWT 기반 사용자 인증 시스템

## 요구사항

### REQ-01: 로그인

- 시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHALL)
- 로그인 실패 시 구체적인 에러 메시지를 반환해야 한다(SHOULD)

## 시나리오

### Scenario 1: 성공적인 로그인 (REQ-01)

- **GIVEN** 유효한 사용자 계정이 있을 때
- **WHEN** 올바른 이메일과 비밀번호로 로그인하면
- **THEN** JWT 토큰이 반환된다
- **AND** 토큰 만료 시간이 설정된다
```

### 요구사항과 추적성

- **요구사항은 헤딩으로 정의합니다**: `### REQ-01: 제목`. 번호는 스펙 안에서 고유하며 스펙마다 `REQ-01`부터 다시 시작합니다. `sdd sync`는 이 정의 헤딩만 요구사항으로 세고, 본문·표·목록에서 언급한 REQ ID는 참조로 취급합니다.
- **코드와 테스트를 요구사항에 연결**할 때는 `@spec <domain>/<feature>#REQ-01`(주석 또는 테스트 제목)을 사용합니다. 예: `@spec auth/login#REQ-01`. 한정하지 않은 `REQ-01`은 여러 스펙이 같은 ID를 가지면 모호해져 `sdd sync`가 무시합니다.
- **상태**는 frontmatter를 직접 고치지 말고 `sdd new status <feature> <status>`(`draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated`)로 변경합니다.

### 의존성 (`depends`)

다른 스펙에 대한 의존성은 frontmatter에 `<domain>/<feature>` ID의 YAML 목록으로 선언하며, 없으면 `depends: []`를 씁니다:

```yaml
depends: [pricing/cart, auth/session]
```

`depends`는 `sdd impact`(그래프, 순환, 건강도, 영향받는 스펙)의 유일한 의존성 출처입니다. 본문에서 다른 스펙을 언급하는 것(`` `pricing/cart` ``, 링크)은 의존성이 아니라 참조로 표시됩니다.

### RFC 2119 키워드

| 키워드 | 의미 |
|--------|------|
| **SHALL** / **MUST** | 절대 필수 |
| **SHOULD** | 권장 (예외 허용) |
| **MAY** | 선택적 |
| **SHALL NOT** | 절대 금지 |

---

## CLI 명령어

스킬 외에 터미널에서 직접 사용할 수 있는 명령어들입니다.

### 기본 명령어

```bash
sdd init                    # 프로젝트 초기화 (대화형 Git/CI-CD 설정 포함)
sdd init --skip-git-setup   # Git/CI-CD 설정 건너뛰기
sdd init --auto-approve     # 모든 설정 자동 승인
sdd init --no-skills        # .claude/skills/, .agents/skills/ 생성 건너뛰기
sdd init --legacy-commands  # 레거시 .claude/commands/sdd.*.md도 함께 생성
sdd validate                # 스펙 검증
sdd status                  # 기능별 단계, 작업 진행률, 다음 단계
sdd list                    # 목록 조회
```

`sdd status`는 기능마다 작업 진행률(예: `작업 1/3`)을 보여 주고, "다음 단계"를 기능별 파일·스펙 상태·작업 진행률로 계산합니다 (plan → tasks → implement → `sdd validate` · `sdd sync` → `sdd new status <feature> implemented`).

### 기능 개발

```bash
sdd new <domain>/<feature>           # 기능 생성 (없는 도메인은 자동 생성)
sdd new <name>                       # 도메인 생략: `common` (또는 컨텍스트의 활성 도메인이 하나면 그 도메인)
sdd new <name> -d <domain>           # 옵션으로 도메인 지정 (계속 지원)
sdd new <domain>/<feature> --all     # spec.md + plan.md + tasks.md + checklist.md
sdd new <domain>/<feature> --no-branch  # git 브랜치를 만들지/전환하지 않음
sdd new <domain>/<feature> --all --force  # 기존 파일을 덮어쓰며 다시 생성
sdd prepare <feature>                # 서브에이전트/스킬 점검
```

- 경로: `.sdd/specs/<domain>/<feature>/spec.md`. 예: `sdd new auth/login` (또는 `sdd new login -d auth`) → `.sdd/specs/auth/login/spec.md`
- 아직 없는 도메인은 `sdd domain create <domain>`처럼 자동 생성되고 안내 메시지가 출력됩니다
- 도메인을 생략하면 `common`, 또는 현재 컨텍스트의 활성 도메인이 하나뿐이면 그 도메인에 생성됩니다
- 기본적으로 `sdd new`는 `feature/<name>` git 브랜치를 만들어 전환합니다. 현재 브랜치에 머무르려면 `--no-branch`를 사용하세요
- 기존 파일은 덮어쓰지 않습니다. 종료 코드 1과 함께 파일 이름을 알려 주며, `--force`로 다시 생성할 수 있습니다

**상태 변경** (frontmatter나 tasks.md를 직접 고치는 대신). `<feature>`는 `<domain>/<feature>` 또는 유일한 기능 이름입니다:

```bash
sdd new status <feature> <status>              # draft | review | approved | planned | tasked | implementing | implemented | deprecated
sdd new task <feature> <task-id> <status>      # pending | in-progress | completed | blocked (한글: 대기 | "진행 중" | 완료 | 차단됨)

sdd new status pricing/cart implemented
sdd new task pricing/cart cart-task-001 in-progress
sdd new task cart cart-task-001 completed      # 기능 이름만 사용 가능, 작업 ID는 <name>-task-NNN
```

`sdd new task`는 tasks.md의 진행 상황 블록과 `total:` / `completed:` 집계도 갱신하고, 마지막 작업을 완료하면 `sdd new status <feature> implemented`를 제안합니다. 공백이 있는 값은 따옴표로 감싸세요(`"진행 중"`).

### 변경 관리

```bash
sdd change                  # 변경 제안 생성
sdd change apply <id>       # 변경 적용
sdd impact <feature>        # 영향도 분석 (의존성은 frontmatter `depends`에서만 계산)
```

### 품질 및 분석

```bash
sdd quality                 # 품질 분석
sdd report                  # 리포트 생성
sdd search <query>          # 스펙 검색
```

### 동기화 및 변경 추적

`sdd sync`는 스펙이 `### REQ-01: 제목` 헤딩으로 정의한 요구사항만 세고, 코드와 테스트의 `@spec <domain>/<feature>#REQ-01` 참조와 매칭합니다 (한정하지 않은 ID는 모호하지 않을 때만 인정).

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

### 스펙 내보내기

```bash
sdd export user-auth        # 단일 스펙 HTML 내보내기
sdd export --all            # 전체 스펙 내보내기
sdd export --format json    # JSON 형식
sdd export --format markdown # 마크다운 병합
sdd export -o ./docs/specs.html # 출력 경로 지정
sdd export --theme dark     # 다크 테마
sdd export --no-toc         # 목차 제외
```

### 도메인 관리

```bash
sdd domain create auth              # 새 도메인 생성
sdd domain list                     # 도메인 목록
sdd domain show auth                # 도메인 상세 정보
sdd domain link auth user-login     # 스펙을 도메인에 연결
sdd domain depends order --on auth  # 도메인 의존성 설정
sdd domain graph                    # 의존성 그래프 (Mermaid)
sdd domain graph --format dot       # DOT 형식
```

### 컨텍스트 관리

```bash
sdd context set auth                # 컨텍스트 설정
sdd context set auth order          # 여러 도메인
sdd context set auth # 의존성 기본 포함
sdd context show                    # 현재 컨텍스트
sdd context specs                   # 컨텍스트 내 스펙 목록
sdd context clear                   # 컨텍스트 해제
```

### 역추출

CLI는 구조 스캔, 초안 검증, 리뷰 결정 기록을 담당합니다. 코드를 읽고 초안(`.sdd/.reverse-drafts/<도메인>/<기능>/spec.md`)을 작성하는 것은 AI(`/sdd-reverse` 스킬, Codex에서는 `$sdd-reverse`. `/sdd.reverse`는 `sdd init --legacy-commands`를 사용할 때만 존재)입니다.

```bash
sdd reverse scan --json             # 구조 스캔 (파일, 라인, 언어, 제안 도메인)
sdd validate .sdd/.reverse-drafts   # AI가 작성한 초안 검증
sdd reverse review --list           # 초안 목록 (상태 + 검증 결과)
sdd reverse review <ref> --approve  # 초안 승인 (또는 --reject --reason "...")
sdd reverse finalize                # 승인된 초안을 .sdd/specs/로 이동
```

### Git 워크플로우

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

## 프로젝트 구조

```
your-project/
├── .sdd/
│   ├── constitution.md     # 프로젝트 헌법
│   ├── domains.yml         # 도메인 정의 (`sdd init --with-domains` 또는 첫 `sdd new <domain>/<feature>` 때 생성)
│   ├── .context.json       # 현재 컨텍스트 (`sdd context set` 때 생성)
│   ├── specs/              # 기능 명세 (도메인 기반 구조)
│   │   ├── common/         # 기본 도메인 (도메인 미지정 시)
│   │   │   └── feature-name/
│   │   │       ├── spec.md
│   │   │       ├── plan.md
│   │   │       ├── tasks.md
│   │   │       └── checklist.md
│   │   └── auth/           # 도메인별 그룹
│   │       └── login/
│   │           ├── spec.md
│   │           ├── plan.md
│   │           ├── tasks.md
│   │           └── checklist.md
│   ├── changes/            # 변경 제안
│   ├── archive/            # 완료된 변경
│   └── .reverse-drafts/    # 역추출 임시 스펙
│
├── AGENTS.md               # <!-- sdd:begin/end --> 블록의 SDD 지침 (Codex가 읽음)
├── CLAUDE.md               # @AGENTS.md로 지침을 import (Claude Code)
│
├── .claude/                # Claude Code
│   ├── agents/             # 서브에이전트 (sdd-spec-reviewer, sdd-implementer, sdd-impact-analyst)
│   └── skills/             # SDD 워크플로우 스킬 — 영어, 케밥 케이스
│       ├── sdd-start/
│       │   └── SKILL.md
│       └── ...             # sdd-* 스킬 30개
├── .agents/skills/         # Codex 스킬 (같은 sdd-* 스킬 30개)
└── .codex/agents/          # Codex 서브에이전트 (sdd-*.toml)
```

> **스킬**: `sdd init`이 `.claude/skills/sdd-*/SKILL.md`와 `.agents/skills/sdd-*/SKILL.md`에 영어 스킬 30개를 생성하고, 루트 `AGENTS.md` 블록에 SDD 지침을 쓰며, `CLAUDE.md`가 `@AGENTS.md`를 import하도록 보장합니다 (없으면 생성, import 줄이 없으면 추가, 이전 `@.sdd/AGENTS.md` 줄은 교체하며 기존 내용은 덮어쓰지 않음). `.sdd/AGENTS.md`는 더 이상 생성하지 않습니다. 레거시 `.claude/commands/` 파일은 `--legacy-commands`를 사용할 때만 생성됩니다.

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
