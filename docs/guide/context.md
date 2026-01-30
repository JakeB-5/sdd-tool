# Context Guide

A guide to the context system for setting work scope in large-scale projects.

## Overview

Context defines the domain scope you're currently working on. It helps improve work efficiency by focusing on specific areas in large-scale projects.

## What is Context?

When context is set:

- Only specs from that domain are displayed
- Dependent domains are included as read-only
- AI assistant recognizes domain boundaries
- Domain is auto-detected when creating new specs

## Setting Context

### Single Domain

```bash
sdd context set auth
```

### Multiple Domains

```bash
sdd context set auth order payment
```

### Include Dependencies

```bash
sdd context set auth --include-deps
```

If `auth` depends on `core`, `core` is also included as read-only.

## Viewing Context

### Current State

```bash
sdd context show
```

Example output:
```
📍 Current Context

Active Domains:
  ✏️  auth (editable)
  ✏️  order (editable)

Read-only:
  📖 core

Spec count: 12
```

### Spec List

```bash
sdd context specs
sdd context specs --status draft
```

## Context Management

### Add Domain

```bash
sdd context add payment
```

### Remove Domain

```bash
sdd context remove order
```

### Clear Context

```bash
sdd context clear
```

## Context File

State is saved in `.sdd/.context.json`:

```json
{
  "active_domains": ["auth", "order"],
  "read_only_domains": ["core"],
  "updated_at": "2025-12-29T10:00:00Z"
}
```

## Use Cases

### 1. Focus on Feature Development

```bash
# Auth-related work
sdd context set auth
sdd list                    # Shows only auth specs
sdd new mfa-setup          # Auto-created as auth/mfa-setup
```

### 2. Cross-Domain Work

```bash
# Work on entire payment flow
sdd context set order payment --include-deps
```

### 3. Review Mode

```bash
# Review specific domain
sdd context set auth
sdd validate                # Validates auth-related only
```

## Context with Other Commands

### sdd new

With context set:

```bash
sdd context set auth
sdd new user-login          # → Creates auth/user-login
```

### sdd list

```bash
sdd context set auth
sdd list                    # Shows only auth domain specs
sdd list --all              # Shows all specs
```

### sdd validate

```bash
sdd context set auth
sdd validate                # Validates auth-related specs only
sdd validate --all          # Full validation
```

## Warning System

When modifying domains outside context:

```
⚠️ Warning: payment domain is not in current context.
Continue? [y/N]
```

Bypass with `--force` option:

```bash
sdd new payment/refund --force
```

## Best Practices

### At Work Start

```bash
# 1. Set domain to work on
sdd context set auth

# 2. Check current state
sdd context specs

# 3. Proceed with work
sdd new oauth-google
```

### When Switching Tasks

```bash
# 1. Clear current context
sdd context clear

# 2. Set new context
sdd context set payment
```

### For Large-Scale Changes

```bash
# Include dependencies for full picture
sdd context set order --include-deps
sdd context specs           # Check impact scope
```

## Related Documentation

- [Domain System](./domains.md)
- [Large Projects](./large-projects.md)
- [CLI: context](../cli/context.md)
