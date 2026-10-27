# sdd new

Creates a new feature specification.

## Usage

```bash
sdd new <name> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `name` | Feature name (English, kebab-case recommended) |

## Options

| Option | Description |
|--------|-------------|
| `-d, --domain <domain>` | Specify domain (v1.3.0) |
| `--title <title>` / `--description <desc>` | Feature title / description |
| `--plan` / `--tasks` / `--checklist` | Also generate plan.md / tasks.md / checklist.md |
| `--all` | Generate spec, plan, tasks, and checklist |
| `--numbered` | Auto-number the feature: id `001-<name>`, branch `feature/001-<name>` |
| `--no-branch` | Do not create a git branch (default branch: `feature/<id>`) |
| `-f, --force` | Overwrite existing spec.md / plan.md / tasks.md / checklist.md |

The command fails (non-zero exit) if any file cannot be written. Existing files are never overwritten without `--force`: if any target file already exists, nothing is written and the command exits with code 1.

If the domain (`-d` or `<domain>/<name>`) does not exist yet, it is created first — same as `sdd domain create <domain>` — and a notice is printed.

## Generated Files

```
.sdd/specs/<domain>/<name>/
├── spec.md     # Feature specification
├── plan.md     # Implementation plan (with --all)
└── tasks.md    # Task breakdown (with --all)
```

::: tip v1.3.0 Domain-Based Structure
- If no domain is specified, files are created in the `common` folder
- Example: `sdd new login -d auth` → `.sdd/specs/auth/login/spec.md`
:::

## Examples

### Basic Creation (common domain)

```bash
sdd new user-auth
# → .sdd/specs/common/user-auth/spec.md
```

### Create with Domain

```bash
sdd new login -d auth
# → .sdd/specs/auth/login/spec.md
```

### Create All Files

```bash
sdd new user-auth --all -d auth
# → .sdd/specs/auth/user-auth/spec.md, plan.md, tasks.md
```

## Subcommands

### sdd new plan

Create only the implementation plan:

```bash
sdd new plan user-auth
sdd new plan auth/user-auth --title "Auth rollout plan"   # explicit title overrides the spec title
```

### sdd new tasks

Create only the task breakdown:

```bash
sdd new tasks user-auth
```

### sdd new status

Change a spec's lifecycle status (`status` in the spec.md frontmatter):

```bash
sdd new status auth/user-auth implemented
# ✅ auth/user-auth 스펙 상태: implementing → implemented
```

- Valid statuses: `draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated` (legacy `specified` / `completed` are written as `review` / `implemented`)
- `<feature>` is `<domain>/<feature>`, or a bare `<feature>` when only one domain has it
- Only `status` is rewritten, plus `updated:` (today) when the frontmatter already has that field; other fields are left as written, and CRLF line endings are kept
- Exit code 1 for an unknown feature (available ids are listed) or an invalid status (valid values are listed)
- `--json` prints `{ featureId, specPath, from, to, changed }`

### sdd new task

Change one task's status in the feature's tasks.md:

```bash
sdd new task auth/user-auth user-auth-task-002 in-progress
sdd new task user-auth 2 completed      # numeric suffix, when it matches one task
# ✅ auth/user-auth user-auth-task-002: in-progress → completed (작업 2/3 완료)
```

- Statuses (exact value, case and surrounding spaces ignored): `pending`, `in-progress` (or `in_progress`), `completed`, `blocked`, `대기`, `진행 중` (or `진행중`), `완료`, `차단됨`. Anything else (`"완료 안 됨"`, `completed-ish`, `**pending**`) is rejected. Quote values with a space (`"진행 중"`) or use `in-progress`; extra arguments are an error
- The value is written in the language already used in the file: English under `**Status:**`, or when the current value is English (`**상태:** pending` → `**상태:** in-progress`); otherwise Korean (`**상태:** 완료`)
- Refreshed counts: the Korean `## 진행 상황` block, and the frontmatter `completed:` / `total:` fields when present. Other progress blocks in the body (e.g. an English `## Progress`) are left as written
- Exit code 1 for an unknown task id (available ids are listed), an ambiguous number, an invalid status, a missing tasks.md, or a task without a status line; the file is not modified
- Text output shows `in-progress`; `--json` prints `{ featureId, tasksPath, taskId, from, to, changed, progress, specStatus }` with the internal value `in_progress`

When the last task is completed and the spec is not `implemented` yet, the command suggests finishing with `sdd validate` and `sdd sync`, then `sdd new status <feature> implemented`.

::: tip Reserved names
`status` and `task` (like `plan`, `tasks`, `checklist`, `counter`) are subcommands of `sdd new`, so `sdd new status` does not create a feature named `status`. Use the domain form instead: `sdd new common/status` or `sdd new <domain>/task`.
:::

## Generated spec.md Example

```markdown
---
id: user-auth
title: "user-auth"
status: draft
created: 2025-12-24
---

# user-auth

> Write the feature description here

## Requirements

### REQ-01: Requirement Title

The system SHALL ...

## Scenarios

### Scenario 1: Scenario Title

- **GIVEN** precondition
- **WHEN** action
- **THEN** expected result
```
