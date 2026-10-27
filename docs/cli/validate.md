# sdd validate

Validates spec documents.

## Usage

```bash
sdd validate [path] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `path` | File or directory to validate (all specs if omitted) |

## Options

| Option | Description |
|--------|-------------|
| `-s, --strict` | Treat warnings as errors |
| `-q, --quiet` | Output summary only |
| `-l, --check-links` | Validate reference links |
| `-c, --constitution` | Check the constitution version (default) |
| `--no-constitution` | Skip constitution check |
| `-d, --domain <domain>` | Validate only the specs of one domain |
| `--orphan-specs` | Report specs that do not belong to any domain |

## Exit Codes

| Situation | Exit code |
|-----------|-----------|
| All specs pass (warnings allowed) | 0 |
| A spec fails, a path cannot be read (or warnings with `--strict`) | 2 (`VALIDATION_FAILED`) |
| Not inside an SDD project | 1 |

## Validation Items

### Required Validation

- YAML frontmatter format (`id`, `title` and `constitution_version` are optional; only a missing `created` date is reported, as a warning that fails under `--strict`)
- At least one RFC 2119 keyword in the requirements. A spec without any keyword fails (exit code 2); keywords must be uppercase, so lowercase-only text (`shall`) also fails and additionally gets hint W008
- `status` (defaults to `draft` when omitted) is one of `draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated` (legacy `specified` / `completed` are read as `review` / `implemented` with warning W006)
- At least one scenario in GIVEN-WHEN-THEN form (a spec without one fails)
- Markdown syntax

### Warning Validation

- Keywords inside HTML comments and code fences do not count
- Requirement ID format
- Leftover template placeholders (<code v-pre>{{...}}</code> values, also in frontmatter such as <code v-pre>id: "{{FEATURE_ID}}"</code>, and `[...]` text), so `--strict` fails on an unfilled spec template

### Constitution Validation

- `constitution_version` is compared with the constitution's `version`: a difference is a warning, a major difference fails; specs without it are skipped
- An unparseable constitution gives warning W007 and the check is skipped. The constitution's rules (for example forbidden practices) are not checked against spec text

## Examples

### Validate All Specs

```bash
sdd validate
```

### Validate Specific File

```bash
sdd validate .sdd/specs/auth/user-auth/spec.md
```

### One Domain

```bash
sdd validate --domain auth
```

### Strict Mode

```bash
sdd validate --strict
```

### Use in CI/CD

```bash
sdd validate --quiet
```

## Output Example

```
ℹ 검증 중: /path/to/project/.sdd/specs

✓ auth/user-auth/spec.md
✓ auth/profile/spec.md
✓ common/settings/spec.md
  ⚠ 템플릿 플레이스홀더가 남아 있습니다: [요구사항 제목], [기능] 외 2개

결과: 3개 통과, 0개 실패, 1개 경고
```

The summary line reads "Result: N passed, M failed, K warnings" (CLI output is Korean). Warnings do not fail validation unless `--strict` is used.
