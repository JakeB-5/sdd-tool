# /sdd-tasks

Break an implementation plan into executable tasks.

## Usage

```
/sdd-tasks <feature>
```

In Codex, invoke it as `$sdd-tasks <feature>`.

## Arguments

| Argument | Description |
|----------|-------------|
| feature | `<domain>/<feature>` or a feature name that is unique in the project (e.g. `auth/login` or `login`) |

## Behavior

1. Read the feature's `spec.md` and `plan.md` and review the implementation phases
2. Write the tasks in the feature's `tasks.md`:
   - A feature created with `--all` (the `/sdd-spec` default) already has a `tasks.md` with placeholder tasks. Edit it in place; do not re-run `sdd new tasks`
   - Only if the file is missing, run `sdd new tasks <feature>` to generate the template
   - `--force` regenerates the file from scratch and discards its content; use it only when asked
3. Replace the placeholder tasks with the real breakdown, giving each task a priority, dependencies and the pending status
4. Refresh the counts for the new list without changing any status: `sdd new task <feature> <first-task-id> pending`
5. Optionally record the stage: `sdd new status <feature> tasked`

## Generated File

```
.sdd/specs/<domain>/<feature>/tasks.md
```

## Task Rules

- Each task is completable within 2-4 hours
- Task ids are `<name>-task-NNN`, where `<name>` is the feature name without its domain (`login-task-001`, `login-task-002`, ...), under a `### <task-id>: Title` heading
- Dependencies are task ids, or `none`
- Priority levels: HIGH (🔴), MEDIUM (🟡), LOW (🟢)
- Implementation tasks are test-first: a task writes failing tests for its scenarios, then the code. Do not add a separate "write tests" task after the implementation

## Task Format

```markdown
### login-task-001: Password hashing utility

- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **설명:** Write failing tests for the scenarios of REQ-01, then implement hashing
- **의존성:** 없음
```

Status values: `대기` = pending, `진행 중` = in-progress, `완료` = completed, `차단됨` = blocked; `없음` = none. English labels (`**Status:**`, `**Priority:**`, `**Description:**`, `**Dependencies:**`) with English values are parsed too; keep the form the file already uses.

## Updating Status and Counts

Do not edit task statuses or progress counts by hand. During implementation (see `/sdd-implement`):

```bash
sdd new task login login-task-001 in-progress   # pending | in-progress | completed | blocked
sdd new task login login-task-001 completed
```

Every `sdd new task` run recomputes the counts (frontmatter `total:` / `completed:`, the `> 총 N개 작업` line and the `## 진행 상황` block) from the tasks it parses, even when the status is unchanged. After editing the task list, re-run it with a task's current status to refresh the counts only.

## Example

```
/sdd-tasks auth/login

AI: Reading spec.md and plan.md.
    -> tasks.md already exists (created by sdd new --all); editing it in place.
    -> Replaced 3 placeholder tasks with 5 tasks (login-task-001 ... login-task-005).
    -> Runs: sdd new task login login-task-001 pending   (counts refreshed)
```

## Next Steps

```
/sdd-prepare    -> Tool check (optional)
/sdd-implement  -> Start implementation
```

## Related Commands

- [`sdd new`](/cli/new) - `sdd new task` / `sdd new status`
- [`/sdd-plan`](/commands/sdd-plan) - Implementation plan
- [`/sdd-implement`](/commands/sdd-implement) - Implementation
