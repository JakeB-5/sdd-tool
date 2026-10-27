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
ℹ 검증 중: /path/to/project/.sdd/specs

✓ auth/user-auth/spec.md
✓ auth/profile/spec.md
✓ common/settings/spec.md
  ⚠ RFC 2119 키워드가 없습니다

결과: 3개 통과, 0개 실패, 1개 경고
```

The summary line reads "Result: N passed, M failed, K warnings" (CLI output is Korean). Warnings do not fail validation unless `--strict` is used.
