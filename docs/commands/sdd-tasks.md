# /sdd.tasks

Break down work into executable units.

## Usage

```
/sdd.tasks [feature-id]
```

## Arguments

| Argument | Description |
|----------|-------------|
| feature-id | Feature ID (defaults to most recently written spec if omitted) |

## Behavior

The AI breaks down the implementation plan into work units:

1. Analyze the plan
2. Define tasks
3. Set dependencies
4. Assign priorities

## Generated File

```
.sdd/specs/<feature-id>/tasks.md
```

## Task Size Criteria

- Completable within 2-4 hours
- Clear completion criteria
- Testable

## Example

```
/sdd.tasks user-auth

AI: Breaking down user-auth plan into work units.
```

## Generated tasks.md

```markdown
---
spec_id: user-auth
total_tasks: 8
completed: 0
---

# Task List: user-auth

## Phase 1: Data Model

- [ ] T1: Define User schema
  - File: src/models/user.ts
  - Dependencies: none

- [ ] T2: Write migration
  - File: migrations/001_users.sql
  - Dependencies: T1

## Phase 2: Authentication Service

- [ ] T3: Password hashing utility
  - File: src/utils/password.ts
  - Dependencies: none

- [ ] T4: JWT service
  - File: src/services/jwt.ts
  - Dependencies: none

- [ ] T5: Login service
  - File: src/services/auth.ts
  - Dependencies: T1, T3, T4
```

## Priority

| Icon | Priority | Description |
|------|----------|-------------|
| HIGH | Immediate | Process immediately |
| MEDIUM | Next | Process next |
| LOW | Later | Process later |

## Next Steps

After task breakdown:

```
/sdd.prepare    -> Tool check
/sdd.implement  -> Start implementation
```
