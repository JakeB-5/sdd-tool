# sdd constitution

Manages the project constitution.

## Usage

```bash
sdd constitution [command] [options]
```

## Subcommands

| Command | Description |
|---------|-------------|
| `show` | Display current constitution |
| `version` | Display the current constitution version |
| `bump` | Update the constitution version |
| `validate` | Validate constitution |
| `history` | Show constitution change history |

## Options

| Command | Option | Description |
|---------|--------|-------------|
| `show` | `--json` | Output in JSON format |
| `bump` | `--major` / `--minor` / `--patch` | Version part to bump (core principle change / new principle / wording fix); a version part is required |
| `bump` | `-m, --message <message>` | Reason for the change |
| `history` | `-n, --count <count>` | Number of entries to show (default: 10) |

```bash
sdd constitution bump --minor -m "Add security principles"
```

## What is a Constitution?

A document that defines the core principles and rules of the project. All specs must comply with the constitution.

### Components

- **Core Principles**: Immutable core principles
- **Technical Principles**: Technical guidelines
- **Forbidden**: Prohibited actions
- **Guidelines**: Recommendations

## Examples

### Show Constitution

```bash
sdd constitution show
```

Output:
```
=== Constitution: my-project ===

📋 Core Principles:
  • Quality First: Code quality is non-negotiable
  • Spec First: Specs before code

🔧 Technical Principles:
  • Use TypeScript
  • Apply ESLint + Prettier
  • Test coverage 80% or higher

🚫 Forbidden:
  • Using any type
  • console.log in production code
```

### Validate Constitution

```bash
sdd constitution validate
```

Output:
```
🔍 Validating constitution...

✅ Required sections present
✅ RFC 2119 keywords used
✅ Principles defined

Validation result: Valid
```

### Constitution Change History

```bash
sdd constitution history
```

Output:
```
=== Constitution Change History ===

v1.2.0 (2025-01-05)
  - Test coverage requirement raised 70% → 80%

v1.1.0 (2024-12-20)
  - ESLint flat config migration

v1.0.0 (2024-12-01)
  - Initial constitution defined
```

## Constitution File Structure

```markdown
---
version: 1.0.0
created: 2025-01-01
updated: 2025-01-07
---

# Constitution: my-project

## Core Principles

Defines the core principles of the project.

### Quality First

- Code quality is non-negotiable (SHALL)
- Code without tests is not deployed (MUST)

## Technical Principles

Defines technical decisions.

### Languages and Tools

- TypeScript SHALL be used
- ESLint and Prettier SHOULD be applied

## Forbidden

Specifies prohibited patterns.

- Using any type (SHALL NOT)
- console.log in production code (MUST NOT)
```

## Related Documentation

- [sdd validate](./validate) - Spec validation
- [sdd start](./start) - Start workflow
- [CLI Reference](./) - All commands
