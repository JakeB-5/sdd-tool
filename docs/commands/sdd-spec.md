# /sdd-spec

Create or modify feature specifications. (Unified entry point)

## Overview

`/sdd-spec` decides whether the request is a new feature or a change to an existing one and follows the matching workflow. Large modifications go through a change proposal under `.sdd/changes/CHG-xxx/`.
## Usage

```
/sdd-spec <domain>/<feature>
```

In Codex, invoke it as `$sdd-spec <domain>/<feature>`.

## Arguments

| Argument | Description |
|----------|-------------|
| domain/feature | Domain and feature name (e.g. `auth/login`). If omitted, the skill asks for them |

## Behavior

1. Get the domain and feature name (from the argument, or ask)
2. Check whether `.sdd/specs/<domain>/<feature>/spec.md` exists
3. No spec: new feature workflow. Spec exists: route by change scope

### New Feature (No existing spec)

```bash
sdd new <domain>/<feature> --all
```

- Creates `.sdd/specs/<domain>/<feature>/` with `spec.md`, `plan.md`, `tasks.md` and `checklist.md`
- A missing domain is created automatically (a notice is printed). Without a domain the feature goes under `common`, or under the single active domain of the current context (`/sdd-context`) if one is set
- Creates and switches to a `feature/<feature>` git branch from the current one. Add `--no-branch` when you are already on a working branch (e.g. several features in one branch); otherwise each new feature branches off the previous feature's branch
- Existing files are never overwritten (exit code 1). `--force` regenerates them from scratch
- The spec starts as `status: draft`. Change it with `sdd new status <feature> <status>` (`draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated`) instead of editing the frontmatter
- After `--all`, edit the generated `plan.md` and `tasks.md` (`/sdd-plan`, `/sdd-tasks`); do not re-run `sdd new plan` / `sdd new tasks`

### Modify Existing (Spec exists)

**Small modifications** (typos, wording fixes, adding 1-2 requirements):
- Edit `spec.md` directly
- Validate with `sdd validate`

**Large changes** (multiple requirement changes, structural changes, deletions):
- Create a change proposal: `sdd change -t "<title>" -s <feature>`
- This creates `.sdd/changes/CHG-xxx/proposal.md` and `delta.md`; add a `tasks.md` in the same directory if the change needs a task list
- Fill in the delta (ADDED / MODIFIED / REMOVED), then run `sdd change validate <id>`, `sdd change apply <id>` and `sdd change archive <id>`

## Change Scope Criteria

| Scope | Example | Recommended Approach |
|-------|---------|---------------------|
| Small | Typo fixes, wording improvements | Direct edit |
| Medium | Adding 1-2 requirements | Direct edit |
| Large | Changing 3+ requirements | Change proposal |
| Large | Deleting existing requirements | Change proposal |
| Large | Structural scenario changes | Change proposal |

## Spec Authoring Rules

- Use RFC 2119 keywords: SHALL, MUST, SHOULD, MAY, SHALL NOT
- Define each requirement with a `### REQ-01: Title` heading. Only definition headings count as requirements for `sdd sync`; REQ IDs in prose, tables or lists are references
- REQ IDs restart in every spec. When you mention another spec's requirement, qualify it: `<domain>/<feature>#REQ-xx`
- Every requirement must be covered by at least one GIVEN-WHEN-THEN scenario. Keep the structure `sdd new` generates (a requirements section, then a scenarios section whose scenarios name the requirement they cover); a `#### Scenario:` directly under each requirement is also accepted
- Declare dependencies in the frontmatter `depends` field as a YAML list of `<domain>/<feature>` ids, e.g. `depends: [pricing/cart, auth/session]`, or `depends: []` for none. Only `depends` creates dependencies for `/sdd-impact`; mentioning another spec in the body is just a reference

```markdown
## Requirements

### REQ-01: User Authentication

The system SHALL authenticate users using email and password.

## Scenarios

### Scenario 1: Login with valid credentials (REQ-01)

- **GIVEN** a registered user exists
- **WHEN** the user submits the correct email and password
- **THEN** an access token SHALL be issued
```

## Traceability

Code and tests reference requirements as `@spec <domain>/<feature>#REQ-xx` (in a comment or a test title). A bare `REQ-xx` counts only while a single spec has that ID. `/sdd-implement` adds these references, and `sdd sync` reports which requirements are covered.

## Examples

### Creating a New Feature

```
/sdd-spec auth/login

AI: Checking .sdd/specs/...
    -> auth/login not found. Creating a new feature.
    -> Runs: sdd new auth/login --all
    -> Guides you through writing spec.md
```

### Modifying an Existing Spec

```
/sdd-spec auth/login   (add social login)

AI: Checking .sdd/specs/...
    -> auth/login/spec.md exists.
    -> Adding 1 requirement: small change, editing spec.md directly.
    -> Adds REQ-03: Social Login, then runs sdd validate
```

## Generated Files

```
.sdd/specs/<domain>/<feature>/
├── spec.md        # Feature specification
├── plan.md        # Implementation plan
├── tasks.md       # Task breakdown
└── checklist.md   # Checklist
```

## Next Steps

- After creating a new spec: `/sdd-plan` -> `/sdd-tasks` -> `/sdd-implement`
- After modifying a spec: `sdd validate` -> commit

## Related Commands

| Command | Description |
|---------|-------------|
| `/sdd-plan` | Create implementation plan |
| `/sdd-tasks` | Task breakdown |
| `/sdd-validate` | Spec validation |
| `/sdd-impact` | Change impact analysis |
