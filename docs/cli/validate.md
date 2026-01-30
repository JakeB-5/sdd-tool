# sdd validate

Validates spec documents.

## Usage

```bash
sdd validate [files...] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `files` | Files to validate (all if omitted) |

## Options

| Option | Description |
|--------|-------------|
| `--strict` | Treat warnings as errors |
| `--quiet` | Output summary only |
| `--json` | JSON format output |
| `--check-links` | Validate links |
| `--no-constitution` | Skip constitution check |

## Validation Items

### Required Validation

- YAML frontmatter format
- Required metadata (id, title, status)
- Markdown syntax

### Warning Validation

- RFC 2119 keyword usage
- GIVEN-WHEN-THEN format
- Requirement ID format

### Constitution Validation

- constitution_version match
- Forbidden rules violation

## Examples

### Validate All Specs

```bash
sdd validate
```

### Validate Specific File

```bash
sdd validate .sdd/specs/user-auth/spec.md
```

### Strict Mode

```bash
sdd validate --strict
```

### Use in CI/CD

```bash
sdd validate --quiet --json
```

## Output Example

```
SDD Validate

  ✓ user-auth/spec.md
  ✓ profile/spec.md
  ⚠ settings/spec.md
    - Missing RFC 2119 keywords

Summary: 2 passed, 1 warning, 0 errors
```
