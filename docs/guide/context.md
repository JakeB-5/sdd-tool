# Context Guide

A guide to the context system for setting work scope in large-scale projects.

## Overview

Context defines the domain scope you're currently working on. It helps improve work efficiency by focusing on specific areas in large-scale projects.

## What is Context?

When context is set:

- The domains you work on are marked active (editable)
- Domains they depend on are included as read-only
- `sdd context specs` lists the specs in scope
- `sdd new <feature>` uses the active domain when there is exactly one

The context does not filter other commands: `sdd list`, `sdd validate` and `sdd status` still cover every spec.
Use their `--domain` options (`sdd validate --domain auth`, `sdd status --domain auth`) to narrow them.

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
sdd context set auth
```

If `auth` depends on `core` (`sdd domain depends auth --on core`), `core` is also included as read-only.
Pass `--no-include-deps` to leave dependent domains out.

## Viewing Context

### Current State

```bash
sdd context show
```

Example output (CLI output is Korean):
```
현재 컨텍스트:

  활성 도메인 (편집 가능):
    auth - auth 도메인 (4 specs)
    order - order 도메인 (5 specs)

  읽기 전용 도메인 (의존성):
    core - core 도메인 (3 specs)

요약:
  총 도메인: 3
  총 스펙: 12
```

### Spec List

```bash
sdd context specs
sdd context specs --json
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
  "activeDomains": ["auth", "order"],
  "readOnlyDomains": ["core"],
  "updatedAt": "2025-12-29T10:00:00.000Z",
  "includeDependencies": true
}
```

## Use Cases

### 1. Focus on Feature Development

```bash
# Auth-related work
sdd context set auth
sdd context specs           # Shows the auth specs (plus read-only dependencies)
sdd new mfa-setup          # Auto-created as auth/mfa-setup
```

### 2. Cross-Domain Work

```bash
# Work on entire payment flow
sdd context set order payment
```

With several active domains, `sdd new <feature>` cannot pick one and falls back to `common`,
so name the domain: `sdd new payment/refund`.

### 3. Review Mode

```bash
# Review specific domain
sdd context set auth
sdd validate --domain auth  # Validates only the auth domain
```

## Context with Other Commands

### sdd new

With exactly one active domain, the feature goes there:

```bash
sdd context set auth
sdd new user-login          # → Creates auth/user-login
```

With no context or several active domains the default is `common`. An explicit `<domain>/<feature>` or `-d <domain>`
always wins, and a domain that does not exist yet is created. There is no "outside the context" warning, and
`--force` does not bypass anything here (it overwrites existing files, see [sdd new](/cli/new)).

### sdd list / sdd validate

These ignore the context. Narrow them explicitly:

```bash
sdd validate --domain auth
sdd status --domain auth
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
sdd context set order
sdd context specs           # Check impact scope
```

## Related Documentation

- [Domain System](./domains.md)
- [Large Projects](./large-projects.md)
- [CLI: context](../cli/context.md)
