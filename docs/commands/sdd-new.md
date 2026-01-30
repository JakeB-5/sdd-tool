# /sdd.new

::: warning Deprecated
This command has been replaced by `/sdd.spec`.
`/sdd.spec` automatically determines whether you're writing a new feature or modifying an existing spec, and guides you to the appropriate workflow.
:::

Write specifications for a new feature with AI assistance.

## Usage

```
/sdd.new [feature description]
```

## Arguments

| Argument | Description |
|----------|-------------|
| feature description | Description of the feature to implement |

## Behavior

The AI writes the specification through conversation:

1. Understand feature purpose
2. Derive requirements
3. Write scenarios
4. Apply RFC 2119 keywords

## Generated File

```
.sdd/specs/<feature-id>/spec.md
```

## Example

```
/sdd.new user authentication feature

AI: I'll write the specification for the user authentication feature.
    I have a few questions:

    1. What authentication method will you use? (JWT, session, OAuth)
    2. Do you need social login?
    3. What is your password policy?
```

## Generated spec.md

```markdown
---
id: user-auth
title: "User Authentication"
status: draft
created: 2025-12-24
constitution_version: 1.0.0
---

# User Authentication

> JWT-based user authentication system

## Requirements

### REQ-01: Login

- The system SHALL support email/password login
- The system SHOULD return an error message on login failure

## Scenarios

### Scenario 1: Successful Login

- **GIVEN** a valid user account exists
- **WHEN** logging in with correct email and password
- **THEN** a JWT token is returned
- **AND** a token expiration time is set
```

## Next Steps

After writing the spec:

```
/sdd.plan  -> Create implementation plan
```
