# dev-implement (Skill)

A development skill for spec-based TDD implementation.

> **Note**: This is a **skill**, not a slash command. Claude automatically selects and uses it based on the work context.

## Overview

The `dev-implement` skill reads spec documents from `.sdd/specs/` and implements TypeScript code using TDD. It converts GIVEN-WHEN-THEN scenarios into tests and writes code.

## Trigger Conditions

Claude automatically uses this skill when receiving requests like:

- "Implement the auth/login spec"
- "Implement this", "develop this", "code this"
- "implement this spec"

## Workflow

1. **Load spec**: Read the specified spec document
2. **Generate tests**: Convert GIVEN-WHEN-THEN to Vitest tests
3. **Implement code**: Write code that passes the tests
4. **Refactor**: Improve code quality
5. **Verify**: Run tests and confirm

## Usage Example

```
User: Implement the auth/login spec

Claude: Spec loaded: auth/login

## User Login

### Scenario 1: Normal Login
GIVEN valid email and password
WHEN login request
THEN return session token

### Scenario 2: Wrong Password
GIVEN valid email
AND wrong password
WHEN login request
THEN return authentication error

---

Generating tests...

// tests/auth/login.test.ts
describe('Login', () => {
  it('returns session token with valid credentials', async () => {
    // Arrange
    const email = 'user@example.com';
    const password = 'ValidPass123';

    // Act
    const result = await login(email, password);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.token).toBeDefined();
  });
});

---

Implementing...

// src/auth/login.ts
export async function login(
  email: string,
  password: string
): Promise<Result<Session, AuthError>> {
  // Implementation...
}

---

Tests passed: 2/2
```

## Related Skills

- [`dev-next`](/commands/dev-next) - Recommend next spec to implement
- [`dev-test`](/commands/dev-test) - Run tests
- [`dev-review`](/commands/dev-review) - Code review
