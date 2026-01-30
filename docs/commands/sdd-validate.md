# /sdd.validate

Verify that specifications are correctly written.

## Usage

```
/sdd.validate [feature-id]
```

## Arguments

| Argument | Description |
|----------|-------------|
| feature-id | Feature ID (validates all if omitted) |

## Validation Items

### Required Validation (Errors)

- YAML frontmatter format
- Required metadata: id, title, status
- Markdown syntax

### Recommended Validation (Warnings)

- RFC 2119 keyword usage
- GIVEN-WHEN-THEN format
- Requirement ID format (REQ-XX)

### Constitution Validation

- constitution_version match
- Forbidden practices violations

## Example

```
/sdd.validate

AI: Validating all specs.

    ✓ user-auth/spec.md
      - 5 requirements
      - 3 scenarios
      - RFC 2119 keywords ✓

    ⚠ profile/spec.md
      - RFC 2119 keywords missing
      - Not in GIVEN-WHEN-THEN format

    ✗ settings/spec.md
      - Invalid YAML frontmatter
      - Required field 'id' missing

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Result: 1 passed, 1 warning, 1 error
```

## Auto-fix

Some issues can be automatically fixed:

```
/sdd.validate --fix

AI: Auto-fixable issues:
    - profile/spec.md: Add SHOULD keyword

    Apply fixes? [Y/n]
```

## CI/CD Integration

```bash
sdd validate --strict --quiet
```

Returns exit code 1 on errors or warnings
