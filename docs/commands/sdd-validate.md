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

### Errors (the file fails)

- Unclosed or invalid YAML frontmatter, or invalid metadata types/values (the metadata fields themselves, including `id`, `title` and `status`, are optional; `status` defaults to `draft`)
- Missing `# Title` heading
- No requirement with an uppercase RFC 2119 keyword (SHALL, MUST, SHOULD, MAY, ...)
- No GIVEN-WHEN-THEN scenario
- Critical constitution violations and a major `constitution_version` mismatch

### Warnings

- Missing `created` date (W001)
- Broken links, only with `--check-links` (W002)
- Non-critical constitution violations (W003) and a minor `constitution_version` mismatch (W004)
- Leftover template placeholders such as `[requirement title]` (W005)
- Deprecated `status` alias (W006)
- Constitution could not be parsed, so the check is skipped (W007)
- Lowercase RFC 2119 keywords (W008)

Constitution checks run by default; skip them with `--no-constitution`.

## Example

```
/sdd-validate

AI: Running sdd validate.

    ✓ billing/invoice/spec.md
    ✗ common/bad/spec.md
      - Requirement에 RFC 2119 키워드(SHALL, MUST, SHOULD, MAY)가 없습니다
      - Scenario에 GIVEN-WHEN-THEN 형식이 없습니다
      ⚠ RFC 2119 키워드는 대문자로 작성하세요 (소문자 발견: shall → SHALL)
      ⚠ YAML frontmatter에 created 날짜가 없습니다

    결과: 1개 통과, 1개 실패, 2개 경고
    -> Fixing common/bad/spec.md, re-running sdd validate.
```

(The CLI prints its messages in Korean.)

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

Exits with code 2 when any file fails validation, and with `--strict` also when there are only warnings. Exit code 1 is a generic error.

## Related Commands

- [`sdd validate`](/cli/validate) - CLI reference
- [`sdd sync`](/cli/sync) - Spec-to-code traceability
- [`/sdd-spec`](/commands/sdd-spec) - Write/modify specs
