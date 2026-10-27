# sdd new

새 기능의 명세를 생성합니다.

## 사용법

```bash
sdd new <name> [options]
```

## 인수

| 인수 | 설명 |
|------|------|
| `name` | 기능 이름 (영문, 케밥케이스 권장) |

## 옵션

| 옵션 | 설명 |
|------|------|
| `-d, --domain <domain>` | 도메인 지정 (v1.3.0) |
| `--title <title>` / `--description <desc>` | 기능 제목 / 설명 |
| `--plan` / `--tasks` / `--checklist` | plan.md / tasks.md / checklist.md도 함께 생성 |
| `--all` | spec, plan, tasks, checklist 모두 생성 |
| `--numbered` | 자동 번호 부여: ID `001-<name>`, 브랜치 `feature/001-<name>` |
| `--no-branch` | git 브랜치 생성 안 함 (기본 브랜치: `feature/<id>`) |
| `-f, --force` | 기존 spec.md / plan.md / tasks.md / checklist.md 덮어쓰기 |

파일을 하나라도 쓰지 못하면 0이 아닌 종료 코드로 실패합니다. `--force` 없이는 기존 파일을 덮어쓰지 않습니다. 대상 파일이 하나라도 이미 있으면 아무것도 쓰지 않고 종료 코드 1로 실패합니다.

도메인(`-d` 또는 `<domain>/<name>`)이 아직 없으면 먼저 생성하고(`sdd domain create <domain>`과 동일) 안내 메시지를 출력합니다.

## 생성되는 파일

```
.sdd/specs/<domain>/<name>/
├── spec.md     # 기능 명세
├── plan.md     # 구현 계획 (--all 옵션)
└── tasks.md    # 작업 분해 (--all 옵션)
```

::: tip v1.3.0 도메인 기반 구조
- 도메인 미지정 시 `common` 폴더에 생성됩니다
- 예: `sdd new login -d auth` → `.sdd/specs/auth/login/spec.md`
:::

## 예시

### 기본 생성 (common 도메인)

```bash
sdd new user-auth
# → .sdd/specs/common/user-auth/spec.md
```

### 도메인 지정 생성

```bash
sdd new login -d auth
# → .sdd/specs/auth/login/spec.md
```

### 모든 파일 생성

```bash
sdd new user-auth --all -d auth
# → .sdd/specs/auth/user-auth/spec.md, plan.md, tasks.md
```

## 서브커맨드

### sdd new plan

구현 계획만 생성:

```bash
sdd new plan user-auth
sdd new plan auth/user-auth --title "인증 적용 계획"   # 명시한 제목이 스펙 제목보다 우선
```

### sdd new tasks

작업 분해만 생성:

```bash
sdd new tasks user-auth
```

### sdd new status

스펙의 라이프사이클 상태(spec.md frontmatter의 `status`)를 변경:

```bash
sdd new status auth/user-auth implemented
# ✅ auth/user-auth 스펙 상태: implementing → implemented
```

- 허용 상태: `draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated` (레거시 `specified` / `completed`는 `review` / `implemented`로 기록)
- `<feature>`는 `<domain>/<feature>` 또는 한 도메인에만 있을 때의 `<feature>`
- `status`만 바꾸고, frontmatter에 `updated:` 필드가 이미 있으면 오늘 날짜로 갱신. 다른 필드는 작성된 그대로 유지
- 없는 기능(사용 가능한 ID 나열)이나 유효하지 않은 상태(허용 값 나열)는 종료 코드 1
- `--json`: `{ featureId, specPath, from, to, changed }` 출력

### sdd new task

기능 tasks.md의 작업 하나의 상태를 변경:

```bash
sdd new task auth/user-auth user-auth-task-002 in-progress
sdd new task user-auth 2 completed      # 번호만: 한 작업과만 일치할 때
# ✅ auth/user-auth user-auth-task-002: in_progress → completed (작업 2/3 완료)
```

- 상태: `pending`, `in-progress`(또는 `in_progress`), `completed`, `blocked`, 또는 `대기`, `진행 중`, `완료`, `차단됨`. 값은 작업 라벨의 언어로 기록 (`**상태:** 완료` / `**Status:** completed`)
- `## 진행 상황` 집계와 frontmatter `completed:` 수를 갱신
- 없는 작업 ID(사용 가능한 ID 나열), 모호한 번호, 유효하지 않은 상태, tasks.md 없음, 상태 줄이 없는 작업은 종료 코드 1이며 파일을 수정하지 않음
- `--json`: `{ featureId, tasksPath, taskId, from, to, changed, progress }` 출력

마지막 작업을 완료하면 `sdd validate`와 `sdd sync`로 확인한 뒤 `sdd new status <feature> implemented`로 마무리합니다.

## 생성되는 spec.md 예시

```markdown
---
id: user-auth
title: "user-auth"
status: draft
created: 2025-12-24
---

# user-auth

> 기능 설명을 작성하세요

## 요구사항

### REQ-01: 요구사항 제목

시스템은 ... 해야 한다(SHALL).

## 시나리오

### Scenario 1: 시나리오 제목

- **GIVEN** 전제 조건
- **WHEN** 동작
- **THEN** 예상 결과
```
