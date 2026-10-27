# 시작하기

SDD Tool은 **Claude Code**와 함께 사용하도록 설계된 명세 기반 개발(Spec-Driven Development) CLI입니다.

## SDD란?

**명세 기반 개발(Spec-Driven Development)**은 코드 작성 전에 명세를 먼저 작성하는 개발 방법론입니다.

### 핵심 원칙

1. **명세 우선**: 코드 작성 전 명세 작성
2. **명세 = 진실**: 명세가 구현의 기준
3. **RFC 2119**: SHALL, MUST, SHOULD, MAY로 요구사항 명확화
4. **GIVEN-WHEN-THEN**: 시나리오 기반 요구사항 정의

## 설치

```bash
npm install -g sdd-tool
```

## 첫 프로젝트 시작

### 1. 프로젝트 초기화

```bash
sdd init
```

이 명령어는 다음을 생성합니다:
- `.sdd/` - 명세 저장소
- `.claude/skills/` - 30개의 sdd-* 스킬 (영문, Claude Code에서 `/sdd-*`로 호출)
- `.agents/skills/` - 같은 스킬 30개 (Codex에서 `$sdd-*`로 호출)
- `.claude/agents/`, `.codex/agents/` - 서브에이전트 `sdd-spec-reviewer`, `sdd-implementer`, `sdd-impact-analyst`
- `AGENTS.md` - 루트 파일의 `sdd:begin/end` 블록에 SDD 지침 (블록 밖 내용은 유지)
- `CLAUDE.md` - `@AGENTS.md` import 보장 (없으면 생성, 있으면 줄 추가)

스킬 생성을 건너뛰려면 `--no-skills`(두 도구 모두), 레거시 슬래시 커맨드(`.claude/commands/sdd.*.md`)도 함께 생성하려면 `--legacy-commands` 옵션을 사용합니다.

### 2. Git 워크플로우 설정 (선택)

팀 협업을 위한 Git 워크플로우를 설정합니다:

```bash
sdd git setup
```

이 명령어는 다음을 설정합니다:
- Git Hooks (pre-commit, commit-msg, pre-push)
- 커밋 메시지 템플릿
- SDD용 .gitignore/.gitattributes

자세한 내용은 [Git 워크플로우](/guide/commit-convention) 문서를 참고하세요.

### 3. Claude Code 실행

```bash
claude
```

### 4. 워크플로우 시작

```
/sdd-start
```

AI가 프로젝트 상태를 분석하고 다음 단계를 안내합니다.

## 전체 워크플로우

```
/sdd-start        → 워크플로우 시작
    ↓
/sdd-constitution → 프로젝트 원칙 정의
    ↓
/sdd-spec         → 기능 명세 작성/수정
    ↓
/sdd-plan         → 구현 계획 수립
    ↓
/sdd-tasks        → 작업 분해
    ↓
/sdd-prepare      → 도구 점검
    ↓
/sdd-implement    → 순차적 구현
    ↓
/sdd-validate     → 명세 검증
```

각 단계가 내부적으로 사용하는 CLI 명령어입니다 (직접 실행해도 됩니다). Codex에서는 `/sdd-*` 대신 `$sdd-*`를 사용합니다.

| 단계 | 스킬 | 사용하는 CLI 명령어 |
|------|------|---------------------|
| 1 | `/sdd-start` | `sdd status` |
| 2 | `/sdd-constitution` | `.sdd/constitution.md` 편집 |
| 3 | `/sdd-spec` | `sdd new <domain>/<feature> --all`, `sdd validate` |
| 4 | `/sdd-plan` | 이미 생성된 `plan.md` 편집, 선택적으로 `sdd new status <feature> planned` |
| 5 | `/sdd-tasks` | 이미 생성된 `tasks.md` 편집, 선택적으로 `sdd new status <feature> tasked` |
| 6 | `/sdd-prepare` | `sdd prepare <feature>` |
| 7 | `/sdd-implement` | 작업마다 `sdd new task <feature> <task-id> in-progress\|completed`; 마지막 작업 후 `sdd validate`, `sdd sync <feature>`, 이어서 `sdd new status <feature> implemented` |
| 8 | `/sdd-validate` | `sdd validate` (구현 완료된 기능은 `sdd sync`도 실행) |

`<feature>`는 `<domain>/<feature>`(예: `auth/user-authentication`) 또는 프로젝트에서 유일한 기능 이름입니다.

## CLI로 명세 만들기

`<domain>/<feature>` 형식으로 도메인과 함께 명세를 생성합니다:

```bash
sdd new auth/user-authentication --all
```

`--all`은 `.sdd/specs/auth/user-authentication/`에 `spec.md`, `plan.md`, `tasks.md`, `checklist.md`를 생성합니다.

- 아직 없는 도메인(`auth`)은 자동으로 생성되고 안내 메시지가 출력됩니다. 도메인을 생략하면(`sdd new user-authentication`) `common`, 또는 현재 컨텍스트의 활성 도메인이 하나뿐이면 그 도메인에 생성됩니다. `-d auth` 옵션도 계속 사용할 수 있습니다.
- 기본적으로 `sdd new`는 `feature/user-authentication` git 브랜치를 만들어 전환합니다. 현재 브랜치에 머무르려면 `--no-branch`를 사용하세요 (예: 한 브랜치에서 여러 기능을 작업할 때).
- 기존 파일은 덮어쓰지 않습니다. 같은 명령을 다시 실행하면 파일 이름과 함께 종료 코드 1로 실패하며, 처음부터 다시 생성할 때만 `--force`를 사용하세요.

`--all` 없이 실행하면 `spec.md`만 생성됩니다. 나머지는 `sdd new plan <feature>`, `sdd new tasks <feature>`, `sdd new checklist`로 나중에 추가할 수 있습니다.

### 요구사항, 추적성, 의존성

요구사항은 `### REQ-01: 제목` 헤딩으로 정의합니다. 번호는 스펙 안에서 고유하며 스펙마다 `REQ-01`부터 다시 시작합니다. `sdd sync`는 이 헤딩으로 정의된 요구사항만 세며, 본문에서 언급한 REQ ID는 요구사항이 아닙니다.

```markdown
---
id: user-authentication
title: "사용자 인증"
status: draft
created: 2025-01-30
domain: auth
depends: []
constitution_version: 1.0.0
---

# 사용자 인증

## 요구사항

### REQ-01: 사용자 로그인

시스템은 이메일과 비밀번호 인증을 지원해야 한다(SHALL).

## 시나리오

### Scenario 1: 로그인 성공 (REQ-01)

- **GIVEN** 유효한 계정을 가진 사용자가 있을 때
- **WHEN** 로그인 폼을 제출하면
- **THEN** JWT 토큰을 받는다
```

- **추적성**: 코드와 테스트에서 `@spec <domain>/<feature>#REQ-01`로 요구사항을 참조합니다 (예: `@spec auth/user-authentication#REQ-01`). 한정하지 않은 `REQ-01`은 여러 스펙이 같은 ID를 가지면 모호해져 `sdd sync`가 무시합니다.
- **의존성**: frontmatter의 `depends`에 `<domain>/<feature>` ID 목록으로 선언하고, 없으면 `depends: []`를 씁니다 (예: `depends: [auth/session, pricing/cart]`). `sdd impact`는 `depends`만 의존성으로 계산하며, 본문에서 다른 스펙을 언급한 것은 별도의 "본문 참조"로 표시됩니다.

### 진행 상황 갱신

작업 상태와 스펙 상태는 파일을 직접 고치지 말고 상태 명령어로 변경합니다. `<feature>`는 `<domain>/<feature>` 또는 유일한 기능 이름입니다:

```bash
sdd new task auth/user-authentication user-authentication-task-001 in-progress
sdd new task user-authentication user-authentication-task-001 completed
sdd new status auth/user-authentication implemented
```

- `sdd new task <feature> <task-id> <status>`: `pending`, `in-progress`, `completed`, `blocked` (또는 `대기`, `"진행 중"`, `완료`, `차단됨`). tasks.md의 진행 집계도 함께 갱신합니다. 작업 ID는 `<name>-task-NNN` 형식입니다.
- `sdd new status <feature> <status>`: `draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated`.
- `sdd status`는 기능마다 상태 아이콘(📝 초안, ✅ 구현 완료 등)과 작업 진행률(tasks.md가 있으면 `— 작업 1/3`)을 보여 주고, 기능별 다음 단계를 안내합니다. 스펙 상태 문구와 기능별 파일 목록은 `--verbose`로 확인합니다.

## 다음 단계

- [설치 가이드](/guide/installation) - 상세 설치 방법
- [첫 프로젝트](/guide/first-project) - 단계별 튜토리얼
- [워크플로우](/guide/workflow) - 전체 워크플로우 이해
