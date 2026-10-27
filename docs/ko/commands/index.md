# 스킬 (슬래시 커맨드)

Claude Code와 Codex에서 사용하는 SDD 스킬 가이드입니다.

## 개요

`sdd init` 실행 시 `.claude/skills/sdd-*/SKILL.md`에 30개의 영문 SDD 워크플로우 스킬이 자동 생성됩니다. Claude Code는 각 스킬을 슬래시 커맨드로 노출하므로 `/sdd-start`, `/sdd-spec` 같은 kebab-case 이름으로 호출합니다.

- **30개 sdd-* 스킬** — `.claude/skills/sdd-*/` (Claude Code에서 `/sdd-<이름>`으로 호출)
- 같은 스킬이 OpenAI Codex용으로 `.agents/skills/sdd-*/`에도 생성되며 `$sdd-<이름>`(예: `$sdd-spec`)으로 호출하거나 `/skills`에서 선택합니다. [sdd init › Codex 지원](/ko/cli/init#codex-지원)을 참고하세요.
- `.claude/commands/`는 기본적으로 생성되지 **않습니다**. Claude Code가 커스텀 커맨드를 스킬로 통합했으므로 스킬이 지원되는 형식입니다.
- 레거시 한국어 dot-notation 커맨드(`.claude/commands/sdd.*.md`)도 함께 생성하려면 `sdd init --legacy-commands`를 사용합니다.
- 스킬 생성을 건너뛰려면 `--no-skills`를 사용합니다.
- 스킬과 함께 서브에이전트 3개가 생성됩니다(`.claude/agents/`, `.codex/agents/`): `sdd-spec-reviewer`, `sdd-implementer`, `sdd-impact-analyst`.
- 아래에서 `sdd-spec`처럼 쓴 것은 스킬 이름이고, `sdd ...`로 시작하는 줄은 터미널에서 실행하는 CLI 명령어입니다.

::: tip `<feature>` 인수
기존 기능을 가리키는 `<feature>`에는 `<domain>/<feature>`(예: `auth/login`) 또는 프로젝트에서 유일한 기능 이름(예: `login`)을 넣습니다. 새 기능을 만들 때만 `<domain>/<feature>` 형식을 씁니다(`/sdd-spec auth/login`).
:::

## 스킬 목록

**모드** 열은 스킬의 실행 방식을 나타냅니다([스킬 프론트매터](#스킬-프론트매터) 참고). **fork** = 분리된(forked) 컨텍스트에서 실행, **수동** = 사용자만 호출 가능(모델이 스스로 호출하지 않음).

### 핵심 워크플로우

| 스킬 | 인수 | 설명 | 모드 |
|------|------|------|------|
| [`/sdd-start`](/ko/commands/sdd-start) | — | 통합 진입점: 설정을 점검하고 다음 스킬을 추천 | |
| [`/sdd-constitution`](/ko/commands/sdd-constitution) | — | 프로젝트 헌법 작성/수정 및 버전 업데이트 | |
| [`/sdd-spec`](/ko/commands/sdd-spec) | `<domain>/<feature>` | **기능 명세 작성/수정 (통합)** | |
| [`/sdd-plan`](/ko/commands/sdd-plan) | `<feature>` | `plan.md` 작성 | |
| [`/sdd-tasks`](/ko/commands/sdd-tasks) | `<feature>` | 계획을 `tasks.md`로 분해 | |
| [`/sdd-prepare`](/ko/commands/sdd-prepare) | `<feature> [--dry-run]` | 필요한 서브에이전트/스킬 감지 및 생성 | |
| [`/sdd-implement`](/ko/commands/sdd-implement) | `<feature>` | 테스트 우선, 작업 단위 구현 | |
| [`/sdd-validate`](/ko/commands/sdd-validate) | `[path] [--strict]` | 스펙 검증 | |

> **Note**: `/sdd-spec`은 새 스펙을 작성하거나 기존 스펙을 수정합니다. 큰 수정은 `.sdd/changes/CHG-xxx/{proposal,delta,tasks}.md` 변경 제안을 거치며, `sdd change apply <id>`로 적용하고 `sdd change archive <id>`로 보관합니다.

핵심 흐름은 `/sdd-spec` → `/sdd-plan` → `/sdd-tasks` → `/sdd-implement` → `/sdd-validate`입니다. 작업 상태와 `sdd sync`가 어디에 들어가는지는 [`/sdd-implement`](/ko/commands/sdd-implement)를 참고하세요.

### 도메인 & 역추출

| 스킬 | 인수 | 설명 | 모드 |
|------|------|------|------|
| [`/sdd-reverse`](/ko/commands/sdd-reverse) | `[scan\|review\|finalize] [args]` | 레거시 코드에서 스펙 역추출 | |
| [`/sdd-domain`](/ko/commands/sdd-domain) | `[create\|list\|show\|link\|depends\|graph\|validate] [args]` | 도메인 관리 (생성, 연결, 그래프) | |
| [`/sdd-context`](/ko/commands/sdd-context) | `[set\|show\|add\|remove\|clear\|specs] [domain...]` | 작업 컨텍스트 설정 | |

### 변경 관리

| 스킬 | 인수 | 설명 | 모드 |
|------|------|------|------|
| `/sdd-impact` | `<feature> [--graph] [--code] [--json]` | 변경 영향도 분석 | fork |
| `/sdd-transition` | `[new-to-change <spec-id> \| change-to-new <change-id> \| guide]` | new ↔ change 워크플로우 전환 | |

> **제거됨**: `/sdd-new`와 `/sdd-change`는 더 이상 존재하지 않습니다. 대신 `/sdd-spec`을 사용하세요.

### 분석 및 품질

| 스킬 | 인수 | 설명 | 모드 |
|------|------|------|------|
| `/sdd-analyze` | `<request>` | 요청 분석 및 규모 판단 | fork |
| `/sdd-quality` | `[specId] [--all] [--min-score <n>] [--json]` | 스펙 품질 점수 산출 | |
| `/sdd-report` | `[--format html\|markdown\|json] [-o <path>]` | 프로젝트 리포트 생성 | fork |
| `/sdd-search` | `[query] [--status <status>] [--tags <tags>]` | 스펙 검색 | fork |
| `/sdd-status` | — | 프로젝트 상태 확인 | |
| `/sdd-list` | `[features\|changes\|specs\|templates] [--status <status>]` | 항목 목록 조회 | |
| `/sdd-sync` | `[specId] [--json] [--ci --threshold <percent>]` | 스펙-코드 동기화 검증 (`@spec` 어노테이션) | fork |
| `/sdd-diff` | `[commit1] [commit2] [--staged] [--stat]` | 스펙 변경사항 시각화 | |
| `/sdd-export` | `[specId] [--all] [--format html\|json\|markdown] [-o <path>]` | 스펙 내보내기 | |

### 문서 생성

| 스킬 | 인수 | 설명 | 모드 |
|------|------|------|------|
| `/sdd-research` | `<topic>` | 기술 리서치 문서 | fork |
| `/sdd-data-model` | `[feature-id]` | 데이터 모델 문서 | |
| `/sdd-guide` | — | 워크플로우 가이드 | 수동 |

### 운영

| 스킬 | 인수 | 설명 | 모드 |
|------|------|------|------|
| `/sdd-chat` | — | 대화형 SDD 어시스턴트 | 수동 |
| `/sdd-watch` | `[--no-validate] [--impact] [--quiet] [--debounce <ms>]` | 파일 감시 모드 | 수동 |
| `/sdd-migrate` | `[detect\|openspec\|speckit\|docs\|scan\|analyze] [source] [--dry-run]` | 외부 도구에서 마이그레이션 | 수동 |
| `/sdd-cicd` | `[setup [github\|gitlab\|all] \| hooks [type] \| check]` | CI/CD 설정 | 수동 |
| `/sdd-prompt` | `[new\|plan\|tasks\|change\|apply\|archive\|impact\|validate] [--list]` | 프롬프트 출력 | |

### 스킬 프론트매터

Claude Code 스킬의 `SKILL.md`는 다음 프론트매터 필드를 사용합니다:

| 필드 | 적용 대상 |
|------|----------|
| `context: fork` | 6개 분석 스킬 (`sdd-analyze`, `sdd-impact`, `sdd-report`, `sdd-research`, `sdd-search`, `sdd-sync`) — 분리된 컨텍스트에서 실행 |
| `disable-model-invocation: true` | 5개 유틸리티 스킬 (`sdd-chat`, `sdd-cicd`, `sdd-guide`, `sdd-migrate`, `sdd-watch`) — 사용자만 호출 가능 |
| `argument-hint` | 인수를 받는 스킬 |
| `allowed-tools` | 모든 sdd-* 스킬 — 최소 권한 패턴 (예: `Bash(sdd validate*)`) |

Codex 스킬(`.agents/skills/`)에는 `name`과 `description`만 들어갑니다. 수동 전용 스킬 5개에는 대신 `policy.allow_implicit_invocation: false`가 담긴 `agents/openai.yaml`이 함께 생성됩니다.

## 사용법

Claude Code에서 슬래시로 시작하는 스킬 이름을 입력합니다(Codex에서는 `$`):

```
/sdd-start
```

인수가 필요한 경우:

```
/sdd-spec auth/login
/sdd-implement auth/login
```

Codex에서는 같은 호출이 `$sdd-spec auth/login`, `$sdd-implement auth/login`입니다.

## 사용 예시

### 역추출 워크플로우

레거시 코드에서 SDD 스펙을 추출합니다. AI가 코드를 읽고 초안을 작성하며, CLI는 스캔·검증·리뷰·확정을 담당합니다:

`/sdd-reverse`를 실행하면 프로젝트 스캔, 코드 기반 스펙 초안 작성, 초안 리뷰, 확정 단계를 안내합니다. 자세한 내용은 [/sdd-reverse](/ko/commands/sdd-reverse)를 참고하세요.

```
/sdd-reverse                              # AI 주도: 스캔, 코드 읽기, 초안 작성
sdd validate .sdd/.reverse-drafts         # 초안 검증
sdd reverse review --list                 # 초안 리뷰
sdd reverse review <ref> --approve        # 승인 (사용자 확인 후)
sdd reverse finalize                      # 승인된 초안을 .sdd/specs/로 이동
```

### 도메인 시스템

대규모 프로젝트를 논리적으로 그룹화합니다:

```
/sdd-domain create auth        # 도메인 생성
/sdd-domain graph              # 의존성 그래프
/sdd-context set auth payment  # 작업 컨텍스트 설정
```
