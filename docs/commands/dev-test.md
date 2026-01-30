# dev-test (Skill)

A development skill that writes or runs tests using Vitest.

> **Note**: This is a **skill**, not a slash command. Claude automatically selects and uses it based on the work context.

## Overview

The `dev-test` skill analyzes target files to generate test cases and check coverage.

## Trigger Conditions

Claude automatically uses this skill when receiving requests like:

- "Write tests", "run tests", "coverage"
- "vitest", "run tests"

## Test Generation Example

```
User: Write tests for src/auth/login.ts

Claude: Test analysis: src/auth/login.ts

## Functions Found
- login(email, password)
- validateCredentials(email, password)
- createSession(user)

## Tests to Generate

### login
```typescript
describe('login', () => {
  it('returns session with valid credentials', async () => {
    const result = await login('user@test.com', 'pass123');
    expect(result.success).toBe(true);
  });

  it('returns error with wrong password', async () => {
    const result = await login('user@test.com', 'wrong');
    expect(result.success).toBe(false);
  });
});
```

Create test file?
-> tests/auth/login.test.ts
```

## Test Execution Example

```
User: Run the tests

Claude: Running tests...

 ✓ tests/auth/login.test.ts (5 tests)
 ✓ tests/core/validation.test.ts (12 tests)
 ✗ tests/payment/checkout.test.ts (3 tests)
   - ✗ Payment amount calculation

Result: 19/20 passed (95%)

Failed test:
  tests/payment/checkout.test.ts:45
  Expected: 10000
  Received: 9900

Fix needed.
```

## Coverage Example

```
User: Check coverage

Claude: Test Coverage

| File | Lines | Branches | Functions |
|------|-------|----------|-----------|
| src/auth/login.ts | 95% | 80% | 100% |
| src/core/validation.ts | 100% | 100% | 100% |
| src/payment/checkout.ts | 72% | 60% | 85% |

Overall coverage: 89%

Insufficient coverage:
- src/payment/checkout.ts:50-65 (error handling)
```

## Related Skills

- [`dev-implement`](/commands/dev-implement) - Spec implementation
- [`dev-review`](/commands/dev-review) - Code review
