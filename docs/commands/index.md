# Slash Commands

A guide to SDD slash commands for Claude Code.

## Overview

When you run `sdd init`, slash commands and development skills are automatically created in `.claude/commands/` and `.claude/skills/`.

## Command List

### Core Workflow

| Command | Description |
|---------|-------------|
| [`/sdd.start`](/commands/sdd-start) | Unified entry point |
| [`/sdd.constitution`](/commands/sdd-constitution) | Manage project principles |
| [`/sdd.spec`](/commands/sdd-spec) | **Create/modify feature specs (unified)** |
| [`/sdd.plan`](/commands/sdd-plan) | Create implementation plan |
| [`/sdd.tasks`](/commands/sdd-tasks) | Task breakdown |
| [`/sdd.prepare`](/commands/sdd-prepare) | Tool check |
| [`/sdd.implement`](/commands/sdd-implement) | Sequential implementation |
| [`/sdd.validate`](/commands/sdd-validate) | Spec validation |

> **Note**: `/sdd.spec` automatically determines whether you're writing a new feature or modifying an existing spec, and guides you to the appropriate workflow.

### Domain & Reverse Engineering (v1.2.0)

| Command | Description |
|---------|-------------|
| [`/sdd.reverse`](/commands/sdd-reverse) | Reverse engineer specs from legacy code |
| [`/sdd.domain`](/commands/sdd-domain) | Domain management (create, link, graph) |
| [`/sdd.context`](/commands/sdd-context) | Set working context |

### Development Skills (v1.2.0)

> **Note**: Skills are different from slash commands. Claude automatically selects and uses them based on the work context.

| Skill | Description |
|-------|-------------|
| [`dev-implement`](/commands/dev-implement) | Spec-based TDD implementation |
| [`dev-next`](/commands/dev-next) | Recommend next spec to implement |
| [`dev-review`](/commands/dev-review) | Code review |
| [`dev-scaffold`](/commands/dev-scaffold) | Boilerplate generation |
| [`dev-status`](/commands/dev-status) | Implementation progress |
| [`dev-test`](/commands/dev-test) | Run Vitest tests |

### Change Management

| Command | Description |
|---------|-------------|
| `/sdd.impact` | Change impact analysis |
| `/sdd.transition` | Switch between new <-> change workflows |

### Deprecated

| Command | Replaced By | Description |
|---------|-------------|-------------|
| [`/sdd.new`](/commands/sdd-new) | `/sdd.spec` | Create new feature spec |
| `/sdd.change` | `/sdd.spec` | Propose changes to existing spec |

### Analysis & Quality

| Command | Description |
|---------|-------------|
| `/sdd.analyze` | Analyze request and assess scope |
| `/sdd.quality` | Calculate spec quality score |
| `/sdd.report` | Generate project report |
| `/sdd.search` | Search specs |
| `/sdd.status` | Check project status |
| `/sdd.list` | List items |
| `/sdd.sync` | Validate spec-code synchronization |
| `/sdd.diff` | Visualize spec changes |
| `/sdd.export` | Export specs |

### Documentation Generation

| Command | Description |
|---------|-------------|
| `/sdd.research` | Technical research document |
| `/sdd.data-model` | Data model document |
| `/sdd.guide` | Workflow guide |

### Operations

| Command | Description |
|---------|-------------|
| `/sdd.chat` | Interactive SDD assistant |
| `/sdd.watch` | File watch mode |
| `/sdd.migrate` | Migrate from external tools |
| `/sdd.cicd` | CI/CD configuration |
| `/sdd.prompt` | Output prompts |

## Usage

Enter commands starting with a slash in Claude Code:

```
/sdd.start
```

When arguments are needed:

```
/sdd.spec user authentication feature
```

## v1.2.0 New Features

### Reverse Engineering Workflow

Automatically extract SDD specs from legacy code:

```
/sdd.reverse scan              # Scan project
/sdd.reverse extract           # Extract specs
/sdd.reverse review            # Review
/sdd.reverse finalize          # Finalize
```

### Domain System

Logically group large projects:

```
/sdd.domain create auth        # Create domain
/sdd.domain graph              # Dependency graph
/sdd.context set auth payment  # Set working context
```

### Development Skills

Support spec-based TDD development. Skills are automatically used by Claude based on the task (no `/` prefix):

- `dev-next` - Recommend next spec to implement
- `dev-implement` - Spec-based TDD implementation
- `dev-test` - Run tests
- `dev-review` - Code review

Example: "Implement the auth/login spec" -> Claude automatically uses the `dev-implement` skill
