# sdd new

Creates a new feature specification.

## Usage

```bash
sdd new <name> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `name` | Feature name (English, kebab-case recommended) |

## Options

| Option | Description |
|--------|-------------|
| `-d, --domain <domain>` | Specify domain (v1.3.0) |
| `--all` | Generate spec, plan, and tasks |

## Generated Files

```
.sdd/specs/<domain>/<name>/
├── spec.md     # Feature specification
├── plan.md     # Implementation plan (with --all)
└── tasks.md    # Task breakdown (with --all)
```

::: tip v1.3.0 Domain-Based Structure
- If no domain is specified, files are created in the `common` folder
- Example: `sdd new login -d auth` → `.sdd/specs/auth/login/spec.md`
:::

## Examples

### Basic Creation (common domain)

```bash
sdd new user-auth
# → .sdd/specs/common/user-auth/spec.md
```

### Create with Domain

```bash
sdd new login -d auth
# → .sdd/specs/auth/login/spec.md
```

### Create All Files

```bash
sdd new user-auth --all -d auth
# → .sdd/specs/auth/user-auth/spec.md, plan.md, tasks.md
```

## Subcommands

### sdd new plan

Create only the implementation plan:

```bash
sdd new plan user-auth
```

### sdd new tasks

Create only the task breakdown:

```bash
sdd new tasks user-auth
```

## Generated spec.md Example

```markdown
---
id: user-auth
title: "user-auth"
status: draft
created: 2025-12-24
---

# user-auth

> Write the feature description here

## Requirements

### REQ-01: Requirement Title

The system SHALL ...

## Scenarios

### Scenario 1: Scenario Title

- **GIVEN** precondition
- **WHEN** action
- **THEN** expected result
```
