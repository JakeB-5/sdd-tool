# dev-review (Skill)

A development skill that verifies whether implemented code meets the spec.

> **Note**: This is a **skill**, not a slash command. Claude automatically selects and uses it based on the work context.

## Overview

The `dev-review` skill verifies that implemented code meets the spec and reviews code quality, type safety, and error handling.

## Trigger Conditions

Claude automatically uses this skill when receiving requests like:

- "Review this", "code review", "check quality"
- "review this code"

## Review Items

1. **Spec compliance**: Whether all requirements are implemented
2. **Scenario coverage**: Whether GIVEN-WHEN-THEN tests exist
3. **Code quality**: Readability, maintainability
4. **Type safety**: Appropriateness of TypeScript types
5. **Error handling**: Exception case handling

## Usage Example

```
User: Review the auth/login code

Claude: Code Review: auth/login

## Spec Compliance Check

| Requirement | Status |
|-------------|--------|
| REQ-001: Email/password login | Met |
| REQ-002: JWT token issuance | Met |
| REQ-003: Login failure handling | Partially met |

## Scenario Coverage

| Scenario | Test |
|----------|------|
| Normal login | Exists |
| Wrong password | Exists |
| Unregistered user | Missing |

## Improvement Suggestions

1. **Add missing test**
   - Need test for unregistered user scenario

2. **Improve error handling**
   ```typescript
   // Current
   throw new Error('Login failed');

   // Recommended
   throw new AuthenticationError('INVALID_CREDENTIALS');
   ```

3. **Improve types**
   - Recommend removing `any` type usage

## Score: 85/100

Mostly compliant
Some improvements needed
```

## Related Skills

- [`dev-implement`](/commands/dev-implement) - Spec implementation
- [`dev-test`](/commands/dev-test) - Run tests
