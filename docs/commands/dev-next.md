# dev-next (Skill)

A development skill that recommends the next spec to implement.

> **Note**: This is a **skill**, not a slash command. Claude automatically selects and uses it based on the work context.

## Overview

The `dev-next` skill analyzes the dependency graph and recommends the next spec to implement. It prioritizes specs with no dependencies or dependencies that are already satisfied.

## Trigger Conditions

Claude automatically uses this skill when receiving requests like:

- "What's next", "next task", "what should I implement"
- "next", "what's next"

## Usage Example

```
User: What should I implement next?

Claude: Next Implementation Recommendation

## Recommended Spec: core/validation

Reasons:
  - No dependencies (independent module)
  - 3 other specs depend on this module
  - Implementation difficulty: Low

### Spec Overview
Input data validation utilities

### Key Features
- Email format validation
- Password rule validation
- Common validation functions

### Dependent Specs (waiting on this)
- auth/login
- auth/registration
- user/profile

Would you like to implement this?
```

## Full Order Display

```
User: Show me the full implementation order

Claude: Full Implementation Order

1. Pending: core/validation (no dependencies)
2. Pending: core/types (no dependencies)
3. Pending: auth/token (<- core/types)
4. Pending: auth/login (<- core/validation, auth/token)
5. Pending: auth/registration (<- auth/login)
6. Pending: payment/checkout (<- auth/login)

Complete: 0
Pending: 6

Recommendation: Start with core/validation
```

## Related Skills

- [`dev-implement`](/commands/dev-implement) - Spec implementation
- [`dev-status`](/commands/dev-status) - Implementation status
