# /sdd.reverse

Drafts SDD specs from an existing codebase with Claude Code (skill: `sdd-reverse`).

## Overview

`/sdd.reverse` (or the `sdd-reverse` skill) makes Claude read your code and write spec drafts,
while the `sdd reverse` CLI handles the deterministic parts: structure scan, draft validation,
review state and finalization. Drafts only become specs after you approve them.

## Workflow

```
scan → read code → write drafts → validate → review (your approval) → finalize
```

### 1. Scan

Claude runs `sdd reverse scan --json` to get the file list, language distribution and
directory-based domain suggestions with per-domain file lists.

### 2. Read the code

For each domain Claude reads entry points, public APIs, data models, validation and error
handling, and existing tests, then groups behaviour into features (one spec per feature).

### 3. Write drafts

Claude writes `.sdd/.reverse-drafts/<domain>/<feature>/spec.md` in the same format as `sdd new`:
frontmatter (`id`, `title`, `status: draft`, `created`, `domain`, `depends`), requirements with
uppercase RFC 2119 keywords and GIVEN/WHEN/THEN scenarios. Drafts describe **observed behaviour
only**; unclear intent is marked as uncertain instead of guessed.

### 4. Validate

Claude runs `sdd validate .sdd/.reverse-drafts` and fixes errors.

### 5. Review

Claude runs `sdd reverse review --list`, summarizes each draft and asks you which drafts to
approve, change or reject.

### 6. Approve / reject (after your confirmation)

```bash
sdd reverse review auth/login --approve
sdd reverse review auth/logout --reject --reason "covers two features"
```

Drafts with validation errors cannot be approved. Editing a draft after review resets it to pending.

### 7. Finalize

```bash
sdd reverse finalize
```

Approved drafts move to `.sdd/specs/<domain>/<feature>/spec.md`, the domain is registered in
`.sdd/domains.yml` if needed, and the drafts are removed. Existing specs are only overwritten
with `--force`.

## Tool permissions

The generated `sdd-reverse` skill allows `Read`, `Glob`, `Grep`, `Write`, `Edit`,
`Bash(sdd reverse *)` and `Bash(sdd validate *)`. It runs in the main conversation (no forked
context) because it asks for your approval mid-flow.

## Related Commands

- [`sdd reverse`](/cli/reverse) - CLI reference
- [`/sdd.spec`](/commands/sdd-spec) - Write/modify specs
- [`/sdd.validate`](/commands/sdd-validate) - Validate specs
