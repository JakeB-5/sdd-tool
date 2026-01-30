# /sdd.implement

Sequential TDD implementation based on the task list.

## Usage

```
/sdd.implement [feature-id]
```

## Arguments

| Argument | Description |
|----------|-------------|
| feature-id | Feature ID (defaults to in-progress task if omitted) |

## Behavior

1. Read tasks.md
2. Select next incomplete task
3. Implement using TDD:
   - Write test
   - Implement code
   - Verify test passes
4. Update task status
5. Move to next task

## TDD Cycle

```
1. Task status: "Pending" -> "In Progress"
2. Write test (RED)
3. Implement code (GREEN)
4. Refactor (REFACTOR)
5. Task status: "In Progress" -> "Complete"
```

## Example

```
/sdd.implement user-auth

AI: Starting user-auth implementation.

    Current progress: 2/8 (25%)

    Next task: T3 - Password hashing utility

    Step 1: Writing test
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Creating tests/utils/password.test.ts...
```

## Task Status

| Icon | Status |
|------|--------|
| Pending | Waiting |
| In Progress | Working |
| Complete | Done |
| Failed | Failed/Blocked |

## Pause and Resume

Pause during implementation:

```
/sdd.implement pause
```

Resume:

```
/sdd.implement
```

## After Completion

When all tasks are complete:

```
AI: user-auth implementation complete!

    Completed tasks: 8/8
    Tests passed: 24/24
    Coverage: 92%

    Next step: /sdd.validate
```
