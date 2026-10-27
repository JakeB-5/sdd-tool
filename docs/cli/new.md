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
| `--title <title>` / `--description <desc>` | Feature title / description |
| `--plan` / `--tasks` / `--checklist` | Also generate plan.md / tasks.md / checklist.md |
| `--all` | Generate spec, plan, tasks, and checklist |
| `--numbered` | Auto-number the feature: id `001-<name>`, branch `feature/001-<name>` |
| `--no-branch` | Do not create a git branch (default branch: `feature/<id>`) |
| `-f, --force` | Overwrite existing spec.md / plan.md / tasks.md / checklist.md |

The command fails (non-zero exit) if any file cannot be written. Existing files are never overwritten without `--force`: if any target file already exists, nothing is written and the command exits with code 1.

If the domain (`-d` or `<domain>/<name>`) does not exist yet, it is created first — same as `sdd domain create <domain>` — and a notice is printed.

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
sdd new plan auth/user-auth --title "Auth rollout plan"   # explicit title overrides the spec title
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
