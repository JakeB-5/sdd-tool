# /sdd.context

A slash command for managing working context.

## Overview

`/sdd.context` sets the scope of domains you're currently working with. Use it to focus on related specs in large projects.

## Usage

```
/sdd.context set <domain...>  # Set context
/sdd.context show             # Show current context
/sdd.context clear            # Clear context
/sdd.context specs            # List specs in context
/sdd.context export           # Export prompt
```

## Subcommands

### set

Set the working context.

```
/sdd.context set auth
/sdd.context set auth payment order
/sdd.context set auth --include-deps  # Include dependent domains
```

### show

Display the currently set context.

```
/sdd.context show
```

**Output:**
```
Current context: auth, payment

Included domains:
  - auth (5 specs)
  - payment (3 specs)

Dependent domains:
  - core (auto-included)
```

### add / remove

Add or remove domains from the context.

```
/sdd.context add order
/sdd.context remove payment
```

### clear

Clear the context.

```
/sdd.context clear
```

### specs

Display list of specs within the context.

```
/sdd.context specs
```

**Output:**
```
Context specs (8):

auth/
  - user-login
  - user-registration
  - token-management

payment/
  - checkout
  - refund
```

### export

Export a context-based prompt.

```
/sdd.context export
/sdd.context export --format markdown
```

Generates context information to provide to AI.

## Context Effects

When context is set:

1. **Spec creation**: `/sdd.spec` auto-detects domain
2. **Validation**: `/sdd.validate` validates only those domains
3. **Listing**: `/sdd.list` shows only context specs
4. **Implementation**: `/dev-implement` references related specs

## Example

```
User: /sdd.context set auth payment

Claude: Context set successfully!

Current context: auth, payment

Included specs:
  auth/
    - user-login
    - user-registration
  payment/
    - checkout
    - payment-methods

Now working with these domains.

---

User: /sdd.context specs

Claude: Context spec list:

auth/ (3 specs)
  Complete: user-login
  In progress: user-registration
  Pending: password-reset

payment/ (2 specs)
  Complete: checkout
  Pending: refund

---

User: /sdd.context export

Claude: Context prompt export:

## Current Working Context

### Domain: auth
User authentication related features

### Domain: payment
Payment processing features

### Related Specs
- auth/user-login: Email/password login
- auth/user-registration: User registration
- payment/checkout: Payment processing

[Copied to clipboard]
```

## Related Commands

- [`sdd context`](/cli/context) - CLI version
- [`/sdd.domain`](/commands/sdd-domain) - Domain management
- [Context Guide](/guide/context)
