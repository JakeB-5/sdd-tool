# /sdd-validate

Validate specs with `sdd validate` and fix the reported errors.

## Usage

```
/sdd-validate [path] [--strict]
```

In Codex, invoke it as `$sdd-validate`.

## Arguments

| Argument | Description |
|----------|-------------|
| path | Spec file or directory to validate (all specs if omitted) |
| --strict | Treat warnings as errors |

## Behavior

The skill runs the CLI and fixes what it reports:

```bash
# Validate all specs
sdd validate

# Validate a specific file (domain-based path)
sdd validate .sdd/specs/auth/login/spec.md

# Strict mode (warnings count as errors)
sdd validate --strict
```

When validation fails, the skill opens the flagged file and corrects the reported errors (each message says how to fix it), then re-runs `sdd validate`.
For a deeper read-only review (RFC 2119 usage, scenario coverage, constitution compliance), delegate to the `sdd-spec-reviewer` subagent that `sdd init` generates. It reports issues without editing files.

## Validation Checks

### Errors

- YAML frontmatter format
- Required metadata: id, title, status
- Markdown syntax

### Warnings

- RFC 2119 keyword usage (SHALL, MUST, SHOULD, MAY, ...)
- GIVEN-WHEN-THEN scenario format
- Requirement ID format (`### REQ-01: Title`)
- Leftover template placeholders such as `[requirement title]`

### Constitution

- `constitution_version` match
- Forbidden practices violations (skip with `--no-constitution`)

## Example

```
/sdd-validate

AI: Running sdd validate.

    ✓ auth/user-auth/spec.md
    ⚠ auth/profile/spec.md
      - RFC 2119 keywords missing
    ✗ common/settings/spec.md
      - Required field 'id' missing

    Result: 1 passed, 1 failed, 1 warning
    -> Fixing common/settings/spec.md and auth/profile/spec.md, re-running sdd validate.
```

## After Validation Passes

For features that are already implemented, also run `sdd sync` to confirm every requirement is referenced by code or tests (`@spec <domain>/<feature>#REQ-xx`).

1. `git add .sdd/` - stage the spec changes
2. `git commit -m "spec: <description>"` - commit
3. Open a PR and request review

Commit messages follow the commit-msg hook format `<type>(<scope>): <message>`. The type is a spec type (`spec`, `spec-update`, `spec-status`, `plan`, `tasks`, `constitution`, `sdd-config`) or a Conventional Commits type (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, ...). The scope is optional, and `Merge ...` / `Revert ...` messages are allowed.

## CI/CD Integration

```bash
sdd validate --strict --quiet
```

Returns exit code 1 on errors or warnings.

## Related Commands

- [`sdd validate`](/cli/validate) - CLI reference
- [`sdd sync`](/cli/sync) - Spec-to-code traceability
- [`/sdd-spec`](/commands/sdd-spec) - Write/modify specs
