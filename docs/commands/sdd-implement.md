# /sdd-implement

Implement a feature's `tasks.md` one task at a time, test-first, with a commit per task.

## Usage

```
/sdd-implement <feature>      # Claude Code
$sdd-implement <feature>      # Codex
```

## Arguments

| Argument | Description |
|----------|-------------|
| feature | `<domain>/<feature>` (e.g. `auth/login`) or the feature name when it is unique in the project (e.g. `login`) |

## Behavior

1. Run `sdd status` to review current progress
2. Read the feature's `spec.md` and `tasks.md`; pick the first task that is not completed and whose dependencies are completed
3. Implement it with the workflow below, strictly test-first

## Rules

- One task at a time
- Tests come first: never write implementation code before a failing test for it exists
- Change task status only with `sdd new task <feature> <task-id> <status>` (`pending`, `in-progress`, `completed`, `blocked`). Do not hand-edit status lines or the progress counts; every run recomputes the counts from the tasks
- Include the task ID in every commit message
- Follow the principles in `.sdd/constitution.md`
- Work on the feature branch created together with the spec (or the current working branch); do not create a branch per task

## Workflow per Task

1. `sdd new task <feature> <task-id> in-progress`
2. **Red**: turn the task's GIVEN-WHEN-THEN scenarios into tests and run them; confirm they fail
3. **Green**: write the minimum code that makes the tests pass
4. **Refactor**: clean up while keeping all tests green
5. Add `@spec` traceability references
6. `sdd new task <feature> <task-id> completed`
7. Commit: `feat(<name>): <task-id> - <description>` (`<name>` is the feature name without its domain)

## Task IDs and Status

Tasks live in `.sdd/specs/<domain>/<feature>/tasks.md` under `### <name>-task-NNN: Title` headings (e.g. `login-task-001`), each with a `**상태:**` line (English `**Status:**` is parsed too):

| Status | `**상태:**` value | `sdd new task` argument |
|--------|-------------------|-------------------------|
| Waiting | 대기 | `pending` |
| Working | 진행 중 | `in-progress` |
| Done | 완료 | `completed` |
| Blocked | 차단됨 | `blocked` |

The value is written in the language the file already uses. See [`sdd new task`](/cli/new#sdd-new-task).

## Traceability

Reference every requirement you implement with the qualified form `<domain>/<feature>#REQ-xx`, in the code and in the tests:

```typescript
/**
 * @spec auth/login#REQ-01
 */
export function login(email: string, password: string) { ... }

it('auth/login#REQ-01: issues a token for valid credentials', () => { ... });
```

A bare `REQ-01` is ambiguous once several specs define `REQ-01`, and `sdd sync` ignores it.

## Commit Messages

The SDD commit-msg hook accepts `<type>(<scope>): <message>` with a Conventional Commits type (`feat`, `fix`, ...) or a spec type (`spec`, `plan`, `tasks`, ...). The full list is in the `AGENTS.md` SDD block.

## Delegation

SDD setup also generates the `sdd-implementer` subagent. For a self-contained task you may delegate it to that subagent by naming it and passing the feature id and task id. The subagent sets the task to `in-progress` and reports back; it does not mark the task completed or commit. Review its changes and test results, then mark the task completed and commit (workflow steps 6-7).

## Example

Illustrative transcript (abbreviated):

```
/sdd-implement auth/login

AI: sdd status: login 1/4 tasks completed.
    Next task: login-task-002 - Password hashing utility

    $ sdd new task auth/login login-task-002 in-progress
    Red: tests/password.test.ts ('auth/login#REQ-02: ...') -> 2 failing
    Green: src/password.ts -> 2 passing
    $ sdd new task auth/login login-task-002 completed
    Commit: feat(login): login-task-002 - Password hashing utility
```

## Completion Criteria

Once all tasks are complete:

1. Run `sdd validate` for a final validation pass
2. Run `sdd sync <feature>`: every requirement SHOULD be covered, with no ignored-reference warnings
3. `sdd new status <feature> implemented`
4. Commit and open a PR or merge
5. Run `/sdd-status` to review overall progress

## Related Commands

- [`sdd new`](/cli/new) - `sdd new task` and `sdd new status`
- [`sdd sync`](/cli/sync) - Check `@spec` coverage
- [`/sdd-tasks`](/commands/sdd-tasks) - Task breakdown
- [`/sdd-validate`](/commands/sdd-validate) - Spec validation
