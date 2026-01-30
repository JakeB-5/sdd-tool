# /sdd.plan

Create an implementation plan.

## Usage

```
/sdd.plan [feature-id]
```

## Arguments

| Argument | Description |
|----------|-------------|
| feature-id | Feature ID (defaults to most recently written spec if omitted) |

## Behavior

The AI creates a technical implementation plan:

1. Analyze the spec
2. Derive technical decisions
3. Define implementation phases
4. Risk analysis

## Generated File

```
.sdd/specs/<feature-id>/plan.md
```

## Example

```
/sdd.plan user-auth

AI: Analyzing user-auth spec to create implementation plan.

    Technical Decisions:
    - JWT library: jsonwebtoken
    - Password hashing: bcrypt
    - Token storage: httpOnly cookies

    Implementation Phases:
    1. Define data model
    2. Implement authentication service
    3. Implement API endpoints
    4. Implement middleware
```

## Generated plan.md

```markdown
---
spec_id: user-auth
created: 2025-12-24
---

# Implementation Plan: user-auth

## Technical Decisions

| Item | Choice | Rationale |
|------|--------|-----------|
| JWT library | jsonwebtoken | Widely used, stable |
| Password hashing | bcrypt | Industry standard |

## Implementation Phases

### Phase 1: Data Model
- Define User schema
- Write migrations

### Phase 2: Authentication Service
- Login logic
- Token generation/validation

## Risks

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| Token theft | High | Short expiration time, refresh token |
```

## Next Steps

After creating the plan:

```
/sdd.tasks  -> Task breakdown
```
