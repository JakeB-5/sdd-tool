# sdd sync

Validates synchronization between specs and code.

## Usage

```bash
sdd sync [specId] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `specId` | Specific spec (`<domain>/<feature>` or a unique `<feature>`; all if omitted) |

## Options

| Option | Description |
|--------|-------------|
| `--ci` | CI mode: exit code 2 when the sync rate is below the threshold |
| `--threshold <percent>` | Sync rate threshold 0-100 (default: 100). Setting it enables the gate even without `--ci` |
| `--json` | JSON output (stdout carries only the JSON document) |
| `--markdown` | Markdown report |
| `--src <dir>` | Source directory (default: `./src`) |
| `--include <patterns>` / `--exclude <patterns>` | Scan include/exclude globs (comma separated) |

## Exit Codes

| Situation | Exit code |
|-----------|-----------|
| No `--ci`/`--threshold` (report only) | 0 |
| Sync rate ≥ threshold | 0 (passes even with missing requirements) |
| Sync rate < threshold | 2 (`VALIDATION_FAILED`) — the report is always printed first |
| Invalid `--threshold` (not a number, outside 0-100) | non-zero error |

## How requirements are defined

A spec's requirements are the REQ IDs it **defines with a heading** (levels 2-4):

```markdown
### REQ-01: Login
### REQ-02 Logout
### REQ-03 - Session
### `REQ-04`: Token
### [REQ-05] Refresh
```

- REQ IDs that only appear in prose, tables or lists (e.g. "see `pricing/checkout` REQ-05") are
  references, not definitions, and are not counted as requirements of that spec.
- Headings inside fenced code blocks and HTML comments are ignored.
- A spec that mentions REQ IDs but has no definition heading yields 0 requirements and a warning
  (`<spec>: REQ 정의 헤딩이 없어 …`, shown in the report and in JSON `warnings`).
- In `--json`, a spec's `title` is the spec's own title (frontmatter `title`, else the first `# ` heading).

## Reference Syntax

Requirement IDs (`REQ-xx`) are numbered per spec, so when several specs share an ID use a
**spec-qualified reference** `<spec>#REQ-xx`, where `<spec>` is `<domain>/<feature>` or a unique `<feature>`.

```typescript
/**
 * @spec auth/login#REQ-01
 * @spec auth/login#REQ-02, billing/pay#REQ-01
 */
function login() {}
```

```typescript
describe('auth/login#REQ-01: Login', () => {
  it('should authenticate user', () => {});
});
```

- A bare reference `@spec REQ-01` matches only when **exactly one** spec has that ID.
  Otherwise it is ignored and reported as an ignored-reference warning (JSON: `warnings`).
- A bare reference that a qualified reference of the same REQ number covers is not ambiguous:
  same line, or the declaration directly below a `@spec <spec>#REQ-xx` comment including its whole
  block (so an annotated `describe` covers the `it('REQ-xx ...')` titles inside). This only applies
  when the qualified reference matches a real requirement; with a typo it stays a normal bare reference.
- Ambiguity is judged against all specs even when checking a single spec (`sdd sync auth/login`).
- References that match no spec are reported as code without a spec (JSON: `orphans`).
- A requirement counts as implemented when it is referenced by **code or a test** (either is enough).

## Examples

```bash
sdd sync                          # full report (exit code 0)
sdd sync auth/login               # a single spec
sdd sync --ci                     # fail below 100%
sdd sync --ci --threshold 80      # fail below 80%
sdd sync --json                   # JSON output
```

## CI/CD Integration

```yaml
- name: Check spec sync
  run: sdd sync --ci --threshold 80
```
