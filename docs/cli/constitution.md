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

A document that defines the core principles and rules of the project. Specs reference its version through
`constitution_version`; `sdd validate` compares the two (see [sdd validate](./validate)).

### Components

- **Core principles** (`## 핵심 원칙`): numbered `### N. Title` entries with `-` rules
- **Tech stack** (`## 기술 스택`) and **quality standards** (`## 품질 기준`): `-` lines
- **Forbidden** (`## 금지 사항`): rules containing `SHALL NOT` / `MUST NOT`

## Examples

### Show Constitution

```bash
sdd constitution show
```

Output (the CLI prints Korean):
```
ℹ Constitution: My Project
ℹ 버전: 1.0.0
ℹ 설명: One-line description of the project's principles.

ℹ 핵심 원칙:
• P1. User First
  • User experience SHALL be the basis of all decisions
• P2. Data Protection
  • User data safety SHALL be the top priority

ℹ 금지 사항:
• The `any` type SHALL NOT be used
• Hardcoded secrets MUST NOT be committed
```

### Validate Constitution

```bash
sdd constitution validate
```

Output:
```
✓ Constitution 검증 통과
ℹ 프로젝트: My Project
ℹ 버전: 1.0.0
ℹ 원칙 수: 2
ℹ 금지 사항 수: 2
```

It exits with code 2 when the file cannot be parsed (for example a missing `# Constitution: <name>` title).

### Bump the Version and Read the History

```bash
sdd constitution bump --minor -m "Added test coverage criteria"
# ✓ Constitution 버전 업데이트: 1.0.0 → 1.1.0
sdd constitution history
```

`bump` updates `version:` / `updated:` in the frontmatter and records the change in `.sdd/CHANGELOG.md`.

## Constitution File Structure

```markdown
---
version: 1.0.0
created: 2025-01-01
updated: 2025-01-07
---

# Constitution: my-project

> One-line description.

## 핵심 원칙

### 1. Quality First

- Code quality is non-negotiable (SHALL)
- Code without tests must not be deployed (SHALL NOT)

## 기술 스택

- Language: TypeScript

## 품질 기준

- Test coverage SHALL be at least 80%

## 금지 사항

- The `any` type SHALL NOT be used
- console.log in production code MUST NOT be left in
```

See the [Constitution writing guide](/spec-writing/constitution) for details.

## Related Documentation

- [sdd validate](./validate) - Spec validation
- [sdd start](./start) - Start workflow
- [CLI Reference](./) - All commands
