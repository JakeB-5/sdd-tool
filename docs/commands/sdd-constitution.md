# /sdd-constitution

Create or edit the project constitution (`.sdd/constitution.md`) and bump its version.

## Usage

```
/sdd-constitution      # Claude Code
$sdd-constitution      # Codex
```

The skill takes no arguments; it asks you about the project instead.

## Overview

The constitution defines the core principles of a project. Every spec and implementation must comply with the principles declared here.

## Behavior

### Setting up a new project

1. Ask you about the project's core values and principles
2. Open `.sdd/constitution.md` and write the content
3. Validate the format with `sdd constitution validate`

### Editing an existing constitution

1. Review the current content with `sdd constitution show`
2. After editing, bump the version to reflect the scope of change:
   - `sdd constitution bump --patch -m "Fix wording"`
   - `sdd constitution bump --minor -m "Add new principle"`
   - `sdd constitution bump --major -m "Change core principle"`

## Constitution Structure

```markdown
---
version: 1.0.0
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Constitution: <Project Name>

> Project description

## Core Principles

### 1. <Principle Name>
- Rule (SHALL/MUST/SHOULD/MAY)

## Forbidden Practices
- Prohibition (SHALL NOT/MUST NOT)

## Tech Stack
- Technology choices

## Quality Standards
- Quality requirements
```

## Versioning

| Bump | When |
|------|------|
| **MAJOR** | Core principle changes (affects existing specs) |
| **MINOR** | New principle added |
| **PATCH** | Wording fixes, typo corrections |

## CLI Commands

The skill may run any `sdd constitution` subcommand:

```bash
sdd constitution show      # Display current constitution
sdd constitution version   # Show version only
sdd constitution validate  # Validate format
sdd constitution history   # View change history
sdd constitution bump      # Bump version
```

## Example

```
/sdd-constitution

AI: Let me set up the constitution. A few questions:

    1. What are the project's core values?
    2. Which tech stack and quality standards apply?
    3. What must never be done (forbidden practices)?

    (writes .sdd/constitution.md)
    $ sdd constitution validate   (passes)
```

## Related Commands

- [`sdd constitution`](/cli/constitution) - CLI version
- [`/sdd-start`](/commands/sdd-start) - Project setup entry point
- [`/sdd-implement`](/commands/sdd-implement) - Implementation follows the constitution
