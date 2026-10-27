# Reverse Extraction Guide

How to draft SDD specs from an existing (brownfield) codebase.

## Overview

Reverse extraction turns the current behaviour of your code into SDD specs. It is split
between two actors:

| Actor | Responsibility |
|-------|----------------|
| `sdd reverse` CLI | Deterministic work: structure scan, draft validation, review state, finalization |
| AI (`sdd-reverse` skill / `/sdd.reverse`) | Reads the code and writes spec drafts |
| You | Approve or reject each draft |

No external analysis server is required.

## Workflow

```
scan → read code → write drafts → validate → review → finalize
```

In Claude Code, run the `sdd-reverse` skill (or `/sdd.reverse`) and Claude walks through all
steps, asking for your approval before anything is finalized. The steps below show what
happens under the hood.

### 1. Scan

```bash
sdd reverse scan --json
```

The scan reports real numbers only: file and line counts, language distribution, suggested
domains with their file lists, and source files that could not be assigned to a domain.
Domains are suggested from the children of `src/`, `lib/`, `packages/`, `modules/` or `apps/`
and from any other top-level directory (e.g. `app/`). Treat them as a starting point:
merge, split or rename domains when the code suggests better boundaries.

Useful options:

```bash
sdd reverse scan src/payments/ --json          # one sub-tree
sdd reverse scan --json --exclude "*.test.ts"  # skip tests in the file lists
sdd reverse scan --json --language py          # one language
sdd reverse scan --depth 2                     # shallow overview
```

### 2. Read the code

The AI reads each domain's entry points, public APIs, data models, validation and error
handling — and especially existing tests, which are the best evidence of intended behaviour —
and groups behaviour into features. One spec describes one feature.

### 3. Write drafts

Drafts live at `.sdd/.reverse-drafts/<domain>/<feature>/spec.md` and use the same format as
`sdd new`:

```markdown
---
id: login
title: Login
status: draft
created: 2026-10-27
domain: auth
depends: []
---

# Login

> Authenticates users with a username and password.

## Overview

Implemented in `src/auth/login.ts`. Uncertain: the lockout counter is never reset.

## Requirements

### REQ-01: Credential check

The system SHALL reject a login when the password does not match.

## Scenarios

### Scenario 1: Wrong password

- **GIVEN** a registered user
- **WHEN** the user submits a wrong password
- **THEN** the login is rejected
```

Rules for drafts:

- Describe observed behaviour only; never invent requirements.
- Mark unclear intent as uncertain in the overview instead of guessing.
- `<domain>` must be a valid domain id (lowercase letter first; lowercase letters, digits, hyphens).
- RFC 2119 keywords must be uppercase; at least one requirement and one GIVEN/WHEN/THEN scenario.

You can also write or edit drafts by hand — the CLI treats them the same way.

### 4. Validate

```bash
sdd validate .sdd/.reverse-drafts
```

### 5. Review

```bash
sdd reverse review --list               # every draft, its status and validation result
sdd reverse review auth/login           # one draft with content
sdd reverse review auth/login --approve
sdd reverse review auth/logout --reject --reason "mixes two features"
```

- Drafts with validation errors cannot be approved.
- Rejected drafts are kept so they can be revised and reviewed again.
- Approval is tied to a hash of the draft content: any change after review (even CRLF → LF
  normalization) resets it to pending, so approvals always refer to the final text.
- Decisions are stored in `.sdd/.reverse-drafts/review.json`.

### 6. Finalize

```bash
sdd reverse finalize                 # all approved drafts
sdd reverse finalize auth/login      # one approved draft
sdd reverse finalize --force         # overwrite existing specs
```

Finalize moves approved drafts to `.sdd/specs/<domain>/<feature>/spec.md`, registers missing
domains in `.sdd/domains.yml`, links each spec to its domain and removes the draft. An existing
spec is never overwritten without `--force`.

## Best Practices

- **Go domain by domain.** Scan a sub-tree, draft, review and finalize one domain before the next.
- **Prefer tests as evidence.** Requirements backed by tests are the most reliable.
- **Keep specs small.** One feature per spec makes review and later changes easier.
- **Record uncertainty.** An explicit "Uncertain: ..." note is better than a confident guess.
- **Validate after finalizing.** Run `sdd validate` and adjust domains with `sdd domain`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `검증에 실패한 초안은 승인할 수 없습니다` | Run `sdd reverse review <ref>` to see the errors, fix the draft, approve again |
| `이미 스펙이 존재합니다` on finalize | Merge the draft into the existing spec manually, or re-run with `--force` |
| `review.json` reported as corrupt | Fix the JSON or delete the file (all drafts become pending) |
| Wrong domain suggestion | Write the draft under the domain you want; finalize registers it |
| Draft not listed | It must be at `.sdd/.reverse-drafts/<domain>/<feature>/spec.md` |

## Related Documentation

- [sdd reverse CLI](/cli/reverse)
- [/sdd.reverse](/commands/sdd-reverse)
- [Brownfield tutorial](/tutorial/brownfield)
- [Domains](/guide/domains)
