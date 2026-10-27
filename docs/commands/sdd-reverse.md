# /sdd-reverse

Draft specs from an existing codebase (brownfield onboarding).

## Overview

`/sdd-reverse` is AI-driven: the AI reads your code and writes the spec drafts, while the `sdd reverse` CLI handles the deterministic parts (structure scan, review state, finalization) and `sdd validate` checks the drafts. Drafts only become official specs after you approve them.

```
scan -> read code -> write drafts -> validate -> review (your approval) -> finalize
```

## Usage

```
/sdd-reverse [scan|review|finalize] [args]
```

In Codex, invoke it as `$sdd-reverse`. Without arguments the skill runs the whole flow; a subcommand jumps to that step.

## Rules

- Drafts describe **observed behaviour only**. Requirements the code does not implement are never invented; unclear intent (dead code, ambiguous branches, missing tests) is marked "Uncertain: ..." in the draft instead of guessed.
- Drafts are written only under `.sdd/.reverse-drafts/<domain>/<feature>/spec.md`. The skill never writes to `.sdd/specs/` directly; `sdd reverse finalize` does that.
- `<domain>` and `<feature>` are kebab-case ids. The frontmatter `id` must equal `<feature>`, and `domain` (if set) must equal `<domain>`.
- A draft is never approved without your explicit confirmation.

## Workflow

### 1. Scan

```bash
sdd reverse scan --json                       # whole project
sdd reverse scan src/ --json                  # a sub-tree
sdd reverse scan --json --exclude "**/*.test.ts" --language ts
```

The JSON contains a summary (file count, line count, language distribution), suggested domains (`id`, `path`, `files`, `lines`, `languages`) and unassigned source files. Suggestions are directory-based; the AI merges, splits or renames them when the code suggests a better boundary.

### 2. Read the code

For each domain the AI reads entry points, public APIs, route handlers, data models, validation, error handling and existing tests (the best evidence of intended behaviour), then groups behaviour into features (one spec per feature).

### 3. Write drafts

The AI writes `.sdd/.reverse-drafts/<domain>/<feature>/spec.md` in the same format `/sdd-spec` produces:

```markdown
---
id: invoice
title: Invoice
status: draft
created: 2026-10-27
domain: billing
depends: []
---

# Invoice

> Creates invoices for completed orders.

## Overview

What the feature does, which files implement it (e.g. `src/billing/invoice.ts`), and any uncertainty.

## Requirements

### REQ-01: Create invoice

The system SHALL create an invoice for every completed order.

## Scenarios

### Scenario 1: Completed order (REQ-01)

- **GIVEN** an order is completed
- **WHEN** the billing job runs
- **THEN** an invoice SHALL be created
```

- RFC 2119 keywords are uppercase (SHALL, MUST, SHOULD, MAY and their NOT forms).
- Every draft needs at least one `### REQ-xx: Title` requirement and one GIVEN/WHEN/THEN scenario.
- Add other spec ids to `depends` (`depends: [<domain>/<feature>]`) only when the code really depends on them; `[]` means none.
- Template placeholders such as `[requirement title]` are not left behind.

### 4. Validate

```bash
sdd validate .sdd/.reverse-drafts
```

The AI fixes every error (and warnings where reasonable) and re-runs until it passes.

### 5. Review

```bash
sdd reverse review --list                 # all drafts, statuses and validation results
sdd reverse review <domain>/<feature>     # one draft with its content
```

The AI summarizes each draft (requirements, scenarios, open uncertainties) and asks which to approve, change or reject. Requested changes are applied to the draft files first.

### 6. Approve / reject (after your confirmation)

```bash
sdd reverse review billing/invoice --approve
sdd reverse review billing/refund --reject --reason "covers two features"
```

Approval is refused while the draft has validation errors. It is tied to a hash of the draft content, so any later edit (even CRLF to LF normalization) returns the draft to pending and it must be re-approved.

### 7. Finalize

```bash
sdd reverse finalize                      # all approved drafts
sdd reverse finalize billing/invoice      # one approved draft
sdd reverse finalize --force              # overwrite existing specs (the skill asks first)
```

Approved drafts move to `.sdd/specs/<domain>/<feature>/spec.md`, the domain is registered in `.sdd/domains.yml` if needed, the spec is linked to it, and the draft is removed. An existing spec is overwritten only with `--force`.

## Tool Permissions

The generated skill allows `Read`, `Glob`, `Grep`, `Write`, `Edit`, `Bash(sdd reverse *)` and `Bash(sdd validate *)`. It runs in the main conversation (no forked context) because it asks for your approval mid-flow.

## Next Steps

- Validate the finalized specs: `sdd validate .sdd/specs`
- Adjust domains with `/sdd-domain`
- Author new features with `/sdd-spec`

## Related Commands

- [`sdd reverse`](/cli/reverse) - CLI reference
- [`/sdd-spec`](/commands/sdd-spec) - Write/modify specs
- [`/sdd-validate`](/commands/sdd-validate) - Validate specs
