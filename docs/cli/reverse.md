# sdd reverse

Drafts SDD specs from an existing codebase.

## Overview

`sdd reverse` supports brownfield onboarding. The CLI only does the deterministic parts —
structure scan, draft validation, review state and finalization. Reading the code and writing
the spec drafts is done by the AI through the `sdd-reverse` skill (or `/sdd.reverse` command).

## Workflow

```
scan → (AI reads code and writes drafts) → validate → review → finalize
```

1. `sdd reverse scan --json` — structure scan and suggested domains
2. The AI reads the code of each domain and writes `.sdd/.reverse-drafts/<domain>/<feature>/spec.md`
3. `sdd validate .sdd/.reverse-drafts` — fix errors
4. `sdd reverse review --list` — present drafts to the user
5. `sdd reverse review <ref> --approve` — only after the user confirms
6. `sdd reverse finalize` — move approved drafts to `.sdd/specs/`

## Subcommands

### scan

```bash
sdd reverse scan [path] [options]
```

Scans the directory structure and prints real numbers only: file count, source file count,
line count, language distribution, suggested domains (directory-based) with per-domain file
lists, and source files that were not assigned to a domain. Scan does not modify the project.

| Option | Description |
|--------|-------------|
| `-i, --include <glob>` | Keep only files matching the glob (repeatable) |
| `-e, --exclude <glob>` | Drop files matching the glob (repeatable) |
| `-l, --language <lang>` | Only one language, by id or extension (`typescript`, `ts`) |
| `-d, --depth <n>` | Max directory depth below the scan root (`0` = root files only, default unlimited) |
| `-o, --output <file>` | Also write the JSON result to a file |
| `--json` | Print pure JSON to stdout |

Globs without a slash match the file name anywhere (`*.test.ts`); globs with a slash match the
path relative to the scan root (`src/legacy/**`); backslashes are treated as `/`. Hidden
directories (e.g. `.next`, `.turbo`) and `node_modules`, `bower_components`, `__pycache__`,
`venv`, `dist`, `build`, `out`, `coverage` are skipped at any depth (including monorepo
packages). The ambiguous names `vendor` and `target` are skipped only at the scan root or in a
directory with a package manifest (`package.json`, `Cargo.toml`, `go.mod`, `composer.json`,
`pom.xml`, `build.gradle`), so `src/vendor/` is still scanned.

Domains are suggested from the children of `src/`, `lib/`, `packages/`, `modules/` or `apps/`,
and from any other top-level directory of the scan root (e.g. `app/`). Directory names
are converted to valid domain ids (`userProfile` → `user-profile`).

```bash
sdd reverse scan --json
sdd reverse scan src/ --exclude "*.test.ts" --language ts
```

JSON shape:

```json
{
  "root": ".",
  "scannedAt": "2026-10-27T00:00:00.000Z",
  "options": {},
  "summary": { "fileCount": 42, "sourceFileCount": 38, "lines": 5120, "languages": { "typescript": 38 } },
  "domains": [
    { "id": "auth", "path": "src/auth", "fileCount": 6, "lines": 840,
      "languages": { "typescript": 6 }, "files": ["src/auth/login.ts", "..."] }
  ],
  "unassigned": ["src/index.ts"]
}
```

### review

```bash
sdd reverse review [ref] [--list] [--approve | --reject [--reason <text>]]
```

| Usage | Description |
|-------|-------------|
| `sdd reverse review` / `--list` | List every draft (pending, approved, rejected) with validation results |
| `sdd reverse review <ref>` | Show one draft with its validation result and content |
| `sdd reverse review <ref> --approve` | Approve; refused while the draft has validation errors |
| `sdd reverse review <ref> --reject --reason "..."` | Reject; the draft file is kept so it can be revised |

`<ref>` is `<domain>/<feature>` or a unique `<feature>`. Decisions are stored in
`.sdd/.reverse-drafts/review.json`. Approval is tied to a hash of the draft content, so any
change to the file after review — even line-ending normalization (CRLF → LF) — resets it to pending.

Draft rules checked by `review`: `<domain>` must be a valid domain id, `<feature>` must be a
canonical feature id (lowercase letters, digits, hyphens), the frontmatter `id` must equal
`<feature>` and `domain` (if set) must equal `<domain>`, and drafts must be real files inside
`.sdd/.reverse-drafts` (symlinked drafts are rejected).
A corrupt `review.json` is reported as an error; fix or delete the file.

### finalize

```bash
sdd reverse finalize [ref] [--all] [--force]
```

Moves approved drafts to `.sdd/specs/<domain>/<feature>/spec.md`, registers the domain in
`.sdd/domains.yml` (same as `sdd domain create`) when it does not exist yet, links the spec to
the domain and removes the draft. Without a ref, all approved drafts are finalized.

| Option | Description |
|--------|-------------|
| `-a, --all` | Finalize all approved drafts (default) |
| `-f, --force` | Overwrite an existing spec |

An existing spec is never overwritten without `--force`; such drafts are skipped and the
command exits with a non-zero code.

## Files

| Path | Description |
|------|-------------|
| `.sdd/.reverse-drafts/<domain>/<feature>/spec.md` | Drafts written by the AI |
| `.sdd/.reverse-drafts/review.json` | Review decisions |
| `.sdd/specs/<domain>/<feature>/spec.md` | Finalized specs |
| `.sdd/domains.yml` | Domain registry (updated by finalize) |

## Related

- [Reverse Extraction Guide](/guide/reverse-extraction)
- [/sdd.reverse](/commands/sdd-reverse)
- [sdd validate](/cli/validate)
