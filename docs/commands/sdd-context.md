# /sdd-context

A slash command for managing working context.

## Overview

`/sdd-context` sets the scope of domains you're currently working with. Use it to focus on related specs in large projects.

## Usage

```
/sdd-context set <domain...>  # Set context
/sdd-context show             # Show current context
/sdd-context clear            # Clear context
/sdd-context specs            # List specs in context
```

## Subcommands

### set

Set the working context.

```
/sdd-context set auth
/sdd-context set auth payment order
/sdd-context set auth --no-include-deps  # Exclude dependent domains
```

Dependent domains are included by default.

### show

Display the currently set context.

```
/sdd-context show
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
/sdd-context add order
/sdd-context remove payment
```

### clear

Clear the context.

```
/sdd-context clear
```

### specs

Display list of specs within the context.

```
/sdd-context specs
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

## Context Effects

When context is set:

1. **Spec creation**: `/sdd-spec` auto-detects domain
2. **Validation**: `/sdd-validate` validates only those domains
3. **Listing**: `/sdd-list` shows only context specs
4. **Implementation**: `/sdd-implement` references related specs

## Example

```
User: /sdd-context set auth payment

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

User: /sdd-context specs

Claude: Context spec list:

auth/ (3 specs)
  Complete: user-login
  In progress: user-registration
  Pending: password-reset

payment/ (2 specs)
  Complete: checkout
  Pending: refund

```

## Related Commands

- [`sdd context`](/cli/context) - CLI version
- [`/sdd-domain`](/commands/sdd-domain) - Domain management
- [Context Guide](/guide/context)
